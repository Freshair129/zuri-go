---
id: SDD-015
title: Marketing report exchange — design
status: approved
superseded_by: null
version: 0.3.0
date: 2026-10-05
relations:
  relates_to: [FEAT-015, ARCH-005, ADR-007, DOM-CAM, DOM-MET, SRV-002]
---

# SDD-015 — bounded reported-evidence exchange

[Gap evidence](gap-analysis.md) and [wire contract](contract.md) are the peer contracts. P1 source snapshot/preview and P2 preparation/freeze were approved on 2026-10-05 and are implemented in source. Migration file 011 exists but is not applied to an application database; Identity, delivery and parent receiver remain proposed. No production operation was performed.

## Architecture and sequence

```mermaid
sequenceDiagram
  actor Operator as Local operator
  participant Go as Zuri-Go SRV-002
  participant Ledger as Go immutable report / outbox
  participant Identity as Parent Identity binding
  participant Receiver as Parent Marketing evidence inbox
  Operator->>Go: Select campaign and weekly window; preview
  Go->>Go: Resolve viewer and Business; consistent source read
  Go-->>Operator: Sanitized fields, missing evidence, payload hash
  Operator->>Go: Freeze exact preview hash and source revision
  Go->>Ledger: Atomic report + QUEUED record
  Operator->>Go: Explicit send
  Go->>Identity: Server credential and explicit report binding
  Identity-->>Go: Narrow scope evaluated at receiver; no Person impersonation
  Go->>Receiver: Same immutable report / idempotency key
  Receiver->>Receiver: Scope + schema + target + hash validation
  Receiver->>Receiver: Atomic external evidence + durable receipt
  Receiver-->>Go: Matching receipt (or same receipt on replay)
  Go->>Ledger: ACKNOWLEDGED only after receipt validation
```

Identity evaluation actually runs at the receiver on every request; the diagram denotes the authorization boundary, not an extra network call or a new Identity endpoint. Timeout after commit is recovered by replaying the identical report. No arrow means Plan revision, native human approval, provider publication or PM work mutation.

## Owned and read data

| Side / proposed component | Reads | New proposed writes | Authority |
|---|---|---|---|
| Go snapshot/projector | viewer-scoped campaign row, campaign state, current Business revision | none | existing viewer/RLS transaction; one exact snapshot, no client workspace submitted as evidence |
| Go report/outbox | sanitized projection, source revision tuple, confirmed preview hash | immutable report bytes/hash; mutable delivery state/attempt metadata; durable receipt reference | DOM-CAM, local SRV-002 only; never broadens metric or Member reads |
| Go transport | frozen bytes, allowlisted receiver origin, server credential reference | attempts and receipt state | server only; no redirects, browser secrets or arbitrary target URL |
| Parent receiver | Identity-managed service principal/binding, current tenant/Business/Marketing permissions and existing initiative | external reported-evidence record plus receipt, atomic | parent Marketing evidence owner; Identity owns credential/grant; no Person spoofing |
| Parent read projection | receipt-backed reports readable to viewer | none | parent growth/Business access; external reports remain distinct from paid-provider/Commerce values |

Go's four approved physical records and grants are authored once in [P2](p2-freeze-outbox.md); migration 011 is an unapplied file. The Go report key includes deployment identity so local and hosted databases never silently become the same writer. Parent receipt/report records, delivery states and retention/purge still require separate reviewed contracts.

## Interfaces — approved P1

