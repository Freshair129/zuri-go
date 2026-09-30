---
id: FEAT-011-P03
title: Visibility, teams and confidential meetings — Meetings
owner: DOM-MTG
runtime: SRV-001
delivery: declared
status: proposed
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FEAT-011-P03 — Visibility, participants and transcript custody of meetings

Part of [FEAT-011](../feature.md), owned by [DOM-MTG](../../../domains/meetings/README.md). Proposed, not built.

## Scope
- Meeting visibility and participants; confidential meetings restricted to their participants.
- Transcript custody: local only by default for confidential meetings; an upload is explicit and audited.
- Evidence quotes from a confidential meeting shown only to its audience.

## Data
- planned `meeting_participants`; `visibility`, `team_id`, `project_id` and `transcript_custody` on `meetings`

## Boundary
Hands the meeting audience to FEAT-011-P02 when a meeting creates tasks.

## Requirements
- [FR-011-006](../requirements/FR-011-006-meeting-visibility.md) — Visibility and participants of meetings
- [FR-011-010](../requirements/FR-011-010-transcript-custody.md) — Custody of confidential transcripts
