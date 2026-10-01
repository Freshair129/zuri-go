---
id: FEAT-007
title: Single-code login
type: domain-feature
owner: DOM-IAM
runtime: SRV-001
delivery: implemented
status: proposed
legacy: [ZGO-AUTH-003]
relations:
  depends_on: [FEAT-006]
  relates_to: [ARCH-003]
---

# FEAT-007 — Single-code login

The sign-in modal has one masked field, **รหัสระบุตัวตน**. The server resolves exactly one active, enabled credential owner across the Business; a caller-supplied PID or member ID never selects the actor.

## Scope
- Existing personal codes stay valid; no code is reissued and no schema changes.
- No match, several matches, an inactive Member or a disabled credential all give the same error and never reveal which accounts matched.
- Provisioning and reset reject a code that collides with another credential in the Business.
- Input validation, same-origin checks, persistent rate limits, signed HttpOnly/Secure/SameSite cookies, expiry and the credential-version recheck are unchanged.

## Ownership
- Feature owner: [DOM-IAM](../../domains/identity-access/README.md) — Identity & access. Type: domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md). The local runtime [SRV-002](../../services/SRV-002-local/SERVICE.md) is a trusted operator workspace without Guest mode or Member sign-in; this feature does not run there.

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Approved change “เข้าสู่ระบบด้วยรหัสระบุตัวตนช่องเดียว” | `docs/architecture/identity-code-login-spec.md` | v0.4.2 · 2026-09-30 · legacy `ZGO-AUTH-003` |

## Requirement index
Written on 2026-10-01 from the approved [spec.md](spec.md) (PLAN-001 WI-06) and approved by the owner the same day (PLAN-003 G4). Each file cites the spec section it comes from, holds its acceptance criteria and records its delivery evidence. No TC binds to them yet (WI-08). Spec acceptance items map as follows: 1 to FR-007-003; 2 to FR-007-004 and FR-007-006; 3 to FR-007-007; 4 to FR-007-005 and FR-007-010; 5 to FR-007-009; 6 to FR-007-001, -002 and -009; 7 (backend tests, build, packaging and the browser report) and the data-preservation half of item 5 are obligations of release 0.4.2, met in its [record](../../releases/0.4.2/verification.md), not standing requirements. “Guest อ่านได้เหมือนเดิม” was narrowed on 2026-10-01 by [FR-011-007](../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md); it is cited there, not restated.

| ID | Requirement | Delivery |
|---|---|---|
| [FR-007-001](requirements/FR-007-001-one-masked-field.md) | The sign-in modal has one masked field, รหัสระบุตัวตน, and no PID field | implemented |
| [FR-007-002](requirements/FR-007-002-code-cleared.md) | The typed code is cleared when the modal closes or sign-in succeeds | implemented |
| [FR-007-003](requirements/FR-007-003-code-identifies-member.md) | The server identifies the Member from the code alone | implemented |
| [FR-007-004](requirements/FR-007-004-ambiguous-code-refused.md) | A code that matches more than one credential is refused | implemented |
| [FR-007-005](requirements/FR-007-005-inactive-or-disabled-refused.md) | A code whose owner is Inactive or whose credential is disabled is refused | implemented |
| [FR-007-006](requirements/FR-007-006-uniform-refusal.md) | Every refused sign-in gets the same answer and leaks no credential data | implemented |
| [FR-007-007](requirements/FR-007-007-caller-identity-ignored.md) | A PID or member ID sent by the caller never selects the signed-in Member | implemented |
| [FR-007-008](requirements/FR-007-008-provisioning-collision-guard.md) | Provisioning and reset refuse a code that collides with another credential | implemented |
| [FR-007-009](requirements/FR-007-009-owner-identity-shown-and-attributed.md) | The session, the top bar and the audit show the real owner of the code | implemented |
| [FR-007-010](requirements/FR-007-010-signin-controls-unchanged.md) | Single-code sign-in keeps the controls of Member sign-in | implemented |
| [NFR-007-001](requirements/NFR-007-001-signin-cost.md) | A sign-in attempt costs at most one scrypt check per credential | implemented |

The delivery values rest on the current code and the tests named in each file, run on 2026-10-01 against the local database (15 tests of `cloud-handler` and `member-auth`, 4 of `team-auth`), and on the 0.4.2 and 0.5.1 records; the browser interaction of the single-code modal (FR-007-002, the resumed action of FR-007-009) was never run, and the number of scrypt checks that the spec asks to record is not in the 0.4.2 record.

## Delivery evidence
- Release evidence: [releases/0.4.2](../../releases/0.4.2/verification.md) — staged and production HTTP/API checks passed; browser visual and resumed-write interaction are NOT_RUN.
