---
id: FEAT-012
title: Meeting intake
type: domain-feature
owner: DOM-MTG
runtime: SRV-001
delivery: building
status: approved
legacy: []
relations:
  depends_on: [FEAT-011]
  relates_to: [FEAT-004, FEAT-010, SDD-004]
---

# FEAT-012 — Meeting intake

> **Approved by the owner on 2026-10-01, written the same day from the approved split of [FEAT-004](../FEAT-004-meeting-task-manager/feature.md) (PLAN-002 WI-12).** Nothing is moved, renamed or renumbered: FEAT-004 keeps its ID, folder, files and its requirement register MT-01…MT-29.

A recording made in FUNG on the user’s own machine becomes a reviewed transcript and owned tasks. The user connects to FUNG, brings a recording in, corrects the transcript, receives draft actions with quoted evidence from FUNG’s local model, names who is responsible, and commits the tasks once — a retry never creates them twice. It is used by every department that holds meetings, including confidential ones, whose audience and transcript custody are [FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md)’s.

## Scope
- Connection to a FUNG Desktop on the same machine: loopback only, a pasted Connect URL, the token kept in memory ([FR-012-001](requirements/FR-012-001-fung-local-connection.md)).
- Audio intake through FUNG’s import and job status, with no made-up progress ([FR-012-002](requirements/FR-012-002-audio-intake.md)).
- The transcript as a source snapshot with its provenance, and reviewed revisions kept apart from it ([FR-012-003](requirements/FR-012-003-transcript-provenance.md), [FR-012-004](requirements/FR-012-004-review-revision.md)).
- Draft actions from FUNG’s configured local model, each with evidence that is checked against the reviewed revision ([FR-012-005](requirements/FR-012-005-action-extraction.md), [FR-012-006](requirements/FR-012-006-evidence.md)).
- The meeting commit on the server: assignment and choices checked, idempotent with a receipt, stored in one transaction ([FR-012-007](requirements/FR-012-007-assignment-check.md), [FR-012-008](requirements/FR-012-008-idempotent-commit.md), [FR-012-009](requirements/FR-012-009-commit-one-transaction.md)).
- The whole chain from a chosen recording to a weekly task ([FR-012-010](requirements/FR-012-010-end-to-end.md)).
- The constraint that transcript content is data and never an instruction ([NFR-012-001](requirements/NFR-012-001-transcript-is-data.md)).

Not in this feature: the task records and their rules ([FEAT-010](../FEAT-010-task-manager/feature.md)); who may see a meeting, the audience its tasks inherit and the custody of a confidential transcript ([FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md): FR-011-006, FR-011-009, FR-011-010); the Member registry (MT-20, MT-22, MT-23, MT-24, to [FEAT-006](../FEAT-006-member-identity/feature.md)); the combined backup (MT-14) and the UI and brand rule (MT-17), which FEAT-004 keeps.

## Ownership
- Feature owner: [DOM-MTG](../../domains/meetings/README.md) — Meetings. Type: domain feature. Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator also runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md), as FEAT-004 does.
- Data written by the feature’s own requirements: `meetings`, `meeting_revisions`, `meeting_draft_batches`, `meeting_task_links` (DOM-MTG). The meeting commit also writes task rows, roles, viewers, week entries and history (DOM-TSK) in the same transaction; see Notes.

## Requirement index
Each file holds the requirement and its acceptance criteria. All were approved by the owner on 2026-10-01; the design gaps in their notes stay open for the owner. The MT origin of each is in its Notes; MT numbers are not IDs ([STD-003 R7](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)).

| ID | Requirement | Origin | Delivery |
|---|---|---|---|
| [FR-012-001](requirements/FR-012-001-fung-local-connection.md) | Connection to FUNG on this machine | MT-05 | implemented |
| [FR-012-002](requirements/FR-012-002-audio-intake.md) | Audio intake through FUNG | MT-06 | building |
| [FR-012-003](requirements/FR-012-003-transcript-provenance.md) | Transcript source snapshot and its provenance | MT-07 | implemented |
| [FR-012-004](requirements/FR-012-004-review-revision.md) | Reviewed revision of a transcript | MT-08 | implemented |
| [FR-012-005](requirements/FR-012-005-action-extraction.md) | Action drafts from a reviewed revision | MT-09 | building |
| [FR-012-006](requirements/FR-012-006-evidence.md) | Evidence for every drafted task | MT-10 | implemented |
| [FR-012-007](requirements/FR-012-007-assignment-check.md) | Assignment and choices are checked before a meeting commit | MT-11 | implemented |
| [FR-012-008](requirements/FR-012-008-idempotent-commit.md) | Idempotent meeting commit with a receipt | MT-12 | implemented |
| [FR-012-009](requirements/FR-012-009-commit-one-transaction.md) | A meeting commit is stored in one transaction | MT-13 | implemented |
| [FR-012-010](requirements/FR-012-010-end-to-end.md) | From a chosen recording to a weekly task, end to end | MT-18 | building |
| [NFR-012-001](requirements/NFR-012-001-transcript-is-data.md) | Transcript content is data, never instructions | MT-15 | implemented |

