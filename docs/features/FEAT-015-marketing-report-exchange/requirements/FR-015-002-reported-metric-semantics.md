---
id: FR-015-002
title: Export truthful reported metrics and weekly opinions
delivery: building
status: approved
superseded_by: null
relations:
  specified_by: [SDD-015]
  relates_to: [FR-002-011, FR-002-017, FR-002-018, FR-002-019, FR-002-021]
---

# FR-015-002 — Reported semantics

The system SHALL export only whitelisted source-reported aggregates and a sanitized nullable weekly review assertion, preserving missing/partial evidence, formula/scope and unverified approval provenance without promoting it to provider or parent authority.

## Acceptance criteria

- AC-015-002-01 — Given missing source, unknown reporting timezone or a zero/unknown denominator, when projecting metrics, then unavailable values stay null with reason codes; known observed zero is distinct from unknown.
- AC-015-002-02 — Given stage entries or late paid/refund events across weeks, when constructing activity and cohort metrics, then each n/N and period remains explicit and compatible; no mixed-window ratio or duplicated unique cohort count appears.
- AC-015-002-03 — Given MQL/SQL records, manual revenue or a local release recommendation, when projecting the report, then it claims neither ready-for-call consent, verified Commerce revenue, attributed ROAS, A/B winner nor parent approval.
- AC-015-002-04 — Given a source snapshot with phones, customer IDs, chat, free-text reviews, raw records or secrets, when projecting, then those fields are absent; the original source is not mutated.

## Implementation

P1 source implementation: `deriveReportedFacts` and `previewMarketingReport` in `apps/api/marketing-report.mjs`; TC-015-002 binds the adversarial projection tests. Whitelisted targets/cap and an optional structured weekly assertion are exported. No raw records, free text, Member/lead/customer identity, consent, verified revenue or parent approval is exported. A review hash covers only the sanitized assertion fields, not its raw saved metrics or records.

All actual scalars, ratio n/N and cohort counts are UNKNOWN/null while the server has no audited source timezone and complete-window evidence. The internal arithmetic distinguishes missing observations from zero, activity stage/payment/refund events from acquisition cohorts, and later cohort follow-up from the activity week; it is not returned as ready evidence. Enabling ready metrics and testing real database source immutability remain pending. Source mapping: [field table](../gap-analysis.md#field-mapping-and-measurement-lineage).
