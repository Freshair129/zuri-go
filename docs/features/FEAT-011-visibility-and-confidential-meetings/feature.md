---
id: FEAT-011
title: Visibility, teams and confidential meetings
type: cross-domain-feature
owner: DOM-IAM
runtime: SRV-001
participants:
  - domain: DOM-IAM
    part: FEAT-011-P01
    role: Teams, Business admin, viewer identity and the Guest rule
  - domain: DOM-TSK
    part: FEAT-011-P02
    role: Visibility of tasks and projects, and of their attachments and history
  - domain: DOM-MTG
    part: FEAT-011-P03
    role: Visibility, participants and transcript custody of meetings
delivery: declared
status: proposed
legacy: []
relations:
  depends_on: [FEAT-006]
  decided_by: [ADR-004]
  relates_to: [FEAT-005, FEAT-010]
---

# FEAT-011 — Visibility, teams and confidential meetings

> **Proposed, not built.** Declared by [ADR-004](../../architecture/decisions.md) for the owner's review; the delivery plan is [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md). Nothing in the application, schema or data has changed.

Every department can use the workspace without exposing its work. Tasks, projects and meetings carry a visibility level — public, business, team or restricted — which the API and row-level security both enforce. Guests see only public items; confidential meetings are seen only by their participants, and their transcripts stay on the recording machine unless someone chooses to upload them.

## Scope
- Teams (ฝ่าย) and team membership, managed by a Business admin ([ADR-004](../../architecture/decisions.md) D7).
- Visibility levels and named viewers on tasks, projects and meetings; tasks inherit a confidential meeting’s audience (D1–D2).
- The Guest view is limited to public items on every read path (D3).
- Transcript segments, evidence quotes, attachments, history, the overview, AI-summary input, search, exports and backups follow each item’s visibility (D4).
- Transcripts of confidential meetings stay on the recording machine by default (D5).
- Enforcement in both the API and row-level security; the trusted local operator is unchanged (D6).
- Widening visibility needs the task’s A or the meeting’s organizer and a reason, and is audited (D8).

## Ownership
- Feature owner: [DOM-IAM](../../domains/identity-access/README.md) — Identity & access. Type: cross-domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md).

| Part | Domain | Role |
|---|---|---|
| [FEAT-011-P01](parts/P01-identity-access.md) | [DOM-IAM](../../domains/identity-access/README.md) | Teams, Business admin, viewer identity and the Guest rule |
| [FEAT-011-P02](parts/P02-tasks.md) | [DOM-TSK](../../domains/tasks/README.md) | Visibility of tasks and projects, and of their attachments and history |
| [FEAT-011-P03](parts/P03-meetings.md) | [DOM-MTG](../../domains/meetings/README.md) | Visibility, participants and transcript custody of meetings |

## Planned requirements
These statements are proposals, not requirements yet: FR / AC files are written once the decisions are approved ([PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md)), as STD-003 R7 requires before the feature is built.

1. Manage teams and team membership (Business admin only).
2. Set the visibility of a task, project or meeting; widening needs the A or the organizer and a reason, and is audited.
3. Guests read only public items, on every endpoint.
4. A Member reads only items whose audience includes them.
5. A task created from a confidential meeting starts restricted to the meeting’s participants; its evidence quotes stay hidden from anyone outside the meeting.
6. A confidential meeting’s transcript stays on the recording machine unless it is uploaded by an explicit, audited choice.
7. The overview, AI summary, search, exports and backups contain only what the viewer may see.
8. Row-level security enforces the same audiences as the API (non-functional).

## Delivery evidence
- None: declared, not built.
