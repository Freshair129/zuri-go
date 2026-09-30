BEGIN;
SET search_path TO zuri_go, public;
CREATE TABLE task_attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), task_id uuid NOT NULL,
 filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 180), media_type text NOT NULL,
 byte_size integer NOT NULL CHECK(byte_size BETWEEN 1 AND 2097152), sha256 text NOT NULL CHECK(length(sha256)=64),
 payload bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
 CHECK(octet_length(payload)=byte_size), FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id)
);
CREATE INDEX task_attachments_active ON task_attachments(business_id,task_id) WHERE deleted_at IS NULL;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments FORCE ROW LEVEL SECURITY;
CREATE POLICY business_scope ON task_attachments USING (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid) WITH CHECK (business_id=nullif(current_setting('zuri_go.business_id',true),'')::uuid);
COMMIT;
