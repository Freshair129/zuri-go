---
id: RB-001
title: Zuri-Go operations after extraction
status: approved
relations:
  relates_to: [SRV-001, SRV-002]
---

# Zuri-Go operations after extraction

Run all commands from the project root described in [README](../../README.md).

## Database custody
Existing local Docker container and volume are retained. `.local/config.json` selects the existing local Business; `.local/cloud-config.json` is for trusted operator cloud access. These files and `.local/postgres.env` are private. Never put them in apps/metrics, apps/web/src/data.json, build/site or build/vercel.

Migration source is `apps/api/migrations/`; five historical SQL migrations were copied without modification. `npm run db:migrate` is an explicit schema operation, not a startup or extraction prerequisite. Do not use setup/import to initialize over an occupied Business. App runtime uses a restricted PostgreSQL role; admin credentials stay outside deployment.

`npm run backup` creates a full local SQL dump under `.local/backups`. Cloud requires a matching-major pg_dump and the private admin connection. Extraction reused existing cloud checkpoints; it did not claim a new cloud backup or restore drill. Member private handovers are retained byte-identical. Operator reset/enable/disable commands stay documented in the identity contract; do not infer authority to rotate credentials from a file move.

## Build and deploy
`npm run build` verifies the copied Data App with the installed Data plugin, builds the guide, assembles static content and creates the allowlisted Vercel package. Do not hand-edit generated files. `npm test` includes PostgreSQL tests that create isolated QA Businesses and requires the local server on 4319 for HTTP checks.

Durable project binding is `scripts/deploy/project.json`, copied by the packager into `build/vercel/.vercel/project.json`: project `zuri-metrics-map`, scope `pornpons-projects`, project ID `prj_8f3zf1qaZnRcAvWabOv1PWAPIABG`. It was copied from the verified existing binding. `npm run deploy` invokes Vercel CLI 61.1.0 only when the operator requests deployment; it always stages: `vercel@61.1.0 deploy --prod --skip-domain --yes --scope pornpons-projects --cwd ./build/vercel`, so the public domain does not move, and it prints the unique deployment URL. `npm run promote -- <deployment-url>` runs `vercel@61.1.0 promote <url> --yes --scope pornpons-projects --cwd ./build/vercel` and refuses, before calling Vercel, a missing URL or one that does not match `https://zuri-metrics-*-pornpons-projects.vercel.app`. `npm run db:migrate` refuses (exit code 1, no connection) a target host that is not local unless `--cloud` is given; see step 5 of the procedure below. The checks are pure functions covered by `apps/api/test/operator-guards.test.mjs`. Use the procedure below for a release. No new Vercel project or provider is needed. The packager restores this binding when regenerating build output and refuses to overwrite a conflicting binding; never silently create a new project.

Production environment: ZURI_GO_DATABASE_URL, ZURI_GO_BUSINESS_ID, ZURI_GO_SESSION_SECRET, ZURI_GO_PUBLIC_ORIGIN. Individual credential hashes live in PostgreSQL; there is no shared-password fallback.

## Local service and rollback
`npm start` opens Docker and starts `apps/api/server.mjs` on 127.0.0.1:4319. Logs: `.local/logs/server.log` and server-error.log. An existing listener is accepted only after API Business identity matches; unrelated processes are not stopped automatically.

For rollback, stop only the identified new Zuri-Go listener and run the previous checkpoint's startup command. The persistent database has not moved, so no restore/reimport is needed for a source-path rollback. Rollback is a deliberate operator action; the old brand-kit source is frozen and its README points here.

## Documentation history
`docs/history/` retains release evidence, screenshots and diffs from prior versions. Paths inside preserved evidence describe where files were when verified; before-snapshots and temporary test data remain in the original checkpoint. Current commands are in the root README and this runbook. Existing external FUNG/AI limitations remain; extraction did not exercise external providers or publish social content.

## Visibility and teams (FEAT-011, schema 6)

