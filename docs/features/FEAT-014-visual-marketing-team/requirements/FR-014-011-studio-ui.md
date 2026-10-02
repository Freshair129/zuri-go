---
id: FR-014-011
title: Show production state inside Marketing
owner: DOM-VIS
status: proposed
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-011 — Show production state inside Marketing

The system SHALL show briefs, board, roles, artifacts and human decisions inside the allowed authored UI.

## Acceptance criteria

- AC-014-011-01 — Given an executing Project, when opened or refreshed, then persisted stage/artifacts and required card fields appear without raw-log digging.

- AC-014-011-02 — Given Guest write intent, when clicked, then existing login is prompted and API independently denies the unauthenticated mutation.

- AC-014-011-03 — Given pending/failed/cancelled/manual/unavailable state, when polling, then labels remain distinct with no stale completion or invented cost.
