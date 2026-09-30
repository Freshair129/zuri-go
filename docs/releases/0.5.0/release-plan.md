---
title: Zuri-Go 0.5.0 release plan
status: proposed
version: 0.5.0
date: 2026-10-01
relations:
  relates_to: [PLAN-002, FEAT-010, FEAT-011, FEAT-004, ADR-002, ADR-003, ADR-004, SDD-010, SDD-011, SDD-004, ARCH-002, ARCH-003, RB-001]
---

# Zuri-Go 0.5.0 — release plan (PLAN-002 phase P5, preparation only)

**Nothing is released, migrated or deployed by this document.** Production is still application 0.4.2 on PostgreSQL schema 5. The owner has authorized neither the production migration nor the deployment; each step that needs an authorization is listed in [Authorizations](#authorizations-the-owner-gives-separately) and waits for it. This plan records the rehearsal that was run on a scratch database, the scope, the ordered runbook and the rollback assessment, so that the owner can decide with the facts in hand.

Phase P5 of [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md) is C-2 / HIGH. Active source: `D:/workspace/zuri-go`. Baseline when this was written: commit `ddce3af` plus uncommitted documentation and the WI-09 work in progress.

## Scope of 0.5.0

| Item | Requirements and design | State at this plan |
|---|---|---|
| Visibility, teams, Business admin, viewer-aware reads, row-level security (FEAT-011 P1) | [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md), [SDD-011](../../features/FEAT-011-visibility-and-confidential-meetings/design.md), migration [`006_visibility.sql`](../../../apps/api/migrations/006_visibility.sql) | Built locally, schema 6 on the local database; approved 2026-10-01; not in production |
| Confidential meetings and transcript custody (FEAT-011 P3, FR-011-009 and FR-011-010) | FR-011-009, FR-011-010; upload route `POST /businesses/:b/meetings/:id/transcript` | Built locally; the meeting commit still runs in the client |
| Task Manager for every department (FEAT-010 P2) | [FEAT-010](../../features/FEAT-010-task-manager/feature.md), [SDD-010](../../features/FEAT-010-task-manager/design.md), migration [`007_tasks_projects.sql`](../../../apps/api/migrations/007_tasks_projects.sql) | Built locally, schema 7 on the local database; approved 2026-10-01; not in production |
| Workboard backfill tool (FEAT-010 P4, FR-010-016) | [`apps/api/backfill-workboard.mjs`](../../../apps/api/backfill-workboard.mjs) | Built and dry-run locally and against production on 2026-10-01 (0 Workboard tasks); not run for real, not needed while the count is 0 (PLAN-002 Q12) |
| Server-side meeting commit (WI-09) | Amendment of [SDD-004](../../features/FEAT-004-meeting-task-manager/design.md) “server-side meeting commit”, approved 2026-10-01 with Decisions 1-8 | **Build evidence pending.** It is being built in parallel; this plan describes it from the approved amendment only. It adds the `meeting-commits` route and `meeting-commit.mjs` to the package list, and moves the commit off the client. Its tests and verification are not recorded here |

The release also carries the documentation and registry changes of PLAN-002 and the version bump listed under [After the release](#after-the-release). It carries no change to metrics, the guide or the graph.

Schema effect: production goes from schema 5 to schema 7. Migrations 006 and 007 are additive: no `DROP`, `TRUNCATE`, row `DELETE` or `UPDATE` of existing rows, and no type change (NFR-010-002). Existing tasks become `business`, existing meetings become `business` with `transcript_custody = 'cloud'`, and existing tasks read `completion_rule = 'standard'` (FR-011-012, FR-010-007).

## Rehearsal evidence

Run on 2026-09-30T21:35Z (2026-10-01 in Bangkok) by the preparation track, before any production step.

**Method.**
- A new database `zuri_go_rehearsal_p5` was created inside the local container `zuri-go-postgres` with the container's superuser, and was the only database touched. The cluster-wide role `zuri_go_app` already existed and was not altered. No role was created, altered or dropped.
- Migrations 001-005 were applied with the same logic as [`apps/api/migrate.mjs`](../../../apps/api/migrate.mjs) (strip `BEGIN`/`COMMIT`, one transaction per file, a row in `public.zuri_go_migrations`), followed by the grants of the 0.4.2 version of that script (commit `f4820e1`, schema 5).
- A synthetic schema-5 Business was seeded, shaped like the recorded production counts in [`../0.4.2/database-preservation.json`](../0.4.2/database-preservation.json): 4 Members with 4 placeholder credentials, 12 tasks (7 `manual`, 5 `weekly-plan`), 67 `task_roles`, 1 weekly plan with 11 entries, 2 attachments, 1 campaign with its `campaign_states`, 13 content items, 78 `change_events`, 1 meeting with 1 revision, 1 draft batch and 1 task link, and 16 migration keys. Every value is synthetic; no real data was copied and no credential was used as a seed.
- Migrations 006 and 007 were then applied one transaction each, followed by the grants of the current `migrate.mjs` (`GRANT`/`REVOKE` lines unchanged). The repository's own `node apps/api/migrate.mjs` and `node apps/api/backfill-workboard.mjs` were then run against the scratch database only (the connection was passed through the process environment and never printed).
- The scratch database was dropped. Helper scripts lived outside the repository.

**Timing** (local Docker, tiny dataset; milliseconds per transaction):

| Migration | ms |
|---|---|
| 001_core | 60 |
| 002_compatibility | 6 |
| 003_team_access | 6 |
| 004_task_attachments | 6 |
| 005_member_identity | 7 |
| 006_visibility | 16 |
| 007_tasks_projects | 14 |
| 006 + 007 + all grants and revokes | 48 |

Re-running the real `migrate.mjs` on the migrated scratch database took 94 ms and changed nothing (versions 1-7 before and after). These times do not predict Neon, where network round trips dominate; 006 and 007 are one statement batch each, so the expected time is seconds, but that was not measured.

**Reconciliation** (schema 5 before, schema 7 after; every pre-existing table):

| Table | Before | After | | Table | Before | After |
|---|---|---|---|---|---|---|
| businesses | 1 | 1 | | meeting_task_links | 1 | 1 |
| members | 4 | 4 | | meetings | 1 | 1 |
| member_credentials | 4 | 4 | | metric_definitions | 5 | 5 |
| tasks | 12 | 12 | | metric_observations, metric_series | 0 | 0 |
| task_roles | 67 | 67 | | migration_batches | 1 | 1 |
| weekly_plans | 1 | 1 | | migration_keys | 16 | 16 |
| weekly_plan_tasks | 11 | 11 | | campaigns | 1 | 1 |
| task_attachments | 2 | 2 | | campaign_states | 1 | 1 |
| change_events | 78 | 78 | | content_items | 13 | 13 |
| meeting_revisions | 1 | 1 | | publications, goals, goal_series, channel_accounts, campaign_channels, ai_briefs, team_login_limits | 0 | 0 |
| meeting_draft_batches | 1 | 1 | | | | |

- No count differs. A per-table digest over the schema-5 column list (including `updated_at` and `row_version`) is identical before and after for all 28 tables, so no existing row changed, and the `stamp` triggers did not fire.
- Documented defaults: 12 of 12 tasks `visibility = 'business'` with no team, project, owner label or idempotency key, and `completion_rule = 'standard'`; 1 of 1 meeting `visibility = 'business'`, `transcript_custody = 'cloud'`, no team; 4 of 4 Members `is_business_admin = false`; `businesses.next_project_no = 1`.
- The seven new tables (`teams`, `team_members`, `task_viewers`, `meeting_participants`, `projects`, `project_viewers`, `campaign_task_details`) hold 0 rows. The schema has 35 tables; 34 of them (all but `metric_definitions`) have row-level security enabled and forced, and there are 58 policies.
- Read through the runtime role `zuri_go_app` with the viewer settings of each kind (rolled back afterwards): a **Guest** reads 0 tasks, 0 task roles, 0 weekly entries, 0 attachments, 0 meetings, revisions, batches and links, and 0 change events; a **Member** reads all 12 tasks, 67 roles, 11 weekly entries, 2 attachments, the meeting with its revision, batch and link, and 78 events; the **operator** reads the same as a Member. This shows the migration produces the intended audience on existing rows (FR-011-012). It does not exercise `team` or `restricted` items; those are covered by `apps/api/test/visibility-db.test.mjs` locally and by the hosted checks below.
- **Observed, to confirm with the owner:** a Guest still reads `campaigns` (1) and `members` (4) after the migration. PLAN-002 Q1 says the same visibility levels apply later to campaign records and Member profiles, so this is expected for 0.5.0, but it means Guests still see Member names and campaign records.

**Workboard backfill dry run** on the scratch database (schema 7): 0 Workboard tasks, 0 campaigns, 0 to write, 0 anomalies, and the counts before (tasks 12, task_roles 67, weekly_plan_tasks 11, task_attachments 2, change_events 78, campaign_states 1, members 4) are unchanged. It wrote a private report under `.local/backfill/`, which was removed because it described the scratch database. The synthetic data has no `campaign-legacy` tasks because production has none; the backfill logic itself was rehearsed with fixtures in WI-10.

**Isolation of the real databases.** The local `zuri_go` database was not migrated or written: before and after the rehearsal its `public.zuri_go_migrations` held versions 1, 2, 3, 4, 5, 6, 7 (version 7), it had 35 tables, and a fingerprint of the row count of every table was identical (`14b1696634b677155c6774246d4b12cf`, 19851 rows in total). Production (Neon) was not contacted. `zuri_go_rehearsal_p5` is gone: the cluster lists `postgres`, `template0`, `template1` and `zuri_go`.

**What the rehearsal does not cover.**
- Neon differs from the local container: PostgreSQL 18 in production against 17.11 locally (a matching-major `pg_dump` is needed, see the 0.4.0 record in [`../../history/zuri-go-member-review/verification.md`](../../history/zuri-go-member-review/verification.md)), and production roles, connection limits and pooling. Migrations 006 and 007 use no feature newer than those 001 already uses, but that is a reading of the files, not a run on Neon.
- Migration ran as a superuser, which bypasses row-level security. The grants and policies were checked by reading as `zuri_go_app`, but production's owner and runtime roles were not reproduced. The trigger that guards `is_business_admin` compares the current user with the owner of `members`, so the admin URL used for the production migration must be that owner.
- The data is synthetic and tiny. Production's counts must be taken again before migrating (see the read-only checks).

## Authorizations the owner gives separately

AGENTS.md: a build, push or deployment implies none of these, and each step that changes the schema or production data is its own authorization. Each one is named here so that "yes" can be given to exactly one at a time.

| # | Authorization | What it allows | Not included |
|---|---|---|---|
| A1 | Production backup | A full `pg_dump` of the production database to `.local/backups/`, with a matching-major client | A restore, or any write to production |
| A2 | Production migration 006 and 007 | Applying both migrations together to production with the operator script, after A1 | Deployment, promotion, the backfill run, credential changes |
| A3 | Business-admin grant | `npm run members -- --admin <PID> --cloud` for the Member the owner names (PLAN-002 Q3: the owner's own Member) | Any code reset, enable or disable |
| A4 | Staged deployment | `npm run deploy` to a production-target deployment that is not promoted (`--skip-domain`, step 5) | Promotion to the public domain |
| A5 | Hosted checks that write | Creating QA-named records in the production Business for the viewer-kind checks, archived afterwards (teams and tasks cannot be deleted by the runtime role) | Any real confidential content |
| A6 | Promotion | Moving the public production domain to the verified deployment | Rollback |
| A7 (only if needed) | Workboard backfill run | `backfill-workboard.mjs --cloud --run --production-authorized`, only if the pre-release dry run finds Workboard tasks (Q12) | |

**Decisions for the owner before A2.**
- **Maintenance window.** After migration and before promotion, the public site still runs the 0.4.2 code on schema 7. That code sets no viewer, so the database treats every request as a Guest and the workspace shows no business work, including to Members (RB-001; SDD-011 failure modes). What a 0.4.2 client does if someone saves in that window has not been tested. Plan the window as short, announce it, and do not write in it. Staging the deployment on the unique URL needs schema 7 already, so the window cannot be avoided without a second database, which would be a new resource for the owner to decide.
- **Which Member becomes Business admin** (A3).
- **Whether hosted checks may write QA records in production** (A5). Without A5, the Member, participant and admin checks that need new records are reported as not run.

## Pre-release read-only checks

All of these read and write nothing. Run them just before A1, with the counts recorded in the release record.

1. **Production counts.** Record the row count of every table for the Business (the set in [`../0.4.2/database-preservation.json`](../0.4.2/database-preservation.json)). The earlier records disagree — the 0.4.2 record has 12 tasks in production, while FR-011-012 and PLAN-002 Q5 say 11 — so reconcile against the count taken now, not against either.
2. **Production meetings, for the WI-09 staging decision.** Count meetings (Guests read the whole workspace on schema 5, so the `meetings` list of the Guest `/workspace` read is enough; or a `SELECT count(*)` through the operator connection). SDD-004 amendment Decision 8: with 0 meetings, one release; otherwise Release A (the endpoint and the new client), then Release B (the refusal of a client `PUT` on receipts) after old client bundles are gone.
3. **Workboard backfill dry run** (FR-010-016): `node apps/api/backfill-workboard.mjs --cloud`. It is read-only and writes its report to `.local/backfill/`. On 2026-10-01 it found 0 Workboard tasks in production; repeat it, and expect 0. A non-zero count needs A7 and a new decision (Q12).
4. **Business-admin flag.** Migration 006 adds the column, so `npm run members -- --admin <PID> --cloud` can run only after A2; before it, confirm with the owner which PID to use and that the production handover folder exists, without reading any code.
5. **Test and build state.** `npm test` (needs the local PostgreSQL and server on 4319) and `npm run build` pass on the commit to be released, with WI-09's tests included. Record the counts; none are recorded here.
6. **Private files.** `.local/`, `.env*` and generated builds stay ignored; the staged diff holds no secret (AGENTS.md).

## Release runbook

Order matters. Stop at the first failed step; nothing after it runs. Commands were checked against `package.json`, [RB-001](../../operations/RB-001-runbook.md), [ARCH-003](../../architecture/ARCH-003-hosted-deployment.md) and AGENTS.md; `scripts/run.mjs` implements `build`, `test` and `deploy`.

| Step | Action | Command or evidence | Needs |
|---|---|---|---|
| 0 | Release commit: bump the version (see [After the release](#after-the-release), first bullet), run the read-only checks, `git status` clean apart from the release | `npm run build`, `npm test` | |
| 1 | Local backup of the local database, as a habit before any schema work | `npm run backup` (local container only, writes `.local/backups/`; this is **not** a production backup) | |
| 2 | Production backup | `pg_dump` of the production database with a client of the same major version as the server (check the server version first; 18 at 0.4.0), `--no-owner --no-privileges` as in `apps/api/backup-local.mjs`, to `.local/backups/cloud-pre-0.5.0-<date>.sql`, using the private connection in `.local/cloud-config.json`; check the dump header and size; never print the connection string | A1 |
| 3 | Production migration | `npm run db:migrate` runs `apps/api/migrate.mjs`, which reads `ZURI_GO_ADMIN_URL` or `.local/config.json` (the **local** database) and has no `--cloud` option. For production the operator sets `ZURI_GO_ADMIN_URL` to the production admin connection for that one process, and first checks which host and database it names. It applies 006 then 007 in separate transactions and the grants, and prints `Zuri-Go schema 7 applied; runtime role grants configured.` Reconcile the counts of step 0 against the same counts now (AC-011-012-02), and read `max(version)` = 7 | A2 |
| 4 | Business admin | `npm run members -- --admin <PID> --cloud`; check the audit event `admin_granted` | A3 |
| 5 | Stage the deployment | `npm run deploy` runs `vercel@61.1.0 deploy --prod --yes --scope pornpons-projects --cwd ./build/vercel`. AGENTS.md asks for `--prod --skip-domain` so the public domain does not move; `scripts/run.mjs` does not pass `--skip-domain`, so confirm how that flag is applied **before** running, because `vercel deploy --prod` without `--skip-domain` moves the production domain to the new deployment at once. Record the deployment ID and unique URL | A4 |
| 6 | Verify the unique deployment | The hosted checks below, with authenticated Vercel access where the unique URL requires it; compare the served HTML and the package with the verified build as in [0.4.2](../0.4.2/verification.md); exercise a task route on the unique deployment (SDD-010 failure modes), and the meeting-commit route when WI-09 ships | |
| 7 | Promote | Promote the verified deployment to `https://zuri-metrics-map.vercel.app/` | A6 |
| 8 | Verify the public URL | Repeat the Guest and Member checks on the public URL, then read `max(version)`, counts and a Guest `/workspace` read once more | |
| 9 | Record | Write `docs/releases/0.5.0/verification.md` (and the stage and production JSON as in 0.4.2) with the checks run, the ones not run, the deployment ID, the URL and the HTML digest; keep secret-bearing payloads in `.local/` | |

Not part of this release unless separately authorized: rotating or resetting any code, running `--reset`, resetting or reimporting a Business, deleting a volume, running anything against production that is not listed above.

## Hosted checks per viewer kind

Each check cites its acceptance criterion. Guest and unauthenticated checks run first, on the unique deployment and again on the public URL. A check that writes needs A5 and uses QA-named records with synthetic text; none may hold real confidential content. Report each as passed, failed or not run. Browser visual checks use approved browser tools, or are reported as not run (AGENTS.md).

**Guest (no session)**
- `/session`, `/workspace`, `/state` and `/overview` return no task, meeting, transcript, task history or attachment metadata, although the Business holds 11 or 12 tasks (AC-011-007-01, AC-011-012-01). Campaign records and Member profiles are still readable (see the rehearsal observation).
- An attachment requested by its ID returns 404, the same as a missing one (AC-011-007-02).
- Every write is refused: create or change a task or project returns 401 `AUTH_REQUIRED` and nothing changes (AC-010-010-01, AC-010-001-04, AC-010-003-07); `PUT /workspace` and a team write are refused; a cross-origin write is refused.
- The UI shows a sign-in prompt, not an empty board (AC-011-007-03) — browser check.
- A `public` QA task is readable by a Guest (AC-011-007-04) — needs A5.

**Member (one of the four existing Members, by the code handed over privately; never print it)**
- Login by the single masked code; `/session` names the Member (FEAT-007). A body or query carrying `memberId`, `pid` or `actor` is ignored (AC-011-003-03, AC-010-010-02).
- All existing tasks are present with their RACI, per-week MoSCoW entries and attachments, and the counts equal the step-0 counts; every attachment resolves (AC-011-012-01, AC-011-012-02, AC-010-016-04).
- Create a task from a title: `planned`, next `TSK-nnnn`, `business`, no context (AC-010-001-01). Replay with the same idempotency key and body returns the same task; the same key with another body returns 409; a stale `row_version` returns 409; an unlisted field is refused (AC-010-009-02, -03, -04, -06).
- Server rules hold without the browser: a move to `blocked` with no blocker and a move to `done` without evidence return 422 (AC-010-010-03); a Workboard task already Done stays Done (AC-010-007-03).
- Create a project: next `PRJ-nnnn`, `active`, `business`; link a task to it; boards for the campaign, project, team, unlinked work and “my tasks” list exactly the readable tasks (AC-010-003-01, AC-010-005-01 to -06).
- A non-admin Member creating a team gets 403 (AC-011-001-02). A session that expires gives the Guest view on the next read (AC-011-007-05).
- The whole-workspace save of an unchanged client still keeps the new columns (AC-010-011-01).

**Participant of a restricted meeting** (a QA meeting with two participants, plus a Member who is not one)
- The non-participant does not see the meeting, title and date included; a participant does; removing a participant hides it again (AC-011-006-01, -02).
- A `team` meeting is visible to a Member of that team only (AC-011-006-03).
- A save from a non-operator viewer stores a `local_only` meeting as stubs (no transcript segments), the UI says the transcript stays on the recording machine, and upload needs a participant and a reason (AC-011-010-01 to -03). A meeting that is not restricted keeps `cloud` (AC-011-010-04). Use synthetic transcript text only.
- Tasks committed from the restricted meeting are `restricted` with the participants as viewers, and an R who was not at the meeting sees the task without the quotes (AC-011-009-01, -02, -03). Through WI-09 this is the server-side commit; until its build evidence exists, only the client-save path is checked and the WI-09 checks (replayed commit returns the same tasks, `update` onto a wider task returns 422 `AUDIENCE_WIDER`) are not run.
- Widening: the R is refused (403 `VISIBILITY_WIDEN_DENIED`); the A or the organizer succeeds with a reason (422 `REASON_REQUIRED` without one) and an audit event holds the old and new levels (AC-011-011-01, -02, -03).
- A task that is `restricted` and whose viewer was removed disappears from every view and from the API (AC-011-005-03).

**Business admin** (the Member named in A3)
- The admin creates a team and adds two Members; each change has an audit event naming the admin (AC-011-001-01, AC-011-002-04). A body that asks for admin rights is refused (AC-011-002-02).
- The admin, not being a participant, does not see the restricted meeting (AC-011-002-03), and sees no `restricted` task they are not named on (AC-011-004-04).

**Package and deployment**
- The package allowlist lists every new module (54 files at WI-07, plus `meeting-commit.mjs` when WI-09 ships); `build_cloud.py` refuses an unlisted file but does not detect a missing import, so the routes above are the evidence (SDD-010 failure modes).
- Logs on a failed request hold error codes and IDs, never titles or transcript text (AC-011-008-05).

## After the release

- Bump the version in `package.json` (0.4.2 to 0.5.0) **in step 0**, not after: `scripts/deploy/build_cloud.py` line 33 hard-codes `version='0.4.2'` for the deployed package, and the README heading says 0.4.2, so those change in the same release commit. The release commit is not written by this plan.
- Update the AGENTS.md baseline: application 0.5.0, PostgreSQL schema 7 in **production** and locally, the Visibility and Task Manager notes (Guests read public items only, production no longer under the interim rule of ADR-004 D9), and the documentation update record.
- Update [RB-001](../../operations/RB-001-runbook.md) (production migrated on the date, `db:migrate` production procedure, backfill dry run repeated after the migration), [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md), PLAN-002 (P5 done, the interim rule ended) and the delivery state of FEAT-010, FEAT-011 and the WI-09 amendment.
- Write `docs/releases/0.5.0/verification.md`: the checks actually run and those not run, the pre- and post-migration counts, the deployment ID and unique URL, the HTML digest, the rollback target deployment (the current 0.4.2 deployment), and the backup file name and size.
- Repeat the Workboard dry run against production on schema 7 (WI-10 note) and record it.

## Rollback assessment

- **There is no down-migration.** 006 and 007 are additive, and neither this plan nor the repository provides a reverse script.
- **Code rollback alone does not restore 0.4.2.** Old code sets no viewer. A missing viewer setting reads as a Guest and returns the fewest rows (SDD-011 failure modes, first row), and the rehearsal shows the result: a Guest read of the migrated data returned 0 tasks and 0 meetings. RB-001 says the same (“Code from before FEAT-011 on a schema-6 database reads as a Guest and shows no business work”). Promoting the previous deployment (the rollback target recorded in [0.4.2](../0.4.2/verification.md)) would therefore hide the workspace from every viewer, Members included. The old code also ignores the new columns, tables and policies, so nothing it saves carries a visibility other than the default. How an old client behaves when it saves in that state was not tested.
- **Content is re-exposed to Guests only when the schema goes back too.** SDD-011 states the exposure this way: “Old code ignores the new columns and shows everything to Guests again. A rollback therefore reopens the exposure and needs its own decision.” That holds for a rollback that also removes the policies, that is, a restore of the A1 backup into the database (or a later change that drops them). It does not hold for code alone; the two documents read differently on this point, and this plan follows the database behaviour rehearsed above. A restore discards every write made after the backup, was not exercised in any earlier release (the 0.4.0 record says so), and needs its own authorization.
- **Decision before A2:** choose the fallback. The options are to fix forward (a corrected 0.5.x on schema 7), or to restore the A1 backup and promote 0.4.2, accepting the loss of later writes and the return of Guest reads of the whole workspace (the interim rule of ADR-004 D9 then applies again). Deployment is not database rollback authorization; assess the current schema before any rollback (AGENTS.md).
- Attachments and Member credentials are untouched by 006 and 007, so a fix-forward needs no credential change.

## Open items

- WI-09 build evidence, test counts and the meeting-commit route are pending; the WI-09 checks above stay not run until they exist.
- The mechanism that applies `--skip-domain` is not in `scripts/run.mjs`; confirm it before step 5.
- `npm run db:migrate` has no `--cloud` option, unlike the members and backfill tools; the production procedure in step 3 relies on the operator setting the environment, so a wrong URL migrates the wrong database. A guard is a code change for the owner to decide, not part of this plan.
- The maintenance window and the fallback choice above need the owner's decision.
