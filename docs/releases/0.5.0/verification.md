# Zuri-Go 0.5.0 — visibility, Task Manager and server-side meeting commit

Released 2026-10-01 (Bangkok) under the owner's authorization of PLAN-002 phase P5 ("อนุญาต P5 production"). C-3 / HIGH. Source: commit `7bb538c` (code, version 0.5.0) and `0ea5b0a` (documentation) on `main`. Plan and rehearsal: [release-plan.md](release-plan.md).

## Version diff: 0.4.2 → 0.5.0

| Before | After |
|---|---|
| Guests read the whole workspace | Every read resolves a viewer; Guests read public items only, and row-level security enforces it (FEAT-011) |
| No teams, no named viewers, no confidential meetings | Teams, a Business-admin flag, visibility levels, task viewers, meeting participants, transcripts kept on the recording machine for restricted meetings (FEAT-011 P1, P3) |
| One task list, the campaign Workboard as a separate list | Task Manager for every department: projects, contexts, boards, one task record behind the Workboard (FEAT-010 P2) |
| The browser committed meeting tasks | `POST /businesses/{b}/meeting-commits` commits on the server with the meeting's audience; `PUT /workspace` refuses receipts the server did not write (WI-09) |
| PostgreSQL schema 5 | Schema 7 (`006_visibility.sql`, `007_tasks_projects.sql`), additive |

## Sequence (times Bangkok, 2026-10-01)

| Time | Step | Result |
|---|---|---|
| before 04:55 | `npm run build`, `npm test` on the release commit | Build passed (55 packaged files, HTML SHA-256 `aa2f233b…75dd`); 160 Node tests, 5 Python tests, metrics and extraction checks passed |
| 04:54 | Read-only production checks | Schema 5; 0 meetings, so WI-09 ships in one release (SDD-004 amendment Decision 8); Workboard backfill dry run: 0 Workboard tasks; the admin connection owns `members` |
| 04:55 | Production backup | `pg_dump` 18.6 against PostgreSQL 18.6 with full certificate verification, `--no-owner --no-privileges`; 661,955 bytes, 29 COPY sections, dump complete. Kept privately under `.local/backups/` (file `cloud-pre-0.5.0-…`). Restore drilled afterwards, see [restore-drill.md](restore-drill.md) |
| 04:56 | Staged deployment | `vercel deploy --prod --skip-domain`; deployment `dpl_BWZ6s6Uqd8oZnuqdAuX5VV7Qo14v`, unique URL `https://zuri-metrics-2e2jj6pi4-pornpons-projects.vercel.app`; the public domain did not move |
| 04:57 | Production migration | `apps/api/migrate.mjs` with the production admin connection for that process only: 006 and 007 and the grants in 1.2 s; schema 7 |
| 04:59 | Hosted checks on the unique deployment | Passed (see below, [stage.json](stage.json)) |
| 05:00 | Promotion | `vercel promote` to `https://zuri-metrics-map.vercel.app/` |
| 05:00 | Hosted checks on the public URL, production counts, backfill dry run | Passed ([production.json](production.json), [database-preservation.json](database-preservation.json)) |

Between the migration and the promotion (about two and a half minutes) the public site ran 0.4.2 code on schema 7, which reads as a Guest and shows no business work. No write was made in that window by this release.

## Database

- Every table that existed before holds the same number of rows after the migration and after the release (tasks 12, task_roles 67, weekly_plan_tasks 11, task_attachments 2, change_events 109, members 4, member_credentials 4, campaigns 1, content_items 13; the full list is in [database-preservation.json](database-preservation.json)).
- Defaults as designed: all 12 tasks `visibility = business` and `completion_rule = standard`; no meeting existed; the seven new tables are empty; no Business admin yet.
- Workboard backfill dry run on schema 7: 0 Workboard tasks, nothing to write (FR-010-016, PLAN-002 Q12).
- No reset, reimport, credential change or code rotation.
- **Business admin (after the release, 2026-10-01):** the owner named ZGO-P0002 (PLAN-002 Q3); `npm run members -- --admin ZGO-P0002 --cloud` set the flag, and one `admin_granted` audit event records it. No credential was issued or changed; the other three Members are not admins.

## Hosted checks

Run by the operator script `.local/verify-0.5.0.mjs` (private), on the unique deployment through authenticated Vercel access, then on the public URL. Both passed:

- `/session`: Guest, not authenticated.
- Guest `/workspace`, `/state` and `/tasks`: 0 tasks, 0 task roles, 0 week entries, 0 meetings, 0 receipts, 0 history events, although the Business holds 12 tasks (AC-011-007-01, AC-011-012-01). Guests still read the 4 Member profiles and the 1 campaign, as PLAN-002 Q1 defers those levels.
- `/overview` names no task.
- Guest writes answer 401: create task, create project, meeting commit, whole-workspace save, create team. A cross-origin write answers 403.
- The served `index.html` equals the build (SHA-256 `aa2f233b01f4726958ff5068808d861ec70fec66812e2ae734d9d5013f1e75dd`); the `meeting-commits`, `tasks` and `projects` routes answer, so their modules are in the package.

## Not run

- **Member, restricted-meeting participant and Business-admin checks.** They need a real Member's code; the agent does not sign in with real credentials. The owner runs them: sign in, check that all 12 tasks with RACI, weekly MoSCoW and the 2 attachments are present, create a task and a project, and open a restricted meeting with two participants (release plan, “Hosted checks per viewer kind”).
- **Browser visual and interaction checks** on production: not run.
- **Restore of the backup:** not exercised at release; a restore drill into a throw-away PostgreSQL 18 container on 2026-10-01 matched every table count ([restore-drill.md](restore-drill.md)).

## Rollback

There is no down-migration. Promoting the previous deployment (`dpl_5RcxZp63VibqbopFvSRboNmZhMaQ`, 0.4.2) would not restore 0.4.2: that code sets no viewer, so every request would read as a Guest and see no business work. The fallback chosen for this release is to fix forward on schema 7; restoring the backup would discard later writes and needs its own authorization.

## Known limitations

- History events written by a meeting commit keep the task snapshot, quotes included; the API withholds the quotes from readers who cannot read the meeting, but a direct database query by such a reader's role would find them (recorded in the SDD-004 amendment, “Changes found while building WI-09”).
- A restricted meeting with an inactive participant cannot commit tasks (422) until that participant is removed or reactivated.
