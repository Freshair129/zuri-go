---
id: FEAT-011-P01
title: Visibility, teams and confidential meetings — Identity & access
owner: DOM-IAM
runtime: SRV-001
delivery: implemented
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FEAT-011-P01 — Teams, Business admin, viewer identity and the Guest rule

Part of [FEAT-011](../feature.md), owned by [DOM-IAM](../../../domains/identity-access/README.md). Approved 2026-10-01; released to production on 2026-10-01 with 0.5.0 ([verification](../../../releases/0.5.0/verification.md)).

## Scope
- Teams and team membership; a minimal Business-admin capability that manages teams without reading restricted items.
- The viewer (Guest, Member or local operator) handed to every read and set in each database transaction for row-level security.
- The Guest rule: public items only.

## Data
- planned `teams`, `team_members`
- Note 2026-10-01: the word “planned” above is stale. `teams` and `team_members` were created by migration `006_visibility.sql` and have been in production since release 0.5.0 (schema 7; [verification](../../../releases/0.5.0/verification.md)). Proposed addition, not approved: `contact_visibility` on `members` ([FR-011-020](../requirements/FR-011-020-member-contact-visibility.md)).
- a Business-admin flag on `members`

## Boundary
Provides viewer identity and team membership to FEAT-011-P02 and FEAT-011-P03; never exposes credentials.

## Requirements
- [FR-011-001](../requirements/FR-011-001-teams.md) — Teams and team membership
- [FR-011-002](../requirements/FR-011-002-business-admin.md) — Business admin capability
- [FR-011-003](../requirements/FR-011-003-viewer-identity.md) — Viewer identity on every read
- [FR-011-007](../requirements/FR-011-007-guest-public-only.md) — Guests read public items only
- [NFR-011-001](../requirements/NFR-011-001-row-level-security.md) — Row-level security enforces the same audiences
- Approved 2026-10-01, not built: [FR-011-020](../requirements/FR-011-020-member-contact-visibility.md) — Visibility of Member contact details ([ADR-005](../../../architecture/decisions.md)); the campaign records are in [FEAT-011-P04](P04-campaign-records.md)
