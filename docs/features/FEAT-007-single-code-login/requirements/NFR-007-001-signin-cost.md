---
id: NFR-007-001
title: A sign-in attempt costs at most one scrypt check per credential
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-007-003]
---

# NFR-007-001 — A sign-in attempt costs at most one scrypt check per credential

The system SHALL verify a submitted code with at most one scrypt check for each credential of the Business, plus one dummy check when the Business holds no credential, and SHALL NOT add a lookup index or a framework to speed it up unless the number of credentials makes this cost unacceptable.

## Measurement
- Given a Business with N credentials, when a code that matches none is submitted, then N scrypt checks run; measured with a counting stub of `verifyPassword`.
- Given a Business with no credential, then one dummy check runs.
- The number of checks per sign-in is recorded in the verification of any release that changes sign-in; the 0.4.2 record does not state it (open item).

## Notes
- Spec: [spec.md](../spec.md) “Evidence และวิธีทำ” bullets 1 and 6 (“บันทึกจำนวน scrypt checks ต่อ login ในการตรวจ ไม่เพิ่ม lookup index หรือ framework ใหม่โดยไม่จำเป็น”).
- Implementation: `apps/api/member-auth.mjs:loginMember` verifies each candidate once and `DUMMY` when there is none. No committed test counts the checks; the implementation was read, not measured.
- The threshold at which a lookup index becomes necessary is not stated in the spec (“วิธีนี้เหมาะกับทีมขนาดปัจจุบัน”, the method suits the present team size, 4 credentials at 0.4.2); it is a decision for the owner when the team grows.
