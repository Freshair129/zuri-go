BEGIN;
SET search_path TO zuri_go,public;
-- FEAT-011 visibility (SDD-011). Additive: existing rows become 'business' and keep every other field.
-- Viewer settings are set per transaction next to zuri_go.business_id; a missing setting reads as guest.
CREATE FUNCTION viewer_kind() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('zuri_go.viewer_kind',true),''),'guest') $$;
CREATE FUNCTION viewer_member() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('zuri_go.viewer_member',true),'')::uuid $$;

CREATE TABLE teams (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80), archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1, UNIQUE(business_id,id)
);
CREATE UNIQUE INDEX team_active_name ON teams(business_id,lower(trim(name))) WHERE archived_at IS NULL;
CREATE TABLE team_members (
 business_id uuid NOT NULL REFERENCES businesses(id), team_id uuid NOT NULL, member_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,team_id,member_id), FOREIGN KEY(business_id,team_id) REFERENCES teams(business_id,id), FOREIGN KEY(business_id,member_id) REFERENCES members(business_id,id)
);
CREATE INDEX team_member_lookup ON team_members(business_id,member_id);
ALTER TABLE members ADD COLUMN is_business_admin boolean NOT NULL DEFAULT false;

ALTER TABLE tasks ADD COLUMN visibility text NOT NULL DEFAULT 'business' CHECK(visibility IN('public','business','team','restricted')), ADD COLUMN team_id uuid,
 ADD FOREIGN KEY(business_id,team_id) REFERENCES teams(business_id,id), ADD CONSTRAINT task_team_required CHECK(visibility<>'team' OR team_id IS NOT NULL);
CREATE TABLE task_viewers (
 business_id uuid NOT NULL REFERENCES businesses(id), task_id uuid NOT NULL, member_id uuid NOT NULL, added_by_member_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,task_id,member_id), FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id), FOREIGN KEY(business_id,member_id) REFERENCES members(business_id,id),
 FOREIGN KEY(business_id,added_by_member_id) REFERENCES members(business_id,id)
);
CREATE INDEX task_viewer_lookup ON task_viewers(business_id,member_id);

ALTER TABLE meetings ADD COLUMN visibility text NOT NULL DEFAULT 'business' CHECK(visibility IN('public','business','team','restricted')), ADD COLUMN team_id uuid,
 ADD COLUMN transcript_custody text NOT NULL DEFAULT 'cloud' CHECK(transcript_custody IN('local_only','cloud')),
 ADD FOREIGN KEY(business_id,team_id) REFERENCES teams(business_id,id), ADD CONSTRAINT meeting_team_required CHECK(visibility<>'team' OR team_id IS NOT NULL);
