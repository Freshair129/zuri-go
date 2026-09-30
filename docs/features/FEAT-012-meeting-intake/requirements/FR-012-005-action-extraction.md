---
id: FR-012-005
title: Action drafts from a reviewed revision
delivery: building
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
  relates_to: [FR-011-010]
---

# FR-012-005 — Action drafts from a reviewed revision

The system SHALL ask FUNG’s configured local model for draft actions only from a saved reviewed revision of one selected meeting, SHALL refuse a reply that is invalid or that answers another revision, and SHALL — when the model is not available — say why and let the user create a task by hand from selected text, labelled Manual.

## Acceptance criteria
- AC-012-005-01 — Given a FUNG whose capabilities report no action-draft route or report it unavailable, then “สร้างร่างงานด้วย FUNG” is disabled with the note “โมเดล local / adapter ยังไม่พร้อม หรือมีต้นฉบับใหม่ …”, no other model or cloud service is used and no draft is made up.
- AC-012-005-02 — Given a saved reviewed revision of the selected meeting, when the user asks for drafts, then the request names that one recording and carries only a request ID, source instance, project, recording, expected source hash, review ID and hash, the reviewed segments (ID, times, text, speaker label), locale `th-TH`, meeting start and time zone `Asia/Bangkok` — no Member list, contact or credential; the same request ID is used again for the same review (a retry), and “วิเคราะห์ใหม่” makes a new one.
- AC-012-005-03 — Given a reply whose review ID, review hash or source hash differs from the stored ones, then it is refused (“ผลร่างอ้างฉบับเก่า กรุณาตรวจใหม่”); given a reply with more than 30 items, an item without a proposal ID or title, a repeated proposal ID or a kind other than task, decision or question, then it is refused (“รูปแบบร่างงานไม่ถูกต้อง”, “รายการร่างไม่ถูกต้อง”); in each case nothing is stored.
- AC-012-005-04 — Given a valid reply, then the batch is stored under its `draftBatchId` and the same reply again stores no second batch; decision and question items default to “ไม่สร้าง”, and an item reaches the task store only when its handling is create, link or update and the user commits (FR-012-008).
- AC-012-005-05 — Given a task committed from a draft, then its MoSCoW priority is whatever the user chose and “ยังไม่จัดลำดับ” when none was; the model never sets it.
- AC-012-005-06 — Given a saved, unchanged reviewed revision, when the user chooses “สร้างงานเองจากช่วงนี้” on a segment, then the task form opens with the segment’s text as description, the segment’s span as evidence and source kind `manual-from-meeting`, and the task card reads “Manual”; the control is disabled while the working copy differs from the saved revision.

## Implementation
- `apps/web/src/content/meeting/Meetings.jsx`: `Meetings.extract` (readiness check, request fields, request ID reuse; AC-012-005-01, -02) and `manual` in `ReviewEditor` (AC-012-005-06); the defaults of the batch form in `ActionBatch` (AC-012-005-04, -05).
- `apps/web/src/content/meeting/fung-client.mjs`: `createFungClient().draft` posts to `/integrations/meeting-task-manager/v1/action-drafts`.
- `apps/web/src/content/meeting/model.mjs`: `addBatch` (hash check, at most 30 items, item shape, evidence check, one batch per `draftBatchId`; AC-012-005-03, -04).
- `apps/web/src/content/meeting/MeetingWorkspace.jsx`: the weekly card label reads `sourceKind` — `meeting` shows “FUNG”, `weekly-plan` “Weekly plan”, anything else including `manual-from-meeting` “Manual”.
- Tests: `apps/web/src/content/meeting/model.test.mjs` — the fixture builds its batch with `addBatch`, and “withheld revisions cannot be reviewed, drafted or committed on this side” covers the refusal on a stub. The reply refusals of AC-012-005-03, the request fields of AC-012-005-02 and the UI defaults have no test of their own.

## Notes
- Origin: FEAT-004 MT-09. Delivery is `building`: the [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PASS for the production adapter against a local transport fixture, and inference with a configured real model is NOT_RUN. The installed FUNG may not serve the action-draft route at all until the adapter is built into it (same document, “Remaining acceptance”).
- Not run: drafts from a real FUNG and model, on any machine; the production page against a real FUNG.
- Evidence of every proposal is FR-012-006; the quotes of a draft stay inside the meeting’s audience (FR-011-009, FR-011-010).
- The spec asks that the real reason the model is unavailable be shown. `extract` does throw the reason code FUNG reports (`capabilities.actionDraft.reasonCode`), but the button is disabled in that state, so the screen shows only the generic note of AC-012-005-01.
- The spec also asks that a date such as “วันศุกร์” be shown as a date read from the meeting day; the screen shows the text FUNG reports (“วันส่งที่กล่าวถึง: …”) next to an editable date that is filled only with the date FUNG suggested. That is not restated as a requirement here.
- Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D15): the two differences above are unchanged for now — the FUNG status screens stay narrower than MT-06, MT-07, MT-09 and MT-11 describe. No code change.
