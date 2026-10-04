---
id: NFR-015-001
title: Bound report size, network work and private data custody
delivery: declared
status: draft
superseded_by: null
relations:
  relates_to: [SDD-015, FEAT-015]
---

# NFR-015-001 — Bounded private exchange

The system SHALL enforce the proposed report limits (256 KiB UTF-8, 100 metrics, 32 source references), 20-second calls and four total attempts within 24 hours, with server-only secrets, whitelisted payloads and private receipt/report reads. P1 enforces a 1024-byte preview request, a 256-KiB preview output guard and a fixed 12-metric/two-reference maximum through projection. Network attempts, receipts, storage retention and the frozen-wire limits remain proposals; no sender exists. Retention and parent private-reader contracts must be settled before migrations; unconfigured privacy/authorization refuses operation.

## Measurement

P1 fixture tests verify oversized/duplicate preview requests and private text exclusion from the returned preview. Full exchange acceptance remains NOT_RUN: wire size boundaries, network timeout/attempt/age bounds, concurrent claim, receipt privacy, credential revocation and redirects. No log/browser/live source-custody acceptance is claimed by the fixtures.
