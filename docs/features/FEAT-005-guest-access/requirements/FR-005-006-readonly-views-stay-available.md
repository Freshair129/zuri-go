---
id: FR-005-006
title: Navigation, filtering, metric details and read-only views need no sign-in
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: [ADR-004]
  relates_to: [FEAT-005, FR-011-007]
---

# FR-005-006 — Navigation, filtering, metric details and read-only views need no sign-in

The system SHALL keep navigation, filtering, metric details and the read-only views available to a Guest, with the edit fields disabled and an explicit sign-in action offered where a Guest could edit.

## Acceptance criteria
- AC-005-006-01 — Given a Guest, when they move between views, filter, or open a metric or a record they may read, then no sign-in is requested.
- AC-005-006-02 — Given a Guest who opens a task or a Member they may read, then the fields are read-only and a sign-in action (“แก้ไข”, “เขียน Review”) is offered.

## Implementation
- `apps/web/src/content/meeting/Boards.jsx` (the “Guest mode · รายละเอียดงานอ่านอย่างเดียว” note and its sign-in button), `apps/web/src/content/dashboard/DashboardContent.jsx` (`<fieldset className="mt-access-fields" disabled={!canWrite}>`), `apps/web/src/content/meeting/TaskForms.jsx` (the Member form).
- Evidence: the 0.3.1 record states that task and Member details open readable with disabled edit fields and an explicit sign-in action, and that navigation and read views worked after logout, reload and fresh navigation ([guest review](../../../history/zuri-go-guest-review/verification.md)); the 0.5.1 production check as a Guest saw a Member card open read-only ([0.5.1 verification](../../../releases/0.5.1/verification.md)). No committed test covers the screens.

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 4 (the last sentence: “Navigation, filtering, metric details and read-only views remain available without login”) and “Evidence attachments” bullet 3 (a Guest may “view task details”). The disabled edit fields and the explicit sign-in action of AC-005-006-02 come from the 0.3.1 release record, not from a spec sentence.
- What a Guest can open is limited by [FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md); a Guest on the Task Manager gets a sign-in prompt, not an empty board.
