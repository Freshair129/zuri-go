BEGIN;
SET search_path TO zuri_go,public;
-- @trace implements FR-015-001, FR-015-003 — additive file only; no transport or existing-data rewrite.
CREATE TABLE marketing_report_associations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id),
 source_deployment_id text NOT NULL CHECK(source_deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$'),
 external_binding_id text NOT NULL CHECK(external_binding_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$'),
 parent_tenant_id text NOT NULL CHECK(parent_tenant_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$'),
 parent_business_id text NOT NULL CHECK(parent_business_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$'),
 parent_initiative_id text NOT NULL CHECK(parent_initiative_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$'),
 reviewed_at timestamptz NOT NULL CHECK(isfinite(reviewed_at)), review_ref text NOT NULL CHECK(review_ref ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$'),
 active boolean NOT NULL DEFAULT true, row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(business_id,id)
);
CREATE TABLE marketing_report_preparations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES businesses(id),campaign_id uuid NOT NULL,association_id uuid NOT NULL,association_version bigint NOT NULL,
 request_key uuid NOT NULL,request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),preview_hash text NOT NULL CHECK(preview_hash ~ '^[a-f0-9]{64}$'),
 canonical_preview text NOT NULL CHECK(octet_length(canonical_preview)<=262144),captured_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(business_id,id),CONSTRAINT marketing_preparation_key UNIQUE(business_id,campaign_id,request_key),UNIQUE(business_id,campaign_id,id),
 FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id),FOREIGN KEY(business_id,association_id) REFERENCES marketing_report_associations(business_id,id),
 CHECK(isfinite(captured_at) AND expires_at=captured_at+interval '15 minutes'),
 CHECK(preview_hash=encode(public.digest(convert_to(canonical_preview,'UTF8'),'sha256'),'hex'))
);
CREATE TABLE marketing_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES businesses(id),campaign_id uuid NOT NULL,preparation_id uuid NOT NULL,
 freeze_key uuid NOT NULL,freeze_request_hash text NOT NULL CHECK(freeze_request_hash ~ '^[a-f0-9]{64}$'),
 source_deployment_id text NOT NULL,external_binding_id text NOT NULL,target_initiative_id text NOT NULL,
 activity_start date NOT NULL,activity_end_exclusive date NOT NULL,activity_timezone text NOT NULL,
 report_revision integer NOT NULL DEFAULT 1 CHECK(report_revision=1),supersedes_report_id uuid CHECK(supersedes_report_id IS NULL),
 payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),frozen_at timestamptz NOT NULL CHECK(isfinite(frozen_at)),canonical_envelope text NOT NULL CHECK(octet_length(canonical_envelope)<=262144),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(business_id,id),CONSTRAINT marketing_freeze_key UNIQUE(business_id,freeze_key),CONSTRAINT marketing_one_preparation UNIQUE(business_id,preparation_id),
 CONSTRAINT marketing_original_scope UNIQUE(business_id,source_deployment_id,external_binding_id,target_initiative_id,campaign_id,activity_start,activity_end_exclusive,activity_timezone),
 FOREIGN KEY(business_id,campaign_id,preparation_id) REFERENCES marketing_report_preparations(business_id,campaign_id,id),
 CHECK(extract(isodow FROM activity_start)=1 AND activity_end_exclusive=activity_start+7)
);
CREATE TABLE marketing_report_outbox (
 business_id uuid NOT NULL REFERENCES businesses(id),report_id uuid NOT NULL,state text NOT NULL DEFAULT 'QUEUED' CHECK(state='QUEUED'),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(business_id,report_id),FOREIGN KEY(business_id,report_id) REFERENCES marketing_reports(business_id,id)
);
CREATE POLICY marketing_audit_private ON change_events AS RESTRICTIVE FOR SELECT USING(entity_type<>'marketing_reports' OR viewer_kind()='operator');

CREATE FUNCTION marketing_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN RAISE EXCEPTION 'MARKETING_IMMUTABLE' USING ERRCODE='42501'; END $$;
CREATE FUNCTION marketing_association_update() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['active','row_version']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['active','row_version']) THEN RAISE EXCEPTION 'MARKETING_IMMUTABLE' USING ERRCODE='42501'; END IF;
 NEW.row_version:=OLD.row_version+1;RETURN NEW;