Migration `006_visibility.sql` adds teams, the Business-admin flag, visibility levels, task viewers and meeting participants, with row-level security that reads the viewer from `zuri_go.viewer_kind` and `zuri_go.viewer_member`. It is additive: existing tasks and meetings become `business`. It was applied to the local database on 2026-10-01 after `npm run backup`, and to production on 2026-10-01 with release 0.5.0 (backup first, then the matching code; see [Production release procedure](#production-release-procedure-used-for-050) and the [verification record](../releases/0.5.0/verification.md)).

- **Restart after migrating.** A server started before schema 6 sets no viewer, so the database treats it as a Guest and it shows no business work. Stop only the identified Zuri-Go listener on 4319 and run `npm start`.
- **Business admin.** `npm run members -- --admin ZGO-Pnnnn` grants it and `--no-admin ZGO-Pnnnn` removes it (add `--cloud` for production). Each change is audited; the runtime role cannot change the flag. An admin manages teams but reads nothing extra.
- **Rollback.** Code from before FEAT-011 on a schema-6 database reads as a Guest and shows no business work. Plan a rollback together with the schema; there is no down-migration.

## Task Manager (FEAT-010, schema 7)

Migration `007_tasks_projects.sql` adds `projects`, `project_viewers`, `campaign_task_details` and, on `tasks`, `project_id`, `owner_label`, `completion_rule` and the idempotency columns. It is additive: existing rows keep their values, and `completion_rule` reads `standard` until the backfill (PLAN-002 P4). It was applied to the local database on 2026-10-01 after `npm run backup`, and to production on 2026-10-01 together with 006 and their code (release 0.5.0, [verification](../releases/0.5.0/verification.md)).

- **Restart after migrating**, as for schema 6.
- **Moving a Workboard task to Done** now needs an R and the standard completion rule; tasks already Done keep their state.
- **Rollback.** Code from before FEAT-010 ignores the new columns and tables; plan it together with FEAT-011's rollback note above.
- **Workboard backfill (FR-010-016).** `node apps/api/backfill-workboard.mjs` is a read-only dry run of the local Business (`--cloud` for production); it prints counts and writes the full report to `.local/backfill/`. `--run` writes, reconciles and needs schema 7; a production run also needs `--production-authorized`, a backup first and the owner's specific authorization. The dry run of 2026-10-01 found 0 Workboard tasks in production on schema 5 and again after the migration on schema 7, so nothing was moved and no real run was needed.

## Production release procedure (used for 0.5.0)

First used for release 0.5.0 on 2026-10-01 (Bangkok), before the operator-script guards above (the 0.5.0 run used the Vercel and migration commands directly); the record is [docs/releases/0.5.0/verification.md](../releases/0.5.0/verification.md). Each step needs the owner's authorization for that release (AGENTS.md); no step prints or stores a secret in the repository, and every connection string is passed only through the environment of the one process that needs it.

1. **Build and test** the release commit: `npm run build`, `npm test`.
2. **Read-only production checks:** the schema version, the row counts of every table of the Business, the meetings count (WI-09 staging decision) and `node apps/api/backfill-workboard.mjs --cloud` (dry run).
3. **Production backup** with `pg_dump` 18 run from the local `postgres:18` Docker image (the local container is older than the Neon major, so a matching-major client is needed). The connection is passed only through the environment, never on the command line. The image has no root certificates: mount a root CA bundle into the container and set `PGSSLROOTCERT`, so that certificate verification stays on. Use `--no-owner --no-privileges`. Check the dump is complete (the trailer is present, the expected number of `COPY` sections) and keep it privately under `.local/backups/`. A restore was not exercised at release time; the drill of 2026-10-01 restored it into a throw-away PostgreSQL 18 container with every table count matching ([restore drill](../releases/0.5.0/restore-drill.md)).
4. **Staged deployment:** `npm run deploy` (`vercel@61.1.0 deploy --prod --skip-domain --yes` from `build/vercel`, project `zuri-metrics-map`, scope `pornpons-projects`). The public domain does not move; the command prints the unique deployment URL. Verify that URL with `vercel curl` (authenticated Vercel access).
5. **Production migration:** `npm run db:migrate -- --cloud`. With `--cloud`, `migrate.mjs` reads `adminUrl` from `.local/cloud-config.json` (it ignores `ZURI_GO_ADMIN_URL`) and prints only the last two labels of the host and the database name before migrating. Without `--cloud` it uses `ZURI_GO_ADMIN_URL` or `.local/config.json` and **refuses** (exit code 1, no connection) a host that is not `localhost`, `127.0.0.1`, `::1` or a single-label Docker host name taken from the local config. Confirm the schema before and after. Apply the migration after the staged deployment and before promotion, because code and schema must match.
6. **Hosted checks on the unique deployment**, then `npm run promote -- <deployment-url>` to the public domain, then the same checks on the public URL, the production counts against the pre-migration counts, and the backfill dry run on the new schema. Record the deployment ID, the URLs, the HTML digest and what was not run.

Between the migration and the promotion the public site runs the previous code on the new schema. Code from before FEAT-011 sets no viewer and reads as a Guest, so the window shows no business work; keep it short.

**Rollback.** There is no down-migration. Promoting the previous deployment does not restore the previous behavior on a migrated schema (it reads as a Guest). The fallback chosen for 0.5.0 is to fix forward on schema 7; restoring the backup would discard later writes and needs its own authorization.

After 0.5.0, the Business-admin flag was set for the owner's Member (`npm run members -- --admin <PID> --cloud`, one audit event; see the verification record). **Left to the owner:** the hosted Member, restricted-meeting participant and Business-admin checks (they need a real Member code), browser checks on production and a restore drill.

## Identity-code login (0.4.2)

Members enter their existing personal code in the single masked field **รหัสระบุตัวตน**; no PID input is needed. PID remains on Member records and in operator reset commands. An ambiguous code is denied even if another matching credential is disabled; only an explicitly authorized operator reset can resolve it. No code rotation or migration is needed for this release. Login evaluates all credentials within the Business (currently four scrypt checks); rate limits remain enabled.

## Visual Studio — FEAT-014 local first slice

Source code requires schema 10 after migrations `008_visual_marketing.sql` through `010_visual_approval_boundary.sql`. `npm run db:migrate` is an explicit operator action, not part of startup/build; do not run it against user or cloud data without that authorization. R3 migration and focused verification passed only in the separate PostgreSQL 17 QA container on port 54339; fresh independent VerifyGate and whole-PR ReviewGate remain pending. The last-recorded user/cloud baseline remains schema 7 and was not live-inspected or migrated for R3. Before schema 10, Visual Studio returns FEATURE_UNAVAILABLE; other domains continue working. Existing database backups include all new tables. Existing workspace JSON export does not include creative records; retain PostgreSQL backups.

Use Task Manager to create an ordinary Project with owner/audience, then open Visual Studio and select it. Confirm brand context, save Brief, complete manual stages, check QA and obtain the Project owner's final approval (or explicit local-operator decision). This creates text assets only. Revisions retain previous records and retract the current public projection. There is no automatic publishing or Campaign/Task write.

Optional server-only variables: `ZURI_GO_VISUAL_ENDPOINT=http://127.0.0.1:11434` and `ZURI_GO_VISUAL_MODEL=<installed-model>`. Set both before starting the existing server. These are independent of the summary configuration. Only loopback HTTP is accepted; no model is installed or downloaded by this feature. A user must authorize the exact revision before enqueue. Do not put credentials in these values. Unconfigured models leave manual mode available. Model context contains the selected Brief, confirmed Brand and prior same-revision outputs; no shell, general HTTP or MCP access exists.

The local server owns one worker loop. SIGINT/SIGTERM aborts its request before closing PostgreSQL. A crashed process leaves a 60-second lease; a restarted server can reclaim up to two attempts, with token/hash/revision fencing. Cancel first to switch a running job to manual. Retry failed/cancelled work only with a fresh operator grant and unchanged revision; old history remains. The image provider, hosted executor, variants and performance learning return unavailable. Do not launch another server against the same Business merely to add capacity.

No source rollback/down migration is supplied. Keep schema 10 data and assess code compatibility; build, push and local tests are not production migration/deployment authorization. [Verification](../features/FEAT-014-visual-marketing-team/verification.md) records current evidence and remaining gates.
