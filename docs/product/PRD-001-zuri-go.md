---
id: PRD-001
title: Zuri-Go — product requirements (product level)
status: proposed
relations:
  decided_by: [ADR-002, ADR-003, ADR-004, ADR-008]
  relates_to: [BRD-001, FEAT-010, FEAT-011, FEAT-014]
---

# PRD-001 — Zuri-Go: product requirements (product level)

**Zuri-Go — Let’s Go to Market. Together.** Marketing made simple: business overview, campaign KPIs, a metrics guide and graph, and a Meeting & Task Manager. The owner opens one page and sees what is running, how far each goal is to its target, and what to do next ([FEAT-001 spec](../features/FEAT-001-business-overview/spec.md)).

This is the product-level index: it says which surfaces exist and which feature owns each, and it collects the rules that apply to every feature. Behavior is specified in the feature folders, not here. It was assembled from existing documents and adds no new product behavior.

## Platform relationship — owner statement, 2026-10-04

Zuri-Go is the light Marketing/Commercial edition of Zuri-AI, independently deployable with its supporting functions. It must be able to send relevant marketing data back to the parent Marketing domain. This is the owner-stated product direction; parent extraction, model parity and operational integration are not established by it. Canonical process/context: [ARCH-005](../architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md); document decision: [ADR-007](../architecture/decisions.md#adr-007--zuri-go-as-a-marketingcommercial-edition-and-a-canonical-commercial-pipeline); single authored context map: [registry/relations.yaml](../../registry/relations.yaml). Existing approved feature behavior remains governed by its own contracts.

## Surfaces

| Surface | Route | Feature | Domain |
|---|---|---|---|
| Business Overview (default) | `/?view=1&tab=overview` | [FEAT-001](../features/FEAT-001-business-overview/feature.md) | DOM-BIZ |
| Content list and calendar | `tab=content` | FEAT-001 | DOM-BIZ |
| Goals (weekly / monthly, actual vs target) | `tab=goals` | FEAT-001 | DOM-BIZ |
| Campaign workspace: Overview, Performance, Plan & Gates, Workboard, Review & Decisions | `tab=campaign-overview&campaign=<id>` and the campaign tabs | [FEAT-002](../features/FEAT-002-campaign-mission-control/feature.md) | DOM-CAM |
| Meeting & Task Manager | `/?view=1&tab=meeting-task-manager` | [FEAT-004](../features/FEAT-004-meeting-task-manager/feature.md) | DOM-TSK (ADR-002) |
| ความรู้ Metrics (guide) | `/metrics/#overview` | [FEAT-003](../features/FEAT-003-metrics-map/feature.md) | DOM-MET |
| Graph View | `/metrics/#metrics-graph` | FEAT-003 | DOM-MET |
| Guest mode, sign-in modal, Member badge | upper-right toolbar; write-intent modal | [FEAT-005](../features/FEAT-005-guest-access/feature.md), [FEAT-006](../features/FEAT-006-member-identity/feature.md), [FEAT-007](../features/FEAT-007-single-code-login/feature.md) | DOM-IAM |
| Site menu: Marketing · Meeting & Task Manager · ความรู้ Metrics · Graph View | every part of the site | [FEAT-008](../features/FEAT-008-unified-site/feature.md) | DOM-PLT |
| Visual Studio | `/?view=1&tab=visual-studio` | [FEAT-014](../features/FEAT-014-visual-marketing-team/feature.md) | DOM-VIS |
| Emar service launcher (local only) | Separate **บริการ / Services** entry on the local Zuri-Go site; opens `http://localhost:8788/` | [FEAT-013](../features/FEAT-013-emar-local-access/feature.md) | DOM-PLT |
| Logo and brand marks | headers, navigation, guide mastheads, graph header | [FEAT-009](../features/FEAT-009-logo-placement/feature.md) | DOM-BRN |

Since release 0.5.0 (2026-10-01) the site menu reads “Task Manager” and “Meetings” ([FEAT-010](../features/FEAT-010-task-manager/feature.md), PLAN-002 Q9; [verification](../releases/0.5.0/verification.md)); the served page equals the verified build, but the menu was not browser-checked on production; the table keeps the feature-level names.

The tabs and routes are defined in [FEAT-001 spec §4](../features/FEAT-001-business-overview/spec.md) and [FEAT-008 spec](../features/FEAT-008-unified-site/spec.md). Delivery status of each feature is in the [documentation map](../README.md#features).

## Scope chain

Every row belongs to exactly one Business, and a session reads the one configured Business. Campaigns, channel accounts, content, goals, tasks, weekly plans and meetings hang from it ([ARCH-002 §1](../architecture/ARCH-002-postgresql-data-model.md)). Members are Business-scoped too and are identified by a stable PID ([FEAT-006](../features/FEAT-006-member-identity/feature.md)).

## Product-wide rules

1. **Approved access policy (ADR-008, 2026-10-05):** Guests may read every non-secret record in the selected Business, including full Member contact records, campaigns, tasks, projects, meetings and their transcripts, attachments, history, and Visual records. Guests remain read-only: every create, update, delete, or internal approval is denied. Every active, logged-in Member has the same read/create/update/delete and internal approval rights for every mutable non-secret Business record, including Member and Team records, regardless of former visibility, owner, team, assignee, participant, named viewer, or RACI assignment. Member identities are retired/deactivated rather than hard-deleted, preserving references and history. The API and database enforce the policy; Member identity comes from the verified session and requests remain inside the selected Business. The production schema 11 still reflects the prior access implementation until a separately approved migration 012 to schema 12 and deployment ([ADR-008](../architecture/decisions.md), [ARCH-002](../architecture/ARCH-002-postgresql-data-model.md)).
2. The team works on one shared record of the Business: what one Member saves, the others see; a browser keeps only view preferences such as filters ([ARCH-001 §1](../architecture/ARCH-001-baseline-architecture.md)).
3. No credential code/hash, session token/secret, provider key or operator configuration is exposed in Guest or Member data responses, browser content, exports or public documents. These secrets are outside the Business-record access policy; individual login, session-derived actors and operator-controlled credential provisioning remain in force ([AGENTS.md](../../AGENTS.md); [ARCH-002](../architecture/ARCH-002-postgresql-data-model.md)).
4. User-facing copy is Thai with the existing English technical and product labels; the brand rules and approved assets govern visuals ([DOM-BRN](../domains/brand/README.md), [FEAT-009](../features/FEAT-009-logo-placement/feature.md)).
5. Plan and scenario figures are labelled as such; actuals and benchmarks are never invented ([FEAT-002 brief](../features/FEAT-002-campaign-mission-control/brief.md)).
6. Navigation, deployment and repository-layout changes do not reinterpret KPI definitions, formulas, targets, RACI, MoSCoW or Member identity. Record audience, owner, team, assignment and RACI remain business metadata; ADR-008 governs access across features and supersedes older audience-based access rules ([FEAT-008 spec](../features/FEAT-008-unified-site/spec.md); [migration record](../migrations/verification.md); [ADR-008](../architecture/decisions.md)).
7. Business audit events are readable to Guests and Members and remain append-only. Application writes attribute events to the verified session actor. Business-admin status does not change record permissions; credential provisioning, session/operator secrets, provider egress, spend, publication and deployment keep their separate controls ([ADR-008](../architecture/decisions.md); [ARCH-002 §12](../architecture/ARCH-002-postgresql-data-model.md#approved-adr-008-amendment-guest-read-only-and-shared-member-crud-for-schema-12)).
8. Emar is a separate local service. Zuri-Go only provides a launcher from its canonical local site; Emar is started separately and has no shared Identity, CRM, Files, Marketing, or campaign data integration under FEAT-013.

## Historical release 0.5.0 behavior (2026-10-01)

The statements in this section record the access model released with 0.5.0 and remain historical release evidence. Approved ADR-008 defines the replacement access policy; until migration 012 to schema 12 and separately approved production deployment, production remains on its schema 11 behavior documented by release 0.5.1.

[ADR-004](../architecture/decisions.md) and [FEAT-011](../features/FEAT-011-visibility-and-confidential-meetings/feature.md), then [ADR-002 and ADR-003](../architecture/decisions.md) and [FEAT-010](../features/FEAT-010-task-manager/feature.md), were approved by the owner on 2026-10-01. [PLAN-002](../governance/plans/PLAN-002-task-and-meeting-domains.md) phase P1 (PostgreSQL schema 6, migration `006_visibility.sql`), phase P2 (schema 7, migration `007_tasks_projects.sql`), P3 and the server-side meeting commit were released to production on 2026-10-01 as application 0.5.0: production went from schema 5 to schema 7 and runs the matching code ([verification](../releases/0.5.0/verification.md)). The Business-admin flag was set for the owner's Member after the release; the hosted Member, participant and Business-admin checks and the browser checks are not yet done.

- **Visibility, teams and confidential meetings.** Tasks and meetings carry a level — `public`, `business`, `team` or `restricted` — and named people. Guests see public items only, and a confidential meeting only its participants. Teams are managed by a Business admin, a flag set by the operator only ([ARCH-002](../architecture/ARCH-002-postgresql-data-model.md), schema 6 amendment).
- **Task Manager for every department** ([FEAT-010](../features/FEAT-010-task-manager/feature.md), delivery `implemented`). One task record for every department, with campaign, project and team as contexts; projects; boards for all work, a campaign, a project, a team, unlinked work and “my tasks”; and the campaign Workboard as a view of the same tasks ([ARCH-002](../architecture/ARCH-002-postgresql-data-model.md), schema 7 amendment). The site menu names it “Task Manager” next to “Meetings” (PLAN-002 Q9, decided 2026-10-01). The reviewed move of existing Workboard tasks is an operator tool; its dry runs on 2026-10-01, before and after the production migration, found no Workboard tasks in production, so nothing was moved.
- **Server-side meeting commit.** The design amendment to [SDD-004](../features/FEAT-004-meeting-task-manager/design.md) (PLAN-002 WI-09) was approved on 2026-10-01, built and released with 0.5.0: the server commits meeting tasks with the meeting's audience, and the whole-workspace save refuses receipts the server did not write.
- **Product-wide rule 7** above comes from the visibility decision.

At the 0.5.0 release, the interim rule of ADR-004 D9 (no confidential content in production because Guests read everything) ended for tasks and meetings. It remained for Member profiles and campaign records under that release's Guest policy; ADR-008 supersedes those limits when implemented.

## Document notes

File paths and baseline infrastructure statements inside older documents describe their original version; current build, start and deploy commands are in the [project README](../../README.md).

## Approved Visual Marketing slice — Visual Studio

[FEAT-014](../features/FEAT-014-visual-marketing-team/feature.md) is approved and its local first slice is implemented in the existing Marketing authored UI. It reads Campaign/Project/Member context, persists creative production and requires human review. R3 migration 010 and focused checks passed in isolated QA at source schema 10; fresh independent VerifyGate and whole-PR ReviewGate remain pending. That focused QA did not live-inspect production; the current production schema 11 baseline after FEAT-015 migration 011 is recorded in [release 0.5.1](../releases/0.5.1/verification.md). Hosted execution remains disabled. Scope and phase acceptance are canonical in the feature.
