---
id: FR-011-002
title: Business admin capability
part: FEAT-011-P01
owner: DOM-IAM
delivery: implemented
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-002 — Business admin capability

The system SHALL mark Business admins on their Member record, set only through the operator path. A Business admin SHALL be able to manage teams without gaining read access to any item outside their own audience.

## Acceptance criteria
- AC-011-002-01 — Given the initial rollout, when the operator runs the admin step, then only the owner’s own Member is admin (PLAN-002 Q3).
- AC-011-002-02 — Given any API request, when its body carries an admin flag or asks for admin rights, then it is refused; admin status changes only through the operator path.
- AC-011-002-03 — Given an admin who is not a participant of a restricted meeting, when they read meetings, then that meeting is not returned.
- AC-011-002-04 — Given an admin is set or removed, then an audit event records the change and the operator path used.

## Implementation
- Built locally 2026-10-01: `members.is_business_admin`, guarded by the trigger `members_admin_guard` (only the table owner may change it) in `006_visibility.sql`; operator flags `--admin <PID>` and `--no-admin <PID>` in `apps/api/provision-members.mjs`, each with an audit event.
- Tests: `apps/api/test/visibility-db.test.mjs` (admin reads nothing extra; runtime role refused).
- Operator path: an extension of `apps/api/provision-members.mjs`, which today supports `--cloud`, `--reset`, `--disable` and `--enable`; no browser endpoint grants admin.

## Notes
- FEAT-006 left granular roles out of scope; this adds one capability, not a role system.