## Documents
- Design: [SDD-004](../FEAT-004-meeting-task-manager/design.md) stays where it is and designs this feature too — the FUNG connector (sections 3.1 to 3.4, Thai) and the “Proposed amendment — server-side meeting commit (PLAN-002 WI-09)”, which the owner approved on 2026-10-01. This feature has no `design.md` of its own (PLAN-002 WI-12).
- Origin of the requirements: [spec.md](../FEAT-004-meeting-task-manager/spec.md) section 5 (MT-05…MT-18) and the “Proposed split” of [feature.md](../FEAT-004-meeting-task-manager/feature.md).
- Verification: [FEAT-004 verification](../FEAT-004-meeting-task-manager/verification.md) (2026-09-30, the MT rows) and [0.5.0 verification](../../releases/0.5.0/verification.md) (2026-10-01, the server commit in production). There is no `verification.md` of this feature and no `TC-012-…` binding yet (PLAN-001 WI-08).

## Delivery evidence
- `delivery` is `building` because three requirements are not accepted: FR-012-002 (real upload and transcription with an installed FUNG not run), FR-012-005 (inference with a real configured model not run) and FR-012-010 (PARTIAL in the FEAT-004 verification: the browser chain ran after a supplied transcript, against a fixture, on the IndexedDB build). The other eight are as implemented as their sources say; the judgement per requirement is in its Implementation and Notes.
- Local checks run on 2026-10-01 for this document: the 36 tests of `apps/web/src/content/meeting/model.test.mjs` passed (no database needed). The tests against PostgreSQL (`apps/api/test/meeting-commit.test.mjs` and others) were not run for this document; the release record of 0.5.0 reports 160 Node tests passing on the release commit `7bb538c`, and `apps/` and `scripts/` are unchanged since it.
- The server-side commit was released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest write answered 401 and the route is in the package. A Member’s commit, a restricted-meeting participant’s commit and every browser check on production are not yet run ([verification](../../releases/0.5.0/verification.md)).
- Acceptance of the installed FUNG Desktop, real audio and model inference is NOT_RUN ([FEAT-004 verification](../FEAT-004-meeting-task-manager/verification.md), “Remaining acceptance”). The FUNG adapter routes live in a separate repository and were not inspected here.

## Notes
- Origin. The FR and NFR files were written from [spec.md](../FEAT-004-meeting-task-manager/spec.md) section 5 (Thai), the approved split in FEAT-004 and PLAN-002 WI-12, and the code as it is on 2026-10-01. Meaning is kept as MT-nn states it; where the current behavior is narrower or differs, the requirement says so in its Notes.
- Relations. `depends_on` names [FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md) because the commit gives a restricted meeting’s tasks its audience and works on custody stubs (FR-011-009, FR-011-010). [FEAT-010](../FEAT-010-task-manager/feature.md) is only `relates_to`, because the commit writes tasks through `writeDomain`, the write path of the whole-workspace save, and not through the per-task create of FR-010-009; [ADR-002](../../architecture/decisions.md) D2 says a meeting creates tasks through the task domain’s contract, and whether today’s in-process call satisfies it is the owner’s decision. If it does not, the dependency becomes `depends_on` FEAT-010 when the commit is moved onto that operation.
- What remains in FEAT-004. The requirement register MT-01…MT-29, its delivered 0.3.0 documents and SDD-004. FEAT-004’s requirement index points each of MT-05…MT-13, MT-15 and MT-18 to its file here (“Proposed split”, step 5).
- MT-11, MT-12 and MT-13 have a task side in FEAT-010 (FR-010-009 AC-010-009-05 and -07, FR-010-007, FR-010-019); the DOM-MTG side is here.
- The local browser-storage mode of the 0.3.0 build is still in the code (`openRepository`); without a server workspace the client commits on its own and the server guarantees of FR-012-008 and FR-012-009 do not apply. The requirements describe the server workspace.
