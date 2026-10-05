---
id: NFR-011-002
title: Row-level security enforces Business scope
part: FEAT-011-P04
delivery: declared
status: approved
relations:
  decided_by: [ADR-005, ADR-004, ADR-008]
  relates_to: [NFR-011-001]
---

# NFR-011-002 — Row-level security enforces Business scope

The database SHALL enforce the selected Business boundary with row-level security on every table that holds campaign records. Guests may read every non-secret campaign record in that Business; every active authenticated Member has the same record rights regardless of former audience, owner or named viewer. Guest mutations and approval are denied. Secrets stay hidden, actor attribution is session-derived, and audit rows remain append-only.

> **Supersession:** [ADR-008](../../../architecture/decisions.md) (approved 2026-10-05) replaces the audience-filtering target below. The migration and checks recorded in the implementation section describe the former schema 10 policy; the new target requires forward migration 012 to schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment.

## Measurement
- Given direct runtime-role queries for `campaigns`, `campaign_viewers`, `campaign_states`, `campaign_channels`, `content_items`, `publications`, `goals`, `goal_series`, `metric_series` and `metric_observations`, then a Guest and every active Member read all non-secret rows in the selected Business, including campaign ledger and formerly restricted records, and no rows from another Business.
- Given a Guest, then direct INSERT, UPDATE, DELETE or internal approval attempts are denied without changing row counts or values.
- Given an active Member, then direct writes to mutable campaign records succeed regardless of former audience or owner, while audit and immutable observation/history rows cannot be updated or deleted.
- Given a direct query of `change_events`, then Guest and Member read the selected Business audit history, but no caller can change or delete it and actor attribution is derived from the verified session.
- Given any Guest or Member data query, then credential codes/hashes, session material, provider keys and operator configuration are not returned.
- Given the runtime role, then it stays non-superuser and NOBYPASSRLS; given the local operator viewer, then every row of the local database is visible, as today.
- Given migration 012 to schema 12, then it preserves existing campaign rows and history, and isolated schema-11 QA proves the policies cover each table without recursive RLS references.

## Implementation
- Former campaign-audience design approved 2026-10-01 (ADR-005, gate G2); the schema 10 behavior is already released. The earlier ADR-008 candidate used migration 011 before FEAT-015 allocated that version and passed schema-10-to-11 QA; migration 012 now targets schema 12. Fresh schema-11-to-12 replay and focused database regressions passed in isolated QA on 2026-10-05; the test extends `apps/api/test/visibility-db.test.mjs` with direct RLS policy checks.

## Notes
- Extends [NFR-011-001](NFR-011-001-row-level-security.md) to campaign records. An NFR carries a measurement, not AC IDs (STD-002 R1).
- The former audience filters, campaign contact-field restrictions and Guest ledger withholding remain historical evidence only. Current policy exposes non-secret Business record fields to Guests; credential/session/provider/operator secrets are excluded under ADR-008.
