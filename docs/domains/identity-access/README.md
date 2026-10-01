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
- Production opens in Guest mode, read-only; API authorization enforces writes independently of UI state ([AGENTS.md](../../../AGENTS.md)) ([FR-005-001](../../features/FEAT-005-guest-access/requirements/FR-005-001-guest-opens-workspace.md), [FR-005-003](../../features/FEAT-005-guest-access/requirements/FR-005-003-writes-need-member-session.md)).
- Sign-in is one masked field: exactly one matching credential across the Business (disabled candidates count for ambiguity) must belong to an active, enabled Member; a caller-supplied PID or member ID never selects the actor ([FEAT-007 spec](../../features/FEAT-007-single-code-login/spec.md)); approved requirements [FR-007-001](../../features/FEAT-007-single-code-login/requirements/FR-007-001-one-masked-field.md), [-003](../../features/FEAT-007-single-code-login/requirements/FR-007-003-code-identifies-member.md), [-004](../../features/FEAT-007-single-code-login/requirements/FR-007-004-ambiguous-code-refused.md), [-005](../../features/FEAT-007-single-code-login/requirements/FR-007-005-inactive-or-disabled-refused.md) and [-007](../../features/FEAT-007-single-code-login/requirements/FR-007-007-caller-identity-ignored.md).
- PID is the stable public identifier; UUID stays the primary/foreign key and canonical actor identity ([FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md)); approved requirement [FR-006-009](../../features/FEAT-006-member-identity/requirements/FR-006-009-pid-server-assigned-immutable.md).
- Sessions are signed and versioned; the credential is rechecked in the write transaction; origin checks and persistent rate limits apply; there is no shared-password fallback ([FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md)); approved requirements [FR-006-015](../../features/FEAT-006-member-identity/requirements/FR-006-015-writes-recheck-member.md), [FR-006-016](../../features/FEAT-006-member-identity/requirements/FR-006-016-member-session.md) and [FR-006-021](../../features/FEAT-006-member-identity/requirements/FR-006-021-old-shared-access-rejected.md).
- Local access is a trusted operator on `127.0.0.1:4319`, never an authenticated Member session ([SRV-002](../../services/SRV-002-local/SERVICE.md)).
- Released to production on 2026-10-01 with 0.5.0 (schema 6 and 7; [ADR-004](../../architecture/decisions.md), [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md)): every read resolves a viewer (Guest, Member or local operator); Guests read only tasks, projects and meetings marked `public`; every other one needs a Member session whose Member is in its audience, enforced by the API and by row-level security. Guests still read campaign records and, on 0.5.0, every Member profile field, which PLAN-002 Q1 defers, so the interim rule of ADR-004 D9 (no HR, salary or customers’ personal data) still applies to them; decided 2026-10-01 (D16, built locally and not released): a Guest reads only a Member’s ID, PID, display name and status ([FR-011-007](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) AC-011-007-06) ([release verification](../../releases/0.5.0/verification.md)).
- Teams are managed only by a Business admin or the local operator. The Business-admin flag is changed only by the operator path (`npm run members -- --admin <PID>` or `--no-admin <PID>`, with `--cloud` for production): a trigger refuses the runtime role, so a hosted Member cannot grant it, and an admin reads nothing beyond their own audience. In production the flag is set for one Member, the owner’s ([FR-011-002](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-002-business-admin.md)).
- The Member registry — registration from a display name alone, rename that keeps the ID and PID, Inactive Members that are not offered for new work but keep their history, a seed that never overwrites, backup and restore by Member ID, nothing sent to a Member, and no failed save reported as saved — is written as proposed requirements in [FEAT-006](../../features/FEAT-006-member-identity/feature.md#requirement-index); their origin is FEAT-004 (MT-20, MT-22, MT-23, MT-24). Registering a Member issues no credential; only the operator does.
- Who may edit the registry (decided 2026-10-01, [PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D3; released 2026-10-01 in 0.5.1; on 0.5.0 any signed-in Member could): adding a Member and changing any Member’s status need the Business admin or the local operator; a Member edits their own details but not their own status, and a Business admin cannot change their own status either (only the operator can); another Member’s record needs the Business admin. The API enforces it on the workspace save and on the per-record route ([FR-006-001](../../features/FEAT-006-member-identity/requirements/FR-006-001-register-member.md) AC-006-001-07, [FR-006-002](../../features/FEAT-006-member-identity/requirements/FR-006-002-rename-keeps-references.md) AC-006-002-04, [FR-006-004](../../features/FEAT-006-member-identity/requirements/FR-006-004-inactive-history-and-reactivation.md) AC-006-004-05). An Inactive Member takes no new R, A, C or I on the server, but may still be a named viewer or meeting participant (D2, [FR-006-003](../../features/FEAT-006-member-identity/requirements/FR-006-003-inactive-not-offered.md)). A backup restore is not an identity migration: new PIDs, no credentials (D7).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Declared on 2026-10-01, all `proposed`: API-002…API-004 in [contracts.md](contracts.md) (PLAN-001 WI-09); business rules BR-008 in [rules.md](rules.md) (PLAN-001 WI-10); security requirements SEC-001…SEC-020 in [architecture/requirements](../../architecture/requirements/security-requirements.md). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` is added to this folder when the first ADR owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand; `npm run docs:views` (scripts/docs/generate_views.py --check, PLAN-001 WI-11) reports any drift from `feature.md` and the registry._

**Classification** — subdomain `generic` · role `foundation`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-005](../../features/FEAT-005-guest-access/feature.md) | Guest read-only access and task evidence | implemented |
| [FEAT-006](../../features/FEAT-006-member-identity/feature.md) | Member identity (PID and individual sign-in) | implemented |
| [FEAT-007](../../features/FEAT-007-single-code-login/feature.md) | Single-code login | implemented |
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | Visibility, teams and confidential meetings | implemented |

**Requirements** — requirement files sit in their feature’s `requirements/` folder. The Member registry requirements of [FEAT-006](../../features/FEAT-006-member-identity/feature.md#requirement-index) (FR-006-001 to -008) were approved on 2026-10-01 (written the same day from FEAT-004, origin MT-20, MT-22, MT-23, MT-24); those of FEAT-011-P01 were approved on 2026-10-01 and released with 0.5.0. The requirements of FEAT-005 (Guest access and task evidence), the PID and sign-in part of FEAT-006 (FR-006-009 to -023, NFR-006-001) and FEAT-007 (single-code login) were written on 2026-10-01 from their approved specifications (PLAN-001 WI-06) and were approved by the owner the same day (PLAN-003 G4).

| Requirement | Feature | Title | Status | Delivery |
|---|---|---|---|---|
| [FR-005-001](../../features/FEAT-005-guest-access/requirements/FR-005-001-guest-opens-workspace.md) | FEAT-005 | An anonymous visitor opens the live workspace in Guest mode with no login wall | approved | implemented |
| [FR-005-002](../../features/FEAT-005-guest-access/requirements/FR-005-002-public-reads-business-scoped.md) | FEAT-005 | Session, bootstrap and Business reads are public and limited to the configured Business | approved | implemented |
| [FR-005-003](../../features/FEAT-005-guest-access/requirements/FR-005-003-writes-need-member-session.md) | FEAT-005 | Every write needs a Member session; a Guest write answers 401 and changes nothing | approved | implemented |
| [FR-005-004](../../features/FEAT-005-guest-access/requirements/FR-005-004-write-intent-opens-sign-in.md) | FEAT-005 | A write intent opens the sign-in modal before the action starts | approved | implemented |
| [FR-005-005](../../features/FEAT-005-guest-access/requirements/FR-005-005-action-resumes.md) | FEAT-005 | After a successful sign-in the chosen action continues | approved | implemented |
| [FR-005-006](../../features/FEAT-005-guest-access/requirements/FR-005-006-readonly-views-stay-available.md) | FEAT-005 | Navigation, filtering, metric details and read-only views need no sign-in | approved | implemented |
| [FR-005-007](../../features/FEAT-005-guest-access/requirements/FR-005-007-expired-session-falls-back-to-guest.md) | FEAT-005 | An expired session falls back to Guest mode and the next write asks to sign in | approved | implemented |
| [FR-005-008](../../features/FEAT-005-guest-access/requirements/FR-005-008-logout-keeps-workspace-readable.md) | FEAT-005 | Logout clears the session and keeps the workspace readable | approved | implemented |
| [FR-005-009](../../features/FEAT-005-guest-access/requirements/FR-005-009-attachments-on-saved-tasks.md) | FEAT-005 | Files and images attach to a saved task only, beside the existing evidence text | approved | implemented |
| [FR-005-010](../../features/FEAT-005-guest-access/requirements/FR-005-010-attachment-limits.md) | FEAT-005 | A file is at most 2 MiB and a task holds at most 5 active files | approved | implemented |
| [FR-005-011](../../features/FEAT-005-guest-access/requirements/FR-005-011-attachment-storage.md) | FEAT-005 | Files are stored in PostgreSQL with their metadata and hash, scoped to the Business | approved | implemented |
| [FR-005-012](../../features/FEAT-005-guest-access/requirements/FR-005-012-attachment-access-by-role.md) | FEAT-005 | A Guest lists and downloads evidence files; a Member uploads and removes them | approved | implemented |
| [FR-005-013](../../features/FEAT-005-guest-access/requirements/FR-005-013-safe-preview-and-download.md) | FEAT-005 | Only signature-checked raster images preview; every other file downloads inert | approved | implemented |
| [FR-005-014](../../features/FEAT-005-guest-access/requirements/FR-005-014-upload-payload-validated.md) | FEAT-005 | An upload is a bounded JSON and base64 payload that is validated | approved | implemented |
| [FR-005-015](../../features/FEAT-005-guest-access/requirements/FR-005-015-attachment-changes-audited.md) | FEAT-005 | Attachment changes are explicit saves, audited without bytes; removal is a soft delete | approved | implemented |
| [FR-005-016](../../features/FEAT-005-guest-access/requirements/FR-005-016-json-backup-excludes-file-bytes.md) | FEAT-005 | The JSON export carries no file bytes; the full PostgreSQL backup does | approved | implemented |
| [FR-006-001](../../features/FEAT-006-member-identity/requirements/FR-006-001-register-member.md) | FEAT-006 | Register a Member from a display name alone | approved | implemented |
| [FR-006-002](../../features/FEAT-006-member-identity/requirements/FR-006-002-rename-keeps-references.md) | FEAT-006 | Renaming a Member keeps every reference | approved | implemented |
| [FR-006-003](../../features/FEAT-006-member-identity/requirements/FR-006-003-inactive-not-offered.md) | FEAT-006 | An Inactive Member is not offered for new assignments | approved | implemented |
| [FR-006-004](../../features/FEAT-006-member-identity/requirements/FR-006-004-inactive-history-and-reactivation.md) | FEAT-006 | An Inactive Member keeps their history and can be made Active again | approved | implemented |
| [FR-006-005](../../features/FEAT-006-member-identity/requirements/FR-006-005-seed-once.md) | FEAT-006 | The weekly seed adds its Members once and never overwrites | approved | implemented |
| [FR-006-006](../../features/FEAT-006-member-identity/requirements/FR-006-006-backup-restore-keeps-members.md) | FEAT-006 | Export and restore keep Member references and never merge Members by name | approved | building |
| [FR-006-007](../../features/FEAT-006-member-identity/requirements/FR-006-007-registry-needs-no-provider.md) | FEAT-006 | The Member registry needs no provider and contacts nobody | approved | implemented |
| [FR-006-008](../../features/FEAT-006-member-identity/requirements/FR-006-008-failed-save-not-reported-saved.md) | FEAT-006 | A failed Member save is never reported as saved | approved | implemented |
| [FR-006-009](../../features/FEAT-006-member-identity/requirements/FR-006-009-pid-server-assigned-immutable.md) | FEAT-006 | A Member’s PID is assigned by the server, unique in the Business, immutable and never reused | approved | implemented |
| [FR-006-010](../../features/FEAT-006-member-identity/requirements/FR-006-010-pid-shown-with-copy.md) | FEAT-006 | The Members view and the Member details show the PID, with a copy action | approved | implemented |
| [FR-006-011](../../features/FEAT-006-member-identity/requirements/FR-006-011-credential-random-hashed-private.md) | FEAT-006 | Each Member’s code is independent and random, stored only as a salted hash | approved | implemented |
| [FR-006-012](../../features/FEAT-006-member-identity/requirements/FR-006-012-provisioning-idempotent.md) | FEAT-006 | Provisioning is idempotent and a Member registered later has a PID but no code | approved | implemented |
| [FR-006-013](../../features/FEAT-006-member-identity/requirements/FR-006-013-private-handover.md) | FEAT-006 | A code is handed over once, privately, and nobody is messaged | approved | implemented |
| [FR-006-014](../../features/FEAT-006-member-identity/requirements/FR-006-014-reset-raises-version.md) | FEAT-006 | Reset, disable and enable name their target and raise the credential version | approved | implemented |
| [FR-006-015](../../features/FEAT-006-member-identity/requirements/FR-006-015-writes-recheck-member.md) | FEAT-006 | Every write rechecks the Member and the credential in its own transaction | approved | implemented |
| [FR-006-016](../../features/FEAT-006-member-identity/requirements/FR-006-016-member-session.md) | FEAT-006 | A Member session is signed, versioned, bounded and distinct from the team cookie | approved | implemented |
| [FR-006-017](../../features/FEAT-006-member-identity/requirements/FR-006-017-session-public-identity-only.md) | FEAT-006 | The session answer carries the public identity only | approved | implemented |
| [FR-006-018](../../features/FEAT-006-member-identity/requirements/FR-006-018-credentials-never-exposed.md) | FEAT-006 | Credentials never appear in a response, a bundle, an export or a Member’s profile | approved | implemented |
| [FR-006-019](../../features/FEAT-006-member-identity/requirements/FR-006-019-server-derives-actor.md) | FEAT-006 | The server derives the actor of every new write from the session | approved | implemented |
| [FR-006-020](../../features/FEAT-006-member-identity/requirements/FR-006-020-earlier-history-keeps-label.md) | FEAT-006 | History written before Member sign-in keeps its original label | approved | implemented |
| [FR-006-021](../../features/FEAT-006-member-identity/requirements/FR-006-021-old-shared-access-rejected.md) | FEAT-006 | The shared team password and the team cookie are rejected, with no fallback | approved | implemented |
| [FR-006-022](../../features/FEAT-006-member-identity/requirements/FR-006-022-local-operator-attribution.md) | FEAT-006 | A local write is attributed to the trusted local operator and never to a Member | approved | implemented |
| [FR-006-023](../../features/FEAT-006-member-identity/requirements/FR-006-023-member-save-paths-keep-identity.md) | FEAT-006 | Both Member save paths resolve the canonical Member and assign the PID the same way | approved | implemented |
| [NFR-006-001](../../features/FEAT-006-member-identity/requirements/NFR-006-001-credential-table-isolation.md) | FEAT-006 | The database isolates the credential table from the runtime role | approved | implemented |
| [FR-007-001](../../features/FEAT-007-single-code-login/requirements/FR-007-001-one-masked-field.md) | FEAT-007 | The sign-in modal has one masked field, รหัสระบุตัวตน, and no PID field | approved | implemented |
| [FR-007-002](../../features/FEAT-007-single-code-login/requirements/FR-007-002-code-cleared.md) | FEAT-007 | The typed code is cleared when the modal closes or sign-in succeeds | approved | implemented |
| [FR-007-003](../../features/FEAT-007-single-code-login/requirements/FR-007-003-code-identifies-member.md) | FEAT-007 | The server identifies the Member from the code alone | approved | implemented |
| [FR-007-004](../../features/FEAT-007-single-code-login/requirements/FR-007-004-ambiguous-code-refused.md) | FEAT-007 | A code that matches more than one credential is refused | approved | implemented |
| [FR-007-005](../../features/FEAT-007-single-code-login/requirements/FR-007-005-inactive-or-disabled-refused.md) | FEAT-007 | A code whose owner is Inactive or whose credential is disabled is refused | approved | implemented |
| [FR-007-006](../../features/FEAT-007-single-code-login/requirements/FR-007-006-uniform-refusal.md) | FEAT-007 | Every refused sign-in gets the same answer and leaks no credential data | approved | implemented |
| [FR-007-007](../../features/FEAT-007-single-code-login/requirements/FR-007-007-caller-identity-ignored.md) | FEAT-007 | A PID or member ID sent by the caller never selects the signed-in Member | approved | implemented |
| [FR-007-008](../../features/FEAT-007-single-code-login/requirements/FR-007-008-provisioning-collision-guard.md) | FEAT-007 | Provisioning and reset refuse a code that collides with another credential | approved | implemented |
| [FR-007-009](../../features/FEAT-007-single-code-login/requirements/FR-007-009-owner-identity-shown-and-attributed.md) | FEAT-007 | The session, the top bar and the audit show the real owner of the code | approved | implemented |
| [FR-007-010](../../features/FEAT-007-single-code-login/requirements/FR-007-010-signin-controls-unchanged.md) | FEAT-007 | Single-code sign-in keeps the controls of Member sign-in | approved | implemented |
| [NFR-007-001](../../features/FEAT-007-single-code-login/requirements/NFR-007-001-signin-cost.md) | FEAT-007 | A sign-in attempt costs at most one scrypt check per credential | approved | implemented |
| [FR-011-001](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-001-teams.md) | FEAT-011-P01 | Teams and team membership | approved | implemented |
| [FR-011-002](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-002-business-admin.md) | FEAT-011-P01 | Business admin capability | approved | implemented |
| [FR-011-003](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-003-viewer-identity.md) | FEAT-011-P01 | Viewer identity on every read | approved | implemented |
| [FR-011-007](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) | FEAT-011-P01 | Guests read public items only | approved | implemented |
| [NFR-011-001](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/NFR-011-001-row-level-security.md) | FEAT-011-P01 | Row-level security enforces the same audiences | approved | implemented |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md). Its features are realised by SRV-001; SRV-002 keeps its data for the trusted local operator (see the runtime line of each feature).
<!-- END GENERATED -->
