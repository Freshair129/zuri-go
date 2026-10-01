---
id: FR-007-006
title: Every refused sign-in gets the same answer and leaks no credential data
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-007-004, FR-007-005]
---

# FR-007-006 — Every refused sign-in gets the same answer and leaks no credential data

The system SHALL answer every refused sign-in — no match, several matches, an Inactive owner, a disabled credential, and an empty, non-text or over-long code — with the same status 401 and the message “รหัสระบุตัวตนไม่ถูกต้อง”, SHALL use the same term in the message that asks a Guest to sign in before editing, and SHALL NOT put any credential data, or the name or PID of any Member that matched, in a response or a log.

## Acceptance criteria
- AC-007-006-01 — Given a code that matches no credential, when it is submitted, then the answer is 401 “รหัสระบุตัวตนไม่ถูกต้อง”.
- AC-007-006-02 — Given a code that matches several credentials, an Inactive owner or a disabled credential, then the answer is the same 401 and the same message as AC-007-006-01.
- AC-007-006-03 — Given an empty code, a code that is not text, or a code longer than 256 characters, then the answer is the same 401 and the credentials are not queried.
- AC-007-006-04 — Given a write by a Guest, then the answer is 401 with the code `AUTH_REQUIRED` and a message that names “รหัสระบุตัวตน”.
- AC-007-006-05 — Given any refusal, then the body holds only the message and a code, and no credential value, hash, credential version, matched name or PID.

## Implementation
- `apps/api/cloud.mjs:handler` — `if(!member){send(res,401,{error:'รหัสระบุตัวตนไม่ถูกต้อง'})}`; a write without a session answers `เข้าสู่ระบบด้วย รหัสระบุตัวตนก่อนแก้ไข` with `AUTH_REQUIRED`.
- `apps/api/member-auth.mjs:loginMember` — returns `null` before any query when the code is not a text of 1 to 256 characters; `authorizeWrite` throws `กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน` with 401.
- Tests: `apps/api/test/member-auth.test.mjs` (“single code rejects ambiguity…”; the invalid inputs call a client that fails if queried); `apps/api/test/cloud-handler.test.mjs` (“hosted API allows guest reads…”, a wrong code answers 401; “guest write attempts…”). Run on 2026-10-01 by the author of this file: passed.
- No committed test compares the body of each refusal for leaked fields; AC-007-006-05 rests on reading the handler, whose only refusal body is the one above.

## Notes
- Spec: [spec.md](../spec.md) “พฤติกรรมที่เปลี่ยน” bullet 4, “Evidence และวิธีทำ” bullet 5, “Acceptance / success / exit criteria” item 2.
- The 256-character bound is the limit of the existing input validation (“คง input length/type validation”); the spec names no number.
