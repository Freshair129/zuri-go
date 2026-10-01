---
id: FR-006-009
title: A Member’s PID is assigned by the server, unique in the Business, immutable and never reused
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-006-001, FR-006-002, FR-007-007]
---

# FR-006-009 — A Member’s PID is assigned by the server, unique in the Business, immutable and never reused

The system SHALL assign each Member a PID on the server when the Member is first saved — `ZGO-P` followed by at least four digits, taken from a per-Business counter that is incremented under lock — SHALL keep it unique within the Business, SHALL NOT change it afterwards or give it to another person, and SHALL refuse any request that names a PID.

## Acceptance criteria
- AC-006-009-01 — Given two Members of one Business, including two created at the same time, then their PIDs differ; a concurrent creation may fail to serialize but never produces a duplicate.
- AC-006-009-02 — Given a Member that is renamed, reloaded or provisioned again, then its PID is unchanged.
- AC-006-009-03 — Given an insert that carries a PID, then it fails with “PID is server assigned”; given an update that changes a PID, then it fails with “PID is immutable”; given a `PATCH` of a Member that carries `pid`, then the answer is 422.
- AC-006-009-04 — Given a Member that became Inactive, then its PID stays with it and the next Member gets the next number, not the same one.
- AC-006-009-05 — Given a PID, then it is a public identifier within the Business and not a credential: a PID alone never signs anyone in or selects the signed-in Member ([FR-007-007](../../FEAT-007-single-code-login/requirements/FR-007-007-caller-identity-ignored.md)).

## Implementation
- `apps/api/migrations/005_member_identity.sql` — column `businesses.next_member_no`, trigger `members_pid` (`member_pid()`: refuses a supplied PID, refuses a change, allocates with `UPDATE businesses SET next_member_no=next_member_no+1 … RETURNING`, formats `ZGO-P` plus `lpad` to at least 4 digits), `UNIQUE(business_id,pid)`.
- `apps/api/workspace.mjs:writeDomain` and `apps/api/service.mjs:save` — never write `pid` ([FR-006-001](FR-006-001-register-member.md) AC-006-001-06).
- Test: `apps/api/test/member-auth.test.mjs` (“PID creation is unique and immutable; operator provisioning is idempotent and reset revokes sessions”) covers AC-006-009-01 and -02; `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”) covers AC-006-009-03 (a `PATCH` with `pid` answers 422; a direct `UPDATE` fails with “PID is immutable”). Run on 2026-10-01 by the author of this file: passed. AC-006-009-04 rests on reading the counter (no row is deleted and the counter only grows); no committed test covers it.
- Production: the four existing Members received their PIDs from migration 005 on 2026-09-30 ([0.4.0 record](../../../history/zuri-go-member-review/verification.md)); the owner’s checks of 2026-10-01 saw them ([0.5.1 verification](../../../releases/0.5.1/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) §1 assumption 1 and the table of the four PIDs (not repeated here), §3 (“PID allocation uses a locked atomic increment; no MAX+1 or reuse”, “server-assigned and immutable”), §6 (“Four unique, stable PIDs…”).
- The backfill of the four PIDs by migration 005 followed the preserved import identities and is a one-time rollout fact, not a standing behavior.
