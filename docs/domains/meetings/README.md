---
id: DOM-MTG
title: Meetings
status: proposed
relations:
  supersedes: [DOM-WRK]
---

# DOM-MTG — Meetings

> **Adopted** with [ADR-002](../../architecture/decisions.md), approved 2026-10-01: together with the other half of the split it replaces DOM-WRK.

Meetings of every department turned into a reviewed record and owned work: recordings and transcripts from FUNG, reviewed revisions, and drafts of tasks, decisions and questions with quoted evidence — including confidential meetings seen only by their participants.

## Language
- Meeting
- Organizer and participant
- Confidential (restricted) meeting
- Source snapshot (transcript)
- Review revision
- Transcript custody (local only / cloud)
- Draft batch
- Proposal (task / decision / question)
- Evidence quote
- Commit receipt
- FUNG

## Owned data
- `meetings`
- `meeting_revisions`
- `meeting_draft_batches`
- `meeting_task_links`
- Released to production on 2026-10-01 with 0.5.0 ([ADR-004](../../architecture/decisions.md); schema 6; [verification](../../releases/0.5.0/verification.md)): `meeting_participants`; on `meetings`: `visibility`, `team_id`, `transcript_custody`.
- Planned, no migration yet: `meetings.project_id`.
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- A task created from a transcript comes from a reviewed revision and is idempotent: replaying the same request leaves one task ([FEAT-004 verification](../../features/FEAT-004-meeting-task-manager/verification.md)); today’s server commit states it in [FR-012-008](../../features/FEAT-012-meeting-intake/requirements/FR-012-008-idempotent-commit.md) and [FR-012-009](../../features/FEAT-012-meeting-intake/requirements/FR-012-009-commit-one-transaction.md).
- Sending a transcript to the cloud sends its content to a new destination: the user chooses and sees the scope first ([ARCH-001 §5](../../architecture/ARCH-001-baseline-architecture.md)).
- Approved 2026-10-01: a meeting creates tasks only through the task records’ contract ([ADR-002](../../architecture/decisions.md)); the contract is the idempotent create of [FR-010-009](../../features/FEAT-010-task-manager/requirements/FR-010-009-task-api-create-update.md) ([SDD-010](../../features/FEAT-010-task-manager/design.md#api-contract-proposed)), and tasks from a confidential meeting follow [FR-011-009](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-009-confidential-meeting-tasks.md). Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D1): the server commit writes its tasks through `writeDomain`, not the per-task create; that in-process call applies the same task rules, audit and single transaction and counts as the contract.
- Approved 2026-10-01 and released to production the same day with 0.5.0 (schema 6): a confidential meeting is `restricted` to its participants, and its transcript stays on the recording machine unless someone uploads it by an explicit, audited choice ([ADR-004](../../architecture/decisions.md)). The interim rule of ADR-004 D9 (no confidential content in production) ended for meetings on that date ([verification](../../releases/0.5.0/verification.md)); the hosted restricted-meeting checks with two participants are the owner's and are not yet run.
- Approved 2026-10-01, built and released with 0.5.0 (production held 0 meetings, so it shipped in the one release): the server-side meeting commit, an amendment to [SDD-004](../../features/FEAT-004-meeting-task-manager/design.md#proposed-amendment--server-side-meeting-commit-plan-002-wi-09) ([PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md) WI-09, Q15). Tasks of a restricted meeting get its audience, fixed at commit; tasks of a `team` meeting stay `business`; anyone who can read the meeting may commit.
- Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01); the code of D2, D4, D6 and D14 was released on 2026-10-01 in 0.5.1): an Inactive participant of a restricted meeting is access, not work, so they no longer block the commit and stay in the audience, while an Inactive R or A is still refused (D2, [FR-012-007](../../features/FEAT-012-meeting-intake/requirements/FR-012-007-assignment-check.md) AC-012-007-07); with a server workspace the commit is allowed without a connected FUNG, the server still compares the stored review and source hashes, and the screen says the FUNG comparison was skipped (D4, [FR-012-008](../../features/FEAT-012-meeting-intake/requirements/FR-012-008-idempotent-commit.md) AC-012-008-08); the commit screen names where the work is saved (D6); history events of the created tasks keep no evidence quote (D14, [FR-011-009](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-009-confidential-meeting-tasks.md) AC-011-009-05). The FUNG status screens stay narrower than the spec for now (D15).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. The one write endpoint of this domain’s intake, `POST /businesses/{businessId}/meeting-commits`, is specified by [FR-012-008](../../features/FEAT-012-meeting-intake/requirements/FR-012-008-idempotent-commit.md) and the SDD-004 amendment, and is the candidate first API- artifact. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `supporting` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Type | Status | Delivery |
|---|---|---|---|
| [FEAT-012](../../features/FEAT-012-meeting-intake/feature.md) — Meeting intake | domain feature | approved | building |

FEAT-012 is the meeting intake that leaves FEAT-004 (“Proposed split”, PLAN-002 WI-12): FUNG connection, audio intake, transcript provenance and review, draft actions with evidence, and the server-side meeting commit. Its FR and NFR files were written on 2026-10-01 from the MT-05…MT-18 rows of the FEAT-004 register and the code; the owner approved them the same day.

**Requirements owned or used**

| Requirement | Status | Title |
|---|---|---|
| [FR-012-001](../../features/FEAT-012-meeting-intake/requirements/FR-012-001-fung-local-connection.md) | approved, implemented | Connection to FUNG on this machine (from MT-05) |
| [FR-012-002](../../features/FEAT-012-meeting-intake/requirements/FR-012-002-audio-intake.md) | approved, building | Audio intake through FUNG (from MT-06) |
| [FR-012-003](../../features/FEAT-012-meeting-intake/requirements/FR-012-003-transcript-provenance.md) | approved, implemented | Transcript source snapshot and its provenance (from MT-07) |
| [FR-012-004](../../features/FEAT-012-meeting-intake/requirements/FR-012-004-review-revision.md) | approved, implemented | Reviewed revision of a transcript (from MT-08) |
| [FR-012-005](../../features/FEAT-012-meeting-intake/requirements/FR-012-005-action-extraction.md) | approved, building | Action drafts from a reviewed revision (from MT-09) |
| [FR-012-006](../../features/FEAT-012-meeting-intake/requirements/FR-012-006-evidence.md) | approved, implemented | Evidence for every drafted task (from MT-10) |
| [FR-012-007](../../features/FEAT-012-meeting-intake/requirements/FR-012-007-assignment-check.md) | approved, implemented, released 2026-10-01 | Assignment and choices are checked before a meeting commit (from MT-11) |
| [FR-012-008](../../features/FEAT-012-meeting-intake/requirements/FR-012-008-idempotent-commit.md) | approved, implemented, released 2026-10-01 | Idempotent meeting commit with a receipt (from MT-12) |
| [FR-012-009](../../features/FEAT-012-meeting-intake/requirements/FR-012-009-commit-one-transaction.md) | approved, implemented, released 2026-10-01 | A meeting commit is stored in one transaction (from MT-13) |
| [FR-012-010](../../features/FEAT-012-meeting-intake/requirements/FR-012-010-end-to-end.md) | approved, building | From a chosen recording to a weekly task, end to end (from MT-18) |
| [NFR-012-001](../../features/FEAT-012-meeting-intake/requirements/NFR-012-001-transcript-is-data.md) | approved, implemented | Transcript content is data, never instructions (from MT-15) |
| [FR-011-006](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-006-meeting-visibility.md) | approved, implemented, released 2026-10-01 | Visibility and participants of meetings |
| [FR-011-010](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-010-transcript-custody.md) | approved, implemented, released 2026-10-01 | Custody of confidential transcripts |
| [FR-011-009](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-009-confidential-meeting-tasks.md) | approved, implemented, released 2026-10-01 | Tasks from a confidential meeting (owned by the DOM-TSK part of FEAT-011) |
| [FR-010-009](../../features/FEAT-010-task-manager/requirements/FR-010-009-task-api-create-update.md) | approved, implemented, released 2026-10-01 | Task API — idempotent create (the contract ADR-002 names for the meeting commit; the commit as built writes through `writeDomain`, see [FEAT-012](../../features/FEAT-012-meeting-intake/feature.md) Notes) |

**Participating cross-domain features**

| Feature | Part | Role | Delivery |
|---|---|---|---|
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | [FEAT-011-P03](../../features/FEAT-011-visibility-and-confidential-meetings/parts/P03-meetings.md) | Visibility, participants and transcript custody of meetings | implemented |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
