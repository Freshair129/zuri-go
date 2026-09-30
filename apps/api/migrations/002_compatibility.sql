BEGIN;
SET search_path TO zuri_go, public;
ALTER TABLE businesses ADD COLUMN legacy_metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE members ADD COLUMN legacy_metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE weekly_plans ADD COLUMN legacy_metadata jsonb NOT NULL DEFAULT '{}';
COMMIT;
