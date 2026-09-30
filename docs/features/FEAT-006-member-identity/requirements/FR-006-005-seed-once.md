---
id: FR-006-005
title: The weekly seed adds its Members once and never overwrites
delivery: implemented
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-005 — The weekly seed adds its Members once and never overwrites

The system SHALL seed the weekly plan of 28 September – 4 October 2026 (4 Members and 5 tasks) at most once per workspace, and a repeated seed SHALL NOT add, duplicate or overwrite any Member or task, including anything changed after the first seed.

## Acceptance criteria
- AC-006-005-01 — Given an empty workspace, when the seed runs, then the workspace holds 4 Members and 5 tasks and records the seed key `weekly-plan:2026-09-28:v1`.
- AC-006-005-02 — Given a seeded workspace in which a task’s description was filled in and a seeded Member was renamed, when the seed runs again, then there are still 4 Members and 5 tasks, both changes are kept and no history event is added.
- AC-006-005-03 — Given a seeded workspace saved to PostgreSQL, then the seed key is stored with the Business and returned with it, so a later seed of the loaded state is still a no-op.

## Implementation
- `apps/web/src/content/meeting/model.mjs:seedWorkspace` — returns at once when `seedKeys` already holds the seed key; otherwise adds each Member once (by `seedMemberId`, through `saveMember`) and each task, then records the key. The data is `apps/web/src/content/meeting/seed.json` (`seedKey`, 4 `members`, 5 `tasks`).
- `apps/web/src/content/meeting/repository.mjs:openRepository` (`init`) — the only place the application calls it, for the browser workspace.
- `apps/api/workspace.mjs:writeDomain` and `readLegacy` — store and return `seedKeys` in the Business metadata.
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“seed repeats preserve 5 tasks, 4 members, names and user edits”); `apps/web/src/content/meeting/tests/repository.browser.mjs` (“seed initialization is idempotent across connections”, a manual browser harness that is not part of `npm test`). No committed test asserts AC-006-005-03 alone.
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests), and a throw-away script (not committed) confirmed a renamed seeded Member and an unchanged event count after a second seed. The browser harness and the PostgreSQL round trip were not run.

## Notes
- Origin: FEAT-004 MT-23 (seed 4 Members and 5 tasks, repeated seed adds and overwrites nothing). The content of the five seeded tasks (PIC, empty A and due date, proposed C and I) is MT-02 and belongs to the task requirements, not here.
- The PostgreSQL workspace (`apps/web/src/content/business/api.mjs:openServerRepository`) does not call the seed. A Business holds the seeded weekly plan only when a seeded state was saved or imported into it (the isolated QA helper `apps/api/test/seed-ui.mjs` does this). Whether the PostgreSQL workspace should seed a new Business is not decided in any document.
