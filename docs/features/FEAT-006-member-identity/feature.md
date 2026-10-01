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
FR-006-001 to -008 were approved by the owner on 2026-10-01: they hold the Member-registry requirements of [FEAT-004](../FEAT-004-meeting-task-manager/feature.md) written here under its approved split (PLAN-002 WI-12, decided 2026-10-01, delegated by the owner); FEAT-004 and its MT numbers are unchanged. Each of those files records its FEAT-004 origin in its notes and holds its acceptance criteria. FR-006-009 to -023 and NFR-006-001 were written on 2026-10-01 from the approved PID and individual sign-in contract, [spec.md](spec.md) (PLAN-001 WI-06), as `status: proposed`; the owner approves them (PLAN-003 G4). Each cites the spec section it comes from and records its delivery evidence. No TC binds to these requirements yet (WI-08).

Spec map for the sign-in contract: §6 “Acceptance / success / exit criteria” bullet 1 (four credentials authenticate the intended Member; a correct password with another PID fails) is now the single-code sign-in of [FEAT-007](../FEAT-007-single-code-login/feature.md) (FR-007-003, FR-007-007); bullet 2 to FR-006-009 and FR-006-023; bullet 3 (Guest reads, writes need an individual session) to [FEAT-005](../FEAT-005-guest-access/feature.md) FR-005-001 and FR-005-003; bullet 4 to FR-006-019 and FR-006-020; bullet 5 to FR-006-014, -015, -016 and -021; bullet 6 to FR-006-013 and FR-006-018; bullets 7 and 8 (tests, staged and production checks, document amendments) are obligations of release 0.4.0, met in its [record](../../history/zuri-go-member-review/verification.md). §2 (the modal asking for a PID and a personal password) is superseded by FR-007-001. §1 assumption 2 (all active Members have the same editor permissions, no permission matrix) was changed on 2026-10-01 by [FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md) (the Business admin, visibility) and decision D3 (FR-006-001 AC-006-001-07); it is cited, not restated. §5 and the one-time migration, handover and rollout steps are release procedure, not requirements.

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
| [FR-006-009](requirements/FR-006-009-pid-server-assigned-immutable.md) | A Member’s PID is assigned by the server, unique in the Business, immutable and never reused | implemented |
| [FR-006-010](requirements/FR-006-010-pid-shown-with-copy.md) | The Members view and the Member details show the PID, with a copy action | implemented |
| [FR-006-011](requirements/FR-006-011-credential-random-hashed-private.md) | Each Member’s code is independent and random, stored only as a salted hash | implemented |
| [FR-006-012](requirements/FR-006-012-provisioning-idempotent.md) | Provisioning is idempotent and a Member registered later has a PID but no code | implemented |
| [FR-006-013](requirements/FR-006-013-private-handover.md) | A code is handed over once, privately, and nobody is messaged | implemented |
| [FR-006-014](requirements/FR-006-014-reset-raises-version.md) | Reset, disable and enable name their target and raise the credential version | implemented |
| [FR-006-015](requirements/FR-006-015-writes-recheck-member.md) | Every write rechecks the Member and the credential in its own transaction | implemented |
| [FR-006-016](requirements/FR-006-016-member-session.md) | A Member session is signed, versioned, bounded and distinct from the team cookie | implemented |
| [FR-006-017](requirements/FR-006-017-session-public-identity-only.md) | The session answer carries the public identity only | implemented |
| [FR-006-018](requirements/FR-006-018-credentials-never-exposed.md) | Credentials never appear in a response, a bundle, an export or a Member’s profile | implemented |
| [FR-006-019](requirements/FR-006-019-server-derives-actor.md) | The server derives the actor of every new write from the session | implemented |
| [FR-006-020](requirements/FR-006-020-earlier-history-keeps-label.md) | History written before Member sign-in keeps its original label | implemented |
| [FR-006-021](requirements/FR-006-021-old-shared-access-rejected.md) | The shared team password and the team cookie are rejected, with no fallback | implemented |
| [FR-006-022](requirements/FR-006-022-local-operator-attribution.md) | A local write is attributed to the trusted local operator and never to a Member | implemented |
| [FR-006-023](requirements/FR-006-023-member-save-paths-keep-identity.md) | Both Member save paths resolve the canonical Member and assign the PID the same way | implemented |
| [NFR-006-001](requirements/NFR-006-001-credential-table-isolation.md) | The database isolates the credential table from the runtime role | implemented |

FR-006-006 is `building`: restoring a backup over a PostgreSQL workspace is not supported from the screen, and no restore has been run on production. The other delivery values rest on the current code and the model tests named in each file; the hosted Member checks and the browser checks are not yet run ([release verification](../../releases/0.5.0/verification.md)).

The delivery values of FR-006-009 to -023 and NFR-006-001 rest on the current code, the tests named in each file (run on 2026-10-01 against the local database: 15 tests of `cloud-handler` and `member-auth`, 13 of `meeting-commit`, 38 of the meeting model) and the 0.4.0 and 0.4.2 records; the owner reported on 2026-10-01 that production sign-in as a Member passed ([0.5.1 verification](../../releases/0.5.1/verification.md)), which the agent did not observe. Not covered by a committed test: concurrency of a reset against a write, the PID of a Member created by a workspace save, the profile metadata and export checks, and the screens.

## Delivery evidence
- Deployed and promoted to production: [history/zuri-go-member-review](../../history/zuri-go-member-review/verification.md).

## Notes
- Migration `005_member_identity.sql` preserves every Member UUID; see [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) (0.4.0 amendment).
