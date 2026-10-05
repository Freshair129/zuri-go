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
  decided_by: [ADR-008]
  relates_to: [ARCH-003]
---

# FEAT-005 — Guest read-only access and task evidence

An anonymous visitor reads every non-secret record in the configured Business immediately in Guest mode, while all Guest mutations and approvals are rejected. Every active signed-in Member has the same CRUD and internal approval rights for every mutable non-secret Business record. This approved ADR-008 policy is declared for implementation; existing release evidence below records the earlier runtime behavior.

## Scope
- Session bootstrap and reads return all non-secret records in the configured Business; Guest mutations and approvals return 401 and change nothing.
- A write intent opens the sign-in modal before the action starts; after sign-in the chosen action resumes, cancel leaves state unchanged.
- Expired sessions fall back to Guest mode; logout keeps the readable workspace visible.
- Every active Member may create, read, update and remove mutable non-secret records and perform internal approvals, regardless of audience, team, owner or assignment metadata.
- Evidence attachments are Business-scoped: Guests may list and download every non-secret attachment; active Members may add, update and remove them. Signature-checked raster previews only; every other file downloads as octet-stream with nosniff and a sandbox CSP. Changes are audited without file bytes; audit events remain append-only.
- Credential/session/provider/operator secrets remain hidden, every request stays in the configured Business, and provider, spend, publication and deployment gates remain separate.

## Ownership
- Feature owner: [DOM-IAM](../../domains/identity-access/README.md) — Identity & access. Type: domain feature. Provisional: the evidence attachments are DOM-TSK data (`task_attachments`), which would make this a cross-domain feature under STD-001 R4 — PLAN-001 WI-14 (question 1).
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md). The local runtime [SRV-002](../../services/SRV-002-local/SERVICE.md) is a trusted operator workspace without Guest mode or Member sign-in; only the evidence-attachment endpoints run there, without Guest restrictions.

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Specification (0.3.1) with the 0.4.0 and 0.4.2 amendment notes | `docs/architecture/guest-access-spec.md` | v0.3.1 · 2026-09-30 |

## Requirement index
Written on 2026-10-01 from the approved [spec.md](spec.md) (PLAN-001 WI-06) and approved by the owner the same day (PLAN-003 G4). Each file cites the spec section it comes from, holds its acceptance criteria and records its delivery evidence. No TC binds to them yet (WI-08). Spec map: “Behavior” bullet 1 to FR-005-001; 2 to FR-005-002; 3 to FR-005-003; 4 to FR-005-004, -005 and -006; 5 to FR-005-007 and -008; bullet 6 (the shared team password) was superseded by [FEAT-006](../FEAT-006-member-identity/feature.md) and [FEAT-007](../FEAT-007-single-code-login/feature.md) and is not a requirement. “Verification” items 1 to 4 map to the same files; item 5 (build, regression tests, production browser checks, redeploy) is a release obligation, met in the [guest review](../../history/zuri-go-guest-review/verification.md). “Evidence attachments” bullet 1 to FR-005-009 and FR-005-010; 2 to FR-005-011; 3 to FR-005-012 and FR-005-013; 4 to FR-005-010, -014 and -015; 5 to FR-005-016; 6 (the verification list) is covered by the acceptance criteria of those files. Amended since: the Guest read narrowed to public items and attachments follow their task ([FR-011-007](../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md), [FR-011-008](../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-008-content-follows-item.md)); these are cited in FR-005-001, -002, -006 and -012, not restated.

| ID | Requirement | Delivery |
|---|---|---|
| [FR-005-001](requirements/FR-005-001-guest-opens-workspace.md) | An anonymous visitor opens the live workspace in Guest mode with no login wall | declared |
| [FR-005-002](requirements/FR-005-002-public-reads-business-scoped.md) | Guest reads are Business-scoped and include every non-secret record | declared |
| [FR-005-003](requirements/FR-005-003-writes-need-member-session.md) | Mutations need an active Member session; Guests remain read-only | declared |
| [FR-005-004](requirements/FR-005-004-write-intent-opens-sign-in.md) | A write intent opens the sign-in modal before the action starts | implemented |
| [FR-005-005](requirements/FR-005-005-action-resumes.md) | After a successful sign-in the chosen action continues | implemented |
| [FR-005-006](requirements/FR-005-006-readonly-views-stay-available.md) | Navigation, filtering, metric details and read-only views need no sign-in | implemented |
| [FR-005-007](requirements/FR-005-007-expired-session-falls-back-to-guest.md) | An expired session falls back to Guest mode and the next write asks to sign in | implemented |
| [FR-005-008](requirements/FR-005-008-logout-keeps-workspace-readable.md) | Logout clears the session and keeps the workspace readable | implemented |
| [FR-005-009](requirements/FR-005-009-attachments-on-saved-tasks.md) | Files and images attach to a saved task only, beside the existing evidence text | implemented |
| [FR-005-010](requirements/FR-005-010-attachment-limits.md) | A file is at most 2 MiB and a task holds at most 5 active files | implemented |
| [FR-005-011](requirements/FR-005-011-attachment-storage.md) | Files are stored in PostgreSQL with their metadata and hash, scoped to the Business | implemented |
| [FR-005-012](requirements/FR-005-012-attachment-access-by-role.md) | Guests read evidence files; active Members manage them | declared |
| [FR-005-013](requirements/FR-005-013-safe-preview-and-download.md) | Only signature-checked raster images preview; every other file downloads inert | implemented |
| [FR-005-014](requirements/FR-005-014-upload-payload-validated.md) | An upload is a bounded JSON and base64 payload that is validated | implemented |
| [FR-005-015](requirements/FR-005-015-attachment-changes-audited.md) | Attachment changes are explicit saves, audited without bytes; removal is a soft delete | implemented |
| [FR-005-016](requirements/FR-005-016-json-backup-excludes-file-bytes.md) | The JSON export carries no file bytes; the full PostgreSQL backup does | implemented |

The delivery values rest on the current code, the tests named in each file (run on 2026-10-01 against the local database: 15 tests of `cloud-handler` and `member-auth`) and the 0.3.1, 0.5.0 and 0.5.1 records. Not browser-checked since the single code of 0.4.2: the resumed action (FR-005-005) and the expiry prompt (FR-005-007). FR-005-009 to -016 are the attachments section; if it becomes its own DOM-TSK feature (PLAN-001 WI-14) they are re-declared there with `supersedes`.

## Delivery evidence
- Verified and promoted to production, including production-browser Guest and file checks: [history/zuri-go-guest-review](../../history/zuri-go-guest-review/verification.md).

## Notes
- Approved 2026-10-05: [ADR-008](../../architecture/decisions.md) supersedes the prior public-only Guest rule and audience-based Member restrictions. This access policy is implemented in local source, but final-candidate database verification is NOT_RUN after the command runner rejected bootstrap; the delivery evidence above is historical.
- Amended by [FEAT-006](../FEAT-006-member-identity/feature.md) (shared-team password replaced) and [FEAT-007](../FEAT-007-single-code-login/feature.md) (single code). The write-intent modal, action resume, file limits and safe downloads remain part of the feature.
- The attachments section is a candidate for its own DOM-TSK feature (PLAN-001 WI-14).
- Historical 0.5.0 release rule: the Guest view narrowed to public items and attachments followed task visibility. ADR-008 supersedes those access restrictions.
