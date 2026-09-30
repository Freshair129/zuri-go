---
id: FR-006-007
title: The Member registry needs no provider and contacts nobody
delivery: implemented
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-007 — The Member registry needs no provider and contacts nobody

The system SHALL let Members be registered, edited, set Inactive and assigned to tasks without any external provider (the FUNG connector, an AI model, or an email or messaging service), and SHALL send nothing to a Member or to anyone else when a Member is registered or changed: no email, message, invitation or notification.

## Acceptance criteria
- AC-006-007-01 — Given FUNG is not connected and no AI endpoint is configured, when a Member is registered, edited, set Inactive and assigned to a task, then each step succeeds and the result is still there after the page is reloaded.
- AC-006-007-02 — Given a Member registered with an email address and a phone number, then no email, message, invitation or notification is sent: the save is one request to the app’s own API, or a write to the browser’s own store, and the contact fields are stored as plain data.
- AC-006-007-03 — Given the Members view, then it tells the user that nothing is sent to the team (“ยังไม่มีการส่งข้อความหาทีม”).
- AC-006-007-04 — Given a request to the FUNG connector or to the optional local AI model, then it carries no Member record and no contact field.

## Implementation
- `apps/web/src/content/meeting/MeetingWorkspace.jsx:change` → `repo.mutate`, implemented by `apps/web/src/content/meeting/repository.mjs:openRepository` (browser workspace) and `apps/web/src/content/business/api.mjs:openServerRepository` (`PUT /workspace`); the Member path calls nothing else.
- No code in `apps/api/*.mjs` or `apps/web/src/content` sends email, SMS, an invitation or a notification (searched, case-insensitive, for nodemailer, SMTP, SendGrid, `mailto:`, SMS, webhook, invite and notification; no match). The API’s only outbound call is the optional loopback AI brief in `apps/api/service.mjs:brief`, which sends facts built by `apps/web/src/content/business/model.mjs` — that file reads no Member field.
- `apps/web/src/content/meeting/fung-client.mjs` names no Member; the draft request of `apps/web/src/content/meeting/Meetings.jsx` (`extract`) carries the reviewed transcript segments and IDs only.
- Tests: none for this requirement; `apps/web/src/content/meeting/tests/repository.browser.mjs` (manual browser harness) stores domain data without any provider.
- Checked 2026-10-01 by the author of this file: the searches above, run over the current source. No browser or network trace was taken for this file, so AC-006-007-01 and -02 rest on reading the code.

## Notes
- Origin: FEAT-004 MT-24 (no provider needed; no automatic contact, notification or invitation). The approved [FEAT-006 spec](../spec.md) §6 states the same for sign-in: “no email or external notification sent”, and lists email delivery, OTP and self-registration as out of scope.
- The Members view text is static: it says the list is “บันทึกรายชื่อในเครื่อง” (saved on this machine) even when the workspace is PostgreSQL in production. The copy is stale for the hosted runtime; the heading of the page already names the store. Whether to change it is for the owner.
- In production Guests still read Member profiles, including email and phone (PLAN-002 Q1; [release verification](../../../releases/0.5.0/verification.md)). Nothing is sent, but the contact fields are visible to Guests until that level is built.
