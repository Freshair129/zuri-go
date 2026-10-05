BEGIN;
SET search_path TO zuri_go,public;
-- @trace implements FR-015-004 — explicit operator delivery; original 011 bytes remain immutable.
CREATE TABLE marketing_report_deliveries (
 business_id uuid NOT NULL REFERENCES businesses(id),report_id uuid NOT NULL,
 state text NOT NULL DEFAULT 'QUEUED' CHECK(state IN('QUEUED','SENDING','ACKNOWLEDGED','UNKNOWN','RETRY_SCHEDULED','REJECTED','EXHAUSTED')),
 row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0),attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 4),
 first_sent_at timestamptz,next_eligible_at timestamptz,lease_id uuid,lease_expires_at timestamptz,receipt_id uuid,last_outcome text CHECK(last_outcome IN('ACK','UNKNOWN','RATE_LIMIT','REJECTED')),
 PRIMARY KEY(business_id,report_id),UNIQUE(report_id),FOREIGN KEY(business_id,report_id) REFERENCES marketing_reports(business_id,id),
 CHECK((attempt_count=0)=(first_sent_at IS NULL)),CHECK(first_sent_at IS NULL OR isfinite(first_sent_at)),CHECK(next_eligible_at IS NULL OR isfinite(next_eligible_at)),
 CHECK((state='SENDING')=(lease_id IS NOT NULL AND lease_expires_at IS NOT NULL)),CHECK((lease_id IS NULL)=(lease_expires_at IS NULL)),CHECK(lease_expires_at IS NULL OR isfinite(lease_expires_at)),
 CHECK((state='ACKNOWLEDGED')=(receipt_id IS NOT NULL))
);
CREATE TABLE marketing_report_delivery_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL,report_id uuid NOT NULL,attempt_number integer NOT NULL CHECK(attempt_number BETWEEN 1 AND 4),
 lease_id uuid NOT NULL UNIQUE,started_at timestamptz NOT NULL,lease_expires_at timestamptz NOT NULL,association_version bigint NOT NULL CHECK(association_version>0),
 outcome text CHECK(outcome IN('ACK','UNKNOWN','RATE_LIMIT','REJECTED')),http_status integer CHECK(http_status BETWEEN 100 AND 599),finished_at timestamptz,
 UNIQUE(business_id,report_id,id),UNIQUE(report_id,attempt_number),FOREIGN KEY(business_id,report_id) REFERENCES marketing_report_deliveries(business_id,report_id),
 CHECK(isfinite(started_at) AND lease_expires_at=started_at+interval '60 seconds'),CHECK((outcome IS NULL)=(finished_at IS NULL)),CHECK(finished_at IS NULL OR isfinite(finished_at) AND finished_at>=started_at)
);
CREATE TABLE marketing_report_delivery_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL,report_id uuid NOT NULL,attempt_id uuid NOT NULL,
 binding_id text NOT NULL,receiver_receipt_id uuid NOT NULL,canonical_receipt text NOT NULL CHECK(octet_length(canonical_receipt)<=4096),
 accepted_at timestamptz NOT NULL CHECK(isfinite(accepted_at)),observed_at timestamptz NOT NULL CHECK(isfinite(observed_at)),retain_until timestamptz NOT NULL,
 UNIQUE(report_id),UNIQUE(binding_id,receiver_receipt_id),UNIQUE(business_id,report_id,id),
 FOREIGN KEY(business_id,report_id) REFERENCES marketing_reports(business_id,id),FOREIGN KEY(business_id,report_id,attempt_id) REFERENCES marketing_report_delivery_attempts(business_id,report_id,id),
 CHECK(retain_until=accepted_at+interval '90 days')
);
ALTER TABLE marketing_report_deliveries ADD FOREIGN KEY(business_id,report_id,receipt_id) REFERENCES marketing_report_delivery_receipts(business_id,report_id,id);

