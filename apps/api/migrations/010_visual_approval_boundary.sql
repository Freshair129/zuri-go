BEGIN;
SET search_path TO zuri_go,public;
-- @trace implements FR-014-008, FR-014-009, FR-014-010
-- Preserve legacy hashes and rows. New trust is established only by the finalization functions below.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

ALTER TABLE zuri_go.visual_artifacts
 ADD COLUMN canonical_hash text GENERATED ALWAYS AS (encode(public.digest(payload::text,'sha256'),'hex')) STORED,
 ADD CONSTRAINT visual_artifact_canonical_hash_format CHECK(canonical_hash ~ '^[a-f0-9]{64}$');
ALTER TABLE zuri_go.visual_reviews
 ADD COLUMN assessment jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(assessment)='object'),
 ADD COLUMN validated boolean NOT NULL DEFAULT false,
 ADD COLUMN validated_pass boolean NOT NULL DEFAULT false CHECK(NOT validated_pass OR validated);
ALTER TABLE zuri_go.visual_public_outputs
 ADD COLUMN trusted_publication boolean NOT NULL DEFAULT false;

-- Rows written before schema 10 keep their history but do not become trusted retroactively.
DROP POLICY public_read ON zuri_go.visual_public_outputs;
CREATE POLICY public_read ON zuri_go.visual_public_outputs AS RESTRICTIVE FOR SELECT USING (
 (viewer_kind() IN('member','operator') AND EXISTS(SELECT 1 FROM zuri_go.visual_projects v WHERE v.business_id=visual_public_outputs.business_id AND v.project_id=visual_public_outputs.project_id))
 OR (trusted_publication AND active AND EXISTS(SELECT 1 FROM zuri_go.projects p WHERE p.business_id=visual_public_outputs.business_id AND p.id=visual_public_outputs.project_id AND p.visibility='public'))
);

-- Ordinary runtime SQL cannot manufacture the rows that carry approval authority.
REVOKE INSERT ON zuri_go.visual_reviews,zuri_go.visual_decisions,zuri_go.visual_public_outputs FROM PUBLIC,zuri_go_app;

-- Keep prior publication rows as history; each new owner approval gets its own projection row.
ALTER TABLE zuri_go.visual_public_outputs DROP CONSTRAINT visual_public_outputs_pkey;
ALTER TABLE zuri_go.visual_public_outputs ADD CONSTRAINT visual_public_outputs_pkey PRIMARY KEY(business_id,project_id,artifact_id,decision_id);

