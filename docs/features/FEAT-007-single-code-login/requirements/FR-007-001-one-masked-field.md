---
id: FR-007-001
title: The sign-in modal has one masked field, รหัสระบุตัวตน, and no PID field
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-005-004]
---

# FR-007-001 — The sign-in modal has one masked field, รหัสระบุตัวตน, and no PID field

The system SHALL show in the sign-in modal exactly one input, a masked field labelled **รหัสระบุตัวตน**, SHALL NOT ask for a PID, and SHALL send only the code, in the transport field `{password}`, which is a technical name and not a label.

## Acceptance criteria
- AC-007-001-01 — Given a Guest who starts a write action on the hosted site, when the sign-in modal opens, then it holds one input labelled “รหัสระบุตัวตน” and the characters typed into it are hidden.
- AC-007-001-02 — Given the sign-in modal, then it has no PID input and no member picker.
- AC-007-001-03 — Given a sign-in, when the form is submitted, then the request body is `{password}` alone and the interface never calls the field a password.

## Implementation
- `apps/web/src/content/business/TeamAccess.jsx:TeamAccess` — the modal “เข้าสู่ระบบเพื่อแก้ไข” with `<label htmlFor="team-password">รหัสระบุตัวตน</label>` and `<input type="password" maxLength={256}>`; `login` posts `request('/login','POST',{password})`.
- `apps/api/cloud.mjs:handler` — route `/login` reads `input?.password` only.
- Evidence: the 0.4.2 record names “one password input, new Thai label, no PID input, password-only POST” from the compiled source, and its browser visual check was NOT_RUN ([0.4.2 verification](../../../releases/0.4.2/verification.md)). The 0.5.1 browser check on production as a Guest saw “the sign-in prompt (single masked field “รหัสระบุตัวตน”)” ([0.5.1 verification](../../../releases/0.5.1/verification.md), “Browser checks”). No committed test covers the form.

## Notes
- Spec: [spec.md](../spec.md) “พฤติกรรมที่เปลี่ยน” bullets 1 and 5, “Evidence และวิธีทำ” bullet 1, “Acceptance / success / exit criteria” item 6 (the first sentence).
- Before 0.4.2 the modal asked for a PID and a personal password ([FEAT-006 spec](../../FEAT-006-member-identity/spec.md) §2); that input is superseded by this requirement.
