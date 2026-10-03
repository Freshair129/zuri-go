BEGIN;
SET search_path TO zuri_go,public;
-- @trace implements FR-014-001, FR-014-006, FR-014-008, FR-014-009, FR-014-010
-- Additive FEAT-014: no existing data is modified. All production data stays untouched by this file's creation.
CREATE TABLE visual_projects (
 business_id uuid NOT NULL REFERENCES businesses(id), project_id uuid NOT NULL,
 current_brief_id uuid, revision integer NOT NULL DEFAULT 0, stage text NOT NULL DEFAULT 'BRIEF',
 strategy_approval_required boolean NOT NULL DEFAULT false, strategy_approved boolean NOT NULL DEFAULT false,
 frozen_visibility text NOT NULL, frozen_member_ids uuid[] NOT NULL,
 row_version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,project_id), FOREIGN KEY(business_id,project_id) REFERENCES projects(business_id,id),
 CHECK(stage IN('BRIEF','RESEARCH','STRATEGY','CONCEPT','COPY','ART_DIRECTION','GENERATION','QA','HUMAN_REVIEW','APPROVED','READY_FOR_CAMPAIGN','REVISION','REJECTED','FAILED')),
 CHECK(frozen_visibility IN('public','business','team','restricted')), CHECK(revision>=0)
);
CREATE FUNCTION visual_freeze_audience() RETURNS trigger LANGUAGE plpgsql SET search_path=zuri_go,pg_temp AS $$
DECLARE p record; BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.business_id<>OLD.business_id OR NEW.project_id<>OLD.project_id OR NEW.frozen_visibility<>OLD.frozen_visibility OR NEW.frozen_member_ids<>OLD.frozen_member_ids THEN RAISE EXCEPTION 'Immutable visual audience'; END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO STRICT p FROM projects WHERE business_id=NEW.business_id AND id=NEW.project_id;
 NEW.frozen_visibility=p.visibility;
 NEW.frozen_member_ids=ARRAY(SELECT DISTINCT member_id FROM (
  SELECT p.owner_member_id AS member_id UNION SELECT member_id FROM project_viewers WHERE business_id=p.business_id AND project_id=p.id
  UNION SELECT member_id FROM team_members WHERE business_id=p.business_id AND team_id=p.team_id AND p.visibility='team'
 ) admitted);
 RETURN NEW;
