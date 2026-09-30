BEGIN;
SET search_path TO zuri_go, public;
CREATE TABLE team_login_limits (
 business_id uuid NOT NULL REFERENCES businesses(id), bucket text NOT NULL,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0), resets_at timestamptz NOT NULL,
 PRIMARY KEY(business_id,bucket)
);
ALTER TABLE team_login_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_login_limits FORCE ROW LEVEL SECURITY;
CREATE POLICY business_scope ON team_login_limits USING (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid) WITH CHECK (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid);
COMMIT;
