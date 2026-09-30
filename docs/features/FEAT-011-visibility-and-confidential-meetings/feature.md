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
delivery: building
status: approved
legacy: []
relations:
  depends_on: [FEAT-006]
  decided_by: [ADR-004]
  relates_to: [FEAT-005, FEAT-010]
---

# FEAT-011 — Visibility, teams and confidential meetings

> **Approved 2026-10-01; phase P1 built locally (schema 6), not deployed.** Declared by [ADR-004](../../architecture/decisions.md); the delivery plan is [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md).

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

## Requirement index
Approved by the owner on 2026-10-01; each file holds the requirement and its acceptance criteria. The design [SDD-011](design.md), this feature and [ADR-004](../../architecture/decisions.md) were approved the same day.

| ID | Requirement | Part | Delivery |
|---|---|---|---|
| [FR-011-001](requirements/FR-011-001-teams.md) | Teams and team membership | FEAT-011-P01 | implemented |
| [FR-011-002](requirements/FR-011-002-business-admin.md) | Business admin capability | FEAT-011-P01 | implemented |
| [FR-011-003](requirements/FR-011-003-viewer-identity.md) | Viewer identity on every read | FEAT-011-P01 | implemented |
| [FR-011-004](requirements/FR-011-004-task-project-visibility.md) | Visibility of tasks and projects | FEAT-011-P02 | implemented |
| [FR-011-005](requirements/FR-011-005-named-viewers.md) | Named viewers of a task | FEAT-011-P02 | implemented |
| [FR-011-006](requirements/FR-011-006-meeting-visibility.md) | Visibility and participants of meetings | FEAT-011-P03 | implemented |
| [FR-011-007](requirements/FR-011-007-guest-public-only.md) | Guests read public items only | FEAT-011-P01 | implemented |
| [FR-011-008](requirements/FR-011-008-content-follows-item.md) | Content follows its item | FEAT-011-P02 | implemented |
| [FR-011-009](requirements/FR-011-009-confidential-meeting-tasks.md) | Tasks from a confidential meeting | FEAT-011-P02 | declared |
| [FR-011-010](requirements/FR-011-010-transcript-custody.md) | Custody of confidential transcripts | FEAT-011-P03 | declared |
| [FR-011-011](requirements/FR-011-011-widening-visibility.md) | Widening the visibility of a task or project | FEAT-011-P02 | implemented |
| [FR-011-012](requirements/FR-011-012-existing-data.md) | Visibility of data that exists before the change | FEAT-011-P02 | implemented |
| [NFR-011-001](requirements/NFR-011-001-row-level-security.md) | Row-level security enforces the same audiences | FEAT-011-P01 | implemented |

## Delivery evidence
- Local only (2026-10-01): migration 006 applied to the local database after a backup; `npm test` passed (108 Node tests, Python, metrics and extraction checks); `npm run build` passed. Browser check on the local server (operator): the teams panel and the task visibility picker render and respond; the Guest notice, visibility badges and the meeting form were not browser-checked. Production is unchanged (schema 5).