Component [CMP-002](../../services/SRV-002-local/CMP-002-marketing-report-preview.md) owns the local adapter in `apps/api/marketing-report.mjs`. It exposes [API-024](../../domains/campaign/contracts.md#api-024--local-marketing-report-preview), consumes no parent API, reads only campaign/state/Business revisions and owns no persistent data.

| FR / boundary | Exported signature | Reads / returns |
|---|---|---|
| FR-015-001 | `readMarketingReportSource(tx, businessId, campaignId) → SourceSnapshot` | Existing transaction's resolved operator viewer and Business setting; one scoped SELECT, verified state hash, precise bigint revision strings. Actor is read from `tx.zuriViewer`, never passed by the caller |
| FR-015-001 / preview request | `readPreviewRequest(req, now) → Window` | At most 1024 UTF-8 bytes; four scalar fields, rejects duplicate keys; no source/actor override |
| FR-015-002 | `validateWindow(input, now) → Window` (pure) | Monday→Monday dates, IANA timezone and offset-qualified non-future as-of |
| FR-015-002 | `deriveReportedFacts(state, window) → ObservedFacts` (pure) | Manual arrays; activity uses half-open event dates and state at activity end; cohort eligibility/follow-up uses as-of. Does not establish coverage or timezone |
| FR-015-002 | `previewMarketingReport(snapshot, requestedWindow) → Preview` (pure) | Strict sanitized context, 12 null/UNKNOWN measurements, optional unverified weekly assertion; no raw state or durable envelope |
| FR-015-002 / preview identity | `canonicalHash(value) → SHA256` (pure) | Compact UTF-8 recursive key sorting, preserved array order; rejects non-finite/undefined values; parity checked with existing persistence hash |

P1 deliberately has no path that enables ready values from client/state timezone claims. Source schema has no audited attestation record; the mapper always returns HELD. Internal observed zero and n/N are calculation-test evidence only and do not appear in the preview. Missing state produces null settingsVersion, targets and revision/hash fields plus `CAMPAIGN_STATE_MISSING`; this is an incomplete preview, never the strict wire envelope. Privacy and authority tests bind TC-015-001/002; real source acceptance binds TC-015-003 and remains NOT_RUN.

Acceptance examples: empty source → UNKNOWN/null; reported cap 0 → planning context `"0"`; same snapshot/window/capture time → same preview hash. Adversarial cases are in the bound test files; no local-model micro-task is dispatched.

## Interfaces — approved P2

The owner approved [P2 preparation, freeze and queued outbox](p2-freeze-outbox.md) on 2026-10-05. [CMP-003](../../services/SRV-002-local/CMP-003-marketing-report-ledger.md), `apps/api/marketing-report-ledger.mjs`, owns the local adapter and exposes [API-025](../../domains/campaign/contracts.md#api-025--local-marketing-report-preparation-and-freeze). It reads scoped campaign/state/Business revisions and the reviewed association; owns only the four P2 ledger tables. No parent API is consumed.

| FR / layer | Exported signature | Responsibility |
|---|---|---|
| FR-015-001 | `prepareMarketingReport(tx, businessId, campaignId, request) → PreparationResult` | SQL-created safe preview/time/hash, exact original replay; independently compare new JS/SQL projection |
| FR-015-001/003 | `readLedgerRequest(req, operation) → Request` | ≤4096 UTF-8 bytes, strict nested keys, duplicate/Unicode rejection before DB |
| FR-015-001 | `validatePreparationRequest(input, now) → PreparationRequest` | Three exact fields; selected association UUID and approved weekly window |
| FR-015-003 | `validateFreezeRequest(input) → FreezeRequest` | Exact four fields, IDs/hash and five-field string revision tuple |
| FR-015-003 | `buildMarketingEnvelope(preparation, association, serverIdentity) → CanonicalEnvelope` | Strict held projection/wire whitelist; original payload/window; server report ID/time and registered routing |
| FR-015-001/003 | `freezeMarketingReport(tx, businessId, campaignId, request) → FrozenReportResult` | SQL finalizer locks/rechecks, then atomic report + QUEUED + audit; no network |
| FR-015-003 | `readMarketingReport(tx, businessId, reportId) → PrivateReport` | Private immutable bytes/hash/state; active unchanged association before disclosure |
| FR-015-003 | `canonicalText(value) → UTF8Text` | Compact canonical text, same hash domain as P1 |
| FR-015-003 | `ledgerRetry(error) → Boolean` | Router retries only 40001/exact ledger unique conflicts, at most two retries |

`PreparationResult` and `FrozenReportResult` carry `{replayed, preparation/report}`; 201 new, 200 replay. SQL's `marketing_prepare(uuid,uuid,jsonb)` and `marketing_freeze(uuid,uuid,jsonb)` construct source/clock/routing themselves. Helpers are not runtime-callable. API-024/CMP-002 keep their read-only P1 promise. TC-015-005/006 pass; TC-015-007 native concurrency/locks is NOT_RUN, so P2 exit remains open.

## Future interfaces — not implemented

- FR-015-004 · `dispatchMarketingReport(scope, reportId, now) → DeliveryResult` — manual invocation, leased attempt and bounded retries; no worker starts at application boot.
- FR-015-005 · parent `acceptReportedMarketingEvidence(authenticatedBinding, envelope) → DurableReceipt` — candidate signature in this design only; parent record/schema/authorization approval is mandatory.

No sender/receiver API or cross-system event is allocated; candidate delivery/parent paths are not callable capabilities.

## Failure modes

| Failure | Required behavior |
|---|---|
| missing/revoked binding or inactive target | reject before report write; do not fall back to Guest/owner session |
| changed source or preview | 409; build a new preview; do not overwrite frozen report |
| same key, changed hash | 409; preserve prior evidence and receipt |
| different binding/Business/initiative/tenant | fail closed before replay lookup or write; do not return another scope's receipt |
| malformed/oversized/unapproved payload | reject strictly; no raw JSON/free-text fallback |
| network/timeout/5xx after possible commit | UNKNOWN with retryable attempt metadata; identical replay, never mark success from transport alone |
| 429 | honor bounded Retry-After; no tight loop |
| acknowledgment hash/ID/binding mismatch | do not acknowledge; retain UNKNOWN/conflict evidence for operator |
| missing metric/timezone/cohort evidence | accepted report may carry nulls and reason states; it cannot gain READY/verified status |

## Implementation order and authorization gates

1. P1 was approved on 2026-10-05: source snapshot/projector/preview. Resolve the six parent/delivery decisions in the gap analysis before cross-system implementation.
2. Parent owner reviews the receiver and Identity extension in its own governed repository, including record IDs, permission and persistence. The existing Enterprise API auth is a lead for reuse, not an approved growth-write grant.
3. P1 source and synthetic tests are implemented; real PostgreSQL and live local HTTP acceptance remain NOT_RUN because this checkout has no local configuration. Run TC-015-003 against the existing approved local database; it rolls back all synthetic QA writes. No migration is needed for P1.
4. P2 ledger/outbox source and migration file are approved and implemented; run native isolated QA concurrency/lock acceptance before merge. Applying migration 011 to an application database is a separate operator action. Parent inbox/receipt and actual sending await their own approved implementation.
5. Run one isolated synthetic end-to-end report; only then consider credentials, hosted execution or production rollout under separate explicit operations authorization.

## Exit criteria

All FR/AC cases have executed tests with exact code paths and source commits, no failed or unexecuted required cases, both repositories agree on contract version and permissions, and source reports cannot mutate native parent approvals. Local model PASS and documentation PASS cannot replace that evidence. Parent live binding, receiver tests and production checks remain NOT_RUN.
