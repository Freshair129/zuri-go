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
  - domain: DOM-CAM
    part: FEAT-011-P04
    role: Visibility of campaign records (approved 2026-10-01, not built)
delivery: implemented
status: approved
legacy: []
relations:
  depends_on: [FEAT-006]
  decided_by: [ADR-004, ADR-008]
  relates_to: [FEAT-002, FEAT-005, FEAT-010, ADR-005]
---

# FEAT-011 — Visibility, teams and confidential meetings

> **Approved 2026-10-01; phases P1 and P3 released to production the same day with 0.5.0 (schema 6 and 7; [verification](../../releases/0.5.0/verification.md)).** Declared by [ADR-004](../../architecture/decisions.md); the delivery plan is [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md).

> **Approved by the owner on 2026-10-01 (PLAN-003 node V1, gate G2), not built:** the same levels for campaign records and Member contact details, which Guests and Members still read whole (PLAN-002 Q1). Declared by [ADR-005](../../architecture/decisions.md); requirements FR-011-013…020 and NFR-011-002…003 below; designed in the last section of [SDD-011](design.md#proposed-visibility-of-campaign-records-and-member-profiles-v1-2026-10-01). Everything above this note is unchanged and describes release 0.5.1.

> **Current access contract — [ADR-008](../../architecture/decisions.md), approved 2026-10-05.** A Guest reads every non-secret record in the configured Business and cannot mutate or approve it. Every active Member has equal CRUD and internal approval rights for every mutable non-secret Business record, regardless of audience, team, owner, participant, assignee or RACI metadata. Keep those fields and labels as business metadata; they do not grant or filter access. Audit events are readable and append-only. The Business boundary, secret custody and separate provider/spend/publication/deployment gates remain. This contract is implemented in local source, and fresh schema-11-to-12 replay and focused database regressions passed in isolated QA on 2026-10-05; the release evidence below documents earlier behavior.

Every department can use the workspace within one Business. Audience, team, owner, participant and RACI values remain record metadata; they no longer filter Guest reads or active-Member CRUD. Guests can read all non-secret records, including linked and inherited content, while remaining read-only. Confidential-meeting transcript custody continues to govern provider transfer, separately from record access.

## Scope
- Teams (ฝ่าย) and team membership; every active Member has the same record rights, while Business-admin capability changes remain operator-managed.
- Visibility levels, named viewers and RACI on tasks, projects and meetings remain metadata and do not grant or restrict access.
- Guests read all non-secret Business records on every read path and cannot mutate or approve them.
- Transcript segments, evidence quotes, attachments, history, overview, search, exports and backups follow Business scope and secret exclusions, not item visibility metadata; external provider input remains separately gated.
- Transcripts of confidential meetings stay on the recording machine by default (D5).
- API and row-level security enforce the Business boundary on reads and writes; the trusted local operator remains separately attributed.
- Any active Member may change mutable audience metadata; those changes are audited and do not change access.

## Ownership
- Feature owner: [DOM-IAM](../../domains/identity-access/README.md) — Identity & access. Type: cross-domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md).

| Part | Domain | Role |
|---|---|---|
| [FEAT-011-P01](parts/P01-identity-access.md) | [DOM-IAM](../../domains/identity-access/README.md) | Teams, Business admin, viewer identity and the Guest rule |
| [FEAT-011-P02](parts/P02-tasks.md) | [DOM-TSK](../../domains/tasks/README.md) | Visibility of tasks and projects, and of their attachments and history |
| [FEAT-011-P03](parts/P03-meetings.md) | [DOM-MTG](../../domains/meetings/README.md) | Visibility, participants and transcript custody of meetings |
| [FEAT-011-P04](parts/P04-campaign-records.md) | [DOM-CAM](../../domains/campaign/README.md) | Visibility of campaign records (approved 2026-10-01, not built) |

## Requirement index
**Supersession note — ADR-008 (approved 2026-10-05):** Its Guest/Member access rule supersedes former per-record authorization in FR-011-001…009, FR-011-011, FR-011-013…020 and NFR-011-001…002 wherever visibility level, team, participant, named viewer, owner, organizer, Business-admin or RACI affected reads or writes, including linked and inherited records/content. Keep those fields as business metadata; they no longer grant or filter access. DELETE follows each record family's existing archive, deactivate, cancel or retract lifecycle; add reversible tombstone/archive only for mutable Task, Meeting or week-plan records without one. Preserve foreign keys, work, append-only audit and immutable measurement/Visual history; no hard-delete or purge is in scope. Earlier release and implementation evidence in the linked requirements is historical. Source implementation is present locally as migration 012 targeting schema 12; fresh schema-11-to-12 replay and focused database regressions passed in isolated QA on 2026-10-05. Production remains on schema 11 pending separately authorized migration 012 and deployment. Business isolation, secrets, participant-only transcript custody transfer, and separate external-action gates remain.

The requirements below retain their stable IDs and implementation evidence. Delivery values for the revised access rules are `declared`.

Approved by the owner on 2026-10-01; each file holds the requirement and its acceptance criteria. The design [SDD-011](design.md), this feature and [ADR-004](../../architecture/decisions.md) were approved the same day.

