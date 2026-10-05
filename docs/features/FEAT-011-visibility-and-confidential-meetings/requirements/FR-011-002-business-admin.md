---
id: FR-011-002
title: Operator-managed Business admin capability
part: FEAT-011-P01
owner: DOM-IAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004, ADR-008]
---

# FR-011-002 — Business admin capability

The system SHALL mark Business admins on their Member record, set only through the operator path. Business-admin status SHALL NOT add or remove access to Business records; every active Member has equal record rights under [ADR-008](../../../architecture/decisions.md).

> **Supersession:** ADR-008 (approved 2026-10-05) supersedes the former statement that admin status is excluded from an item's audience. The privileged identity grant remains operator-managed; the new access policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment.

## Acceptance criteria
- AC-011-002-01 — Given the initial rollout, when the operator runs the admin step, then only the owner’s own Member is admin (PLAN-002 Q3).
- AC-011-002-02 — Given any API request, when its body carries an admin flag or asks for admin rights, then it is refused; admin status changes only through the operator path.
- AC-011-002-03 — Given an admin or non-admin active Member who is not a participant of a restricted meeting, when they read that in-Business non-secret meeting, then it is returned; Guest reads are identical and read-only.
- AC-011-002-04 — Given an admin is set or removed, then an audit event records the change and the operator path used.

## Implementation
- Built locally 2026-10-01: `members.is_business_admin`, guarded by the trigger `members_admin_guard` (only the table owner may change it) in `006_visibility.sql`; operator flags `--admin <PID>` and `--no-admin <PID>` in `apps/api/provision-members.mjs`, each with an audit event.
- Tests: `apps/api/test/visibility-db.test.mjs` (admin reads nothing extra; runtime role refused).
- Operator path: an extension of `apps/api/provision-members.mjs`, which today supports `--cloud`, `--reset`, `--disable` and `--enable`; no browser endpoint grants admin.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed. After the release the operator set the flag for the owner's Member (PLAN-002 Q3; one `admin_granted` audit event, no credential changed); the hosted checks as that Member, and the browser checks, are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- FEAT-006 left granular roles out of scope; this adds one capability, not a role system.
