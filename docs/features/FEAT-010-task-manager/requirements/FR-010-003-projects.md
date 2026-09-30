---
id: FR-010-003
title: Projects
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
  relates_to: [FR-011-004, FR-011-011]
---

# FR-010-003 — Projects

The system SHALL let a signed-in Member create, change and archive projects that gather work outside a campaign, each with a `PRJ-nnnn` code, a name, a description, a status (`active`, `on_hold`, `done` or `archived`), an owner Member, a team and dates, and SHALL show each project’s tasks and how many are in each status.

## Acceptance criteria
- AC-010-003-01 — Given a signed-in Member, when they save a project with only a name, then it is created with the next `PRJ-nnnn` code of the Business, status `active` and visibility `business` (FR-011-004).
- AC-010-003-02 — Given a project, when its status is set to any value other than the four above, then the save is refused.
- AC-010-003-03 — Given planned dates, when the end is before the start, then the save is refused.
- AC-010-003-04 — Given a project with tasks, when it is archived, then its tasks stay, keep their link to it and stay readable by their own audience.
- AC-010-003-05 — Given a project, when its page is opened, then it lists the tasks the viewer may read and the number of them in each of the five statuses.
- AC-010-003-06 — Given a project code that was used once, when any later project is created, then the code is not reused.
- AC-010-003-07 — Given a Guest, when they try to create or change a project, then it is refused with 401.

## Implementation
- Not built: there is no `projects` table. The `project_label` text on a task (`apps/api/migrations/001_core.sql:95`) is the only trace of a project today (FR-010-004).
- Codes follow the existing counters: `allocate` (`apps/api/service.mjs:32`) gains `projects`.
- Visibility and widening of a project are FR-011-004 and FR-011-011, which already name projects; this file does not restate them.

## Notes
- **Open — progress.** ADR-003 D3 lists “progress” among a project’s fields but no approved document says how it is computed. This requirement shows counts per status (AC-010-003-05) and leaves any percentage to the owner (SDD-010 Open items).
- **Open — who is named on a restricted project.** FR-011-004 lets “the people named on it” read a `team` or `restricted` item, but FR-011-005 names people on tasks only. Until the owner decides, the `projects` audience policy cannot be written (SDD-010 Open items).
- Creating a project from a name alone follows the rule of FR-010-001 by analogy; the owner may require an owner Member at creation.
