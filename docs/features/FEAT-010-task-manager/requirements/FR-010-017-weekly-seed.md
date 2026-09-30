---
id: FR-010-017
title: Weekly seed of 28 September – 4 October 2026
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FEAT-004, FR-010-018, FR-010-020]
---

# FR-010-017 — Weekly seed of 28 September – 4 October 2026

The system SHALL provide the weekly seed `weekly-plan:2026-09-28:v1` — four Members and five tasks for the week 2026-09-28 to 2026-10-04 — that the browser workspace applies once when it is first opened, SHALL leave every value the user did not give empty or marked as proposed, and SHALL NOT add or overwrite anything when the seed is applied again.

## Acceptance criteria
- AC-010-017-01 — Given a workspace that has not applied the seed key, when the seed is applied, then it holds the Members Chef, Boss, Tong and K’jeab and five tasks, each with source kind `weekly-plan`, status `planned` and an entry in the week starting 2026-09-28: “เลือกแบบเว็บไซต์ MUJEEN” (R Chef), “Campaign marketing metrics” (R Boss), “Data pipeline & tracking” (R Tong), “สรุป / ตัด requirements จาก Canva” (R K’jeab) and “Marketing plan” (R Chef).
- AC-010-017-02 — Given the five seeded tasks, then A is empty and unconfirmed, the due date is empty, the description is empty, no task is linked to a campaign, the week’s MoSCoW entry is empty (FR-010-020), and the status is marked unconfirmed (`statusConfirmed` false).
- AC-010-017-03 — Given the seeded tasks, then their C and I names and their acceptance criteria are marked as proposals (`raciProposed`, `acceptanceProposed`), and the RACI view shows the C and I names with “(เสนอ)” (FR-010-018).
- AC-010-017-04 — Given a workspace that already holds the seed key, when the seed is applied again — the app is reopened, or the seed is imported again — then no Member, task or week entry is added, and a value the user filled in after the first seed (for example a description) is unchanged.

## Implementation
- `apps/web/src/content/meeting/model.mjs:seedWorkspace` applies the seed and records the key in `seedKeys`; the data is `apps/web/src/content/meeting/seed.json`; `apps/web/src/content/meeting/repository.mjs:openRepository` (`init`) applies it when the browser workspace opens.
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “seed repeats preserve 5 tasks, 4 members, names and user edits” (AC-010-017-01 count, AC-010-017-04) and “later details preserve ID, R, state and week; omitted differs from null”. AC-010-017-02 and -03 were checked on 2026-10-01 by running `seedWorkspace` on an empty workspace (5 tasks, 4 Members, one week entry each with no priority, A and due date empty, no campaign, `raciProposed` and `acceptanceProposed` true, `statusConfirmed` false) and have no test of their own.
- The PostgreSQL tests use the seed as a fixture (`apps/api/test/tasks-api.test.mjs`, `apps/api/test/database.test.mjs`, `apps/api/test/meeting-commit.test.mjs`, `apps/api/test/seed-ui.mjs`); they need a local PostgreSQL and were not re-run for this record. The pure model suite (36 tests) passed on 2026-10-01.
- In production since 0.5.0 (code commit `7bb538c`). Not run: Member checks and browser checks on production ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-02 (verification row PASS on the local browser workspace; the week’s rows are listed in the [weekly Kanban](../../FEAT-004-meeting-task-manager/weekly-kanban-2026-09-28.md) and in spec §3).
- Scope of delivery: only the browser workspace applies the seed when it opens. The PostgreSQL workspace never applies it: `apps/api/workspace.mjs` (`readLegacy`, `writeDomain`) only reads and stores `seedKeys` in `businesses.legacy_metadata`, and `openServerRepository` (`apps/web/src/content/business/api.mjs`) does not seed. Whether a PostgreSQL Business should ever be seeded with these rows is not decided here.
- The seed gives no A, no due date and no campaign, and does not read states from the earlier visualization as real task states (spec §3).
