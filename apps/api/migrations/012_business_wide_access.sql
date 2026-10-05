BEGIN;
SET search_path TO zuri_go,public;
-- ADR-008: tenant scope stays mandatory; Business-record audience metadata is no longer an authorization rule.
ALTER TABLE meetings ADD COLUMN archived_at timestamptz;
ALTER TABLE weekly_plans ADD COLUMN archived_at timestamptz;
-- A roster edit cannot grant authority to move a locally held transcript to the cloud.
CREATE TABLE meeting_transcript_upload_eligibility (
 business_id uuid NOT NULL, meeting_id uuid NOT NULL, eligible_member_ids uuid[] NOT NULL, captured_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,meeting_id), FOREIGN KEY(business_id,meeting_id) REFERENCES meetings(business_id,id)
);
ALTER TABLE meeting_transcript_upload_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcript_upload_eligibility FORCE ROW LEVEL SECURITY;
CREATE POLICY business_scope ON meeting_transcript_upload_eligibility USING (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid) WITH CHECK (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid);
CREATE POLICY member_read ON meeting_transcript_upload_eligibility AS RESTRICTIVE FOR SELECT USING (zuri_go.viewer_kind() IN ('member','operator'));
CREATE POLICY owner_insert ON meeting_transcript_upload_eligibility AS RESTRICTIVE FOR INSERT WITH CHECK (current_user<>'zuri_go_app');
CREATE POLICY owner_update ON meeting_transcript_upload_eligibility AS RESTRICTIVE FOR UPDATE USING (current_user<>'zuri_go_app') WITH CHECK (current_user<>'zuri_go_app');
CREATE POLICY owner_delete ON meeting_transcript_upload_eligibility AS RESTRICTIVE FOR DELETE USING (current_user<>'zuri_go_app');
GRANT SELECT ON meeting_transcript_upload_eligibility TO zuri_go_app;
REVOKE INSERT,UPDATE,DELETE ON meeting_transcript_upload_eligibility FROM PUBLIC,zuri_go_app;

CREATE FUNCTION zuri_go.guard_meeting_transcript_custody() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF current_user='zuri_go_app' THEN
  IF TG_OP='INSERT' AND NEW.transcript_custody<>'cloud' THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND OLD.transcript_custody IS DISTINCT FROM NEW.transcript_custody THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER meeting_transcript_custody_guard BEFORE INSERT OR UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION zuri_go.guard_meeting_transcript_custody();

CREATE FUNCTION zuri_go.capture_meeting_transcript_upload_eligibility() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM zuri_go.meetings m WHERE m.business_id=NEW.business_id AND m.id=NEW.id AND m.transcript_custody='local_only') THEN
  INSERT INTO zuri_go.meeting_transcript_upload_eligibility(business_id,meeting_id,eligible_member_ids)
  SELECT NEW.business_id,NEW.id,coalesce(array_agg(p.member_id ORDER BY p.member_id),'{}'::uuid[])
  FROM zuri_go.meeting_participants p WHERE p.business_id=NEW.business_id AND p.meeting_id=NEW.id
  ON CONFLICT(business_id,meeting_id) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER capture_meeting_transcript_upload_eligibility AFTER UPDATE ON meetings DEFERRABLE INITIALLY DEFERRED
 FOR EACH ROW WHEN (OLD.transcript_custody IS DISTINCT FROM NEW.transcript_custody AND NEW.transcript_custody='local_only')
 EXECUTE FUNCTION zuri_go.capture_meeting_transcript_upload_eligibility();

