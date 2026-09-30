---
id: BRD-001
title: Zuri-Go — business requirements
status: draft
relations:
  relates_to: [PRD-001]
---

# BRD-001 — Zuri-Go: business requirements

> Draft assembled from statements already recorded in this repository; it adds no new requirement. Sections that the existing documents do not cover are marked **Not recorded** for the owner to complete before this document is proposed for approval.

## Why the business needs the product

The recorded concept is “Marketing for everyone · Marketing made simple” ([FEAT-001 spec](../features/FEAT-001-business-overview/spec.md)). The outcome recorded for the business owner: open one page and know **what is running, how far to target, and what to do next**.

## Outcomes recorded per audience

| Audience | Recorded outcome | Source |
|---|---|---|
| Business owner | One page across all campaigns: running and queued campaigns, content waiting to publish, weekly and monthly goals as actual / target | [FEAT-001 spec §1](../features/FEAT-001-business-overview/spec.md) |
| Campaign owners, marketing, sales and product / merchandise owners | Know where a campaign stands against its target, what to do next, who owns it, and whether the evidence is enough to change an offer or add budget | [FEAT-002 brief](../features/FEAT-002-campaign-mission-control/brief.md) |
| Thai SME owners and junior marketers | A reference that connects marketing metrics to customer growth, team responsibilities and planning | [FEAT-003 brief](../features/FEAT-003-metrics-map/brief.md) |
| The team | Meetings become owned, prioritised tasks with RACI and MoSCoW, trackable in a weekly plan | [FEAT-004 brief](../features/FEAT-004-meeting-task-manager/brief.md) |

## Stakeholders

As recorded: the business owner; campaign owners, marketing, sales and product / merchandise owners; Thai SME owners and junior marketers; and the team Members who hold a PID ([FEAT-006](../features/FEAT-006-member-identity/feature.md)). Names, roles and responsibilities beyond this are **Not recorded**.

## Constraints

As recorded in existing documents:

- Public Guest reading with authenticated writes ([PRD-001](PRD-001-zuri-go.md), rule 1).
- Credentials and secrets are never exposed to users ([PRD-001](PRD-001-zuri-go.md), rule 3).
- Brand rules and approved assets apply; brand promotion is human-only ([DOM-BRN](../domains/brand/README.md)).
- Figures are never fabricated: plan figures are labelled as plan, and actuals are entered, not invented ([FEAT-002 brief](../features/FEAT-002-campaign-mission-control/brief.md)).

## Success measures

**Not recorded.** No existing document states how the success of the product itself is measured. The per-campaign KPIs are product content, not product success measures.

## Sources

[FEAT-001](../features/FEAT-001-business-overview/feature.md) · [FEAT-002](../features/FEAT-002-campaign-mission-control/feature.md) · [FEAT-003](../features/FEAT-003-metrics-map/feature.md) · [FEAT-004](../features/FEAT-004-meeting-task-manager/feature.md) · [root README](../../README.md) · [AGENTS.md](../../AGENTS.md)
