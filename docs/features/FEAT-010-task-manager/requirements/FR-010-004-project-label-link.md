---
id: FR-010-004
title: Linking a project label to a project
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-004 — Linking a project label to a project

The system SHALL keep showing a task’s `project_label` text until a person links the task to a project, and SHALL never convert a label into a project or a link automatically.

## Acceptance criteria
- AC-010-004-01 — Given a task with the label “X” and no project, then the label is shown as text and the task is on no project board.
- AC-010-004-02 — Given that task, when a signed-in Member picks a project for it, then the task is linked to the project, the project is shown in place of the label, and the stored label is unchanged.
- AC-010-004-03 — Given a project whose name equals some tasks’ labels, when the project is created, then no task is linked to it.

## Implementation
- Not built. `project_label` is stored on `tasks` (`apps/api/migrations/001_core.sql:95`), written from the task form’s “Project” field (`apps/web/src/content/meeting/TaskForms.jsx:51`) and mapped in `T_FIELDS` (`apps/api/workspace.mjs:12`).

## Notes
- The same rule — nothing is matched or converted automatically — is applied to owner text in FR-010-008 (precedent: `005_member_identity.sql:22`).
