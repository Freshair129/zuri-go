BEGIN;
SET search_path TO zuri_go,public;
ALTER TABLE businesses ADD COLUMN next_member_no bigint NOT NULL DEFAULT 1;
ALTER TABLE members ADD COLUMN pid text;
CREATE FUNCTION member_pid() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n bigint; existing_pid text;
BEGIN
 IF TG_OP='INSERT' AND NEW.pid IS NOT NULL THEN RAISE EXCEPTION 'PID is server assigned' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD.pid IS NOT NULL AND NEW.pid IS DISTINCT FROM OLD.pid THEN RAISE EXCEPTION 'PID is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  SELECT pid INTO existing_pid FROM zuri_go.members WHERE business_id=NEW.business_id AND id=NEW.id;
  IF existing_pid IS NOT NULL THEN NEW.pid=existing_pid; RETURN NEW; END IF;
 END IF;
 IF NEW.pid IS NULL THEN
  UPDATE zuri_go.businesses SET next_member_no=next_member_no+1 WHERE id=NEW.business_id RETURNING next_member_no-1 INTO n;
  IF n IS NULL THEN RAISE EXCEPTION 'Business scope required' USING ERRCODE='23514'; END IF;
  NEW.pid='ZGO-P'||lpad(n::text,greatest(4,length(n::text)),'0');
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER members_pid BEFORE INSERT OR UPDATE ON members FOR EACH ROW EXECUTE FUNCTION member_pid();
-- Backfill by the preserved import IDs; no display-name matching or PK changes.
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE m record; BEGIN
 FOR m IN SELECT id,business_id FROM members ORDER BY business_id,CASE legacy_metadata->>'id'
  WHEN 'c746fb0a-f974-4bc8-9e08-610bfd596f75' THEN 1
  WHEN '1d97715d-6ae8-46e4-87ba-5ce4c534da1c' THEN 2
  WHEN '3163eeb1-3f4d-4340-88e7-f07dd188ab34' THEN 3
  WHEN '72ba0a5a-4e04-4d42-b0e2-ca3a802ffe49' THEN 4 ELSE 5 END,created_at,id LOOP
  PERFORM set_config('zuri_go.business_id',m.business_id::text,true);
  UPDATE members SET pid=NULL WHERE id=m.id;
 END LOOP;
END $$;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE members FORCE ROW LEVEL SECURITY;
ALTER TABLE members ALTER COLUMN pid SET NOT NULL;
ALTER TABLE members ADD UNIQUE(business_id,pid);
CREATE TABLE member_credentials (
 business_id uuid NOT NULL,member_id uuid NOT NULL,password_hash text NOT NULL,
 credential_version bigint NOT NULL DEFAULT 1 CHECK(credential_version>0),enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,member_id),FOREIGN KEY(business_id,member_id) REFERENCES members(business_id,id)
);
ALTER TABLE member_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_credentials FORCE ROW LEVEL SECURITY;
CREATE POLICY business_scope ON member_credentials USING (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid) WITH CHECK (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid);
ALTER TABLE change_events ADD COLUMN actor_pid text;
ALTER TABLE task_attachments ADD COLUMN uploaded_by_member_id uuid,ADD COLUMN deleted_by_member_id uuid,
 ADD FOREIGN KEY(business_id,uploaded_by_member_id) REFERENCES members(business_id,id),
 ADD FOREIGN KEY(business_id,deleted_by_member_id) REFERENCES members(business_id,id);
COMMIT;
