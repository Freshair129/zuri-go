---
id: FR-005-004
title: A write intent opens the sign-in modal before the action starts
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FEAT-007, FR-007-001]
---

# FR-005-004 — A write intent opens the sign-in modal before the action starts

The system SHALL open the sign-in modal when a Guest starts a create, edit or delete action, before the editable action begins, and SHALL leave every stored value unchanged when the Guest cancels.

## Acceptance criteria
- AC-005-004-01 — Given a Guest, when they start a create, edit or delete action, a task status change or a file removal, then the sign-in modal opens and the editor does not.
- AC-005-004-02 — Given the open modal, when the Guest cancels (“ดูต่อใน Guest mode” or close), then the modal closes, no request is sent that changes data, and the read view is as before.

## Implementation
- `apps/web/src/content/business/TeamAccess.jsx:TeamAccess` — `requestWrite(action)` runs the action at once only when `canWrite`; otherwise it keeps the action in `pending` and opens the modal; `close` drops `pending`. The views call it through `setModal` and the action handlers (`BusinessWorkspace.jsx`, `DashboardContent.jsx`, `meeting/Boards.jsx`, `meeting/MeetingWorkspace.jsx`, `meeting/Meetings.jsx`).
- Evidence: 0.3.1 production browser, “create-campaign/status-change/edit-task/remove-file intents open the modal; cancellation retains read state” ([guest review](../../../history/zuri-go-guest-review/verification.md)); 0.5.1 production browser, “＋ เพิ่มงาน” opens the prompt and “ดูต่อใน Guest mode” closes it ([0.5.1 verification](../../../releases/0.5.1/verification.md)). The server stays the authority: a write that gets past the screen still answers 401 (FR-005-003). No committed test covers the modal.

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 4 (the first, second and third sentences), “Verification” item 3.
- What the modal asks for is [FR-007-001](../../FEAT-007-single-code-login/requirements/FR-007-001-one-masked-field.md).
