---
id: FEAT-006
title: Member identity (PID and individual sign-in)
type: domain-feature
owner: DOM-IAM
runtime: SRV-001
delivery: implemented
status: proposed
legacy: [ZGO-AUTH-002]
relations:
  relates_to: [FEAT-004, FEAT-005, ARCH-002, ARCH-003]
---

# FEAT-006 — Member identity (PID and individual sign-in)

Every Member has a stable PID and an individual credential. Writes require a Member session and the audit actor is derived from that session, never from the request. It replaces the shared-team password.

## Scope
- PID is immutable and Business-scoped; a display-name change never changes it and it is never reassigned.
- Each credential is an independent random code stored only as a salted hash; one-time private handovers stay under `.local/` and outside deployment and ordinary backups.
- Provisioning is idempotent; a reset names its target PID and raises the credential version, which invalidates earlier sessions.
- Inactive or disabled Members cannot sign in or write; the local trusted operator is attributed distinctly and never impersonates a Member.
- The Member registry (registration, rename, Inactive and re-activation, seed, backup and restore, the local boundary and failed saves) lives here; its requirements came from [FEAT-004](../FEAT-004-meeting-task-manager/feature.md) (origin MT-20, MT-22, MT-23, MT-24), see the requirement index.
- Who may edit the registry (decided 2026-10-01, [PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01) D3; released 2026-10-01 in 0.5.1): adding a Member and changing any status need the Business admin or the local operator; a Member may edit their own details but not their own status, a Business admin included (only the operator changes an admin’s own status); another Member’s record needs the Business admin. The API enforces it on the workspace save and on the per-record route, whatever the screen shows ([FR-006-001](requirements/FR-006-001-register-member.md), [-002](requirements/FR-006-002-rename-keeps-references.md), [-004](requirements/FR-006-004-inactive-history-and-reactivation.md)). On 0.5.0, in production, any signed-in Member can still do all of these.
- What Guests read of a Member (D16; released 2026-10-01 in 0.5.1): only the ID, PID, display name and status ([FR-011-007](../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) AC-011-007-06). On 0.5.0 Guests still read every profile field.
- An Inactive Member takes no new R, A, C or I, on the server as well as in the forms, but may still be a named viewer or meeting participant (D2; [FR-006-003](requirements/FR-006-003-inactive-not-offered.md) AC-006-003-05 to -07).

## Ownership
- Feature owner: [DOM-IAM](../../domains/identity-access/README.md) — Identity & access. Type: domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md). The local runtime [SRV-002](../../services/SRV-002-local/SERVICE.md) is a trusted operator workspace without Guest mode or Member sign-in; its database still assigns Member PIDs, and writes there are attributed to the local operator, never to a Member.

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Approved contract “Member PID and individual sign-in” | `docs/architecture/member-identity-spec.md` | v0.4.0 · 2026-09-30 · legacy `ZGO-AUTH-002` |

## Requirement index
Approved by the owner on 2026-10-01: the files below hold the Member-registry requirements of [FEAT-004](../FEAT-004-meeting-task-manager/feature.md) written here under its approved split (PLAN-002 WI-12, decided 2026-10-01, delegated by the owner); FEAT-004 and its MT numbers are unchanged. Each file records its FEAT-004 origin in its notes and holds its acceptance criteria. The PID and individual sign-in requirements themselves have no FR / NFR files yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08); they remain in [spec.md](spec.md), whose acceptance / success / exit criteria are in §6. No TC binds to these FRs yet.

| ID | Requirement | Delivery |
|---|---|---|
| [FR-006-001](requirements/FR-006-001-register-member.md) | Register a Member from a display name alone | implemented |
| [FR-006-002](requirements/FR-006-002-rename-keeps-references.md) | Renaming a Member keeps every reference | implemented |
| [FR-006-003](requirements/FR-006-003-inactive-not-offered.md) | An Inactive Member is not offered for new assignments | implemented |
| [FR-006-004](requirements/FR-006-004-inactive-history-and-reactivation.md) | An Inactive Member keeps their history and can be made Active again | implemented |
| [FR-006-005](requirements/FR-006-005-seed-once.md) | The weekly seed adds its Members once and never overwrites | implemented |
| [FR-006-006](requirements/FR-006-006-backup-restore-keeps-members.md) | Export and restore keep Member references and never merge Members by name | building |
| [FR-006-007](requirements/FR-006-007-registry-needs-no-provider.md) | The Member registry needs no provider and contacts nobody | implemented |
| [FR-006-008](requirements/FR-006-008-failed-save-not-reported-saved.md) | A failed Member save is never reported as saved | implemented |

FR-006-006 is `building`: restoring a backup over a PostgreSQL workspace is not supported from the screen, and no restore has been run on production. The other delivery values rest on the current code and the model tests named in each file; the hosted Member checks and the browser checks are not yet run ([release verification](../../releases/0.5.0/verification.md)).

## Delivery evidence
- Deployed and promoted to production: [history/zuri-go-member-review](../../history/zuri-go-member-review/verification.md).

## Notes
- Migration `005_member_identity.sql` preserves every Member UUID; see [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) (0.4.0 amendment).
