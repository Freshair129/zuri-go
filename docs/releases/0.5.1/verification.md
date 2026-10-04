# Zuri-Go 0.5.1 — Member registry rules and Guest privacy

Released 2026-10-01 (Bangkok) at the owner's request (“commit แยก 2 ชุดแล้ว push แล้ว deploy”). C-2 / HIGH. Source: commit `2197186` on `main`. No database migration: production stays on PostgreSQL schema 7. Decisions: [PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md) D2–D16.

## Version diff: 0.5.0 → 0.5.1

| Before | After |
|---|---|
| Guests read every Member field, contact details and notes included | Guests read a Member's ID, PID, display name and status only (D16) |
| Any Member could add Members and change anyone's record or status | Adding a Member and changing a status need the Business admin or the operator; a Member edits only their own details, never their own status (D3) |
| The API accepted an Inactive Member in a new role; an Inactive participant blocked a restricted meeting's commit | A new R, A, C or I may not be Inactive, existing roles are kept, and viewers and participants may be Inactive (D2) |
| New task history events kept evidence quotes | New events keep no quote held in `meeting_task_links` (D14); an unchanged weekly priority writes no event (D12) |
| A meeting commit needed a connected FUNG | With a server workspace it runs without FUNG; the server checks the stored hashes (D4); stale screen text corrected (D6) |

Root-cause records: `.brain/rca/zuri-go-guest-reads-member-contact-details.md`, `zuri-go-inactive-participant-blocks-restricted-commit.md`, `zuri-go-history-events-store-evidence-quotes.md`.

## Checks

- Local, on the release commit: `npm run build` passed (55 packaged files, HTML SHA-256 `6501e6af…6574`); `npm test` passed — 169 Node tests, 5 Python tests, metrics and extraction checks. The new tests cover each decision for Guest, Member, Business admin and operator.
- Before the release, production 0.5.0 answered a Guest `/state` with every Member column, `email`, `phone`, `notes` and `legacy_metadata` included (keys recorded, values not read).
- Staged deployment `dpl_x33mhdiZRPynAd5ZrA1dMHrscC25` (`https://zuri-metrics-ayrl2ksht-pornpons-projects.vercel.app`, `--prod --skip-domain`), then promoted to `https://zuri-metrics-map.vercel.app/`. On both ([stage.json](stage.json), [production.json](production.json)):
  - a Guest's Members carry only `id`, `pid`, `displayName`/`display_name` and `status` on `/workspace` and `/state`;
  - Guests still read 0 tasks and 0 meetings; every Guest write answers 401 and a cross-origin write 403;
  - the served HTML equals the build.
- Production database after the release: schema 7; every table count equal to the 0.5.0 record except one more `change_events` row, the `admin_granted` event of ZGO-P0002 made after 0.5.0.

## Browser checks (after the release, 2026-10-01)

Claude Browser pane; read-only, nothing saved.

- **Production, Guest (desktop):**
  - The overview loads with “Guest mode”, and the menu reads “Task Manager” and “Meetings”. No console error.
  - Task Manager shows the note that Guests see public items only, with a sign-in button (AC-011-007-03). The Boards lanes are empty.
  - “＋ เพิ่มงาน” opens the sign-in prompt (single masked field “รหัสระบุตัวตน”), and “ดูต่อใน Guest mode” closes it.
  - Projects is empty.
  - Members:
    - 4 cards with display name, PID and status, and no “ลงทะเบียน Member” button.
    - The footer reads “บันทึกรายชื่อใน PostgreSQL ของทีม” (D6).
    - A Member card opens read-only, with the status field disabled (“เฉพาะ Business admin เปลี่ยนสถานะได้”).
  - Meetings shows “ยังไม่เชื่อม FUNG”.
