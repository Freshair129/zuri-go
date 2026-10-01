---
id: FR-006-014
title: Reset, disable and enable name their target and raise the credential version
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-007-005, FR-006-015]
---

# FR-006-014 — Reset, disable and enable name their target and raise the credential version

The system SHALL require an operator’s reset, disable or enable of a credential to name the target PID, SHALL raise the credential version of that credential, and so SHALL invalidate the earlier sessions of that Member.

## Acceptance criteria
- AC-006-014-01 — Given a reset, disable or enable without a PID or with a malformed one, then the tool refuses and changes nothing.
- AC-006-014-02 — Given a reset of a Member’s credential, then a new code is issued, the version rises, the earlier code is refused and a session signed before the reset fails on its next use.
- AC-006-014-03 — Given a disable and then an enable, then each raises the version, and the code works only while the credential is enabled.
- AC-006-014-04 — Given an Inactive Member, then their sessions are refused for writes by the status check ([FR-006-015](FR-006-015-writes-recheck-member.md)) and not by the version; to revoke permanently before a later reactivation, the operator disables or resets the credential.

## Implementation
- `apps/api/provision-members.mjs` — the CLI accepts `--reset`, `--disable`, `--enable` only with a PID of the form `ZGO-P` and digits (“Specify a PID after …”); `UPDATE member_credentials SET enabled=…,credential_version=credential_version+1`; a reset writes a new code at `credential_version+1`.
- Test: `apps/api/test/member-auth.test.mjs` (“PID creation is unique and immutable; operator provisioning is idempotent and reset revokes sessions”): after `resetPid` the new code differs, `resolveMember` of the earlier claims is `null` and the earlier code is refused; after `disablePid` the code is refused, after `enablePid` it works, after the Member is made Inactive it is refused. Run on 2026-10-01 by the author of this file: passed. AC-006-014-01 rests on reading the CLI.

## Notes
- Spec: [spec.md](../spec.md) §2 (the bullet “Reset must explicitly name the target PID and increases its credential version…” and the last bullet), §6 (“Reset, disable or inactive status blocks old sessions immediately for writes”).
- The statement on Inactive Members is from the 0.4.0 record, “Limits and exit criteria” ([member review](../../../history/zuri-go-member-review/verification.md)).
