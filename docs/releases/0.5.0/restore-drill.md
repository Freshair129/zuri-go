# Zuri-Go 0.5.0 — restore drill of the pre-release production backup

Run 2026-10-01 (Bangkok), 08:43, after release 0.5.0 and 0.5.1 ([release record](verification.md), [release plan](release-plan.md)). It closes the item “Restore of the backup: not exercised” and the “restore drill” left to the owner in [RB-001](../../operations/RB-001-runbook.md). PLAN-003 node R1. C-1 / LOW: local only, no application, database or deployment change.

## Method

1. Start a throw-away container: `docker run -d --name zuri-go-restore-drill -e POSTGRES_PASSWORD=<random, generated for the run, never printed or stored> postgres:18`. Wait until `pg_isready` answers; the server is PostgreSQL 18.6, the major of production (the backup came from 18.6).
2. Restore the private dump `.local/backups/cloud-pre-0.5.0-2026-09-30T21-55-24-525Z.sql` (661,955 bytes, schema 5, taken before migrations 006 and 007) with `psql -v ON_ERROR_STOP=1`, the file piped into `docker exec -i`. The dump was made with `--no-owner --no-privileges`; no role was created, and none was needed.
3. Count every base table of schema `zuri_go` (`select count(*)` per table) and read `public.zuri_go_migrations`, then compare with `countsBefore` in [database-preservation.json](database-preservation.json), the counts read from production before the migration.
4. Remove the container (`docker rm -f zuri-go-restore-drill`) and the anonymous data volume the image created (`docker volume rm`, one volume, created at the start of the run).

The file was never printed. This record holds counts and metadata only; no row content, credential hash or connection detail.

## Result

The restore finished with exit code 0, nothing on standard error, and the dump's 29 `COPY` sections loaded (28 `zuri_go` tables and `public.zuri_go_migrations`). 27 policies exist in schema `zuri_go`. `public.zuri_go_migrations` holds 5 rows with maximum version **5**, as expected before migration 006.

All 27 tables recorded in `countsBefore` hold exactly the recorded number of rows (whole-table counts; `businesses` holds 1 row, so they are the counts of the production Business).

| Table | Production before 0.5.0 (`countsBefore`) | Restored | Result |
|---|---|---|---|
| `ai_briefs` | 0 | 0 | same |
| `businesses` | 1 | 1 | same |
| `campaign_channels` | 0 | 0 | same |
| `campaign_states` | 1 | 1 | same |
| `campaigns` | 1 | 1 | same |
| `change_events` | 109 | 109 | same |
| `channel_accounts` | 0 | 0 | same |
| `content_items` | 13 | 13 | same |
| `goal_series` | 0 | 0 | same |
| `goals` | 0 | 0 | same |
| `meeting_draft_batches` | 0 | 0 | same |
| `meeting_revisions` | 0 | 0 | same |
| `meeting_task_links` | 0 | 0 | same |
| `meetings` | 0 | 0 | same |
| `member_credentials` | 4 | 4 | same |
| `members` | 4 | 4 | same |
| `metric_observations` | 0 | 0 | same |
| `metric_series` | 0 | 0 | same |
| `migration_batches` | 1 | 1 | same |
| `migration_keys` | 16 | 16 | same |
| `publications` | 0 | 0 | same |
| `task_attachments` | 2 | 2 | same |
| `task_roles` | 67 | 67 | same |
| `tasks` | 12 | 12 | same |
| `team_login_limits` | 4 | 4 | same |
| `weekly_plan_tasks` | 11 | 11 | same |
| `weekly_plans` | 1 | 1 | same |

`metric_definitions` is the 28th table of the dump and is not in `countsBefore`: it is reference data without a `business_id` and holds 5 rows after the restore.

## Time

About 8 s from creating the container to the end of the restore (container start, wait for readiness and the restore); about 24 s from creation to removal, including the counts.

## Cleanup and what was not touched

- `zuri-go-restore-drill` was created and removed; no container with that name remains. The one volume created for it was removed.
- The container `zuri-go-postgres` (the local database, `postgres:17`) was not stopped, restarted, queried or changed; only `psql --version` and a final `pg_isready` ran in it, and it stayed up throughout.
- Production (Neon) was not contacted: the drill reads a file and a local container only. No migration, deployment, credential change or `npm run members` ran.

## Limits

- This restores schema 5 into a local PostgreSQL 18.6 container. It is **not** a production restore: it proves the dump is complete and loadable and that its row counts equal the pre-migration record, not that production can be rebuilt with the same roles, grants, connection settings or Neon-specific features. Restoring over production would discard later writes and needs its own authorization ([verification, Rollback](verification.md)).
- The dump holds schema 5; migrations 006 and 007 were not applied in the drill. Data written after the backup (for example the Business admin flag, 0.5.1 changes) is not in it.
- Credential hashes were restored with the Member credentials (4 rows) but were not used: no sign-in, rotation or comparison was made.
- The application's restricted runtime role and the row-level-security viewer settings were not exercised; only row counts, the migration version and the policy count were read.
