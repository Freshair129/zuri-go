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

Durable project binding is `scripts/deploy/project.json`, copied by the packager into `build/vercel/.vercel/project.json`: project `zuri-metrics-map`, scope `pornpons-projects`, project ID `prj_8f3zf1qaZnRcAvWabOv1PWAPIABG`. It was copied from the verified existing binding. `npm run deploy` invokes Vercel CLI 61.1.0 for production only when the operator requests deployment. No new Vercel project or provider is needed. The packager restores this binding when regenerating build output and refuses to overwrite a conflicting binding; never silently create a new project.

Production environment: ZURI_GO_DATABASE_URL, ZURI_GO_BUSINESS_ID, ZURI_GO_SESSION_SECRET, ZURI_GO_PUBLIC_ORIGIN. Individual credential hashes live in PostgreSQL; there is no shared-password fallback.

## Local service and rollback
`npm start` opens Docker and starts `apps/api/server.mjs` on 127.0.0.1:4319. Logs: `.local/logs/server.log` and server-error.log. An existing listener is accepted only after API Business identity matches; unrelated processes are not stopped automatically.

For rollback, stop only the identified new Zuri-Go listener and run the previous checkpoint's startup command. The persistent database has not moved, so no restore/reimport is needed for a source-path rollback. Rollback is a deliberate operator action; the old brand-kit source is frozen and its README points here.

## Documentation history
`docs/history/` retains release evidence, screenshots and diffs from prior versions. Paths inside preserved evidence describe where files were when verified; before-snapshots and temporary test data remain in the original checkpoint. Current commands are in the root README and this runbook. Existing external FUNG/AI limitations remain; extraction did not exercise external providers or publish social content.

## Visibility and teams (FEAT-011, schema 6)

Migration `006_visibility.sql` adds teams, the Business-admin flag, visibility levels, task viewers and meeting participants, with row-level security that reads the viewer from `zuri_go.viewer_kind` and `zuri_go.viewer_member`. It is additive: existing tasks and meetings become `business`. It was applied to the local database on 2026-10-01 after `npm run backup`; production is still schema 5 and needs its own authorization, a backup first, and the release that carries the matching code.

- **Restart after migrating.** A server started before schema 6 sets no viewer, so the database treats it as a Guest and it shows no business work. Stop only the identified Zuri-Go listener on 4319 and run `npm start`.
- **Business admin.** `npm run members -- --admin ZGO-Pnnnn` grants it and `--no-admin ZGO-Pnnnn` removes it (add `--cloud` for production). Each change is audited; the runtime role cannot change the flag. An admin manages teams but reads nothing extra.
- **Rollback.** Code from before FEAT-011 on a schema-6 database reads as a Guest and shows no business work. Plan a rollback together with the schema; there is no down-migration.

## Task Manager (FEAT-010, schema 7)

Migration `007_tasks_projects.sql` adds `projects`, `project_viewers`, `campaign_task_details` and, on `tasks`, `project_id`, `owner_label`, `completion_rule` and the idempotency columns. It is additive: existing rows keep their values, and `completion_rule` reads `standard` until the backfill (PLAN-002 P4). It was applied to the local database on 2026-10-01 after `npm run backup`; production is still schema 5, and a release must apply 006 and 007 together with their code.

- **Restart after migrating**, as for schema 6.
- **Moving a Workboard task to Done** now needs an R and the standard completion rule; tasks already Done keep their state.
- **Rollback.** Code from before FEAT-010 ignores the new columns and tables; plan it together with FEAT-011's rollback note above.

## Identity-code login (0.4.2)

Members enter their existing personal code in the single masked field **รหัสระบุตัวตน**; no PID input is needed. PID remains on Member records and in operator reset commands. An ambiguous code is denied even if another matching credential is disabled; only an explicitly authorized operator reset can resolve it. No code rotation or migration is needed for this release. Login evaluates all credentials within the Business (currently four scrypt checks); rate limits remain enabled.