END $$;
CREATE TRIGGER marketing_association_guard BEFORE UPDATE OR DELETE ON marketing_report_associations FOR EACH ROW EXECUTE FUNCTION marketing_association_update();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['marketing_report_associations','marketing_report_preparations','marketing_reports','marketing_report_outbox'] LOOP
  EXECUTE format('ALTER TABLE zuri_go.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE zuri_go.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY business_scope ON zuri_go.%I USING (business_id=nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid) WITH CHECK (business_id=nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid)',t);
  EXECUTE format('CREATE POLICY operator_only ON zuri_go.%I AS RESTRICTIVE USING (zuri_go.viewer_kind()=''operator'') WITH CHECK (zuri_go.viewer_kind()=''operator'')',t);
  IF t<>'marketing_report_associations' THEN EXECUTE format('CREATE TRIGGER marketing_append_only BEFORE UPDATE OR DELETE ON zuri_go.%I FOR EACH ROW EXECUTE FUNCTION zuri_go.marketing_immutable()',t); END IF;
 END LOOP;
END $$;

-- Compact canonical JSON, ordered arrays, ASCII field names. Source keys outside this supported domain fail closed.
-- The source model uses ASCII field names; Thai/Unicode values are preserved as UTF-8. Float rendering mirrors JSON.stringify's notation thresholds.
CREATE FUNCTION marketing_canonical(v jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,zuri_go,pg_temp SET extra_float_digits=3 AS $$
DECLARE result text; n numeric; f double precision; s text; exponent integer; mantissa text;
BEGIN
 CASE jsonb_typeof(v)
 WHEN 'object' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(v) k WHERE k !~ '^[ -~]*$') THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
  SELECT '{'||coalesce(string_agg(to_jsonb(k)::text||':'||marketing_canonical(x),',' ORDER BY CASE WHEN k ~ '^(0|[1-9][0-9]{0,9})$' AND length(k)<=10 THEN CASE WHEN k::numeric<4294967295 THEN k::numeric END END NULLS LAST,k COLLATE "C"),'')||'}' INTO result FROM jsonb_each(v) e(k,x);
 WHEN 'array' THEN SELECT '['||coalesce(string_agg(marketing_canonical(x),',' ORDER BY ord),'')||']' INTO result FROM jsonb_array_elements(v) WITH ORDINALITY e(x,ord);
 WHEN 'number' THEN
  f:=(v#>>'{}')::double precision; IF f::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
  IF f=0 THEN RETURN '0'; END IF;
  s:=f::text;
  IF abs(f)>=0.000001 AND abs(f)<1e21 THEN n:=s::numeric;result:=n::text;IF position('.' IN result)>0 THEN result:=rtrim(rtrim(result,'0'),'.'); END IF;
  ELSIF position('e' IN s)>0 THEN mantissa:=split_part(s,'e',1);exponent:=split_part(s,'e',2)::integer;result:=mantissa||'e'||CASE WHEN exponent>=0 THEN '+' ELSE '' END||exponent::text;
  ELSE result:=s; END IF;
 ELSE result:=v::text;
 END CASE;
 RETURN result;
EXCEPTION WHEN numeric_value_out_of_range THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001';
END $$;
CREATE FUNCTION marketing_hash(v jsonb) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$ SELECT encode(public.digest(convert_to(marketing_canonical(v),'UTF8'),'sha256'),'hex') $$;
CREATE FUNCTION marketing_time(t timestamptz) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$ SELECT to_char(t AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') $$;
CREATE FUNCTION marketing_fields(v jsonb,keys text[]) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN IF jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RETURN false; END IF;RETURN v ?& keys AND (SELECT count(*) FROM jsonb_object_keys(v))=cardinality(keys);END $$;
CREATE FUNCTION marketing_date(v text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,zuri_go,pg_temp SET datestyle='ISO,YMD' AS $$
BEGIN IF v IS NULL OR v !~ '^\d{4}-\d{2}-\d{2}$' THEN RETURN false; END IF; RETURN v::date::text=v;EXCEPTION WHEN OTHERS THEN RETURN false; END $$;
CREATE FUNCTION marketing_decimal(v jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE n numeric;result text;
BEGIN
 IF v IS NULL OR v='null'::jsonb THEN RETURN NULL; END IF;
 IF jsonb_typeof(v)<>'number' THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
 n:=(v#>>'{}')::numeric;IF n<0 OR n>9007199254740991 OR n<>round(n,4) THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
 result:=n::text;IF position('.' IN result)>0 THEN result:=rtrim(rtrim(result,'0'),'.'); END IF;RETURN result;
END $$;
CREATE FUNCTION marketing_window(w jsonb,t timestamptz) RETURNS boolean LANGUAGE plpgsql STABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE zone text;at_time timestamptz;
BEGIN
 IF marketing_fields(w,ARRAY['start','endExclusive','timezone','asOf']) IS NOT TRUE OR EXISTS(SELECT 1 FROM jsonb_each(w) e(k,v) WHERE jsonb_typeof(v)<>'string') THEN RETURN false; END IF;
 zone:=w->>'timezone';
 IF NOT marketing_date(w->>'start') OR NOT marketing_date(w->>'endExclusive') OR extract(isodow FROM (w->>'start')::date)<>1 OR (w->>'endExclusive')::date<>(w->>'start')::date+7
  OR length(zone)>64 OR (zone<>'UTC' AND position('/' IN zone)=0) OR NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=zone)
  OR (w->>'asOf') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$' THEN RETURN false; END IF;
 IF NOT marketing_date(left(w->>'asOf',10)) OR substring(w->>'asOf',12,2)::integer>23 OR substring(w->>'asOf',15,2)::integer>59 OR substring(w->>'asOf',18,2)::integer>59 THEN RETURN false; END IF;
 at_time:=(w->>'asOf')::timestamptz;RETURN at_time<=t AND (at_time AT TIME ZONE zone)::date >= (w->>'start')::date;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

ALTER TABLE marketing_report_preparations ADD CONSTRAINT marketing_preview_parity CHECK((
 canonical_preview=marketing_canonical(canonical_preview::jsonb)
 AND marketing_fields(canonical_preview::jsonb,ARRAY['previewVersion','readiness','businessId','campaign','sourceRevision','capturedAt','window','payload'])
 AND canonical_preview::jsonb->>'previewVersion'='zuri-marketing-preview/0.1' AND canonical_preview::jsonb->>'readiness'='HELD'
 AND canonical_preview::jsonb->>'businessId'=business_id::text AND canonical_preview::jsonb->'campaign'->>'sourceCampaignId'=campaign_id::text
 AND canonical_preview::jsonb->>'capturedAt'=marketing_time(captured_at)) IS TRUE);
ALTER TABLE marketing_reports ADD CONSTRAINT marketing_envelope_parity CHECK((
 canonical_envelope=marketing_canonical(canonical_envelope::jsonb)
 AND marketing_fields(canonical_envelope::jsonb,ARRAY['contractVersion','reportId','reportRevision','supersedesReportId','source','target','campaign','sourceRevision','window','frozenAt','payload','payloadHash'])
 AND canonical_envelope::jsonb->>'contractVersion'='zuri-marketing-report/0.1' AND canonical_envelope::jsonb->>'reportId'=id::text
 AND canonical_envelope::jsonb->'reportRevision'='1'::jsonb AND canonical_envelope::jsonb->'supersedesReportId'='null'::jsonb
 AND canonical_envelope::jsonb->>'payloadHash'=payload_hash AND payload_hash=marketing_hash(canonical_envelope::jsonb-'payloadHash')
 AND canonical_envelope::jsonb->'source'->>'system'='zuri-go' AND canonical_envelope::jsonb->'source'->>'sourceBusinessId'=business_id::text
 AND canonical_envelope::jsonb->'source'->>'deploymentId'=source_deployment_id AND canonical_envelope::jsonb->'target'->>'bindingId'=external_binding_id
 AND canonical_envelope::jsonb->'target'->>'initiativeId'=target_initiative_id AND canonical_envelope::jsonb->'campaign'->>'sourceCampaignId'=campaign_id::text
 AND canonical_envelope::jsonb->'window'->>'start'=activity_start::text AND canonical_envelope::jsonb->'window'->>'endExclusive'=activity_end_exclusive::text
 AND canonical_envelope::jsonb->'window'->>'timezone'=activity_timezone AND canonical_envelope::jsonb->>'frozenAt'=marketing_time(frozen_at)) IS TRUE);

-- Authoritative projection: never accept preview/envelope/source bytes from the function caller.
CREATE FUNCTION marketing_projection(b uuid,c uuid,w jsonb,t timestamptz) RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE campaign campaigns%ROWTYPE;st campaign_states%ROWTYPE;rev bigint;s jsonb;context jsonb;missing jsonb:='["SOURCE_TIMEZONE_UNATTESTED","SOURCE_COVERAGE_UNATTESTED"]';context_missing jsonb:='[]';
 refs jsonb;measurements jsonb:='[]';review jsonb;safe_review jsonb;review_row jsonb;collection text;key_name text;unit_name text;num_unit text;den_unit text;cohort boolean;watermark text;
 targets jsonb:='{}';value_text text;field text;row_value jsonb;rows_value jsonb;as_date date;gate text;setting numeric;finding jsonb;
BEGIN
 SELECT * INTO campaign FROM campaigns WHERE business_id=b AND id=c AND archived_at IS NULL;
 SELECT * INTO st FROM campaign_states WHERE business_id=b AND campaign_id=c;
 SELECT domain_revision INTO rev FROM businesses WHERE id=b;
 IF campaign.id IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_READABLE' USING ERRCODE='P0001'; END IF;
 IF st.campaign_id IS NULL THEN RAISE EXCEPTION 'SOURCE_INCOMPLETE' USING ERRCODE='P0001'; END IF;
 s:=st.state_json;
 IF st.schema_version<>1 OR st.payload_hash<>marketing_hash(s) OR campaign.code !~ '^CAM-[0-9]{4,60}$' OR campaign.currency !~ '^[A-Z]{3}$'
  OR jsonb_typeof(s->'version') IS DISTINCT FROM 'number' OR (s->>'version') !~ '^[1-9][0-9]*$' OR (s->>'version')::numeric>9007199254740991
  OR rev IS NULL OR marketing_window(w,t) IS NOT TRUE THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
 as_date:=((w->>'asOf')::timestamptz AT TIME ZONE (w->>'timezone'))::date;
 FOREACH collection IN ARRAY ARRAY['ads','leads','orders','reviews'] LOOP
  rows_value:=s->collection;
  IF jsonb_typeof(rows_value) IS DISTINCT FROM 'array' OR jsonb_array_length(rows_value)>10000 THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
  IF collection<>'reviews' AND (EXISTS(SELECT 1 FROM jsonb_array_elements(rows_value) r(v) WHERE jsonb_typeof(v)<>'object' OR jsonb_typeof(v->'id') IS DISTINCT FROM 'string' OR v->>'id'='' OR NOT marketing_date(v->>'date'))
   OR (SELECT count(*) FROM jsonb_array_elements(rows_value))<>(SELECT count(DISTINCT v->>'id') FROM jsonb_array_elements(rows_value) r(v))) THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
  FOR row_value IN SELECT value FROM jsonb_array_elements(rows_value) LOOP
   IF collection='ads' AND row_value->>'date'>=w->>'start' AND row_value->>'date'<w->>'endExclusive' AND (row_value->>'date')::date<=as_date THEN
    IF marketing_decimal(row_value->'spend') IS NULL THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
    FOREACH field IN ARRAY ARRAY['impressions','clicks'] LOOP
     IF coalesce(row_value->field,'null')<>'null'::jsonb AND (jsonb_typeof(row_value->field)<>'number' OR (row_value->>field) !~ '^(0|[1-9][0-9]*)$' OR (row_value->>field)::numeric>9007199254740991) THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
    END LOOP;
    IF (row_value->>'clicks')::numeric>(row_value->>'impressions')::numeric THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
   ELSIF collection='leads' THEN
    FOREACH field IN ARRAY ARRAY['mqlAt','sqlAt'] LOOP IF coalesce(row_value->>field,'')<>'' AND (NOT marketing_date(row_value->>field) OR row_value->>field<row_value->>'date') THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF; END LOOP;
   ELSIF collection='orders' THEN
    IF row_value->>'status' IS NULL OR row_value->>'status' NOT IN('paid','fulfilled','cancelled','void') OR marketing_decimal(row_value->'amount') IS NULL OR marketing_decimal(row_value->'refund') IS NULL
     OR (row_value->>'refund')::numeric>(row_value->>'amount')::numeric OR ((row_value->>'refund')::numeric>0 AND (NOT marketing_date(row_value->>'refundAt') OR row_value->>'refundAt'<row_value->>'date')) THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
   END IF;
  END LOOP;
 END LOOP;
 IF coalesce(s->'windowDays','null')<>'null'::jsonb AND (jsonb_typeof(s->'windowDays')<>'number' OR (s->>'windowDays') !~ '^[1-9][0-9]*$' OR (s->>'windowDays')::numeric>9007199254740991) THEN RAISE EXCEPTION 'SOURCE_INVALID' USING ERRCODE='P0001'; END IF;
 FOREACH field IN ARRAY ARRAY['low','mid','high'] LOOP
  value_text:=marketing_decimal(s->'targets'->field);targets:=targets||jsonb_build_object(field,value_text);
  IF value_text IS NULL THEN context_missing:=context_missing||jsonb_build_array('TARGET_'||upper(field)||'_MISSING'); END IF;
 END LOOP;
 IF marketing_decimal(s->'cap') IS NULL THEN context_missing:=context_missing||'"RELEASED_CAP_MISSING"'::jsonb; END IF;
 IF marketing_decimal(s->'committed') IS NULL THEN context_missing:=context_missing||'"COMMITTED_SPEND_MISSING"'::jsonb; END IF;
 context:=jsonb_build_object('settingsVersion',s->'version','targets',targets,'releasedCap',marketing_decimal(s->'cap'),'committedSpend',marketing_decimal(s->'committed'),'definitionVersion','1','missingFieldCodes',context_missing);
 refs:=jsonb_build_array(jsonb_build_object('refId','campaign-state','kind','CAMPAIGN_STATE','sourceEntityId',c,'sourceRevision',st.row_version::text,'sanitizedHash',NULL));
 FOR key_name,unit_name,collection,num_unit,den_unit IN SELECT * FROM (VALUES
  ('reported_spend','currency','ads',NULL::text,NULL::text),('reported_impressions','count','ads',NULL,NULL),('reported_clicks','count','ads',NULL,NULL),('reported_new_leads','count','leads',NULL,NULL),
  ('reported_mql_entries','count','leads',NULL,NULL),('reported_sql_entries','count','leads',NULL,NULL),('reported_paid_orders','count','orders',NULL,NULL),('reported_net_revenue','currency','orders',NULL,NULL),
  ('reported_ctr','ratio','ads','count','count'),('reported_cpl','currency','ads','currency','count'),('reported_cpo','currency','ads','currency','count'),('reported_mature_lead_to_paid','ratio','leads','count','count')) m(k,u,c,n,d) ORDER BY k COLLATE "C" LOOP
  cohort:=key_name='reported_mature_lead_to_paid';watermark:=s->'sources'->>collection;
  measurements:=measurements||jsonb_build_array(jsonb_build_object('key',key_name,'value',NULL,'unit',unit_name,'currency',CASE WHEN unit_name='currency' THEN campaign.currency::text END,'quality','UNKNOWN','reasonCodes',missing,
   'scope',w||jsonb_build_object('kind',CASE WHEN cohort THEN 'ACQUISITION_COHORT' ELSE 'ACTIVITY' END,'offer',NULL,'channel',NULL,'attributionState','UNKNOWN'),
   'ratio',CASE WHEN num_unit IS NOT NULL THEN jsonb_build_object('numerator',NULL,'denominator',NULL,'numeratorUnit',num_unit,'denominatorUnit',den_unit,'formulaVersion','reported-marketing/0.1') END,
   'cohort',CASE WHEN cohort THEN jsonb_build_object('followupWindowDays',s->'windowDays','matureCount',NULL,'pendingCount',NULL,'convertedCount',NULL) END,
   'provenance',jsonb_build_object('sourceClass','MANUAL_REPORTED','modelVersion','1','collectionKnownAt',NULL,'watermarkDate',CASE WHEN marketing_date(watermark) THEN watermark END,'sourceTimezone',NULL,'timezoneState','UNKNOWN','sourceRefIds',jsonb_build_array('campaign-state'))));
 END LOOP;
 SELECT v INTO review_row FROM jsonb_array_elements(s->'reviews') r(v) WHERE marketing_date(v->>'date') AND v->>'date'>=w->>'start' AND v->>'date'<w->>'endExclusive' AND v->>'date'<=as_date::text ORDER BY v->>'date' DESC,(v->>'id') COLLATE "C" DESC LIMIT 1;
 gate:=review_row->'snapshot'->'gate'->>'status';
 IF review_row->>'id' ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$' AND jsonb_typeof(review_row->'snapshot'->'settings'->'version')='number'
  AND (review_row->'snapshot'->'settings'->>'version') ~ '^[1-9][0-9]*$' AND (review_row->'snapshot'->'settings'->>'version')::numeric<=9007199254740991 AND gate IN('BLOCK','DATA_HOLD','LEARNING','FIX','ON_TRACK','HIGH','BASE') THEN
  finding:=CASE gate WHEN 'BLOCK' THEN '["GATE_BLOCKED"]'::jsonb WHEN 'DATA_HOLD' THEN '["MISSING_REVIEW_INPUTS"]'::jsonb WHEN 'LEARNING' THEN '["LEARNING_ONLY"]'::jsonb WHEN 'FIX' THEN '["RECHECK_REQUIRED"]'::jsonb ELSE '[]'::jsonb END;
  safe_review:=jsonb_build_object('sourceReviewId',review_row->>'id','recordedDate',review_row->>'date','settingsVersion',review_row->'snapshot'->'settings'->'version','reportedGateStatus',gate,'findingCodes',finding,'recommendationCodes','[]'::jsonb,'provenance','LEGACY_REPORTED','approvalTrust','UNVERIFIED');
  review:=safe_review||jsonb_build_object('sanitizedSnapshotHash',marketing_hash(safe_review));
  refs:=refs||jsonb_build_array(jsonb_build_object('refId','weekly-review','kind','LEGACY_REVIEW','sourceEntityId',review_row->>'id','sourceRevision',st.row_version::text,'sanitizedHash',review->>'sanitizedSnapshotHash'));
 ELSE missing:=missing||'"WEEKLY_REVIEW_UNAVAILABLE"'::jsonb; END IF;
 RETURN jsonb_build_object('previewVersion','zuri-marketing-preview/0.1','readiness','HELD','businessId',b,
  'campaign',jsonb_build_object('sourceCampaignId',c,'code',campaign.code,'objective',campaign.objective,'lifecycle',campaign.lifecycle,'currency',campaign.currency::text),
  'sourceRevision',jsonb_build_object('campaignRowVersion',campaign.row_version::text,'stateRowVersion',st.row_version::text,'statePayloadHash',st.payload_hash,'businessDomainRevision',rev::text,'modelVersion','1'),
  'capturedAt',marketing_time(t),'window',w,'payload',jsonb_build_object('context',context,'measurements',measurements,'sourceReferences',refs,'weeklyReviewAssertion',review,'missingFieldCodes',missing));
END $$;

CREATE FUNCTION marketing_assert_operator(b uuid) RETURNS void LANGUAGE plpgsql STABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN IF viewer_kind()<>'operator' OR nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM b THEN RAISE EXCEPTION 'REPORT_DENIED' USING ERRCODE='P0001'; END IF; END $$;

CREATE FUNCTION marketing_preparation_result(p marketing_report_preparations,replayed boolean) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
 SELECT jsonb_build_object('replayed',replayed,'preparation',jsonb_build_object('id',p.id,'expiresAt',marketing_time(p.expires_at),'preview',p.canonical_preview::jsonb||jsonb_build_object('previewHash',p.preview_hash))) $$;
CREATE FUNCTION marketing_report_result(r marketing_reports,replayed boolean) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
 SELECT jsonb_build_object('replayed',replayed,'report',jsonb_build_object('envelope',r.canonical_envelope::jsonb,'canonicalEnvelope',r.canonical_envelope,'state','QUEUED')) $$;

CREATE FUNCTION marketing_prepare(b uuid,c uuid,input jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp SET datestyle='ISO,YMD' AS $$
DECLARE a marketing_report_associations%ROWTYPE;p marketing_report_preparations%ROWTYPE;preview jsonb;t timestamptz;request_hash text;
BEGIN
 PERFORM marketing_assert_operator(b);
 IF octet_length(input::text)>4096 OR marketing_fields(input,ARRAY['idempotencyKey','associationId','window']) IS NOT TRUE
  OR jsonb_typeof(input->'idempotencyKey') IS DISTINCT FROM 'string' OR input->>'idempotencyKey' !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
  OR jsonb_typeof(input->'associationId') IS DISTINCT FROM 'string' OR input->>'associationId' !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' OR marketing_window(input->'window',clock_timestamp()) IS NOT TRUE THEN RAISE EXCEPTION 'REQUEST_INVALID' USING ERRCODE='P0001'; END IF;
 -- NO KEY UPDATE serializes workspace edits without conflicting with campaign-save audit FK KEY SHARE.
 PERFORM 1 FROM businesses WHERE id=b FOR NO KEY UPDATE;
 PERFORM 1 FROM campaigns WHERE business_id=b AND id=c AND archived_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CAMPAIGN_NOT_READABLE' USING ERRCODE='P0001'; END IF;
 PERFORM 1 FROM campaign_states WHERE business_id=b AND campaign_id=c FOR UPDATE;
 SELECT * INTO a FROM marketing_report_associations WHERE business_id=b AND id=(input->>'associationId')::uuid FOR UPDATE;
 IF a.id IS NULL OR NOT a.active THEN RAISE EXCEPTION 'ASSOCIATION_DENIED' USING ERRCODE='P0001'; END IF;
 request_hash:=marketing_hash(input);
 SELECT * INTO p FROM marketing_report_preparations WHERE business_id=b AND campaign_id=c AND request_key=(input->>'idempotencyKey')::uuid;
 IF p.id IS NOT NULL THEN
  IF p.request_hash<>request_hash THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE='P0001'; END IF;
  IF p.association_version<>a.row_version THEN RAISE EXCEPTION 'ASSOCIATION_STALE' USING ERRCODE='P0001'; END IF;
  RETURN marketing_preparation_result(p,true);
 END IF;
 t:=date_trunc('milliseconds',clock_timestamp());preview:=marketing_projection(b,c,input->'window',t);
 INSERT INTO marketing_report_preparations(business_id,campaign_id,association_id,association_version,request_key,request_hash,preview_hash,canonical_preview,captured_at,expires_at)
 VALUES(b,c,a.id,a.row_version,(input->>'idempotencyKey')::uuid,request_hash,marketing_hash(preview),marketing_canonical(preview),t,t+interval '15 minutes') RETURNING * INTO p;
 RETURN marketing_preparation_result(p,false);
END $$;

CREATE FUNCTION marketing_freeze(b uuid,c uuid,input jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp SET datestyle='ISO,YMD' AS $$
DECLARE p marketing_report_preparations%ROWTYPE;a marketing_report_associations%ROWTYPE;r marketing_reports%ROWTYPE;association uuid;preview jsonb;envelope jsonb;content jsonb;t timestamptz;request_hash text;report_id uuid;hash text;
BEGIN
 PERFORM marketing_assert_operator(b);
 IF octet_length(input::text)>4096 OR marketing_fields(input,ARRAY['idempotencyKey','preparationId','expectedPreviewHash','expectedSourceRevision']) IS NOT TRUE
  OR EXISTS(SELECT 1 FROM jsonb_each(input) e(k,v) WHERE k<>'expectedSourceRevision' AND jsonb_typeof(v)<>'string')
  OR input->>'idempotencyKey' !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
  OR input->>'preparationId' !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' OR input->>'expectedPreviewHash' !~ '^[a-f0-9]{64}$'
  OR marketing_fields(input->'expectedSourceRevision',ARRAY['campaignRowVersion','stateRowVersion','statePayloadHash','businessDomainRevision','modelVersion']) IS NOT TRUE
  OR EXISTS(SELECT 1 FROM jsonb_each(input->'expectedSourceRevision') e(k,v) WHERE jsonb_typeof(v)<>'string' OR CASE WHEN k='statePayloadHash' THEN v#>>'{}' !~ '^[a-f0-9]{64}$' ELSE v#>>'{}' !~ '^(0|[1-9][0-9]*)$' END)
  OR input->'expectedSourceRevision'->>'modelVersion'<>'1' THEN RAISE EXCEPTION 'REQUEST_INVALID' USING ERRCODE='P0001'; END IF;
 -- Read association ID without locking; all mutations use the common lock order below.
 SELECT association_id INTO association FROM marketing_report_preparations WHERE business_id=b AND campaign_id=c AND id=(input->>'preparationId')::uuid;
 IF association IS NULL THEN RAISE EXCEPTION 'PREPARATION_NOT_READABLE' USING ERRCODE='P0001'; END IF;
 PERFORM 1 FROM businesses WHERE id=b FOR NO KEY UPDATE;
 PERFORM 1 FROM campaigns WHERE business_id=b AND id=c FOR UPDATE;
 PERFORM 1 FROM campaign_states WHERE business_id=b AND campaign_id=c FOR UPDATE;
 SELECT * INTO a FROM marketing_report_associations WHERE business_id=b AND id=association FOR UPDATE;
 SELECT * INTO p FROM marketing_report_preparations WHERE business_id=b AND campaign_id=c AND id=(input->>'preparationId')::uuid FOR UPDATE;
 IF a.id IS NULL OR NOT a.active THEN RAISE EXCEPTION 'ASSOCIATION_DENIED' USING ERRCODE='P0001'; END IF;
 IF p.association_version<>a.row_version THEN RAISE EXCEPTION 'ASSOCIATION_STALE' USING ERRCODE='P0001'; END IF;
 request_hash:=marketing_hash(input);
 SELECT * INTO r FROM marketing_reports WHERE business_id=b AND freeze_key=(input->>'idempotencyKey')::uuid;
 IF r.id IS NOT NULL THEN
  IF r.campaign_id<>c OR r.freeze_request_hash<>request_hash THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE='P0001'; END IF;
  RETURN marketing_report_result(r,true);
 END IF;
 IF EXISTS(SELECT 1 FROM marketing_reports WHERE business_id=b AND preparation_id=p.id) THEN RAISE EXCEPTION 'PREPARATION_ALREADY_FROZEN' USING ERRCODE='P0001'; END IF;
 IF clock_timestamp()>=p.expires_at THEN RAISE EXCEPTION 'PREPARATION_EXPIRED' USING ERRCODE='P0001'; END IF;
 preview:=p.canonical_preview::jsonb;
 IF p.preview_hash<>input->>'expectedPreviewHash' OR p.preview_hash<>marketing_hash(preview) THEN RAISE EXCEPTION 'PREVIEW_MISMATCH' USING ERRCODE='P0001'; END IF;
 IF preview->'sourceRevision' IS DISTINCT FROM input->'expectedSourceRevision' THEN RAISE EXCEPTION 'SOURCE_STALE' USING ERRCODE='P0001'; END IF;
 -- Original capturedAt, not the new clock, determines the confirmed safe projection.
 BEGIN
  IF preview IS DISTINCT FROM marketing_projection(b,c,preview->'window',p.captured_at) THEN RAISE EXCEPTION 'SOURCE_STALE' USING ERRCODE='P0001'; END IF;
 EXCEPTION WHEN SQLSTATE 'P0001' THEN RAISE EXCEPTION 'SOURCE_STALE' USING ERRCODE='P0001'; END;
 IF EXISTS(SELECT 1 FROM marketing_reports WHERE business_id=b AND campaign_id=c AND source_deployment_id=a.source_deployment_id AND external_binding_id=a.external_binding_id AND target_initiative_id=a.parent_initiative_id
  AND activity_start=(preview->'window'->>'start')::date AND activity_end_exclusive=(preview->'window'->>'endExclusive')::date AND activity_timezone=preview->'window'->>'timezone') THEN RAISE EXCEPTION 'REPORT_SCOPE_EXISTS' USING ERRCODE='P0001'; END IF;
 t:=date_trunc('milliseconds',clock_timestamp());report_id:=gen_random_uuid();
 content:=jsonb_build_object('contractVersion','zuri-marketing-report/0.1','reportId',report_id,'reportRevision',1,'supersedesReportId',NULL,
  'source',jsonb_build_object('system','zuri-go','deploymentId',a.source_deployment_id,'sourceBusinessId',b),'target',jsonb_build_object('bindingId',a.external_binding_id,'initiativeId',a.parent_initiative_id),
  'campaign',preview->'campaign','sourceRevision',preview->'sourceRevision','window',preview->'window','frozenAt',marketing_time(t),'payload',preview->'payload');
 hash:=marketing_hash(content);envelope:=content||jsonb_build_object('payloadHash',hash);
 INSERT INTO marketing_reports(id,business_id,campaign_id,preparation_id,freeze_key,freeze_request_hash,source_deployment_id,external_binding_id,target_initiative_id,activity_start,activity_end_exclusive,activity_timezone,payload_hash,frozen_at,canonical_envelope)
 VALUES(report_id,b,c,p.id,(input->>'idempotencyKey')::uuid,request_hash,a.source_deployment_id,a.external_binding_id,a.parent_initiative_id,(preview->'window'->>'start')::date,(preview->'window'->>'endExclusive')::date,preview->'window'->>'timezone',hash,t,marketing_canonical(envelope)) RETURNING * INTO r;
 INSERT INTO marketing_report_outbox(business_id,report_id) VALUES(b,report_id);
 INSERT INTO change_events(business_id,entity_type,entity_id,event_type,after_data,actor_kind,actor_subject,request_id)
 VALUES(b,'marketing_reports',report_id,'create',jsonb_build_object('reportId',report_id,'preparationId',p.id,'payloadHash',hash,'state','QUEUED'),'local_operator','local_operator',(input->>'idempotencyKey'));
 RETURN marketing_report_result(r,false);
END $$;

-- No PUBLIC access to helper functions; no runtime access to builders that bypass finalization.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT oid::regprocedure AS name FROM pg_proc WHERE pronamespace='zuri_go'::regnamespace AND proname LIKE 'marketing_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,zuri_go_app',f.name);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION marketing_prepare(uuid,uuid,jsonb),marketing_freeze(uuid,uuid,jsonb) TO zuri_go_app;
GRANT SELECT ON marketing_report_associations,marketing_report_preparations,marketing_reports,marketing_report_outbox TO zuri_go_app;
REVOKE INSERT,UPDATE,DELETE ON marketing_report_associations,marketing_report_preparations,marketing_reports,marketing_report_outbox FROM PUBLIC,zuri_go_app;
COMMIT;