END $$;
CREATE TRIGGER visual_audience_freeze BEFORE INSERT OR UPDATE ON visual_projects FOR EACH ROW EXECUTE FUNCTION visual_freeze_audience();
CREATE TRIGGER stamp BEFORE UPDATE ON visual_projects FOR EACH ROW EXECUTE FUNCTION stamp_row();
CREATE TABLE visual_brand_profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, profile jsonb NOT NULL,
 source_refs jsonb NOT NULL DEFAULT '[]', input_hash text NOT NULL, actor_kind text NOT NULL, actor_member_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,project_id,id),
 FOREIGN KEY(business_id,project_id) REFERENCES visual_projects(business_id,project_id), FOREIGN KEY(business_id,actor_member_id) REFERENCES members(business_id,id)
);
CREATE TABLE visual_briefs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, brand_profile_id uuid NOT NULL, campaign_id uuid,
 revision integer NOT NULL, payload jsonb NOT NULL, input_hash text NOT NULL, actor_kind text NOT NULL, actor_member_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,project_id,id), UNIQUE(business_id,project_id,revision),
 FOREIGN KEY(business_id,project_id) REFERENCES visual_projects(business_id,project_id),
 FOREIGN KEY(business_id,project_id,brand_profile_id) REFERENCES visual_brand_profiles(business_id,project_id,id),
 FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id), FOREIGN KEY(business_id,actor_member_id) REFERENCES members(business_id,id)
);
ALTER TABLE visual_projects ADD FOREIGN KEY(business_id,project_id,current_brief_id) REFERENCES visual_briefs(business_id,project_id,id);
CREATE TABLE visual_runs (
 id uuid PRIMARY KEY, business_id uuid NOT NULL, project_id uuid NOT NULL, revision integer NOT NULL,
 root_run_id uuid NOT NULL, parent_run_id uuid, delegation_depth integer NOT NULL CHECK(delegation_depth BETWEEN 0 AND 4),
 agent_id text NOT NULL CHECK(agent_id ~ '^VIS-MKT-0[1-8]$'), stage text NOT NULL, status text NOT NULL,
 allowed_tools jsonb NOT NULL DEFAULT '[]', input_hash text NOT NULL, actor_kind text NOT NULL CHECK(actor_kind IN('operator','member')), actor_member_id uuid,
 started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 UNIQUE(business_id,project_id,id), FOREIGN KEY(business_id,project_id) REFERENCES visual_projects(business_id,project_id),
 FOREIGN KEY(business_id,project_id,root_run_id) REFERENCES visual_runs(business_id,project_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(business_id,project_id,parent_run_id) REFERENCES visual_runs(business_id,project_id,id),
 FOREIGN KEY(business_id,actor_member_id) REFERENCES members(business_id,id),
 CHECK((parent_run_id IS NULL AND root_run_id=id AND delegation_depth=0) OR (parent_run_id IS NOT NULL AND parent_run_id<>id AND delegation_depth>0))
);
CREATE FUNCTION visual_run_lineage() RETURNS trigger LANGUAGE plpgsql SET search_path=zuri_go,pg_temp AS $$
DECLARE p record; BEGIN
 IF TG_OP='UPDATE' THEN
  IF (NEW.business_id,NEW.project_id,NEW.root_run_id,NEW.parent_run_id,NEW.delegation_depth,NEW.revision) IS DISTINCT FROM (OLD.business_id,OLD.project_id,OLD.root_run_id,OLD.parent_run_id,OLD.delegation_depth,OLD.revision) THEN RAISE EXCEPTION 'Immutable lineage'; END IF;
 ELSIF NEW.parent_run_id IS NOT NULL THEN
  SELECT * INTO STRICT p FROM visual_runs WHERE business_id=NEW.business_id AND project_id=NEW.project_id AND id=NEW.parent_run_id;
  IF p.root_run_id<>NEW.root_run_id OR p.revision<>NEW.revision OR p.delegation_depth+1<>NEW.delegation_depth THEN RAISE EXCEPTION 'Invalid lineage'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER lineage BEFORE INSERT OR UPDATE ON visual_runs FOR EACH ROW EXECUTE FUNCTION visual_run_lineage();
CREATE TABLE visual_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, run_id uuid NOT NULL,
 revision integer NOT NULL, input_hash text NOT NULL, stage text NOT NULL, state text NOT NULL DEFAULT 'queued',
 grant_data jsonb NOT NULL, lease_token uuid, lease_expires_at timestamptz, attempt integer NOT NULL DEFAULT 0,
 row_version bigint NOT NULL DEFAULT 1, error_class text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,project_id,id), FOREIGN KEY(business_id,project_id,run_id) REFERENCES visual_runs(business_id,project_id,id),
 CHECK(state IN('queued','running','succeeded','failed','cancelled','submission_unknown'))
);
CREATE UNIQUE INDEX visual_one_active ON visual_jobs(business_id,project_id) WHERE state IN('queued','running','submission_unknown');
CREATE TRIGGER stamp BEFORE UPDATE ON visual_jobs FOR EACH ROW EXECUTE FUNCTION stamp_row();
CREATE TABLE visual_artifacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, run_id uuid NOT NULL,
 revision integer NOT NULL, kind text NOT NULL, payload jsonb NOT NULL, input_hash text NOT NULL, content_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,project_id,id),
 FOREIGN KEY(business_id,project_id,run_id) REFERENCES visual_runs(business_id,project_id,id)
);
CREATE TABLE visual_provider_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, job_id uuid NOT NULL,
 provider text NOT NULL, model text, attempt integer NOT NULL, status text NOT NULL, usage jsonb, estimated_cost numeric, error_class text,
 created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(business_id,project_id,job_id) REFERENCES visual_jobs(business_id,project_id,id)
);
CREATE TABLE visual_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, artifact_id uuid NOT NULL,
 artifact_hash text NOT NULL, result jsonb NOT NULL, actor_kind text NOT NULL, actor_member_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,project_id,id),
 FOREIGN KEY(business_id,project_id,artifact_id) REFERENCES visual_artifacts(business_id,project_id,id), FOREIGN KEY(business_id,actor_member_id) REFERENCES members(business_id,id)
);
CREATE TABLE visual_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, artifact_id uuid NOT NULL,
 artifact_hash text NOT NULL, review_id uuid NOT NULL, decision text NOT NULL CHECK(decision IN('approve','request_changes','reject')),
 reason text, actor_kind text NOT NULL, actor_member_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,project_id,id), FOREIGN KEY(business_id,project_id,artifact_id) REFERENCES visual_artifacts(business_id,project_id,id),
 FOREIGN KEY(business_id,project_id,review_id) REFERENCES visual_reviews(business_id,project_id,id), FOREIGN KEY(business_id,actor_member_id) REFERENCES members(business_id,id)
);
CREATE TABLE visual_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL, project_id uuid NOT NULL, artifact_id uuid NOT NULL,
 metadata jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,project_id,id),
 FOREIGN KEY(business_id,project_id,artifact_id) REFERENCES visual_artifacts(business_id,project_id,id)
);
CREATE TABLE visual_receipts (
 business_id uuid NOT NULL, project_id uuid NOT NULL, actor_key text NOT NULL, operation text NOT NULL, idempotency_key uuid NOT NULL,
 payload_hash text NOT NULL, response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,actor_key,operation,idempotency_key), FOREIGN KEY(business_id,project_id) REFERENCES visual_projects(business_id,project_id)
);
CREATE TABLE visual_public_outputs (
 business_id uuid NOT NULL, project_id uuid NOT NULL, artifact_id uuid NOT NULL, decision_id uuid NOT NULL, payload jsonb NOT NULL,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(business_id,project_id,artifact_id),
 FOREIGN KEY(business_id,project_id,artifact_id) REFERENCES visual_artifacts(business_id,project_id,id),
 FOREIGN KEY(business_id,project_id,decision_id) REFERENCES visual_decisions(business_id,project_id,id)
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['visual_projects','visual_brand_profiles','visual_briefs','visual_runs','visual_jobs','visual_artifacts','visual_provider_runs','visual_reviews','visual_decisions','visual_assets','visual_receipts','visual_public_outputs'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY business_scope ON %I USING (business_id=nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid) WITH CHECK (business_id=nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid)',t);
  IF t NOT IN('visual_projects','visual_public_outputs') THEN
   EXECUTE format('CREATE POLICY follows_visual ON %I AS RESTRICTIVE USING (viewer_kind() IN(''member'',''operator'') AND EXISTS(SELECT 1 FROM visual_projects p WHERE p.business_id=%I.business_id AND p.project_id=%I.project_id)) WITH CHECK (viewer_kind() IN(''member'',''operator'') AND EXISTS(SELECT 1 FROM visual_projects p WHERE p.business_id=%I.business_id AND p.project_id=%I.project_id))',t,t,t,t,t);
  END IF;
 END LOOP;
END $$;
CREATE POLICY visual_audience ON visual_projects AS RESTRICTIVE USING (
 viewer_kind() IN('member','operator') AND EXISTS(SELECT 1 FROM projects p WHERE p.business_id=visual_projects.business_id AND p.id=visual_projects.project_id)
 AND (viewer_kind()='operator' OR frozen_visibility IN('public','business') OR viewer_member()=ANY(frozen_member_ids))
) WITH CHECK (viewer_kind() IN('member','operator') AND EXISTS(SELECT 1 FROM projects p WHERE p.business_id=visual_projects.business_id AND p.id=visual_projects.project_id));
CREATE POLICY decision_authority ON visual_decisions AS RESTRICTIVE FOR INSERT WITH CHECK (
 (viewer_kind()='operator' AND actor_kind='operator' AND actor_member_id IS NULL) OR (viewer_kind()='member' AND actor_kind='member' AND actor_member_id=viewer_member() AND EXISTS(SELECT 1 FROM projects p WHERE p.business_id=visual_decisions.business_id AND p.id=visual_decisions.project_id AND p.owner_member_id=viewer_member()))
);
CREATE POLICY public_read ON visual_public_outputs AS RESTRICTIVE FOR SELECT USING (
 (viewer_kind() IN('member','operator') AND EXISTS(SELECT 1 FROM visual_projects v WHERE v.business_id=visual_public_outputs.business_id AND v.project_id=visual_public_outputs.project_id))
 OR (active AND EXISTS(SELECT 1 FROM projects p WHERE p.business_id=visual_public_outputs.business_id AND p.id=visual_public_outputs.project_id AND p.visibility='public'))
);
CREATE POLICY public_insert ON visual_public_outputs AS RESTRICTIVE FOR INSERT WITH CHECK (viewer_kind() IN('member','operator') AND EXISTS(SELECT 1 FROM visual_projects p WHERE p.business_id=visual_public_outputs.business_id AND p.project_id=visual_public_outputs.project_id AND p.frozen_visibility='public'));
CREATE POLICY public_update ON visual_public_outputs AS RESTRICTIVE FOR UPDATE USING (viewer_kind() IN('member','operator')) WITH CHECK (viewer_kind() IN('member','operator'));
CREATE INDEX visual_artifact_revision ON visual_artifacts(business_id,project_id,revision,created_at);
CREATE INDEX visual_job_claim ON visual_jobs(business_id,state,created_at);
COMMIT;