- **Production, Guest (375 px):** no horizontal page scroll (scrollWidth equals clientWidth).
- **Local server, operator:**
  - Boards shows the 11 local tasks in five lanes, with the context filters.
  - Projects is empty, with “＋ เพิ่มโปรเจกต์”.
  - Members shows “＋ ลงทะเบียน Member” and “บันทึกรายชื่อใน PostgreSQL ในเครื่อง”.
  - The campaign Workboard counts five lanes (“Planned · Backlog + Ready”, Doing, Blocked, Review, Done).
  - No console error.

Findings, fixed in the source the same day (the fix is not deployed; production still serves 0.5.1 as recorded above):
- At 375 px the Task Manager sub-tabs are cut to “B…”, “Pr…”, “Wee…” and similar. The view switcher now wraps onto two rows at 650 px and below; checked on the local build at 375 px, where no label is cut.
- A Guest's Member card says “รายละเอียดติดต่อยังว่าง” (no contact details), although the details are withheld from Guests rather than empty. Now a Guest's card says “ทีม ตำแหน่ง และข้อมูลติดต่อแสดงหลังเข้าสู่ระบบ” and “ซ่อนจาก Guest”.

## Not run

- Member, Business-admin and restricted-meeting checks on the hosted site (they need a real Member code): a non-admin Member being refused when adding a Member, the admin adding one, a Member editing their own details, a commit without FUNG.
- Browser checks that write or need a session: drag and drop, the task and project editors' saves, a Member session, a restricted meeting, the meeting commit screen (no meeting exists locally or in production).

## Rollback

Code only: promoting the 0.5.0 deployment (`dpl_BWZ6s6Uqd8oZnuqdAuX5VV7Qo14v`) restores the previous behavior on the same schema, including the Guest read of Member contact details.

## Follow-up deployment: Guest Member cards and phone tabs (2026-10-01)

Deployed at the owner's request (“deploy”) from commit `ae72a77`, still application 0.5.1 with no migration: the two browser findings above.

- Local: `npm run build` and `npm test` passed (169 Node tests, 5 Python tests, metrics and extraction checks) before the commit.
- Staged deployment `dpl_59cfbogB4DijtVovhQkVW1SyTFtC` (`https://zuri-metrics-c8x0nklnc-pornpons-projects.vercel.app`, `--prod --skip-domain`), then promoted to `https://zuri-metrics-map.vercel.app/`. The same Guest checks passed on both ([stage-ui.json](stage-ui.json), [production-ui.json](production-ui.json)): Member fields limited to ID, PID, display name and status; 0 tasks and meetings; Guest writes 401, cross-origin 403; served HTML equals the build (SHA-256 `49f39604…f08d`).
- Browser, production at 375 px as a Guest: the Task Manager view switcher wraps with no label cut and no horizontal scroll; the four Member cards say “ซ่อนจาก Guest” and none says “รายละเอียดติดต่อยังว่าง”; no console error.
- Rollback: promote `dpl_x33mhdiZRPynAd5ZrA1dMHrscC25` (the first 0.5.1 deployment).

## Owner's hosted checks (2026-10-01)

After the 0.5.1 follow-up deployment the owner signed in on production as a Member and as the Business admin and reported that the checks passed (“ตรวจแล้วผ่าน”). The agent did not observe these checks and holds no record of their individual results; the checks named under “Not run” above are therefore owner-reported as passed, not agent-verified.

## Follow-up production rollout: Visual Studio and schema 10 (2026-10-04)

This owner-authorized production rollout deployed the already-merged FEAT-014 code on the existing application package version 0.5.1. `package.json` remains 0.5.1; no additional source edits or package-version bump were made for the rollout.

| Artifact | Before | After |
|---|---|---|
| Application package | 0.5.1 | 0.5.1 (unchanged) |
| Production PostgreSQL schema | 7 | 10 (migrations 008–010) |
| Public deployment | `dpl_59cfbogB4DijtVovhQkVW1SyTFtC` | `dpl_8NfE1kXSQQL3tMNJ3Jn8LMbezMXi` |
| Served `index.html` SHA-256 | `49f39604…f08d` | `42adec47cef9f425ae11ed170edd7490a2c7174354410ffd26d423707385be51` |

