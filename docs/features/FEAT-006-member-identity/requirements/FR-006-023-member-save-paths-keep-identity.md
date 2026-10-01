---
id: FR-006-023
title: Both Member save paths resolve the canonical Member and assign the PID the same way
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-006-001, FR-006-002, FR-006-009]
---

# FR-006-023 — Both Member save paths resolve the canonical Member and assign the PID the same way

The system SHALL resolve a Member from the legacy workspace by its canonical UUID or its legacy ID, never by display name, before any authentication or foreign-key write, and SHALL give a Member created through the direct Member save or through the legacy workspace save a PID automatically, without letting either path change an existing PID or accept one from the client.

## Acceptance criteria
- AC-006-023-01 — Given a Member created through the direct Member route, then it has a server-assigned PID.
- AC-006-023-02 — Given a Member created through a workspace save, then it has a server-assigned PID.
- AC-006-023-03 — Given a workspace save that carries a different `pid` for an existing Member, then the stored PID is unchanged.
- AC-006-023-04 — Given a Member whose compatibility-view ID is held in its legacy metadata, then every reference (task roles, weekly entries, events, attachments) resolves to the canonical Member UUID and keeps it.

## Implementation
- `apps/api/workspace.mjs:writeDomain` (`memberId`, the Members loop; `pid` is never written) and `apps/api/service.mjs:save` (refuses unknown fields such as `pid`); trigger `members_pid` of `apps/api/migrations/005_member_identity.sql`.
- Tests: `apps/api/test/member-auth.test.mjs` (a Member inserted gets a unique PID); `apps/api/test/cloud-handler.test.mjs` (a `PATCH` with `pid` answers 422; a workspace save that adds a Member as the admin, “the registry rules hold on the hosted workspace save…”); `apps/web/src/content/meeting/model.test.mjs` (a rename keeps task references). Run on 2026-10-01 by the author of this file: the two API files (15 tests) and the model test (38 tests) passed. No committed test reads the PID of a Member created by a workspace save or sends a different `pid` in a workspace save (AC-006-023-02 and -03 rest on reading the Members loop and the trigger); the 0.4.0 record states that the migration backfill leaves every Member UUID and foreign key intact and that the Member, task and RACI counts stayed identical ([member review](../../../history/zuri-go-member-review/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) §3 (the paragraph after the table: “Compatibility-view Member IDs in legacy_metadata are resolved to the canonical Member UUID… Automatic PID assignment must cover both direct Member saves and legacy workspace saves…”), §6 (“canonical and legacy paths preserve the correct UUID/FK”).
- Who may add or edit a Member through either path was changed by D3 (0.5.1): [FR-006-001](FR-006-001-register-member.md) AC-006-001-07.
