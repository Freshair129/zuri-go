# Zuri-Go 0.5.1 — restore drill of the pre-FEAT-014 production backup

Run on 2026-10-04 (Bangkok), after the schema-10 production rollout. This was a local-only C-1 / LOW verification of the private backup taken immediately before migrations 008–010; it made no application, production database or deployment change.

## Method

1. Verified the backup SHA-256 against the release record and confirmed all 36 SQL `COPY` sections were present.
2. Started an isolated PostgreSQL 18 container with `--network none`, no published ports and no host bind mount. A fresh one-use password was generated for container initialization and was not printed or stored.
3. Copied the backup into the container, restored it into a new `zuri_go_restore_drill` database using `psql` with `ON_ERROR_STOP`, and compared every restored table row count with the corresponding `COPY` row count parsed from the backup.
4. Confirmed all 36/36 table counts matched and `public.zuri_go_migrations` restored at schema version 7.
5. Removed the exact temporary container and its anonymous volume, then verified both were gone.

## Result and limits

The restore passed on PostgreSQL major version 18. No table names with row values, credentials, hashes, Business identifiers or connection details were printed. The live production database, local Docker `zuri_go` database, existing PostgreSQL container and their volumes were not queried or modified.

This backup predates migrations 008–010 and represents schema 7. The drill proves this pre-migration backup is loadable and its restored table counts agree with its `COPY` data; it does not prove recovery of the post-migration schema-10 database, production roles/grants, Neon settings, application sign-in or a production failover. The dump was created with `--no-owner --no-privileges`; no role or privilege restoration was tested.

Version diff: application 0.5.1 → 0.5.1; FEAT-014 0.1.0 → 0.1.0; production schema remains 10; the restored scratch database was schema 7 and was removed after verification.
