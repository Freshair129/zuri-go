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