| ID | Requirement | Part | Delivery |
|---|---|---|---|
| [FR-011-001](requirements/FR-011-001-teams.md) | Teams and team membership | FEAT-011-P01 | declared |
| [FR-011-002](requirements/FR-011-002-business-admin.md) | Business admin capability | FEAT-011-P01 | declared |
| [FR-011-003](requirements/FR-011-003-viewer-identity.md) | Viewer identity on every read | FEAT-011-P01 | implemented |
| [FR-011-004](requirements/FR-011-004-task-project-visibility.md) | Task and Project audience metadata | FEAT-011-P02 | declared |
| [FR-011-005](requirements/FR-011-005-named-viewers.md) | RACI and named-viewer metadata | FEAT-011-P02 | declared |
| [FR-011-006](requirements/FR-011-006-meeting-visibility.md) | Meeting audience and participants | FEAT-011-P03 | declared |
| [FR-011-007](requirements/FR-011-007-guest-public-only.md) | Guest reads all non-secret Business records | FEAT-011-P01 | declared |
| [FR-011-008](requirements/FR-011-008-content-follows-item.md) | Linked content follows Business scope | FEAT-011-P02 | declared |
| [FR-011-009](requirements/FR-011-009-confidential-meeting-tasks.md) | Tasks from a confidential meeting | FEAT-011-P02 | declared |
| [FR-011-010](requirements/FR-011-010-transcript-custody.md) | Custody of confidential transcripts | FEAT-011-P03 | implemented |
| [FR-011-011](requirements/FR-011-011-widening-visibility.md) | Changing audience metadata | FEAT-011-P02 | declared |
| [FR-011-012](requirements/FR-011-012-existing-data.md) | Visibility of data that exists before the change | FEAT-011-P02 | implemented |
| [NFR-011-001](requirements/NFR-011-001-row-level-security.md) | Row-level security enforces Business scope | FEAT-011-P01 | declared |

Approved by the owner on 2026-10-01 with ADR-005's questions answered as recommended ([ADR-005](../../architecture/decisions.md); nothing built yet):

| ID | Requirement | Part | Delivery |
|---|---|---|---|
| [FR-011-013](requirements/FR-011-013-campaign-levels.md) | Visibility levels of a campaign | FEAT-011-P04 | declared |
| [FR-011-014](requirements/FR-011-014-attached-records-follow-campaign.md) | Records attached to a campaign follow it | FEAT-011-P04 | declared |
| [FR-011-015](requirements/FR-011-015-guest-public-campaign.md) | Guest reads all non-secret campaign records | FEAT-011-P04 | declared |
| [FR-011-016](requirements/FR-011-016-changing-campaign-level.md) | Changing the level of a campaign | FEAT-011-P04 | declared |
| [FR-011-017](requirements/FR-011-017-campaign-tasks-meetings.md) | Tasks and meetings of a campaign | FEAT-011-P04 | declared |
| [FR-011-018](requirements/FR-011-018-overview-brief-exports.md) | Overview, brief, exports and backups follow campaign records | FEAT-011-P04 | declared |
| [FR-011-019](requirements/FR-011-019-existing-campaigns.md) | Visibility of campaigns that exist before the change | FEAT-011-P04 | declared |
| [FR-011-020](requirements/FR-011-020-member-contact-visibility.md) | Visibility of Member contact details | FEAT-011-P01 | declared |
| [NFR-011-002](requirements/NFR-011-002-campaign-row-level-security.md) | Row-level security enforces the campaign audiences | FEAT-011-P04 | declared |
| [NFR-011-003](requirements/NFR-011-003-campaign-read-cost.md) | The added policies keep reads fast | FEAT-011-P04 | declared |

## Delivery evidence
- Local only (2026-10-01): migration 006 applied to the local database after a backup; the Node suites (108 tests), Python packaging tests and metrics check passed and `npm run build` passed, but the last `npm test` step, `scripts/site/verify_extraction.py`, failed (it expected 46 packaged files; P1 made it 50) — this was misreported as a full pass at the time and corrected on 2026-10-01 below. Browser check on the local server (operator): the teams panel and the task visibility picker render and respond; the Guest notice, visibility badges and the meeting form were not browser-checked. Production was unchanged at that point (schema 5).
- Local only (2026-10-01, FR-011-009 and FR-011-010): the Node suites passed (121 tests, including the new custody and upload tests against local PostgreSQL), as did the Python packaging tests and the metrics check; `npm run build` passed. `npm test` then failed at `scripts/site/verify_extraction.py` (46 expected, 50 packaged since P1). The transcript notice and the upload form were built and compiled but not browser-checked. Production was unchanged at that point (schema 5).
- Integration (2026-10-01): `verify_extraction.py` now expects the 50 packaged files (the 46 at extraction plus `viewer.mjs`, `audience.mjs`, `teams.mjs` and `shared/visibility.mjs`); meeting quotes copied into task metadata are withheld from `/state` too ([RCA](../../../.brain/rca/zuri-go-meeting-quotes-outside-meeting-audience.md)). Full `npm test` passed end to end (121 Node tests, Python packaging, metrics and extraction checks, 50 packaged files) and `npm run build` passed. Production was unchanged at that point (schema 5).
- Released to production (2026-10-01, 0.5.0, code commit `7bb538c`): production backed up, then migrated from schema 5 to schema 7 (migrations 006 and 007; every pre-existing table kept its row count) and the new deployment promoted to https://zuri-metrics-map.vercel.app/. Hosted Guest checks passed on the unique deployment and on the public URL: `/workspace`, `/state` and `/tasks` returned 0 tasks, 0 meetings, 0 receipts and 0 history events although the Business holds 12 tasks (all `business`), `/overview` named no task, and Guest writes answered 401. Guests still read the 4 Member profiles and the 1 campaign (PLAN-002 Q1). The interim rule of ADR-004 D9 ended for tasks and meetings on that date. After the release the Business-admin flag was set for the owner's Member (one audit event, no credential changed). Not run: Member, restricted-meeting participant and Business-admin checks (they need a real Member code, the owner's), browser checks on production and a restore of the backup. Record: [verification](../../releases/0.5.0/verification.md).