### Build, tests, and backup

- The deployment was built from worktree `c833915`. The packaged application sources under `apps/web/`, `apps/api/` and `scripts/` matched `origin/main` at `3a45813`; the branch differed only in three FEAT-013 documentation files, which were not packaged. `npm run build` passed and produced 61 deploy files; `.local/` was excluded.
- `npm test` passed against the isolated local QA database at schema 10. Documentation validation reported 0 errors and 166 existing warnings; the generated-view check found 11 views and 0 drift.
- Before migration, production was schema 7 on PostgreSQL 18; there was one Business, 0 meetings and 0 Workboard tasks to backfill. The full SQL backup used `pg_dump` 18 with TLS 1.3, `verify-full`, and `--no-owner --no-privileges`. It is kept privately under `.local/backups/`: 696,141 bytes, SHA-256 `86b3bde5d0c967f883428779295093dc558f7d36b31479fdf831bb948b2d300d`, with the completion trailer and all 36 expected COPY sections. A restore drill of this backup was not run.

### Migration and deployment

- `npm run db:migrate -- --cloud` applied migrations 008–010. The production ledger now contains versions 1–10. Counts for every table that existed before migration match the private pre-migration manifest; all 12 new Visual tables are empty. The post-migration Workboard dry run found 0 items to write.
- Forced RLS was verified on the Visual review/projection tables. The runtime role cannot update the public-output table or its payload, cannot insert reviews/decisions/public outputs, and can update only the `active` column used for controlled retraction.
- Staged deployment `dpl_8NfE1kXSQQL3tMNJ3Jn8LMbezMXi` reached `READY` at `https://zuri-metrics-9bin0c7rm-pornpons-projects.vercel.app`. Its served HTML was 8,266,005 bytes and matched the build SHA-256 above exactly. It was then promoted to `https://zuri-metrics-map.vercel.app/`; Vercel inspection confirmed that the public alias resolves to the same deployment ID.

### Hosted checks and limits

- On both the staged URL and the public URL, Guest `/session` reported unauthenticated; `/workspace`, `/state` and `/overview` returned 200; Guest `/tasks` returned 0 tasks. Visual team/projects reads returned 200 with 8 registry agents, 0 projects and 0 public outputs. A cross-origin Visual project POST was rejected with 403 by the origin guard and made no write.
- The public Visual Studio page loaded in Guest mode and showed no approved public output; Variants remained disabled. This was a read-only browser check.
- The release checks did not sign in with a real Member or Business-admin code, create a production project, or test interactive saves/mobile layout. At rollout time, the Vercel CLI write probe was blocked by the cross-origin guard, so the same-origin Guest 401 was initially not observed. The production recheck below later observed HTTP 401; the full local test suite also passed the Guest mutation gates.
- No restore drill was run for this new backup. There is no down-migration; use the rollback guidance in [RB-001](../../operations/RB-001-runbook.md) and assess schema compatibility before any code rollback or backup restore.

## Production acceptance recheck — 2026-10-04

Read-only checks were repeated against the public production origin `https://zuri-metrics-map.vercel.app/`:

- `GET /api/index?route=session` reported `authenticated: false`.
- Visual team read returned 8 registered agents; Visual projects and public outputs both returned 0.
- A same-origin Guest `POST` to the Visual project endpoint returned HTTP 401. The request had no Member cookie and created no production record.
- The Visual Studio page loaded in Guest mode, showed no approved public output, and kept Variants disabled.

Still not accepted on production: Member/Admin browser sessions, a real project save, and the narrow-screen layout. No test project was created in the sole production Business. The backup restore drill remains not run. The release record therefore distinguishes live Guest checks from Member/Admin and write-flow acceptance.
