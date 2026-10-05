---
id: FR-011-018
title: Overview, brief, exports and backups follow campaign records
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004, ADR-008]
  relates_to: [FR-011-008, FR-011-014]
---

# FR-011-018 — Overview, brief, exports and backups follow campaign records

> **Current access rule — ADR-008 (approved 2026-10-05):** overview, search, exports and backups include every non-secret record in the selected Business for Guests and active Members; audience and ownership metadata do not filter the projection. Credential/session/provider/operator secrets remain excluded. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; the viewer-filtering rules and acceptance criteria below are historical and superseded.

The system SHALL build the Business overview, the AI-summary input and its cache key, and the UI backup from the campaign records the viewer may read, and SHALL NOT list, count or cache anything from a campaign the viewer cannot read.

## Acceptance criteria
- AC-011-018-01 — Given two Members whose audiences differ by one `restricted` campaign, when each calls `/overview`, then the counts, goals, upcoming publications and pending content cover only the campaigns that Member may read.
- AC-011-018-02 — Given a brief built for a wider audience, when a Member with a narrower audience and otherwise identical figures requests one, then the cache key differs and the wider brief is not returned.
- AC-011-018-03 — Given the UI backup “Backup ข้อมูลที่เห็น”, then it holds only the campaigns the viewer may read, with their level and viewers, and a Guest's backup holds no ledger.
- AC-011-018-04 — Given a Business-level goal that counts published posts, then it is computed from the publications the viewer reads, and the screen labels it as built from what the viewer sees.
- AC-011-018-05 — Given an error while reading or saving a campaign of any level, then the logs hold the error code and IDs only, never a title, figure or customer ID.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. `snapshot` and `audienceKey` (`apps/api/service.mjs`) take the campaigns and the viewer kind into the key; `readLegacy` (`apps/api/workspace.mjs`) scopes the campaigns the backup is built from.
- Today (0.5.1): the key hashes the visible tasks only (`audienceKey`, `apps/api/service.mjs:35`); the overview is built from the full campaign snapshot (`apps/api/api.mjs:46`).

## Notes
- Extends [FR-011-008](FR-011-008-content-follows-item.md) to campaign records.