CREATE FUNCTION zuri_go.visual_calculate_review_result(p_assessment jsonb,p_brief jsonb,p_brand jsonb,p_bundle jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE
 checks text[]:=ARRAY['brand_consistency','message_accuracy','offer_accuracy','cta_clarity','channel_suitability','policy_safety','hallucinated_claims','duplicate_concepts'];
 category text; assessment_value jsonb; findings jsonb:='[]'::jsonb; blocking jsonb; suggestions jsonb;
 allowed_claims jsonb; forbidden_terms jsonb; source_refs jsonb; refs_valid boolean:=false; refs_json jsonb:='[]'::jsonb;
 outputs jsonb; stage_name text; stage_output jsonb; claim_value jsonb; forbidden_value jsonb;
 claim_text text; forbidden_text text;
BEGIN
 IF jsonb_typeof(p_assessment) IS DISTINCT FROM 'object'
  OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_assessment) AS k WHERE k<>ALL(checks))
  OR EXISTS(SELECT 1 FROM jsonb_each(p_assessment) AS e(k,v) WHERE jsonb_typeof(v)<>'boolean') THEN
  RAISE EXCEPTION 'Invalid QA assessment' USING ERRCODE='22023';
 END IF;
 IF jsonb_typeof(coalesce(p_brief->'proof_points','[]'::jsonb))<>'array'
  OR jsonb_typeof(coalesce(p_brand->'approved_claims','[]'::jsonb))<>'array'
  OR jsonb_typeof(coalesce(p_brief->'forbidden_elements','[]'::jsonb))<>'array'
  OR jsonb_typeof(coalesce(p_brand->'forbidden_claims','[]'::jsonb))<>'array' THEN
  RAISE EXCEPTION 'Invalid persisted review context' USING ERRCODE='22023';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(p_brief->'proof_points','[]'::jsonb)) AS x(v) WHERE jsonb_typeof(v)<>'string')
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(p_brand->'approved_claims','[]'::jsonb)) AS x(v) WHERE jsonb_typeof(v)<>'string')
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(p_brief->'forbidden_elements','[]'::jsonb)) AS x(v) WHERE jsonb_typeof(v)<>'string')
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(p_brand->'forbidden_claims','[]'::jsonb)) AS x(v) WHERE jsonb_typeof(v)<>'string') THEN
  RAISE EXCEPTION 'Invalid persisted review context' USING ERRCODE='22023';
 END IF;
 allowed_claims:=coalesce(p_brief->'proof_points','[]'::jsonb)||coalesce(p_brand->'approved_claims','[]'::jsonb);
 forbidden_terms:=coalesce(p_brief->'forbidden_elements','[]'::jsonb)||coalesce(p_brand->'forbidden_claims','[]'::jsonb);
 outputs:=CASE WHEN jsonb_typeof(p_bundle->'outputs')='object' THEN p_bundle->'outputs' ELSE '{}'::jsonb END;
 FOREACH category IN ARRAY checks LOOP
  assessment_value:=p_assessment->category;
  findings:=findings||jsonb_build_array(jsonb_build_object(
   'category',category,'status',CASE WHEN assessment_value='true'::jsonb THEN 'pass' WHEN assessment_value='false'::jsonb THEN 'fail' ELSE 'not_assessed' END,
   'severity',CASE WHEN assessment_value='true'::jsonb THEN 'info' ELSE 'blocking' END,
   'evidenceRefs',jsonb_build_array('brief','brand','COPY','ART_DIRECTION'),
   'message',CASE WHEN assessment_value='true'::jsonb THEN 'ผู้ตรวจยืนยันแล้ว' ELSE 'ต้องตรวจยืนยันหัวข้อนี้' END));
 END LOOP;
 IF jsonb_typeof(coalesce(p_brand->'approved_claims','[]'::jsonb))='array' AND jsonb_array_length(coalesce(p_brand->'approved_claims','[]'::jsonb))>0 THEN
  source_refs:=p_brand->'source_refs';
  IF jsonb_typeof(source_refs)='array' THEN
   refs_valid:=jsonb_array_length(source_refs) BETWEEN 1 AND 20 AND NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(source_refs) AS r(v)
    WHERE jsonb_typeof(v)<>'string' OR length(btrim(v#>>'{}')) NOT BETWEEN 1 AND 2000);
   IF refs_valid THEN SELECT coalesce(jsonb_agg(to_jsonb(btrim(v#>>'{}')) ORDER BY n),'[]'::jsonb) INTO refs_json FROM jsonb_array_elements(source_refs) WITH ORDINALITY AS r(v,n); END IF;
  END IF;
  findings:=findings||jsonb_build_array(jsonb_build_object(
   'category','claim_source_refs','status',CASE WHEN refs_valid THEN 'pass' ELSE 'fail' END,
   'severity',CASE WHEN refs_valid THEN 'info' ELSE 'blocking' END,
   'evidenceRefs',CASE WHEN refs_valid THEN refs_json ELSE jsonb_build_array('brand') END,
   'message',CASE WHEN refs_valid THEN 'ตรวจสอบแหล่งอ้างอิงคำกล่าวอ้างแล้ว' ELSE 'คำกล่าวอ้างที่ยืนยันแล้วต้องมีแหล่งอ้างอิง' END));
 END IF;
 FOR stage_name,stage_output IN SELECT e.key,e.value FROM jsonb_each(outputs) AS e(key,value) LOOP
  IF jsonb_typeof(coalesce(stage_output->'claims','[]'::jsonb))='array' THEN
   FOR claim_value IN SELECT value FROM jsonb_array_elements(coalesce(stage_output->'claims','[]'::jsonb)) LOOP
    IF NOT (allowed_claims @> jsonb_build_array(claim_value)) THEN
     claim_text:=claim_value#>>'{}';
     findings:=findings||jsonb_build_array(jsonb_build_object('category','hallucinated_claims','status','fail','severity','blocking','evidenceRefs',jsonb_build_array(stage_name),'message','ข้อความอ้างอิงไม่มีหลักฐานที่ยืนยัน: '||coalesce(claim_text,'')));
    END IF;
   END LOOP;
  ELSE
   RAISE EXCEPTION 'Invalid persisted stage claims' USING ERRCODE='22023';
  END IF;
  FOR forbidden_value IN SELECT value FROM jsonb_array_elements(forbidden_terms) LOOP
   forbidden_text:=forbidden_value#>>'{}';
   IF length(coalesce(forbidden_text,''))>0 AND position(lower(forbidden_text) IN lower(coalesce(stage_output->>'text','')))>0 THEN
    findings:=findings||jsonb_build_array(jsonb_build_object('category','brand_consistency','status','fail','severity','blocking','evidenceRefs',jsonb_build_array(stage_name),'message','พบข้อความที่ห้ามใช้: '||forbidden_text));
   END IF;
  END LOOP;
 END LOOP;
 IF NOT (outputs ? 'COPY') THEN findings:=findings||jsonb_build_array(jsonb_build_object('category','completeness','status','fail','severity','blocking','evidenceRefs',jsonb_build_array('COPY'),'message','ยังไม่มี COPY')); END IF;
 IF NOT (outputs ? 'ART_DIRECTION') THEN findings:=findings||jsonb_build_array(jsonb_build_object('category','completeness','status','fail','severity','blocking','evidenceRefs',jsonb_build_array('ART_DIRECTION'),'message','ยังไม่มี ART_DIRECTION')); END IF;
 findings:=findings||jsonb_build_array(
  jsonb_build_object('category','visual_hierarchy','status','not_assessed','severity','info','evidenceRefs',jsonb_build_array('ART_DIRECTION'),'message','ตรวจได้เฉพาะ visual prompt; ยังไม่มีภาพให้ตรวจ'),
  jsonb_build_object('category','readability','status','not_assessed','severity','info','evidenceRefs',jsonb_build_array('ART_DIRECTION'),'message','ตรวจได้เฉพาะ visual prompt; ยังไม่มีภาพให้ตรวจ'));
 SELECT coalesce(jsonb_agg(value ORDER BY n),'[]'::jsonb) INTO blocking FROM jsonb_array_elements(findings) WITH ORDINALITY AS f(value,n) WHERE value->>'severity'='blocking';
 SELECT coalesce(jsonb_agg(value->'message' ORDER BY n),'[]'::jsonb) INTO suggestions FROM jsonb_array_elements(blocking) WITH ORDINALITY AS f(value,n);
 RETURN jsonb_build_object('status',CASE WHEN jsonb_array_length(blocking)>0 THEN 'needs_revision' ELSE 'pass' END,'findings',findings,'blockingIssues',blocking,'suggestions',suggestions,'deliverable','copy_and_visual_prompt');
END $$;

CREATE FUNCTION zuri_go.visual_bundle_is_current(p_business_id uuid,p_project_id uuid,p_revision integer,p_input_hash text,p_payload jsonb)
RETURNS boolean LANGUAGE plpgsql STABLE SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE outputs jsonb; expected jsonb;
BEGIN
 SELECT coalesce(jsonb_object_agg(stage,payload),'{}'::jsonb) INTO outputs FROM (
  SELECT DISTINCT ON(kind) kind AS stage,payload FROM zuri_go.visual_artifacts
  WHERE business_id=p_business_id AND project_id=p_project_id AND revision=p_revision AND input_hash=p_input_hash
   AND kind IN('RESEARCH','STRATEGY','CONCEPT','COPY','ART_DIRECTION')
  ORDER BY kind,created_at DESC,id DESC
 ) latest;
 IF NOT (outputs ? 'COPY') OR NOT (outputs ? 'ART_DIRECTION') THEN RETURN false; END IF;
 IF jsonb_typeof(outputs->'COPY'->'text')<>'string' OR jsonb_typeof(outputs->'ART_DIRECTION'->'text')<>'string' THEN RETURN false; END IF;
 expected:=jsonb_build_object('copy',outputs->'COPY'->'text','visual_prompt',outputs->'ART_DIRECTION'->'text','outputs',outputs);
 RETURN p_payload=expected;
END $$;

CREATE FUNCTION zuri_go.visual_record_review(p_business_id uuid,p_project_id uuid,p_artifact_id uuid,p_assessment jsonb)
RETURNS zuri_go.visual_reviews LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE vp zuri_go.visual_projects%ROWTYPE; pr zuri_go.projects%ROWTYPE; br zuri_go.visual_briefs%ROWTYPE; brand zuri_go.visual_brand_profiles%ROWTYPE;
 bundle zuri_go.visual_artifacts%ROWTYPE; v_kind text; v_member uuid; v_result jsonb; out_row zuri_go.visual_reviews%ROWTYPE;
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 v_kind:=zuri_go.viewer_kind();v_member:=zuri_go.viewer_member();
 IF v_kind NOT IN('member','operator') THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO vp FROM zuri_go.visual_projects WHERE business_id=p_business_id AND project_id=p_project_id FOR UPDATE;
 SELECT * INTO pr FROM zuri_go.projects WHERE business_id=p_business_id AND id=p_project_id FOR UPDATE;
 IF vp.project_id IS NULL OR pr.id IS NULL
  OR zuri_go.project_audience(p_business_id,p_project_id,pr.visibility,pr.team_id,pr.owner_member_id) IS NOT TRUE
  OR (v_kind='member' AND (
  v_member IS NULL
  OR NOT EXISTS(SELECT 1 FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id WHERE m.business_id=p_business_id AND m.id=v_member AND m.status='active' AND c.enabled)
  OR (vp.frozen_visibility NOT IN('public','business') AND NOT(v_member=ANY(vp.frozen_member_ids))))) THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO br FROM zuri_go.visual_briefs WHERE business_id=p_business_id AND project_id=p_project_id AND id=vp.current_brief_id;
 SELECT * INTO brand FROM zuri_go.visual_brand_profiles WHERE business_id=p_business_id AND project_id=p_project_id AND id=br.brand_profile_id;
 SELECT * INTO bundle FROM zuri_go.visual_artifacts WHERE business_id=p_business_id AND project_id=p_project_id AND id=p_artifact_id AND kind='BUNDLE';
 IF br.id IS NULL OR brand.id IS NULL OR bundle.id IS NULL OR br.revision<>vp.revision OR bundle.revision<>vp.revision OR bundle.input_hash<>br.input_hash
  OR vp.stage NOT IN('QA','HUMAN_REVIEW') OR NOT zuri_go.visual_bundle_is_current(p_business_id,p_project_id,vp.revision,br.input_hash,bundle.payload)
  OR EXISTS(SELECT 1 FROM zuri_go.visual_artifacts newer WHERE newer.business_id=p_business_id AND newer.project_id=p_project_id AND newer.revision=vp.revision AND newer.kind='BUNDLE' AND (newer.created_at,newer.id)>(bundle.created_at,bundle.id)) THEN
  RAISE EXCEPTION 'STALE' USING ERRCODE='P0001';
 END IF;
 v_result:=zuri_go.visual_calculate_review_result(p_assessment,br.payload,brand.profile||jsonb_build_object('source_refs',brand.source_refs),bundle.payload);
 INSERT INTO zuri_go.visual_reviews(business_id,project_id,artifact_id,artifact_hash,result,actor_kind,actor_member_id,assessment,validated,validated_pass)
 VALUES(p_business_id,p_project_id,p_artifact_id,bundle.canonical_hash,v_result,v_kind,CASE WHEN v_kind='member' THEN v_member ELSE NULL END,p_assessment,true,v_result->>'status'='pass')
 RETURNING * INTO out_row;
 RETURN out_row;
END $$;

CREATE FUNCTION zuri_go.visual_finalize_approval(p_business_id uuid,p_project_id uuid,p_artifact_id uuid,p_expected_row_version bigint,p_artifact_hash text,p_qa_revision uuid,p_decision text,p_reason text)
RETURNS zuri_go.visual_decisions LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE vp zuri_go.visual_projects%ROWTYPE; pr zuri_go.projects%ROWTYPE; br zuri_go.visual_briefs%ROWTYPE; brand zuri_go.visual_brand_profiles%ROWTYPE;
 bundle zuri_go.visual_artifacts%ROWTYPE; qa zuri_go.visual_reviews%ROWTYPE; v_kind text; v_member uuid; v_result jsonb;
 out_row zuri_go.visual_decisions%ROWTYPE; decision_actor_kind text; decision_actor_member uuid;
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 v_kind:=zuri_go.viewer_kind();v_member:=zuri_go.viewer_member();
 IF v_kind NOT IN('member','operator') THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO vp FROM zuri_go.visual_projects WHERE business_id=p_business_id AND project_id=p_project_id FOR UPDATE;
 SELECT * INTO pr FROM zuri_go.projects WHERE business_id=p_business_id AND id=p_project_id FOR UPDATE;
 IF vp.project_id IS NULL OR pr.id IS NULL OR (v_kind='member' AND (v_member IS NULL OR v_member<>pr.owner_member_id
  OR NOT EXISTS(SELECT 1 FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id WHERE m.business_id=p_business_id AND m.id=v_member AND m.status='active' AND c.enabled)
  OR (vp.frozen_visibility NOT IN('public','business') AND NOT(v_member=ANY(vp.frozen_member_ids))))) THEN
  RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501';
 END IF;
 IF p_decision IS NULL OR p_decision NOT IN('approve','request_changes','reject') OR (p_decision<>'approve' AND nullif(btrim(p_reason),'') IS NULL) THEN RAISE EXCEPTION 'BUNDLE_INVALID' USING ERRCODE='22023'; END IF;
 IF vp.row_version IS DISTINCT FROM p_expected_row_version OR vp.stage<>'HUMAN_REVIEW' THEN RAISE EXCEPTION 'STALE' USING ERRCODE='P0001'; END IF;
 SELECT * INTO br FROM zuri_go.visual_briefs WHERE business_id=p_business_id AND project_id=p_project_id AND id=vp.current_brief_id;
 SELECT * INTO brand FROM zuri_go.visual_brand_profiles WHERE business_id=p_business_id AND project_id=p_project_id AND id=br.brand_profile_id;
 SELECT * INTO bundle FROM zuri_go.visual_artifacts WHERE business_id=p_business_id AND project_id=p_project_id AND id=p_artifact_id AND kind='BUNDLE';
 IF br.id IS NULL OR brand.id IS NULL OR bundle.id IS NULL OR br.revision<>vp.revision OR bundle.revision<>vp.revision OR bundle.input_hash<>br.input_hash
  OR bundle.canonical_hash IS DISTINCT FROM p_artifact_hash OR NOT zuri_go.visual_bundle_is_current(p_business_id,p_project_id,vp.revision,br.input_hash,bundle.payload)
  OR EXISTS(SELECT 1 FROM zuri_go.visual_artifacts newer WHERE newer.business_id=p_business_id AND newer.project_id=p_project_id AND newer.revision=vp.revision AND newer.kind='BUNDLE' AND (newer.created_at,newer.id)>(bundle.created_at,bundle.id)) THEN
  RAISE EXCEPTION 'STALE' USING ERRCODE='P0001';
 END IF;
 SELECT * INTO qa FROM zuri_go.visual_reviews WHERE business_id=p_business_id AND project_id=p_project_id AND artifact_id=p_artifact_id AND validated ORDER BY created_at DESC,id DESC LIMIT 1;
 IF qa.id IS NULL OR qa.id IS DISTINCT FROM p_qa_revision OR NOT qa.validated OR qa.artifact_hash<>bundle.canonical_hash THEN RAISE EXCEPTION 'STALE' USING ERRCODE='P0001'; END IF;
 v_result:=zuri_go.visual_calculate_review_result(qa.assessment,br.payload,brand.profile||jsonb_build_object('source_refs',brand.source_refs),bundle.payload);
 IF v_result IS DISTINCT FROM qa.result THEN RAISE EXCEPTION 'STALE' USING ERRCODE='P0001'; END IF;
 IF p_decision='approve' AND (NOT qa.validated_pass OR v_result->>'status'<>'pass') THEN RAISE EXCEPTION 'QA_REQUIRED' USING ERRCODE='P0001'; END IF;
 decision_actor_kind:=v_kind;decision_actor_member:=CASE WHEN v_kind='member' THEN v_member ELSE NULL END;
 INSERT INTO zuri_go.visual_decisions(business_id,project_id,artifact_id,artifact_hash,review_id,decision,reason,actor_kind,actor_member_id)
 VALUES(p_business_id,p_project_id,p_artifact_id,bundle.canonical_hash,qa.id,p_decision,nullif(btrim(p_reason),''),decision_actor_kind,decision_actor_member)
 RETURNING * INTO out_row;
 UPDATE zuri_go.visual_projects SET stage=CASE p_decision WHEN 'approve' THEN 'READY_FOR_CAMPAIGN' WHEN 'request_changes' THEN 'REVISION' ELSE 'REJECTED' END
 WHERE business_id=p_business_id AND project_id=p_project_id;
 IF p_decision='approve' AND vp.frozen_visibility='public' AND pr.visibility='public' THEN
  INSERT INTO zuri_go.visual_public_outputs(business_id,project_id,artifact_id,decision_id,payload,trusted_publication)
  VALUES(p_business_id,p_project_id,p_artifact_id,out_row.id,jsonb_build_object('copy',bundle.payload->'copy','visual_prompt',bundle.payload->'visual_prompt','content_hash',bundle.canonical_hash,'deliverable','copy_and_visual_prompt'),true);
 END IF;
 RETURN out_row;
END $$;

REVOKE ALL ON FUNCTION zuri_go.visual_calculate_review_result(jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,zuri_go_app;
REVOKE ALL ON FUNCTION zuri_go.visual_bundle_is_current(uuid,uuid,integer,text,jsonb) FROM PUBLIC,zuri_go_app;
REVOKE ALL ON FUNCTION zuri_go.visual_record_review(uuid,uuid,uuid,jsonb) FROM PUBLIC,zuri_go_app;
REVOKE ALL ON FUNCTION zuri_go.visual_finalize_approval(uuid,uuid,uuid,bigint,text,uuid,text,text) FROM PUBLIC,zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.visual_record_review(uuid,uuid,uuid,jsonb) TO zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.visual_finalize_approval(uuid,uuid,uuid,bigint,text,uuid,text,text) TO zuri_go_app;
COMMIT;
