# Zuri-Go local integration verification — 2026-09-30

## Symptom
The new PostgreSQL workspace must preserve existing campaign and meeting workflows while introducing the business overview.

## Evidence
- `service.mjs` originally used `ON CONFLICT DO UPDATE` for `ai_briefs`; `migrate.mjs` deliberately revoked UPDATE on that immutable table.
- `writeCampaigns` originally derived a legacy task ID from the incoming campaign ID, which changes to the canonical UUID after import.
- `CampaignContent` originally preferred browser storage over its supplied workspace and persisted every edit to browser storage.

## Root cause
The new persistence adapter was not yet integrated with the old browser-first assumptions. Conflict handling also reused a mutable-table pattern for immutable briefs.

## Why the issue escaped detection
These are implementation-stage integration defects: schema application and syntax checks cannot verify round trips, privileges, or browser repository selection.

## Proposed prevention
Use stable canonical parent IDs for task mappings, immutable insert/select for briefs, explicitly select the persistence repository, and exercise import/save/reload and actual PostgreSQL permissions in integration tests before declaring completion.

## Browser findings
- Selecting a database campaign initially displayed the old MUJEEN local state: `CampaignContent` only consumed initial props on mount, before the asynchronous repository bootstrap returned. Synchronize server props and prevent edits until bootstrap finishes.
- Dark-system control tokens leaked into the fixed light business canvas, causing unreadable labels/buttons. Scope the light canvas control tokens to the authored business view.