CREATE FUNCTION marketing_delivery_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'DELIVERY_RETAINED' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'QUEUED' OR NEW.attempt_count<>0 OR NEW.row_version<>1 OR NEW.next_eligible_at IS NOT NULL OR NEW.last_outcome IS NOT NULL THEN RAISE EXCEPTION 'DELIVERY_INVALID' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD.state IN('ACKNOWLEDGED','REJECTED','EXHAUSTED') OR NEW.business_id<>OLD.business_id OR NEW.report_id<>OLD.report_id OR NEW.row_version<>OLD.row_version+1
   OR OLD.first_sent_at IS NOT NULL AND NEW.first_sent_at IS DISTINCT FROM OLD.first_sent_at
   OR NEW.attempt_count<>OLD.attempt_count+(CASE WHEN NEW.state='SENDING' THEN 1 ELSE 0 END)
   OR NOT (OLD.state IN('QUEUED','UNKNOWN','RETRY_SCHEDULED') AND NEW.state IN('SENDING','EXHAUSTED') OR OLD.state='SENDING' AND NEW.state IN('ACKNOWLEDGED','UNKNOWN','RETRY_SCHEDULED','REJECTED','EXHAUSTED'))
   THEN RAISE EXCEPTION 'DELIVERY_INVALID' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER marketing_delivery_guard BEFORE INSERT OR UPDATE OR DELETE ON marketing_report_deliveries FOR EACH ROW EXECUTE FUNCTION marketing_delivery_guard();
