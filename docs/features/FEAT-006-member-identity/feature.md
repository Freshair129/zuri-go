---
id: FEAT-006
title: Member identity (PID and individual sign-in)
type: domain-feature
owner: DOM-IAM
runtime: SRV-001
delivery: live
status: proposed
legacy: [ZGO-AUTH-002]
relations:
  depends_on: [FEAT-005]
  relates_to: [ARCH-002, ARCH-003]
---

# FEAT-006 — Member identity (PID and individual sign-in)

Every Member has a stable PID and an individual credential. Writes require a Member session and the audit actor is derived from that session, never from the request. It replaces the shared-team password.

## Scope
- PID is immutable and Business-scoped; a display-name change never changes it and it is never reassigned.
- Each credential is an independent random code stored only as a salted hash; one-time private handovers stay under `.local/` and outside deployment and ordinary backups.
- Provisioning is idempotent; a reset names its target PID and raises the credential version, which invalidates earlier sessions.
- Inactive or disabled Members cannot sign in or write; the local trusted operator is attributed distinctly and never impersonates a Member.

## Ownership
- Feature owner: [DOM-IAM](../../domains/identity-access/README.md) — Identity & access. Type: domain feature, no cross-domain participants.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Approved contract “Member PID and individual sign-in” | `docs/architecture/member-identity-spec.md` | v0.4.0 · 2026-09-30 · legacy `ZGO-AUTH-002` |

## Requirement index
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Acceptance / success / exit criteria: [spec.md](spec.md) §6.

## Delivery evidence
- Release evidence: [history/zuri-go-member-review](../../history/zuri-go-member-review/verification.md).

## Notes
- Migration `005_member_identity.sql` preserves every Member UUID; see [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) (0.4.0 amendment).
