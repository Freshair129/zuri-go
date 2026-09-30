---
id: PRD-001
title: Zuri-Go — product requirements (product level)
status: proposed
relations:
  decided_by: [ADR-004]
  relates_to: [BRD-001, FEAT-011]
---

# PRD-001 — Zuri-Go: product requirements (product level)

**Zuri-Go — Let’s Go to Market. Together.** Marketing made simple: business overview, campaign KPIs, a metrics guide and graph, and a Meeting & Task Manager. The owner opens one page and sees what is running, how far each goal is to its target, and what to do next ([FEAT-001 spec](../features/FEAT-001-business-overview/spec.md)).

This is the product-level index: it says which surfaces exist and which feature owns each, and it collects the rules that apply to every feature. Behavior is specified in the feature folders, not here. It was assembled from existing documents and adds no new product behavior.

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
| Logo and brand marks | headers, navigation, guide mastheads, graph header | [FEAT-009](../features/FEAT-009-logo-placement/feature.md) | DOM-BRN |

The tabs and routes are defined in [FEAT-001 spec §4](../features/FEAT-001-business-overview/spec.md) and [FEAT-008 spec](../features/FEAT-008-unified-site/spec.md). Delivery status of each feature is in the [documentation map](../README.md#features).

## Scope chain

Every row belongs to exactly one Business, and a session reads the one configured Business. Campaigns, channel accounts, content, goals, tasks, weekly plans and meetings hang from it ([ARCH-002 §1](../architecture/ARCH-002-postgresql-data-model.md)). Members are Business-scoped too and are identified by a stable PID ([FEAT-006](../features/FEAT-006-member-identity/feature.md)).

## Product-wide rules

1. Production opens in Guest mode, read-only; every write needs an authenticated Member session, enforced by the API independently of the UI ([FEAT-005](../features/FEAT-005-guest-access/feature.md), [FEAT-006](../features/FEAT-006-member-identity/feature.md), [FEAT-007](../features/FEAT-007-single-code-login/feature.md)).
2. The team works on one shared record of the Business: what one Member saves, the others see; a browser keeps only view preferences such as filters ([ARCH-001 §1](../architecture/ARCH-001-baseline-architecture.md)).
3. No connection string, credential, password hash or session secret is ever exposed to users — not in anything the browser receives, an export or a public document ([AGENTS.md](../../AGENTS.md)); credential records appear in no public endpoint, Member metadata or v2 export ([ARCH-002](../architecture/ARCH-002-postgresql-data-model.md), 0.4.0 amendment).
4. User-facing copy is Thai with the existing English technical and product labels; the brand rules and approved assets govern visuals ([DOM-BRN](../domains/brand/README.md), [FEAT-009](../features/FEAT-009-logo-placement/feature.md)).
5. Plan and scenario figures are labelled as such; actuals and benchmarks are never invented ([FEAT-002 brief](../features/FEAT-002-campaign-mission-control/brief.md)).
6. Navigation, deployment and repository-layout changes do not reinterpret KPI definitions, formulas, targets, RACI, MoSCoW, Guest policy or Member identity ([FEAT-008 spec](../features/FEAT-008-unified-site/spec.md); [migration record](../migrations/verification.md)).
7. Content is shown only to its audience, and the API and the database both enforce it ([ADR-004](../architecture/decisions.md), approved 2026-10-01; [FEAT-011](../features/FEAT-011-visibility-and-confidential-meetings/feature.md)). This rule is built locally but **not yet in force in production**: until FEAT-011 is released, rule 1 still lets Guests read the whole workspace and the interim rule below applies.

## Approved, built locally, not released

[ADR-004](../architecture/decisions.md) and [FEAT-011](../features/FEAT-011-visibility-and-confidential-meetings/feature.md) were approved by the owner on 2026-10-01. [PLAN-002](../governance/plans/PLAN-002-task-and-meeting-domains.md) phase P1 is built locally (PostgreSQL schema 6, migration `006_visibility.sql` on the local database only); production is still schema 5 and nothing is released.

- **Visibility, teams and confidential meetings.** Tasks and meetings carry a level — `public`, `business`, `team` or `restricted` — and named people. Guests would see public items only, and a confidential meeting only its participants. Teams are managed by a Business admin, a flag set by the operator only ([ARCH-002](../architecture/ARCH-002-postgresql-data-model.md), schema 6 amendment).
- **Product-wide rule 7** above comes from this decision.

Until PLAN-002 phase P1 is released to production, the interim rule of ADR-004 D9 applies: no HR, accounting, salary, customer-personal or other confidential content in production, because Guests can read it today.

## Proposed changes (not approved)

[ADR-002 and ADR-003](../architecture/decisions.md) were approved on 2026-10-01; phase P2 of [PLAN-002](../governance/plans/PLAN-002-task-and-meeting-domains.md) is being built:

- **Task Manager for every department** ([FEAT-010](../features/FEAT-010-task-manager/feature.md)). Boards for all work, a campaign, a project, a team, unlinked work and “my tasks”; a Projects view; and the campaign Workboard as a view of the same tasks. The site menu names it “Task Manager” next to “Meetings” (PLAN-002 Q9, decided 2026-10-01).

## Document notes

File paths and baseline infrastructure statements inside older documents describe their original version; current build, start and deploy commands are in the [project README](../../README.md).
