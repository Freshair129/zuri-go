---
id: DOM-MTG
title: Meetings
status: proposed
relations:
  supersedes: [DOM-WRK]
---

# DOM-MTG — Meetings

> **Proposed** by [ADR-002](../../architecture/decisions.md): together with the other half of the split it replaces DOM-WRK.

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
- Planned ([ADR-004](../../architecture/decisions.md)): `meeting_participants`; on `meetings`: `visibility`, `team_id`, `project_id`, `transcript_custody`
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- A task created from a transcript comes from a reviewed revision and is idempotent: replaying the same request leaves one task ([FEAT-004 verification](../../features/FEAT-004-meeting-task-manager/verification.md)).
- Sending a transcript to the cloud sends its content to a new destination: the user chooses and sees the scope first ([ARCH-001 §5](../../architecture/ARCH-001-baseline-architecture.md)).
- Proposed: a meeting creates tasks only through the task records’ contract ([ADR-002](../../architecture/decisions.md)).
- Approved 2026-10-01, being built: a confidential meeting is `restricted` to its participants, and its transcript stays on the recording machine unless someone uploads it by an explicit, audited choice ([ADR-004](../../architecture/decisions.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `supporting` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

None yet.

**Participating cross-domain features**

| Feature | Part | Role | Delivery |
|---|---|---|---|
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | [FEAT-011-P03](../../features/FEAT-011-visibility-and-confidential-meetings/parts/P03-meetings.md) | Visibility, participants and transcript custody of meetings | building |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
