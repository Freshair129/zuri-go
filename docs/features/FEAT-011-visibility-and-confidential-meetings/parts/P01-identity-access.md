---
id: FEAT-011-P01
title: Visibility, teams and confidential meetings — Identity & access
owner: DOM-IAM
runtime: SRV-001
delivery: declared
status: proposed
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FEAT-011-P01 — Teams, Business admin, viewer identity and the Guest rule

Part of [FEAT-011](../feature.md), owned by [DOM-IAM](../../../domains/identity-access/README.md). Proposed, not built.

## Scope
- Teams and team membership; a minimal Business-admin capability that manages teams without reading restricted items.
- The viewer (Guest, Member or local operator) handed to every read and set in each database transaction for row-level security.
- The Guest rule: public items only.

## Data
- planned `teams`, `team_members`
- a Business-admin flag on `members`

## Boundary
Provides viewer identity and team membership to FEAT-011-P02 and FEAT-011-P03; never exposes credentials.

## Requirements
- [FR-011-001](../requirements/FR-011-001-teams.md) — Teams and team membership
- [FR-011-002](../requirements/FR-011-002-business-admin.md) — Business admin capability
- [FR-011-003](../requirements/FR-011-003-viewer-identity.md) — Viewer identity on every read
- [FR-011-007](../requirements/FR-011-007-guest-public-only.md) — Guests read public items only
- [NFR-011-001](../requirements/NFR-011-001-row-level-security.md) — Row-level security enforces the same audiences