CREATE FUNCTION zuri_go.begin_meeting_transcript_custody(p_business_id uuid,p_meeting_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id
  OR zuri_go.viewer_kind() NOT IN ('member','operator') THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501'; END IF;
 IF zuri_go.viewer_kind()='member' AND NOT EXISTS(SELECT 1 FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id
  WHERE m.business_id=p_business_id AND m.id=zuri_go.viewer_member() AND m.status='active' AND c.enabled) THEN
  RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501';
 END IF;
 UPDATE zuri_go.meetings SET transcript_custody='local_only'
 WHERE business_id=p_business_id AND id=p_meeting_id AND visibility='restricted' AND transcript_custody='cloud';
 IF NOT FOUND THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_STALE' USING ERRCODE='P0001'; END IF;
END $$;
REVOKE ALL ON FUNCTION zuri_go.begin_meeting_transcript_custody(uuid,uuid) FROM PUBLIC,zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.begin_meeting_transcript_custody(uuid,uuid) TO zuri_go_app;

DROP POLICY IF EXISTS audience_read ON tasks;
DROP POLICY IF EXISTS audience_update ON tasks;
DROP POLICY IF EXISTS audience_delete ON tasks;
DROP POLICY IF EXISTS audience_read ON meetings;
DROP POLICY IF EXISTS audience_update ON meetings;
DROP POLICY IF EXISTS audience_delete ON meetings;
DROP POLICY IF EXISTS audience_read ON projects;
DROP POLICY IF EXISTS audience_update ON projects;
DROP POLICY IF EXISTS audience_delete ON projects;
DROP POLICY IF EXISTS signed_in ON teams;
DROP POLICY IF EXISTS signed_in ON team_members;
DROP POLICY IF EXISTS signed_in ON task_roles;
DROP POLICY IF EXISTS signed_in ON task_viewers;
DROP POLICY IF EXISTS signed_in ON meeting_participants;
DROP POLICY IF EXISTS signed_in ON project_viewers;
DROP POLICY IF EXISTS signed_in ON ai_briefs;
DROP POLICY IF EXISTS follows_entity ON change_events;
DROP POLICY IF EXISTS follows_project ON change_events;

-- Child/history policies now inherit tenant scope only; their parent records are all visible in that Business.
DROP POLICY IF EXISTS follows_task ON task_attachments;
DROP POLICY IF EXISTS follows_task ON weekly_plan_tasks;
DROP POLICY IF EXISTS follows_meeting ON meeting_revisions;
DROP POLICY IF EXISTS follows_meeting ON meeting_draft_batches;
DROP POLICY IF EXISTS follows_meeting ON meeting_task_links;
DROP POLICY IF EXISTS follows_task ON campaign_task_details;

-- Visual Studio records and internal decisions use the same Business boundary as other records.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['visual_brand_profiles','visual_briefs','visual_runs','visual_jobs','visual_artifacts','visual_provider_runs','visual_reviews','visual_decisions','visual_assets','visual_receipts'] LOOP
  EXECUTE format('DROP POLICY IF EXISTS follows_visual ON zuri_go.%I',t);
 END LOOP;
END $$;
DROP POLICY IF EXISTS visual_audience ON visual_projects;
DROP POLICY IF EXISTS decision_authority ON visual_decisions;

-- Guests may read Business rows; only a verified Member or the trusted local operator may mutate them.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY[
  'businesses','members','channel_accounts','campaigns','campaign_channels','campaign_states','content_items','publications',
  'metric_series','metric_observations','goals','goal_series','tasks','task_roles','weekly_plans','weekly_plan_tasks','meetings',
  'meeting_revisions','meeting_draft_batches','meeting_task_links','ai_briefs','change_events','migration_batches','migration_keys',
  'task_attachments','teams','team_members','task_viewers','meeting_participants','projects','project_viewers','campaign_task_details',
  'visual_projects','visual_brand_profiles','visual_briefs','visual_runs','visual_jobs','visual_artifacts','visual_provider_runs',
  'visual_reviews','visual_decisions','visual_assets','visual_receipts','visual_public_outputs'
 ] LOOP
  EXECUTE format('DROP POLICY IF EXISTS member_insert ON zuri_go.%I',t);
  EXECUTE format('DROP POLICY IF EXISTS member_update ON zuri_go.%I',t);
  EXECUTE format('DROP POLICY IF EXISTS member_delete ON zuri_go.%I',t);
  EXECUTE format('CREATE POLICY member_insert ON zuri_go.%I AS RESTRICTIVE FOR INSERT WITH CHECK (zuri_go.viewer_kind() IN (''member'',''operator''))',t);
  EXECUTE format('CREATE POLICY member_update ON zuri_go.%I AS RESTRICTIVE FOR UPDATE USING (zuri_go.viewer_kind() IN (''member'',''operator'')) WITH CHECK (zuri_go.viewer_kind() IN (''member'',''operator''))',t);
  EXECUTE format('CREATE POLICY member_delete ON zuri_go.%I AS RESTRICTIVE FOR DELETE USING (zuri_go.viewer_kind() IN (''member'',''operator''))',t);
 END LOOP;
END $$;
-- Public output is a publication projection, not ordinary record CRUD. Keep the
-- Business-scope-only reads include inactive/retracted history. Creation remains trusted.
DROP POLICY IF EXISTS public_read ON visual_public_outputs;
CREATE POLICY trusted_publication_only ON visual_public_outputs AS RESTRICTIVE FOR INSERT WITH CHECK (trusted_publication AND current_user <> 'zuri_go_app');
DROP POLICY IF EXISTS member_delete ON visual_public_outputs;
CREATE POLICY member_delete ON visual_public_outputs AS RESTRICTIVE FOR DELETE USING (false);
-- Audit is append-only even if a later grant changes; keep Guest SELECT through tenant scope.
CREATE POLICY audit_insert ON change_events AS RESTRICTIVE FOR INSERT WITH CHECK (
 (viewer_kind()='member' AND actor_kind='authenticated' AND actor_member_id=viewer_member()
  -- The signed session was resolved to an active Member before this transaction. Do not re-check status here:
  -- an authorized actor may retire their own Member row before appending that same transaction's audit event.
  AND actor_pid=(SELECT pid FROM members WHERE business_id=change_events.business_id AND id=viewer_member())
  AND actor_subject=actor_pid)
 OR (viewer_kind()='operator' AND actor_kind='local_operator' AND actor_member_id IS NULL AND actor_pid IS NULL)
);
CREATE POLICY audit_no_update ON change_events AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY audit_no_delete ON change_events AS RESTRICTIVE FOR DELETE USING (false);

-- Deletes use lifecycle fields at the API. These rows and their histories never hard-delete.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY[
  'businesses','members','channel_accounts','campaigns','campaign_states','content_items','publications','metric_series','metric_observations',
  'goals','tasks','weekly_plans','meetings','meeting_revisions','meeting_draft_batches','meeting_task_links','ai_briefs','change_events',
  'migration_batches','migration_keys','task_attachments','teams','projects','campaign_task_details','visual_projects','visual_brand_profiles',
  'visual_briefs','visual_runs','visual_jobs','visual_artifacts','visual_provider_runs','visual_reviews','visual_decisions','visual_assets','visual_receipts',
  'visual_public_outputs'
 ] LOOP
  EXECUTE format('DROP POLICY IF EXISTS member_delete ON zuri_go.%I',t);
  EXECUTE format('CREATE POLICY member_delete ON zuri_go.%I AS RESTRICTIVE FOR DELETE USING (false)',t);
 END LOOP;
END $$;
CREATE POLICY migration_metadata_write_operator_only ON migration_batches AS RESTRICTIVE FOR INSERT WITH CHECK (viewer_kind()='operator');
CREATE POLICY migration_metadata_update_operator_only ON migration_batches AS RESTRICTIVE FOR UPDATE USING (viewer_kind()='operator') WITH CHECK (viewer_kind()='operator');
CREATE POLICY migration_keys_insert_operator_only ON migration_keys AS RESTRICTIVE FOR INSERT WITH CHECK (viewer_kind()='operator');
CREATE POLICY migration_keys_update_operator_only ON migration_keys AS RESTRICTIVE FOR UPDATE USING (viewer_kind()='operator') WITH CHECK (viewer_kind()='operator');
-- The server reads hashes for login and credential-version checks, but ordinary record access never manages them.
CREATE POLICY credentials_insert_operator_only ON member_credentials AS RESTRICTIVE FOR INSERT WITH CHECK (viewer_kind()='operator');
CREATE POLICY credentials_update_operator_only ON member_credentials AS RESTRICTIVE FOR UPDATE USING (viewer_kind()='operator') WITH CHECK (viewer_kind()='operator');
CREATE POLICY credentials_delete_operator_only ON member_credentials AS RESTRICTIVE FOR DELETE USING (viewer_kind()='operator');

-- Direct runtime UPDATE is denied; the SECURITY DEFINER correction routine runs as its trusted owner.
-- FORCE ROW LEVEL SECURITY means that narrow role predicate is required for the approved routine path.
DROP POLICY IF EXISTS member_update ON metric_observations;
CREATE POLICY metric_observations_no_direct_update ON metric_observations AS RESTRICTIVE FOR UPDATE USING (current_user <> 'zuri_go_app') WITH CHECK (current_user <> 'zuri_go_app');
REVOKE UPDATE ON zuri_go.metric_observations FROM zuri_go_app;
-- Meeting revisions are immutable; transcript custody has one atomic upload path.
DROP POLICY IF EXISTS member_update ON meeting_revisions;
CREATE POLICY meeting_revisions_no_direct_update ON meeting_revisions AS RESTRICTIVE FOR UPDATE USING (current_user <> 'zuri_go_app') WITH CHECK (current_user <> 'zuri_go_app');
REVOKE UPDATE ON zuri_go.meeting_revisions FROM zuri_go_app;

-- RACI/visibility metadata remains stored but does not determine reads or ordinary writes.
CREATE OR REPLACE FUNCTION task_audience(b uuid, task uuid, level text, team uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT b = nullif(current_setting('zuri_go.business_id',true),'')::uuid
$$;
CREATE OR REPLACE FUNCTION meeting_audience(b uuid, meeting uuid, level text, team uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT b = nullif(current_setting('zuri_go.business_id',true),'')::uuid
$$;
CREATE OR REPLACE FUNCTION project_audience(b uuid, project uuid, level text, team uuid, owner uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT b = nullif(current_setting('zuri_go.business_id',true),'')::uuid
$$;

CREATE OR REPLACE FUNCTION zuri_go.visual_record_review(p_business_id uuid,p_project_id uuid,p_artifact_id uuid,p_assessment jsonb)
RETURNS zuri_go.visual_reviews LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE vp zuri_go.visual_projects%ROWTYPE; pr zuri_go.projects%ROWTYPE; br zuri_go.visual_briefs%ROWTYPE; brand zuri_go.visual_brand_profiles%ROWTYPE;
 bundle zuri_go.visual_artifacts%ROWTYPE; v_kind text; v_member uuid; v_result jsonb; out_row zuri_go.visual_reviews%ROWTYPE;
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 v_kind:=zuri_go.viewer_kind();v_member:=zuri_go.viewer_member();
 IF v_kind NOT IN('member','operator') THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 IF v_kind='member' AND NOT EXISTS(SELECT 1 FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id WHERE m.business_id=p_business_id AND m.id=v_member AND m.status='active' AND c.enabled) THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO vp FROM zuri_go.visual_projects WHERE business_id=p_business_id AND project_id=p_project_id FOR UPDATE;
 SELECT * INTO pr FROM zuri_go.projects WHERE business_id=p_business_id AND id=p_project_id FOR UPDATE;
 IF vp.project_id IS NULL OR pr.id IS NULL THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
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

CREATE OR REPLACE FUNCTION zuri_go.visual_finalize_approval(p_business_id uuid,p_project_id uuid,p_artifact_id uuid,p_expected_row_version bigint,p_artifact_hash text,p_qa_revision uuid,p_decision text,p_reason text)
RETURNS zuri_go.visual_decisions LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE vp zuri_go.visual_projects%ROWTYPE; pr zuri_go.projects%ROWTYPE; br zuri_go.visual_briefs%ROWTYPE; brand zuri_go.visual_brand_profiles%ROWTYPE;
 bundle zuri_go.visual_artifacts%ROWTYPE; qa zuri_go.visual_reviews%ROWTYPE; v_kind text; v_member uuid; v_result jsonb;
 out_row zuri_go.visual_decisions%ROWTYPE; decision_actor_kind text; decision_actor_member uuid;
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 v_kind:=zuri_go.viewer_kind();v_member:=zuri_go.viewer_member();
 IF v_kind NOT IN('member','operator') THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 IF v_kind='member' AND NOT EXISTS(SELECT 1 FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id WHERE m.business_id=p_business_id AND m.id=v_member AND m.status='active' AND c.enabled) THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO vp FROM zuri_go.visual_projects WHERE business_id=p_business_id AND project_id=p_project_id FOR UPDATE;
 SELECT * INTO pr FROM zuri_go.projects WHERE business_id=p_business_id AND id=p_project_id FOR UPDATE;
 IF vp.project_id IS NULL OR pr.id IS NULL THEN RAISE EXCEPTION 'APPROVAL_DENIED' USING ERRCODE='42501'; END IF;
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
 RETURN out_row;
END $$;

CREATE FUNCTION zuri_go.visual_publish_approved(p_business_id uuid,p_project_id uuid,p_artifact_id uuid)
RETURNS zuri_go.visual_public_outputs LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE vp zuri_go.visual_projects%ROWTYPE; pr zuri_go.projects%ROWTYPE; bundle zuri_go.visual_artifacts%ROWTYPE; decision_row zuri_go.visual_decisions%ROWTYPE;
 v_kind text; v_member uuid; out_row zuri_go.visual_public_outputs%ROWTYPE;
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id THEN RAISE EXCEPTION 'PUBLICATION_DENIED' USING ERRCODE='42501'; END IF;
 v_kind:=zuri_go.viewer_kind();v_member:=zuri_go.viewer_member();
 IF v_kind NOT IN('member','operator') THEN RAISE EXCEPTION 'PUBLICATION_DENIED' USING ERRCODE='42501'; END IF;
 IF v_kind='member' AND NOT EXISTS(SELECT 1 FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id WHERE m.business_id=p_business_id AND m.id=v_member AND m.status='active' AND c.enabled) THEN RAISE EXCEPTION 'PUBLICATION_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO vp FROM zuri_go.visual_projects WHERE business_id=p_business_id AND project_id=p_project_id FOR UPDATE;
 SELECT * INTO pr FROM zuri_go.projects WHERE business_id=p_business_id AND id=p_project_id FOR UPDATE;
 IF vp.project_id IS NULL OR pr.id IS NULL OR vp.frozen_visibility<>'public' OR pr.visibility<>'public' OR vp.stage<>'READY_FOR_CAMPAIGN' THEN RAISE EXCEPTION 'PUBLICATION_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO bundle FROM zuri_go.visual_artifacts WHERE business_id=p_business_id AND project_id=p_project_id AND id=p_artifact_id AND kind='BUNDLE';
 SELECT * INTO decision_row FROM zuri_go.visual_decisions WHERE business_id=p_business_id AND project_id=p_project_id AND artifact_id=p_artifact_id AND decision='approve' ORDER BY created_at DESC,id DESC LIMIT 1;
 IF bundle.id IS NULL OR decision_row.id IS NULL OR bundle.revision<>vp.revision OR NOT zuri_go.visual_bundle_is_current(p_business_id,p_project_id,vp.revision,bundle.input_hash,bundle.payload) THEN RAISE EXCEPTION 'PUBLICATION_DENIED' USING ERRCODE='42501'; END IF;
 SELECT * INTO out_row FROM zuri_go.visual_public_outputs WHERE business_id=p_business_id AND project_id=p_project_id AND artifact_id=p_artifact_id;
 IF out_row.artifact_id IS NOT NULL THEN IF NOT out_row.active THEN RAISE EXCEPTION 'PUBLICATION_RETRACTED' USING ERRCODE='42501'; END IF; RETURN out_row; END IF;
 INSERT INTO zuri_go.visual_public_outputs(business_id,project_id,artifact_id,decision_id,payload,trusted_publication)
 VALUES(p_business_id,p_project_id,p_artifact_id,decision_row.id,jsonb_build_object('copy',bundle.payload->'copy','visual_prompt',bundle.payload->'visual_prompt','content_hash',bundle.canonical_hash,'deliverable','copy_and_visual_prompt'),true)
 RETURNING * INTO out_row;
 RETURN out_row;
END $$;

REVOKE ALL ON FUNCTION zuri_go.visual_record_review(uuid,uuid,uuid,jsonb) FROM PUBLIC,zuri_go_app;
REVOKE ALL ON FUNCTION zuri_go.visual_finalize_approval(uuid,uuid,uuid,bigint,text,uuid,text,text) FROM PUBLIC,zuri_go_app;
REVOKE ALL ON FUNCTION zuri_go.visual_publish_approved(uuid,uuid,uuid) FROM PUBLIC,zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.visual_record_review(uuid,uuid,uuid,jsonb) TO zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.visual_finalize_approval(uuid,uuid,uuid,bigint,text,uuid,text,text) TO zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.visual_publish_approved(uuid,uuid,uuid) TO zuri_go_app;

CREATE FUNCTION zuri_go.correct_metric_observation(
 p_business_id uuid,p_series_id uuid,p_expected_id uuid,p_effective_at timestamptz,p_period_start timestamptz,
 p_value numeric,p_coverage text,p_source_ref text,p_correction_reason text
) RETURNS zuri_go.metric_observations LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE
 v_kind text; v_member uuid; v_pid text; v_source_kind text; v_metric_kind text; v_integer_only boolean; v_allows_negative boolean; v_timezone text;
 previous zuri_go.metric_observations%ROWTYPE; out_row zuri_go.metric_observations%ROWTYPE; expected_end timestamptz; changed integer;
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id THEN RAISE EXCEPTION 'CORRECTION_DENIED' USING ERRCODE='42501'; END IF;
 v_kind:=zuri_go.viewer_kind();v_member:=zuri_go.viewer_member();
 IF v_kind NOT IN('member','operator') THEN RAISE EXCEPTION 'CORRECTION_DENIED' USING ERRCODE='42501'; END IF;
 IF v_kind='member' AND NOT EXISTS(
  SELECT 1 FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id
  WHERE m.business_id=p_business_id AND m.id=v_member AND m.status='active' AND c.enabled
 ) THEN RAISE EXCEPTION 'CORRECTION_DENIED' USING ERRCODE='42501'; END IF;

 SELECT s.source_kind,d.kind,d.integer_only,d.allows_negative,b.timezone
 INTO v_source_kind,v_metric_kind,v_integer_only,v_allows_negative,v_timezone
 FROM zuri_go.metric_series s JOIN zuri_go.metric_definitions d ON d.code=s.metric_code
 JOIN zuri_go.businesses b ON b.id=s.business_id
 WHERE s.business_id=p_business_id AND s.id=p_series_id FOR UPDATE OF s;
 IF NOT FOUND OR v_source_kind NOT IN('manual','import') THEN RAISE EXCEPTION 'CORRECTION_DENIED' USING ERRCODE='42501'; END IF;
 IF p_expected_id IS NULL OR nullif(btrim(p_correction_reason),'') IS NULL THEN RAISE EXCEPTION 'CORRECTION_INVALID' USING ERRCODE='22023'; END IF;
 IF p_effective_at IS NULL OR p_effective_at>clock_timestamp() OR p_value IS NULL OR p_value::text IN('NaN','Infinity','-Infinity')
  OR (NOT v_allows_negative AND p_value<0) OR (v_integer_only AND p_value<>trunc(p_value))
  OR p_coverage NOT IN('complete','partial') OR nullif(btrim(p_source_ref),'') IS NULL THEN
  RAISE EXCEPTION 'CORRECTION_INVALID' USING ERRCODE='22023';
 END IF;
 IF v_metric_kind='flow' THEN
  IF p_period_start IS NULL OR p_period_start IS DISTINCT FROM (date_trunc('day',p_period_start AT TIME ZONE v_timezone) AT TIME ZONE v_timezone) THEN
   RAISE EXCEPTION 'CORRECTION_INVALID' USING ERRCODE='22023';
  END IF;
  expected_end:=(((p_period_start AT TIME ZONE v_timezone)::date+1)::timestamp AT TIME ZONE v_timezone);
  IF p_effective_at IS DISTINCT FROM expected_end THEN RAISE EXCEPTION 'CORRECTION_INVALID' USING ERRCODE='22023'; END IF;
 ELSIF p_period_start IS NOT NULL THEN
  RAISE EXCEPTION 'CORRECTION_INVALID' USING ERRCODE='22023';
 END IF;

 SELECT * INTO previous FROM zuri_go.metric_observations
 WHERE business_id=p_business_id AND id=p_expected_id AND series_id=p_series_id AND effective_at=p_effective_at AND is_current
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OBSERVATION_STALE' USING ERRCODE='P0001'; END IF;
 UPDATE zuri_go.metric_observations SET is_current=false WHERE business_id=p_business_id AND id=p_expected_id AND is_current;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'OBSERVATION_STALE' USING ERRCODE='P0001'; END IF;
 INSERT INTO zuri_go.metric_observations(business_id,series_id,effective_at,period_start,value,coverage,source_ref,revision,supersedes_id,correction_reason)
 VALUES(p_business_id,p_series_id,p_effective_at,p_period_start,p_value,p_coverage,p_source_ref,previous.revision+1,previous.id,p_correction_reason)
 RETURNING * INTO out_row;
 IF v_kind='member' THEN SELECT pid INTO v_pid FROM zuri_go.members WHERE business_id=p_business_id AND id=v_member; END IF;
 INSERT INTO zuri_go.change_events(business_id,entity_type,entity_id,event_type,before_data,after_data,actor_kind,actor_subject,request_id,actor_member_id,actor_pid)
 VALUES(p_business_id,'metric_observations',out_row.id,'observe',to_jsonb(previous),to_jsonb(out_row),
  CASE WHEN v_kind='member' THEN 'authenticated' ELSE 'local_operator' END,v_pid,gen_random_uuid()::text,
  CASE WHEN v_kind='member' THEN v_member ELSE NULL END,v_pid);
 RETURN out_row;
END $$;
REVOKE ALL ON FUNCTION zuri_go.correct_metric_observation(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,text) FROM PUBLIC,zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.correct_metric_observation(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,text) TO zuri_go_app;

CREATE FUNCTION zuri_go.complete_meeting_transcript_upload(p_business_id uuid,p_meeting_id uuid,p_reason text,p_revisions jsonb,p_batch_ids text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,zuri_go,pg_temp AS $$
DECLARE
 v_member uuid; v_pid text; meeting_row zuri_go.meetings%ROWTYPE; revision_row zuri_go.meeting_revisions%ROWTYPE;
 item jsonb; segment jsonb; revision_id uuid; stub_count integer; revision_ids text[]:='{}'; expected_batch_ids text[]:='{}'; supplied_batch_ids text[]:='{}';
BEGIN
 IF nullif(current_setting('zuri_go.business_id',true),'')::uuid IS DISTINCT FROM p_business_id THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501'; END IF;
 IF zuri_go.viewer_kind()<>'member' THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501'; END IF;
 v_member:=zuri_go.viewer_member();
 SELECT m.pid INTO v_pid FROM zuri_go.members m JOIN zuri_go.member_credentials c ON c.business_id=m.business_id AND c.member_id=m.id
 WHERE m.business_id=p_business_id AND m.id=v_member AND m.status='active' AND c.enabled;
 IF NOT FOUND THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM zuri_go.meeting_participants p WHERE p.business_id=p_business_id AND p.meeting_id=p_meeting_id AND p.member_id=v_member) THEN
  RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM zuri_go.meeting_transcript_upload_eligibility e WHERE e.business_id=p_business_id AND e.meeting_id=p_meeting_id AND v_member=ANY(e.eligible_member_ids)) THEN
  RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_DENIED' USING ERRCODE='42501';
 END IF;
 IF nullif(btrim(p_reason),'') IS NULL OR jsonb_typeof(p_revisions) IS DISTINCT FROM 'array' OR p_batch_ids IS NULL THEN
  RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_INVALID' USING ERRCODE='22023';
 END IF;
 SELECT * INTO meeting_row FROM zuri_go.meetings WHERE business_id=p_business_id AND id=p_meeting_id FOR UPDATE;
 IF NOT FOUND OR meeting_row.transcript_custody<>'local_only' THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_STALE' USING ERRCODE='P0001'; END IF;
 SELECT count(*)::integer INTO stub_count FROM zuri_go.meeting_revisions
 WHERE business_id=p_business_id AND meeting_id=p_meeting_id AND legacy_metadata->>'withheld'='true';
 IF stub_count=0 THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_INVALID' USING ERRCODE='22023'; END IF;
 IF stub_count<>jsonb_array_length(p_revisions) THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_STALE' USING ERRCODE='P0001'; END IF;
 SELECT coalesce(array_agg(legacy_metadata->'batch'->>'id' ORDER BY legacy_metadata->'batch'->>'id'),'{}'::text[])
 INTO expected_batch_ids FROM zuri_go.meeting_draft_batches
 WHERE business_id=p_business_id AND meeting_id=p_meeting_id AND legacy_metadata->>'withheld'='true';
 SELECT coalesce(array_agg(batch_id ORDER BY batch_id),'{}'::text[]) INTO supplied_batch_ids FROM unnest(p_batch_ids) AS supplied(batch_id);
 IF supplied_batch_ids IS DISTINCT FROM expected_batch_ids THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_STALE' USING ERRCODE='P0001'; END IF;

 FOR item IN SELECT value FROM jsonb_array_elements(p_revisions) LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR nullif(item->>'id','') IS NULL OR jsonb_typeof(item->'segments') IS DISTINCT FROM 'array' OR jsonb_typeof(item->'metadata') IS DISTINCT FROM 'object' THEN
   RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_INVALID' USING ERRCODE='22023';
  END IF;
  revision_id:=(item->>'id')::uuid;
  SELECT * INTO revision_row FROM zuri_go.meeting_revisions
  WHERE business_id=p_business_id AND meeting_id=p_meeting_id AND id=revision_id FOR UPDATE;
  IF NOT FOUND OR revision_row.legacy_metadata->>'withheld'<>'true' OR revision_row.segments<>'[]'::jsonb
   OR (item->'metadata'->'id') IS DISTINCT FROM (revision_row.legacy_metadata->'id')
   OR (item->'metadata'->'segments') IS DISTINCT FROM item->'segments'
   OR ((item->'metadata') - ARRAY['segments','withheld']::text[]) IS DISTINCT FROM (revision_row.legacy_metadata - ARRAY['segments','withheld']::text[])
   OR coalesce(item->'metadata'->>'withheld','false')='true' OR jsonb_array_length(item->'segments')=0 THEN
   RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_MISMATCH' USING ERRCODE='42501';
  END IF;
  FOR segment IN SELECT value FROM jsonb_array_elements(item->'segments') LOOP
   IF jsonb_typeof(segment) IS DISTINCT FROM 'object' OR nullif(segment->>'segmentId','') IS NULL OR jsonb_typeof(segment->'text') IS DISTINCT FROM 'string'
    OR jsonb_typeof(segment->'startMs') IS DISTINCT FROM 'number' OR jsonb_typeof(segment->'endMs') IS DISTINCT FROM 'number'
    OR (segment->>'startMs')::numeric<0 OR (segment->>'endMs')::numeric<(segment->>'startMs')::numeric THEN
    RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_INVALID' USING ERRCODE='22023';
   END IF;
  END LOOP;
  UPDATE zuri_go.meeting_revisions SET segments=item->'segments',legacy_metadata=item->'metadata'
  WHERE business_id=p_business_id AND meeting_id=p_meeting_id AND id=revision_id AND legacy_metadata->>'withheld'='true';
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_STALE' USING ERRCODE='P0001'; END IF;
  revision_ids:=array_append(revision_ids,item->'metadata'->>'id');
 END LOOP;

 UPDATE zuri_go.meetings SET transcript_custody='cloud' WHERE business_id=p_business_id AND id=p_meeting_id AND transcript_custody='local_only';
 IF NOT FOUND THEN RAISE EXCEPTION 'TRANSCRIPT_UPLOAD_STALE' USING ERRCODE='P0001'; END IF;
 UPDATE zuri_go.businesses SET domain_revision=domain_revision+1 WHERE id=p_business_id;
 INSERT INTO zuri_go.change_events(business_id,entity_type,entity_id,event_type,before_data,after_data,actor_kind,actor_subject,request_id,actor_member_id,actor_pid)
 VALUES(p_business_id,'meetings',p_meeting_id,'transcript_upload',
  jsonb_build_object('transcript_custody','local_only'),
  jsonb_build_object('transcript_custody','cloud','reason',btrim(p_reason),'revisionIds',to_jsonb(revision_ids),'batchIds',to_jsonb(p_batch_ids)),
  'authenticated',v_pid,gen_random_uuid()::text,v_member,v_pid);
END $$;
REVOKE ALL ON FUNCTION zuri_go.complete_meeting_transcript_upload(uuid,uuid,text,jsonb,text[]) FROM PUBLIC,zuri_go_app;
GRANT EXECUTE ON FUNCTION zuri_go.complete_meeting_transcript_upload(uuid,uuid,text,jsonb,text[]) TO zuri_go_app;
COMMIT;
