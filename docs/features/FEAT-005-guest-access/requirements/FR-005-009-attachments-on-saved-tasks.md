---
id: FR-005-009
title: Files and images attach to a saved task only, beside the existing evidence text
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-005-010]
---

# FR-005-009 — Files and images attach to a saved task only, beside the existing evidence text

The system SHALL keep a task’s existing evidence text and URLs, SHALL accept attachments only on a saved task, and SHALL require a new task to be saved before it accepts a file, so that no orphan file and no implicit task creation exists.

## Acceptance criteria
- AC-005-009-01 — Given a task with evidence text or URLs, when a file is attached, then the text and URLs are unchanged.
- AC-005-009-02 — Given a task that is not saved yet, then the form offers no upload and says to save the task first (“บันทึกงานก่อน แล้วเปิดรายละเอียดงานเพื่อแนบไฟล์”).
- AC-005-009-03 — Given an upload for a task that does not exist, then the answer is 404 “ไม่พบงาน” and neither a task nor a file is created.

## Implementation
- `apps/web/src/content/meeting/TaskAttachments.jsx:TaskAttachments` — no `taskId` shows the message above; an upload fills the evidence link through `onEvidence` only when the task has none (`TaskForms.jsx`: `if(!draft.evidence)`), so existing text or a URL is never replaced.
- `apps/api/attachments.mjs:attachmentAction` — looks the task up first (by ID or legacy ID, not archived) and answers 404 before any insert.
- Evidence: the 0.3.1 record states that new tasks are saved before files and that an actual image and file round trip passed on production ([guest review](../../../history/zuri-go-guest-review/verification.md)). The upload-to-a-missing-task answer was read from the code; no committed test sends it.

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullet 1 (the first, second and third sentences), bullet 6.
- Provisional ownership: the attachments are DOM-TSK data and a candidate for their own feature ([FEAT-005 feature](../feature.md) “Notes”, PLAN-001 WI-14). If they move, these requirements are re-declared under the new feature with `supersedes` (STD-003 R7) and keep their text.
