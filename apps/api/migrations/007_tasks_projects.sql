BEGIN;
SET search_path TO zuri_go,public;
-- FEAT-010 phase P2 (SDD-010). Additive only (NFR-010-002): no DROP, no TRUNCATE, no DELETE or UPDATE of existing rows,
-- no type change. Existing tasks get project_id NULL, owner_label NULL and completion_rule 'standard'.
ALTER TABLE businesses ADD COLUMN next_project_no bigint NOT NULL DEFAULT 1;

CREATE TABLE projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), code text NOT NULL,
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80), description text,
 status text NOT NULL DEFAULT 'active' CHECK(status IN('active','on_hold','done','archived')),
 owner_member_id uuid NOT NULL, team_id uuid, planned_start date, planned_end date,
 visibility text NOT NULL DEFAULT 'business' CHECK(visibility IN('public','business','team','restricted')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 UNIQUE(business_id,id), UNIQUE(business_id,code),
 FOREIGN KEY(business_id,owner_member_id) REFERENCES members(business_id,id), FOREIGN KEY(business_id,team_id) REFERENCES teams(business_id,id),
 CONSTRAINT project_dates CHECK(planned_start IS NULL OR planned_end IS NULL OR planned_end>=planned_start),
 CONSTRAINT project_team_required CHECK(visibility<>'team' OR team_id IS NOT NULL)
);
-- People named on a project besides its owner (owner decision 2026-10-01).
CREATE TABLE project_viewers (
 business_id uuid NOT NULL REFERENCES businesses(id), project_id uuid NOT NULL, member_id uuid NOT NULL, added_by_member_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,project_id,member_id), FOREIGN KEY(business_id,project_id) REFERENCES projects(business_id,id), FOREIGN KEY(business_id,member_id) REFERENCES members(business_id,id),
 FOREIGN KEY(business_id,added_by_member_id) REFERENCES members(business_id,id)
);
CREATE INDEX project_viewer_lookup ON project_viewers(business_id,member_id);

ALTER TABLE tasks ADD COLUMN project_id uuid, ADD COLUMN owner_label text,
 ADD COLUMN completion_rule text NOT NULL DEFAULT 'standard' CHECK(completion_rule IN('standard','workboard')),
 ADD COLUMN idempotency_key uuid, ADD COLUMN idempotency_hash text,
 ADD FOREIGN KEY(business_id,project_id) REFERENCES projects(business_id,id);
CREATE UNIQUE INDEX task_idempotency ON tasks(business_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX task_project ON tasks(business_id,project_id);

-- Campaign-owned details of a campaign task (FR-010-012); Low/Medium/High is never converted to MoSCoW.
CREATE TABLE campaign_task_details (
 business_id uuid NOT NULL REFERENCES businesses(id), task_id uuid NOT NULL,
 gate text, offer text, hypothesis text, action text, estimate numeric, priority text CHECK(priority IN('Low','Medium','High')),
 original_status text CHECK(original_status IN('Backlog','Ready','Doing','Blocked','Review','Done')), outcome text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 PRIMARY KEY(business_id,task_id), FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id)
);

CREATE FUNCTION project_audience(b uuid, project uuid, level text, team uuid, owner uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT zuri_go.viewer_kind()='operator' OR level='public' OR (zuri_go.viewer_kind()='member' AND zuri_go.viewer_member() IS NOT NULL AND (level='business'
  OR (level='team' AND EXISTS(SELECT 1 FROM zuri_go.team_members m WHERE m.business_id=b AND m.team_id=team AND m.member_id=zuri_go.viewer_member()))
  OR (level IN('team','restricted') AND (owner=zuri_go.viewer_member()
   OR EXISTS(SELECT 1 FROM zuri_go.project_viewers v WHERE v.business_id=b AND v.project_id=project AND v.member_id=zuri_go.viewer_member())))))
$$;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['projects','project_viewers','campaign_task_details'] LOOP
  EXECUTE format('ALTER TABLE zuri_go.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE zuri_go.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY business_scope ON zuri_go.%I USING (business_id = nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid) WITH CHECK (business_id = nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid)',t);
 END LOOP;
END $$;
CREATE TRIGGER stamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION stamp_row();
CREATE TRIGGER stamp BEFORE UPDATE ON campaign_task_details FOR EACH ROW EXECUTE FUNCTION stamp_row();

-- L0: named people are closed to Guests (as task_viewers in 006).
CREATE POLICY signed_in ON project_viewers AS RESTRICTIVE USING (viewer_kind() IN ('member','operator')) WITH CHECK (viewer_kind() IN ('member','operator'));
-- L1: projects follow the audience rule; inserts keep business_scope only (SDD-011 "Write order").
CREATE POLICY audience_read ON projects AS RESTRICTIVE FOR SELECT USING (project_audience(business_id,id,visibility,team_id,owner_member_id));
CREATE POLICY audience_update ON projects AS RESTRICTIVE FOR UPDATE USING (project_audience(business_id,id,visibility,team_id,owner_member_id)) WITH CHECK (true);
CREATE POLICY audience_delete ON projects AS RESTRICTIVE FOR DELETE USING (project_audience(business_id,id,visibility,team_id,owner_member_id));
-- L2: campaign details follow their task, as attachments do.
CREATE POLICY follows_task ON campaign_task_details AS RESTRICTIVE USING (EXISTS(SELECT 1 FROM tasks t WHERE t.business_id=campaign_task_details.business_id AND t.id=campaign_task_details.task_id));
-- History of projects and campaign details follows its item (added beside 006's follows_entity, which stays unchanged).
CREATE POLICY follows_project ON change_events AS RESTRICTIVE FOR SELECT USING (CASE
 WHEN entity_type IN ('projects','project_viewers','project_visibility') THEN EXISTS(SELECT 1 FROM projects p WHERE p.business_id=change_events.business_id AND p.id=change_events.entity_id)
 WHEN entity_type='campaign_task_details' THEN EXISTS(SELECT 1 FROM tasks t WHERE t.business_id=change_events.business_id AND t.id=change_events.entity_id)
 ELSE true END);
COMMIT;
