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
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Acceptance / success / exit criteria: [spec.md](spec.md) “Acceptance / success / exit criteria”.

## Delivery evidence
- Release evidence: [releases/0.4.2](../../releases/0.4.2/verification.md) — staged and production HTTP/API checks passed; browser visual and resumed-write interaction are NOT_RUN.