CREATE FUNCTION marketing_attempt_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'ATTEMPT_RETAINED' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.outcome IS NOT NULL OR NEW.http_status IS NOT NULL OR NEW.finished_at IS NOT NULL THEN RAISE EXCEPTION 'ATTEMPT_INVALID' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD.outcome IS NOT NULL OR NEW.outcome IS NULL OR (to_jsonb(NEW)-ARRAY['outcome','http_status','finished_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['outcome','http_status','finished_at'])
   THEN RAISE EXCEPTION 'ATTEMPT_IMMUTABLE' USING ERRCODE='42501'; END IF;
 END IF;RETURN NEW;
END $$;
CREATE TRIGGER marketing_attempt_guard BEFORE INSERT OR UPDATE OR DELETE ON marketing_report_delivery_attempts FOR EACH ROW EXECUTE FUNCTION marketing_attempt_guard();
CREATE FUNCTION marketing_receipt_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,zuri_go,pg_temp SET datestyle='ISO,YMD' AS $$
DECLARE r marketing_reports%ROWTYPE;d marketing_report_deliveries%ROWTYPE;a marketing_report_delivery_attempts%ROWTYPE;v jsonb;t timestamptz;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'RECEIPT_IMMUTABLE' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM marketing_reports WHERE business_id=NEW.business_id AND id=NEW.report_id;
 SELECT * INTO d FROM marketing_report_deliveries WHERE business_id=NEW.business_id AND report_id=NEW.report_id;
 SELECT * INTO a FROM marketing_report_delivery_attempts WHERE business_id=NEW.business_id AND report_id=NEW.report_id AND id=NEW.attempt_id;
 v:=NEW.canonical_receipt::jsonb;t:=clock_timestamp();
 IF r.id IS NULL OR a.id IS NULL OR d.state IS DISTINCT FROM 'SENDING' OR a.outcome IS NOT NULL OR a.lease_id IS DISTINCT FROM d.lease_id
  OR a.attempt_number<>d.attempt_count OR t>=d.lease_expires_at OR t>=d.first_sent_at+interval '24 hours'
  OR marketing_fields(v,ARRAY['contractVersion','receiverReceiptId','reportId','bindingId','sourceCampaignId','targetInitiativeId','reportRevision','payloadHash','acceptedAt','status']) IS NOT TRUE
  OR NEW.canonical_receipt<>marketing_canonical(v) OR EXISTS(SELECT 1 FROM jsonb_each(v) e(k,x) WHERE k<>'reportRevision' AND jsonb_typeof(x)<>'string')
  OR v->>'contractVersion'<>'zuri-marketing-report/0.1' OR v->>'receiverReceiptId'<>NEW.receiver_receipt_id::text OR v->>'reportId'<>r.id::text
  OR v->>'bindingId'<>r.external_binding_id OR NEW.binding_id<>r.external_binding_id OR v->>'sourceCampaignId'<>r.campaign_id::text
  OR v->>'targetInitiativeId'<>r.target_initiative_id OR v->'reportRevision'<>'1'::jsonb OR v->>'payloadHash'<>r.payload_hash
  OR v->>'status'<>'ACCEPTED_REPORTED_EVIDENCE' OR (v->>'acceptedAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$'
  OR NOT marketing_date(left(v->>'acceptedAt',10)) OR substring(v->>'acceptedAt',12,2)::integer>23 OR substring(v->>'acceptedAt',15,2)::integer>59 OR substring(v->>'acceptedAt',18,2)::integer>59
  OR (v->>'acceptedAt')::timestamptz<>NEW.accepted_at
  THEN RAISE EXCEPTION 'RECEIPT_INVALID' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER marketing_receipt_guard BEFORE INSERT OR UPDATE OR DELETE ON marketing_report_delivery_receipts FOR EACH ROW EXECUTE FUNCTION marketing_receipt_guard();
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['marketing_report_deliveries','marketing_report_delivery_attempts','marketing_report_delivery_receipts'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tab);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',tab);
  EXECUTE format('CREATE POLICY business_scope ON %I USING (business_id=nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid) WITH CHECK (business_id=nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid)',tab);
  EXECUTE format('CREATE POLICY operator_only ON %I AS RESTRICTIVE USING (viewer_kind()=''operator'') WITH CHECK (viewer_kind()=''operator'')',tab);
 END LOOP;
END $$;

-- Helpers cannot be executed directly by the runtime. Each public finalizer
-- locks Business -> immutable report's association -> delivery, then reads DB time.
CREATE FUNCTION marketing_delivery_scope(b uuid,rid uuid) RETURNS marketing_reports LANGUAGE plpgsql SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE r marketing_reports%ROWTYPE;p marketing_report_preparations%ROWTYPE;a marketing_report_associations%ROWTYPE;
BEGIN
 PERFORM marketing_assert_operator(b);
 PERFORM 1 FROM businesses WHERE id=b AND archived_at IS NULL FOR NO KEY UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'REPORT_DENIED' USING ERRCODE='P0001'; END IF;
 SELECT * INTO r FROM marketing_reports WHERE business_id=b AND id=rid;
 IF r.id IS NULL OR NOT EXISTS(SELECT 1 FROM marketing_report_outbox WHERE business_id=b AND report_id=rid) THEN RAISE EXCEPTION 'REPORT_NOT_READABLE' USING ERRCODE='P0001'; END IF;
 SELECT * INTO p FROM marketing_report_preparations WHERE business_id=b AND id=r.preparation_id;
 SELECT * INTO a FROM marketing_report_associations WHERE business_id=b AND id=p.association_id FOR UPDATE;
 IF a.id IS NULL OR NOT a.active THEN RAISE EXCEPTION 'ASSOCIATION_DENIED' USING ERRCODE='P0001'; END IF;
 IF a.row_version<>p.association_version OR a.source_deployment_id<>r.source_deployment_id OR a.external_binding_id<>r.external_binding_id OR a.parent_initiative_id<>r.target_initiative_id
  THEN RAISE EXCEPTION 'ASSOCIATION_STALE' USING ERRCODE='P0001'; END IF;
 IF r.canonical_envelope<>marketing_canonical(r.canonical_envelope::jsonb) OR r.payload_hash<>marketing_hash(r.canonical_envelope::jsonb-'payloadHash') THEN RAISE EXCEPTION 'FROZEN_REPORT_INVALID' USING ERRCODE='P0001'; END IF;
 RETURN r;
END $$;
CREATE FUNCTION marketing_delivery_result(d marketing_report_deliveries) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
 SELECT jsonb_build_object('delivery',jsonb_build_object('reportId',d.report_id,'state',d.state,'attemptCount',d.attempt_count,'rowVersion',d.row_version::text,
 'firstSentAt',d.first_sent_at,'nextEligibleAt',d.next_eligible_at,'leaseExpiresAt',d.lease_expires_at,'lastOutcome',d.last_outcome,
 'receipt',(SELECT canonical_receipt::jsonb FROM marketing_report_delivery_receipts WHERE business_id=d.business_id AND report_id=d.report_id AND id=d.receipt_id)))
$$;
CREATE FUNCTION marketing_delivery_read(b uuid,rid uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE r marketing_reports%ROWTYPE;d marketing_report_deliveries%ROWTYPE;
BEGIN
 r:=marketing_delivery_scope(b,rid);SELECT * INTO d FROM marketing_report_deliveries WHERE business_id=b AND report_id=rid;
 IF d.report_id IS NULL THEN RETURN jsonb_build_object('delivery',jsonb_build_object('reportId',rid,'state','QUEUED','attemptCount',0,'rowVersion',NULL,'receipt',NULL)); END IF;
 RETURN marketing_delivery_result(d);
END $$;
CREATE FUNCTION marketing_delivery_claim(b uuid,rid uuid,association uuid,association_version text,binding text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE r marketing_reports%ROWTYPE;p marketing_report_preparations%ROWTYPE;d marketing_report_deliveries%ROWTYPE;t timestamptz;lid uuid;aid uuid;
BEGIN
 r:=marketing_delivery_scope(b,rid);SELECT * INTO p FROM marketing_report_preparations WHERE business_id=b AND id=r.preparation_id;
 IF association IS DISTINCT FROM p.association_id OR association_version IS DISTINCT FROM p.association_version::text OR binding IS DISTINCT FROM r.external_binding_id THEN RAISE EXCEPTION 'DELIVERY_CONFIGURATION_STALE' USING ERRCODE='P0001'; END IF;
 INSERT INTO marketing_report_deliveries(business_id,report_id) VALUES(b,rid) ON CONFLICT(business_id,report_id) DO NOTHING;
 SELECT * INTO d FROM marketing_report_deliveries WHERE business_id=b AND report_id=rid FOR UPDATE;t:=clock_timestamp();
 IF d.state='SENDING' THEN RAISE EXCEPTION 'DELIVERY_LEASE_ACTIVE' USING ERRCODE='P0001'; END IF;
 IF d.state IN('ACKNOWLEDGED','REJECTED','EXHAUSTED') THEN RAISE EXCEPTION 'DELIVERY_TERMINAL' USING ERRCODE='P0001'; END IF;
 IF d.attempt_count>=4 OR t>=d.first_sent_at+interval '24 hours' THEN
  UPDATE marketing_report_deliveries SET state='EXHAUSTED',next_eligible_at=NULL,row_version=row_version+1 WHERE business_id=b AND report_id=rid RETURNING * INTO d;
  RETURN marketing_delivery_result(d)||jsonb_build_object('claimed',false);
 END IF;
 IF t<d.next_eligible_at THEN RAISE EXCEPTION 'DELIVERY_NOT_ELIGIBLE' USING ERRCODE='P0001'; END IF;
 lid:=gen_random_uuid();aid:=gen_random_uuid();
 INSERT INTO marketing_report_delivery_attempts(id,business_id,report_id,attempt_number,lease_id,started_at,lease_expires_at,association_version)
 VALUES(aid,b,rid,d.attempt_count+1,lid,t,t+interval '60 seconds',p.association_version);
 UPDATE marketing_report_deliveries SET state='SENDING',attempt_count=attempt_count+1,first_sent_at=coalesce(first_sent_at,t),next_eligible_at=NULL,
  lease_id=lid,lease_expires_at=t+interval '60 seconds',row_version=row_version+1 WHERE business_id=b AND report_id=rid RETURNING * INTO d;
 RETURN marketing_delivery_result(d)||jsonb_build_object('claimed',true,'claim',jsonb_build_object('leaseId',lid,'attemptNumber',d.attempt_count,'leaseExpiresAt',d.lease_expires_at,'canonicalEnvelope',r.canonical_envelope));
END $$;

CREATE FUNCTION marketing_delivery_finish(b uuid,rid uuid,lid uuid,n integer,outcome text,http integer,receipt text,delay_seconds integer,retry_at timestamptz,settling boolean) RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,zuri_go,pg_temp SET datestyle='ISO,YMD' AS $$
DECLARE r marketing_reports%ROWTYPE;d marketing_report_deliveries%ROWTYPE;a marketing_report_delivery_attempts%ROWTYPE;t timestamptz;eligible timestamptz;new_state text;rcid uuid;v jsonb;
BEGIN
 r:=marketing_delivery_scope(b,rid);SELECT * INTO d FROM marketing_report_deliveries WHERE business_id=b AND report_id=rid FOR UPDATE;
 IF d.report_id IS NULL OR d.state<>'SENDING' OR NOT settling AND (lid IS DISTINCT FROM d.lease_id OR n IS DISTINCT FROM d.attempt_count)
  THEN RAISE EXCEPTION 'DELIVERY_LEASE_STALE' USING ERRCODE='P0001'; END IF;
 SELECT * INTO a FROM marketing_report_delivery_attempts WHERE business_id=b AND report_id=rid AND lease_id=d.lease_id AND attempt_number=d.attempt_count FOR UPDATE;
 t:=clock_timestamp();
 IF a.id IS NULL OR a.outcome IS NOT NULL THEN RAISE EXCEPTION 'DELIVERY_LEASE_STALE' USING ERRCODE='P0001'; END IF;
 IF settling THEN
  IF t<d.lease_expires_at THEN RAISE EXCEPTION 'DELIVERY_LEASE_ACTIVE' USING ERRCODE='P0001'; END IF;
  outcome:='UNKNOWN';http:=NULL;receipt:=NULL;delay_seconds:=NULL;retry_at:=NULL;
 ELSIF t>=d.lease_expires_at OR t>=d.first_sent_at+interval '24 hours' THEN RAISE EXCEPTION 'DELIVERY_LEASE_STALE' USING ERRCODE='P0001'; END IF;
 IF outcome IS NULL OR outcome NOT IN('ACK','UNKNOWN','RATE_LIMIT','REJECTED') OR http IS NOT NULL AND http NOT BETWEEN 100 AND 599
  OR outcome='ACK' AND (http IS NULL OR http NOT IN(200,201) OR receipt IS NULL)
  OR outcome='RATE_LIMIT' AND http IS DISTINCT FROM 429 OR outcome='REJECTED' AND (http IS NULL OR http NOT IN(400,401,403,404,409,413,415,422))
  OR outcome<>'ACK' AND receipt IS NOT NULL OR delay_seconds IS NOT NULL AND (outcome<>'RATE_LIMIT' OR delay_seconds NOT BETWEEN 0 AND 86400)
  OR retry_at IS NOT NULL AND (outcome<>'RATE_LIMIT' OR NOT isfinite(retry_at)) THEN RAISE EXCEPTION 'DELIVERY_RESULT_INVALID' USING ERRCODE='P0001'; END IF;
 IF outcome='ACK' THEN
  v:=receipt::jsonb;rcid:=gen_random_uuid();
  INSERT INTO marketing_report_delivery_receipts(id,business_id,report_id,attempt_id,binding_id,receiver_receipt_id,canonical_receipt,accepted_at,observed_at,retain_until)
  VALUES(rcid,b,rid,a.id,r.external_binding_id,(v->>'receiverReceiptId')::uuid,receipt,(v->>'acceptedAt')::timestamptz,t,(v->>'acceptedAt')::timestamptz+interval '90 days');new_state:='ACKNOWLEDGED';
 ELSIF outcome='REJECTED' THEN new_state:='REJECTED';
 ELSE
  eligible:=t+CASE d.attempt_count WHEN 1 THEN interval '1 minute' WHEN 2 THEN interval '5 minutes' ELSE interval '15 minutes' END;
  IF outcome='RATE_LIMIT' THEN eligible:=greatest(eligible,t+coalesce(delay_seconds,0)*interval '1 second',retry_at); END IF;
  IF d.attempt_count>=4 OR t>=d.first_sent_at+interval '24 hours' OR eligible>=d.first_sent_at+interval '24 hours' THEN new_state:='EXHAUSTED';eligible:=NULL;
  ELSE new_state:=CASE WHEN outcome='RATE_LIMIT' THEN 'RETRY_SCHEDULED' ELSE 'UNKNOWN' END; END IF;
 END IF;
 UPDATE marketing_report_delivery_attempts SET outcome=marketing_delivery_finish.outcome,http_status=http,finished_at=t WHERE id=a.id;
 UPDATE marketing_report_deliveries SET state=new_state,lease_id=NULL,lease_expires_at=NULL,next_eligible_at=eligible,receipt_id=rcid,
  last_outcome=outcome,row_version=row_version+1 WHERE business_id=b AND report_id=rid RETURNING * INTO d;
 RETURN marketing_delivery_result(d);
END $$;
CREATE FUNCTION marketing_delivery_complete(b uuid,rid uuid,lid uuid,n integer,outcome text,http integer,receipt text,delay_seconds integer,retry_at timestamptz) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
 SELECT marketing_delivery_finish(b,rid,lid,n,outcome,http,receipt,delay_seconds,retry_at,false)
$$;
CREATE FUNCTION marketing_delivery_settle(b uuid,rid uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
 SELECT marketing_delivery_finish(b,rid,NULL,NULL,'UNKNOWN',NULL,NULL,NULL,NULL,true)
$$;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT oid::regprocedure AS name FROM pg_proc WHERE pronamespace='zuri_go'::regnamespace AND (proname LIKE 'marketing_delivery_%' OR proname IN('marketing_attempt_guard','marketing_receipt_guard')) LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,zuri_go_app',f.name);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION marketing_delivery_claim(uuid,uuid,uuid,text,text),marketing_delivery_complete(uuid,uuid,uuid,integer,text,integer,text,integer,timestamptz),marketing_delivery_settle(uuid,uuid),marketing_delivery_read(uuid,uuid) TO zuri_go_app;
GRANT SELECT ON marketing_report_deliveries,marketing_report_delivery_attempts,marketing_report_delivery_receipts TO zuri_go_app;
REVOKE INSERT,UPDATE,DELETE ON marketing_report_deliveries,marketing_report_delivery_attempts,marketing_report_delivery_receipts FROM PUBLIC,zuri_go_app;
COMMIT;
