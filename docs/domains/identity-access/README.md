---
id: DOM-IAM
title: Identity & access
status: proposed
---

# DOM-IAM — Identity & access

Who may read, who may write, and who did it: public Guest reads, Member sign-in for writes, and an audit actor derived on the server.

## Language
- Guest
- Member
- PID
- Identity code (รหัสระบุตัวตน)
- Credential version
- Session
- Write intent
- Trusted local operator
- Viewer (Guest / Member / local operator)
- Team (ฝ่าย)
- Business admin
- Member registry (the list of Members and their optional profile details)
- Member status (Active / Inactive)

## Owned data
- `members` (including the immutable `pid`, the status Active / Inactive, the optional profile fields and, since schema 6, `is_business_admin`)
- `member_credentials`
- `team_login_limits` (persistent sign-in rate-limit counters; defined in [ARCH-003](../../architecture/ARCH-003-hosted-deployment.md), “Authentication data model amendment”)
- `teams` and `team_members` (schema 6, migration `006_visibility.sql`; teams are archived, never deleted; rows are closed to Guests) and the Business-admin flag `members.is_business_admin`: [ADR-004](../../architecture/decisions.md) D3 and D7, [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) part FEAT-011-P01. Released to production on 2026-10-01 with 0.5.0 (production is schema 7; [verification](../../releases/0.5.0/verification.md)).
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- Production opens in Guest mode, read-only; API authorization enforces writes independently of UI state ([AGENTS.md](../../../AGENTS.md)).
- Sign-in is one masked field: exactly one matching credential across the Business (disabled candidates count for ambiguity) must belong to an active, enabled Member; a caller-supplied PID or member ID never selects the actor ([FEAT-007 spec](../../features/FEAT-007-single-code-login/spec.md)).
- PID is the stable public identifier; UUID stays the primary/foreign key and canonical actor identity ([FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md)).
- Sessions are signed and versioned; the credential is rechecked in the write transaction; origin checks and persistent rate limits apply; there is no shared-password fallback ([FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md)).
- Local access is a trusted operator on `127.0.0.1:4319`, never an authenticated Member session ([SRV-002](../../services/SRV-002-local/SERVICE.md)).
- Released to production on 2026-10-01 with 0.5.0 (schema 6 and 7; [ADR-004](../../architecture/decisions.md), [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md)): every read resolves a viewer (Guest, Member or local operator); Guests read only tasks, projects and meetings marked `public`; every other one needs a Member session whose Member is in its audience, enforced by the API and by row-level security. Guests still read campaign records and, on 0.5.0, every Member profile field, which PLAN-002 Q1 defers, so the interim rule of ADR-004 D9 (no HR, salary or customers’ personal data) still applies to them; decided 2026-10-01 (D16, built locally and not released): a Guest reads only a Member’s ID, PID, display name and status ([FR-011-007](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) AC-011-007-06) ([release verification](../../releases/0.5.0/verification.md)).
- Teams are managed only by a Business admin or the local operator. The Business-admin flag is changed only by the operator path (`npm run members -- --admin <PID>` or `--no-admin <PID>`, with `--cloud` for production): a trigger refuses the runtime role, so a hosted Member cannot grant it, and an admin reads nothing beyond their own audience. In production the flag is set for one Member, the owner’s ([FR-011-002](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-002-business-admin.md)).
- The Member registry — registration from a display name alone, rename that keeps the ID and PID, Inactive Members that are not offered for new work but keep their history, a seed that never overwrites, backup and restore by Member ID, nothing sent to a Member, and no failed save reported as saved — is written as proposed requirements in [FEAT-006](../../features/FEAT-006-member-identity/feature.md#requirement-index); their origin is FEAT-004 (MT-20, MT-22, MT-23, MT-24). Registering a Member issues no credential; only the operator does.
- Who may edit the registry (decided 2026-10-01, [PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D3; built locally, not released — on 0.5.0 any signed-in Member can): adding a Member and changing any Member’s status need the Business admin or the local operator; a Member edits their own details but not their own status, and a Business admin cannot change their own status either (only the operator can); another Member’s record needs the Business admin. The API enforces it on the workspace save and on the per-record route ([FR-006-001](../../features/FEAT-006-member-identity/requirements/FR-006-001-register-member.md) AC-006-001-07, [FR-006-002](../../features/FEAT-006-member-identity/requirements/FR-006-002-rename-keeps-references.md) AC-006-002-04, [FR-006-004](../../features/FEAT-006-member-identity/requirements/FR-006-004-inactive-history-and-reactivation.md) AC-006-004-05). An Inactive Member takes no new R, A, C or I on the server, but may still be a named viewer or meeting participant (D2, [FR-006-003](../../features/FEAT-006-member-identity/requirements/FR-006-003-inactive-not-offered.md)). A backup restore is not an identity migration: new PIDs, no credentials (D7).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `generic` · role `foundation`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-005](../../features/FEAT-005-guest-access/feature.md) | Guest read-only access and task evidence | implemented |
| [FEAT-006](../../features/FEAT-006-member-identity/feature.md) | Member identity (PID and individual sign-in) | implemented |
| [FEAT-007](../../features/FEAT-007-single-code-login/feature.md) | Single-code login | implemented |
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | Visibility, teams and confidential meetings | building |

**Requirements** — the Member registry requirements of [FEAT-006](../../features/FEAT-006-member-identity/feature.md#requirement-index) were approved on 2026-10-01 (written the same day from FEAT-004, origin MT-20, MT-22, MT-23, MT-24); those of FEAT-011-P01 were approved on 2026-10-01 and released with 0.5.0. Requirement files sit in their feature’s `requirements/` folder. FEAT-005 and FEAT-007 have no requirement files yet, and the PID and sign-in requirements of FEAT-006 remain in its [spec](../../features/FEAT-006-member-identity/spec.md).

| Requirement | Feature | Title | Status | Delivery |
|---|---|---|---|---|
| [FR-006-001](../../features/FEAT-006-member-identity/requirements/FR-006-001-register-member.md) | FEAT-006 | Register a Member from a display name alone | approved | implemented |
| [FR-006-002](../../features/FEAT-006-member-identity/requirements/FR-006-002-rename-keeps-references.md) | FEAT-006 | Renaming a Member keeps every reference | approved | implemented |
| [FR-006-003](../../features/FEAT-006-member-identity/requirements/FR-006-003-inactive-not-offered.md) | FEAT-006 | An Inactive Member is not offered for new assignments | approved | implemented |
| [FR-006-004](../../features/FEAT-006-member-identity/requirements/FR-006-004-inactive-history-and-reactivation.md) | FEAT-006 | An Inactive Member keeps their history and can be made Active again | approved | implemented |
| [FR-006-005](../../features/FEAT-006-member-identity/requirements/FR-006-005-seed-once.md) | FEAT-006 | The weekly seed adds its Members once and never overwrites | approved | implemented |
| [FR-006-006](../../features/FEAT-006-member-identity/requirements/FR-006-006-backup-restore-keeps-members.md) | FEAT-006 | Export and restore keep Member references and never merge Members by name | approved | building |
| [FR-006-007](../../features/FEAT-006-member-identity/requirements/FR-006-007-registry-needs-no-provider.md) | FEAT-006 | The Member registry needs no provider and contacts nobody | approved | implemented |
| [FR-006-008](../../features/FEAT-006-member-identity/requirements/FR-006-008-failed-save-not-reported-saved.md) | FEAT-006 | A failed Member save is never reported as saved | approved | implemented |
| [FR-011-001](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-001-teams.md) | FEAT-011-P01 | Teams and team membership | approved | implemented |
| [FR-011-002](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-002-business-admin.md) | FEAT-011-P01 | Business admin capability | approved | implemented |
| [FR-011-003](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-003-viewer-identity.md) | FEAT-011-P01 | Viewer identity on every read | approved | implemented |
| [FR-011-007](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) | FEAT-011-P01 | Guests read public items only | approved | implemented |
| [NFR-011-001](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/NFR-011-001-row-level-security.md) | FEAT-011-P01 | Row-level security enforces the same audiences | approved | implemented |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md). Its features are realised by SRV-001; SRV-002 keeps its data for the trusted local operator (see the runtime line of each feature).
<!-- END GENERATED -->
