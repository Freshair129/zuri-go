---
id: FR-015-001
title: Freeze one authorized campaign source snapshot
delivery: building
status: approved
superseded_by: null
relations:
  specified_by: [SDD-015]
  relates_to: [FR-002-008, FR-011-003]
---

# FR-015-001 — Scoped source snapshot

The system SHALL build an operator-requested report from one consistently read, server-authorized campaign snapshot in local SRV-002; caller-supplied workspace data, Business IDs or actor IDs cannot substitute for the resolved source.

## Acceptance criteria

- AC-015-001-01 — Given an authorized local operator and campaign in the configured Business, when preview is requested, then campaign row, state row/hash, Business revision and capture time describe one consistent snapshot.
- AC-015-001-02 — Given another Business, a Guest/Member request on a hosted sender, or an unreadable campaign, when the proposed sender is called, then it refuses without revealing or exporting source data.
- AC-015-001-03 — Given source edits after preview, when freezing the old revision/hash, then it returns conflict and creates no report/outbox; a new preview is required.

## Implementation

P1 source implementation: `readMarketingReportSource` in `apps/api/marketing-report.mjs`, routed by API-024 in `apps/api/api.mjs`. The existing repeatable-read transaction resolves the viewer/RLS settings; one SELECT joins campaign/state/Business revisions and checks the current Business setting. State hash is checked against the captured JSON; unsupported schema and unreadable/archived campaigns refuse. No Member, task or normalized-metric table is read.

P2 adds CMP-003/API-025 preparation and freeze. A persisted safe preview retains its original capture time; finalization locks Business → campaign → state → association → preparation, rechecks revisions/hash/authority/expiry and atomically writes only report/outbox/audit. Source mismatches return SOURCE_STALE 409 with no report writes. Runtime SQL cannot supply a source document to the finalizers. Migration 011 is a file only.

TC-015-001 covers mocked source/router denial; TC-015-003 original local PostgreSQL acceptance remains NOT_RUN. TC-015-005/006 cover P2 parser/denial and disposable WASM SQL stale-source/atomicity/privacy tests, PASS. TC-015-007 native REPEATABLE READ concurrency/locks is NOT_RUN. AC-015-001-03 therefore has partial executed evidence, not a completed native acceptance gate.