CREATE TABLE meeting_participants (
 business_id uuid NOT NULL REFERENCES businesses(id), meeting_id uuid NOT NULL, member_id uuid NOT NULL, role text NOT NULL DEFAULT 'participant' CHECK(role IN('organizer','participant')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(business_id,meeting_id,member_id),
 FOREIGN KEY(business_id,meeting_id) REFERENCES meetings(business_id,id), FOREIGN KEY(business_id,member_id) REFERENCES members(business_id,id)
);
CREATE UNIQUE INDEX meeting_single_organizer ON meeting_participants(business_id,meeting_id) WHERE role='organizer';
CREATE INDEX meeting_participant_lookup ON meeting_participants(business_id,member_id);

-- Only the operator path (the table owner) may grant or remove the Business-admin capability (FR-011-002).
CREATE FUNCTION guard_business_admin() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (TG_OP='INSERT' AND NEW.is_business_admin OR TG_OP='UPDATE' AND NEW.is_business_admin IS DISTINCT FROM OLD.is_business_admin)
  AND current_user<>(SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid='zuri_go.members'::regclass) THEN
  RAISE EXCEPTION 'Business admin is set by the operator only' USING ERRCODE='42501';
 END IF; RETURN NEW; END $$;
CREATE TRIGGER members_admin_guard BEFORE INSERT OR UPDATE ON members FOR EACH ROW EXECUTE FUNCTION guard_business_admin();

-- Audience of a task or meeting. Reads only L0 membership tables, whose policies never refer back (no recursion).
CREATE FUNCTION task_audience(b uuid, task uuid, level text, team uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT zuri_go.viewer_kind()='operator' OR level='public' OR (zuri_go.viewer_kind()='member' AND zuri_go.viewer_member() IS NOT NULL AND (level='business'
  OR (level='team' AND EXISTS(SELECT 1 FROM zuri_go.team_members m WHERE m.business_id=b AND m.team_id=team AND m.member_id=zuri_go.viewer_member()))
  OR (level IN('team','restricted') AND (EXISTS(SELECT 1 FROM zuri_go.task_roles r WHERE r.business_id=b AND r.task_id=task AND r.member_id=zuri_go.viewer_member())
   OR EXISTS(SELECT 1 FROM zuri_go.task_viewers v WHERE v.business_id=b AND v.task_id=task AND v.member_id=zuri_go.viewer_member())))))
$$;
CREATE FUNCTION meeting_audience(b uuid, meeting uuid, level text, team uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT zuri_go.viewer_kind()='operator' OR level='public' OR (zuri_go.viewer_kind()='member' AND zuri_go.viewer_member() IS NOT NULL AND (level='business'
  OR (level='team' AND EXISTS(SELECT 1 FROM zuri_go.team_members m WHERE m.business_id=b AND m.team_id=team AND m.member_id=zuri_go.viewer_member()))
  OR (level IN('team','restricted') AND EXISTS(SELECT 1 FROM zuri_go.meeting_participants p WHERE p.business_id=b AND p.meeting_id=meeting AND p.member_id=zuri_go.viewer_member()))))
$$;

DO $$ DECLARE t text; BEGIN
 -- Every new table keeps the Business boundary of 001_core.sql.
 FOREACH t IN ARRAY ARRAY['teams','team_members','task_viewers','meeting_participants'] LOOP
  EXECUTE format('ALTER TABLE zuri_go.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE zuri_go.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY business_scope ON zuri_go.%I USING (business_id = nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid) WITH CHECK (business_id = nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid)',t);
 END LOOP;
 -- L0: membership rows are closed to Guests.
 FOREACH t IN ARRAY ARRAY['team_members','task_roles','task_viewers','meeting_participants','teams','ai_briefs'] LOOP
  EXECUTE format('CREATE POLICY signed_in ON zuri_go.%I AS RESTRICTIVE USING (zuri_go.viewer_kind() IN (''member'',''operator'')) WITH CHECK (zuri_go.viewer_kind() IN (''member'',''operator''))',t);
 END LOOP;
END $$;
CREATE TRIGGER stamp BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION stamp_row();

-- L1: items. Inserts keep business_scope only, so the named people can be written after the row (SDD-011 "Write order").
CREATE POLICY audience_read ON tasks AS RESTRICTIVE FOR SELECT USING (task_audience(business_id,id,visibility,team_id));
CREATE POLICY audience_update ON tasks AS RESTRICTIVE FOR UPDATE USING (task_audience(business_id,id,visibility,team_id)) WITH CHECK (true);
CREATE POLICY audience_delete ON tasks AS RESTRICTIVE FOR DELETE USING (task_audience(business_id,id,visibility,team_id));
CREATE POLICY audience_read ON meetings AS RESTRICTIVE FOR SELECT USING (meeting_audience(business_id,id,visibility,team_id));
CREATE POLICY audience_update ON meetings AS RESTRICTIVE FOR UPDATE USING (meeting_audience(business_id,id,visibility,team_id)) WITH CHECK (true);
CREATE POLICY audience_delete ON meetings AS RESTRICTIVE FOR DELETE USING (meeting_audience(business_id,id,visibility,team_id));

-- L2: content follows its item through the parent's own policy.
CREATE POLICY follows_task ON task_attachments AS RESTRICTIVE USING (EXISTS(SELECT 1 FROM tasks t WHERE t.business_id=task_attachments.business_id AND t.id=task_attachments.task_id));
CREATE POLICY follows_task ON weekly_plan_tasks AS RESTRICTIVE USING (EXISTS(SELECT 1 FROM tasks t WHERE t.business_id=weekly_plan_tasks.business_id AND t.id=weekly_plan_tasks.task_id));
CREATE POLICY follows_meeting ON meeting_revisions AS RESTRICTIVE USING (EXISTS(SELECT 1 FROM meetings m WHERE m.business_id=meeting_revisions.business_id AND m.id=meeting_revisions.meeting_id));
CREATE POLICY follows_meeting ON meeting_draft_batches AS RESTRICTIVE USING (EXISTS(SELECT 1 FROM meetings m WHERE m.business_id=meeting_draft_batches.business_id AND m.id=meeting_draft_batches.meeting_id));
CREATE POLICY follows_meeting ON meeting_task_links AS RESTRICTIVE USING (EXISTS(SELECT 1 FROM meeting_draft_batches d WHERE d.business_id=meeting_task_links.business_id AND d.id=meeting_task_links.batch_id));
CREATE POLICY follows_entity ON change_events AS RESTRICTIVE FOR SELECT USING (viewer_kind() IN ('member','operator') AND CASE
 WHEN entity_type IN ('tasks','task_roles','task_viewers','task_visibility') THEN EXISTS(SELECT 1 FROM tasks t WHERE t.business_id=change_events.business_id AND t.id=change_events.entity_id)
 WHEN entity_type='legacy_task_event' THEN entity_id=business_id OR EXISTS(SELECT 1 FROM tasks t WHERE t.business_id=change_events.business_id AND t.id=change_events.entity_id)
 WHEN entity_type='task_attachments' THEN EXISTS(SELECT 1 FROM task_attachments a WHERE a.business_id=change_events.business_id AND a.id=change_events.entity_id)
 WHEN entity_type IN ('meetings','meeting_participants','meeting_visibility') THEN EXISTS(SELECT 1 FROM meetings m WHERE m.business_id=change_events.business_id AND m.id=change_events.entity_id)
 ELSE true END);
COMMIT;
