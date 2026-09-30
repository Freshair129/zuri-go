---
id: FEAT-005
title: Guest read-only access and task evidence
type: domain-feature
owner: DOM-IAM
runtime: SRV-001
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [ARCH-003]
---

# FEAT-005 — Guest read-only access and task evidence

An anonymous visitor reads the live workspace immediately in Guest mode; any create, edit or delete intent asks for sign-in first, and a Guest write attempt is rejected by the API. The same specification covers task evidence attachments: images and files on saved tasks, at most 2 MiB each and 5 active per task — Guests may list and download, a signed-in Member uploads and removes.

## Scope
- Session bootstrap and business reads are public and limited to the configured Business; Guest mutations return 401 and change nothing.
- A write intent opens the sign-in modal before the action starts; after sign-in the chosen action resumes, cancel leaves state unchanged.
- Expired sessions fall back to Guest mode; logout keeps the readable workspace visible.
- Evidence attachments: signature-checked raster previews only, every other file downloads as octet-stream with nosniff and a sandbox CSP; removal is a soft delete; changes are audited without file bytes.

## Ownership
- Feature owner: [DOM-IAM](../../domains/identity-access/README.md) — Identity & access. Type: domain feature. Provisional: the evidence attachments are DOM-WRK data (`task_attachments`), which would make this a cross-domain feature under STD-001 R4 — open in PLAN-001 WI-14 (question 1).
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md). The local runtime [SRV-002](../../services/SRV-002-local/SERVICE.md) is a trusted operator workspace without Guest mode or Member sign-in; only the evidence-attachment endpoints run there, without Guest restrictions.

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Specification (0.3.1) with the 0.4.0 and 0.4.2 amendment notes | `docs/architecture/guest-access-spec.md` | v0.3.1 · 2026-09-30 |

## Requirement index
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Verification list: [spec.md](spec.md) “Verification” and the verification bullet under “Evidence attachments”.

## Delivery evidence
- Verified and promoted to production, including production-browser Guest and file checks: [history/zuri-go-guest-review](../../history/zuri-go-guest-review/verification.md).

## Notes
- Amended by [FEAT-006](../FEAT-006-member-identity/feature.md) (shared-team password replaced) and [FEAT-007](../FEAT-007-single-code-login/feature.md) (single code). Guest visibility, the write-intent modal, action resume, file limits and downloads are unchanged.
- The attachments section is a candidate for its own DOM-WRK feature (PLAN-001 WI-14).
