---
title: Zuri-Go to Zuri-AI reported marketing evidence — approved wire contract
status: approved
superseded_by: null
version: 0.4.0
date: 2026-10-05
source_document: SDD-015
---

# Reported marketing evidence contract — v0.1

**NOT_WIRED.** The owner approved the paired wire/physical delivery scope on 2026-10-05, following the earlier local P2 whitelist approval. CMP-003 creates immutable bytes with contractVersion `zuri-marketing-report/0.1`. Receiver and sender implementation/native acceptance remain pending. Sources and incompatibilities are in [gap-analysis.md](gap-analysis.md); behavior belongs to the [requirement index](feature.md#requirement-index). P2 operations/storage/locks are authored once in [the approved P2 chapter](p2-freeze-outbox.md). First delivery supports revision 1/null supersedes only; future corrections are outside this approval.

## Direction, entity and authority

One frozen report represents **one Zuri-Go campaign, one weekly activity window and one as-of time**. Cohort measurements use their own explicit acquisition/follow-up windows. Every metric remains source-reported evidence. Source plan targets and weekly opinions do not gain parent approval authority.

Operational writers: Go writes its campaigns and report/delivery ledger; parent Marketing writes its own evidence inbox and receipt. Parent-native Initiative/Plan/PlanVersion/MarketingReview/MarketingDecision and Commerce verified revenue are never changed by accepting this report. Metrics-domain observations are read-only if referenced later; this v0.1 uses only campaign-state inputs and never sums two stores representing the same facts.

## Binding and authentication

Proposed receiver configuration binds one active source deployment and source Business to exactly one parent Tenant/Business, a reviewed service principal and `marketing.report.ingest` permission. This permission name and binding schema are proposals requiring parent Identity review. The receiver derives target Tenant/Business from that authenticated binding. Body hints must agree; they never select authorization scope.

Parent `resolveApiAccessViewer` currently provides a Tenant-scoped Enterprise service account. It is **not** a Marketing OWNER viewer and Marketing routes currently use a session viewer. Reuse requires an explicitly reviewed Business/operation binding and receiver gate; passing that service account into `assertMarketingWriteAccess` or synthesizing a Person/OWNER is prohibited. No tokens are minted or requested in this task. Secrets belong only in server/operator configuration, never envelope, browser, reports, source control or logs.

Each target initiative is explicitly selected within the bound parent Business. Parent resolves its own plan association. Human codes, campaign titles, local PID, Zuri-Go campaign UUID and parent initiative UUID are not interchangeable. Local and hosted deployments have different source deployment IDs, bindings and operational data unless an owner separately reconciles them.

## Proposed operation surfaces

| Side | Candidate operation | Authority and behavior |
|---|---|---|
| Go local | `POST /api/zuri-go/v1/businesses/{b}/campaigns/{id}/marketing-report-preview` | local operator only; consistent read and whitelist preview, no delivery |
| Go local | `POST /api/zuri-go/v1/businesses/{b}/campaigns/{id}/marketing-reports` | explicit preview hash/source revision; freeze sanitized report + QUEUED outbox atomically |
| Go local | `POST /api/zuri-go/v1/businesses/{b}/marketing-reports/{reportId}/send` | explicit send, same actor/Business scope, server-held credential and fixed origin |
| Parent | `POST /api/growth/external-marketing-reports` | **new candidate endpoint**, not present in inspected routes; explicit Identity ingest binding and active parent Business/domain gate |

The local preview is now API-024, approved for P1 and implemented in the Go router; the other three paths remain unallocated proposals. Native `/api/growth/plans/{id}` review/decide and the paid-media/Insights GET endpoints cannot be substituted as receivers.

### P1 preview contract — approved 2026-10-05

Local POST request has exactly `start`, `endExclusive`, `timezone`, `asOf` (strings). Dates are a Monday→Monday half-open week; timezone is an IANA name (UTC allowed); asOf is a valid offset-qualified instant no later than the server capture time and no earlier than the start's local date. At most 1024 UTF-8 request bytes, invalid UTF-8/JSON and duplicate keys (including escaped equivalents) reject. Campaign and Business come only from the configured path and resolved operator, never the body. Only local `postgresql-local` operator routing is allowed; hosted, Guest/Member and wrong Business are refused before database access.

Response has exactly `previewVersion` (`zuri-marketing-preview/0.1`), `readiness` (`HELD`), `businessId`, `campaign`, `sourceRevision`, `capturedAt`, `window`, `payload`, `previewHash`. Campaign carries `sourceCampaignId`, `code`, `objective`, `lifecycle`, `currency`. Capture time comes from the source transaction. Hash covers all preceding response fields, excluding previewHash, using the canonicalization below. New capture times change the hash; this is not a persisted/frozen report or a receiver idempotency key.

Payload whitelist is below. The current server has no audited source-timezone/coverage attestation, so every scalar and ratio n/N/cohort count is null/UNKNOWN. Source date watermarks may be retained as reported dates; collectionKnownAt and sourceTimezone remain null. Caller timezone scopes the request only. No arbitrary state attestation enables values. The missing-state preview additionally permits null settingsVersion/stateRowVersion/statePayloadHash, empty sourceReferences and `CAMPAIGN_STATE_MISSING`; these are explicitly incomplete preview fields, not allowed substitutions in a frozen wire envelope.

The optional review is the latest recorded date in the requested week through asOf (ID lexical tie-break), with a supported gate and positive settings version. Its sanitizedSnapshotHash hashes only the whitelisted identity/date/version/status/finding/recommendation/provenance/trust fields, excluding the hash itself; raw saved metrics, authors and text are not hashed into that review reference. It never attests the validity of the original saved snapshot or human approval. Missing/unmappable review yields null plus `WEEKLY_REVIEW_UNAVAILABLE`.

P1 always emits 12 candidate measurements and at most two references; output is bounded to 256 KiB. No persistence, reportId, target binding, network request or receipt is created. Strict wire validation/freeze and full delivery limits remain later work. See [API-024](../../domains/campaign/contracts.md#api-024--local-marketing-report-preview) for errors and [verification](verification.md) for evidence.

## Envelope — strict whitelist

Unknown properties are errors at every nested object. UTF-8 JSON, maximum proposed 256 KiB, 100 metrics and 32 source references; bounded strings and no arbitrary embedded workspace or records. Numeric/monetary **aggregate** values are canonical finite decimal strings (no exponent; at most four fractional places for amounts). Ratio scalars may use up to eight fractional places; counts are safe non-negative integers. Sending already-rounded JavaScript values must retain their source precision; it does not recover database precision.

| Field | Proposed type | Rule |
|---|---|---|
| `contractVersion` | literal `zuri-marketing-report/0.1` | unsupported version => reject; no silent downgrade |
| `reportId` | UUID | immutable report identity and idempotency key, scoped by authenticated binding |
| `reportRevision` | positive integer | source campaign/window revision chain; original is 1 |
| `supersedesReportId` | UUID or null | correction only; must identify the latest accepted prior report for the same binding/campaign/window; no cross-window correction |
| `source` | strict object | system `zuri-go`, opaque registered deploymentId and sourceBusinessId; no credential material |
| `target` | strict object | registered bindingId and parent initiativeId; resolved target Tenant/Business is not caller-controlled |
| `campaign` | strict object | sourceCampaignId UUID, bounded public code, source objective enum, lifecycle enum, currency; no owner display name/phone/notes |
| `sourceRevision` | strict object | campaign row version, campaign-state row version/payload hash, Business domain revision, source model/definition version; revisions serialized as canonical integer strings when bigint |
| `window` | strict object | activity start/endExclusive calendar dates, IANA reporting timezone, `asOf` offset-qualified instant; Monday→Monday for weekly report |
| `frozenAt` | offset-qualified instant | Go server timestamp captured once; replay never regenerates it |
| `payload` | strict object | context, measurements and nullable weeklyReviewAssertion described below |
| `payloadHash` | lowercase SHA-256 | hash canonical envelope without payloadHash; includes routing, all times/revisions and payload; does not authenticate a sender by itself |

Hash canonicalization is part of the version: recursively sort object keys by ASCII lexical order; schema keys are ASCII; preserve array order; reject non-finite numbers, undefined values, duplicate JSON keys and non-canonical numeric strings; UTF-8 compact serialization without BOM or newline. Measurement arrays sorted by unique metric key/scope and source references by unique reference ID before freeze. IDs and strings are not normalized after hashing. Go implementation must reconcile the existing `hashable` function with this definition explicitly instead of assuming hash parity with parent Plan hashes.

## Payload mapping

`context`: strict object with `settingsVersion` (positive integer), `targets` (`low`, `mid`, `high`: decimal or null), `releasedCap` and `committedSpend` (decimal or null), `definitionVersion` (bounded version string) and `missingFieldCodes` (unique bounded code array). Targets/caps are copied from the inspected source only; unknown is null. No raw `definition`, `accounting`, `sources` object or free text passed through wholesale. Plan/scenario figures cannot appear in the measurement array as actuals.

`sourceRevision` fields are `campaignRowVersion`, `stateRowVersion`, `statePayloadHash`, `businessDomainRevision`, `modelVersion`; the hash is exactly the captured state-row payload hash. The revision tuple, not a current later row, identifies the inputs used. `window` fields are `start`, `endExclusive`, `timezone`, `asOf`. Bounds for all opaque IDs/version strings are 160 characters; campaign public code 64 characters; no display-name/title text is needed to associate a report.

`measurements` is an array of strict objects: `key` (allowed enum below), `value` (decimal string or null), `unit` (`count`, `currency`, `ratio`), `currency` (three-letter code or null), `quality` (enum below), `reasonCodes` (up to 16 unique codes, 80 characters each), `scope` (strict object), `ratio` (strict object or null), `cohort` (strict object or null), `provenance` (strict object). Count-valued scalars must be canonical whole decimal strings within the safe-integer range. Ratio values are fractions, not percent; currency ratios such as CPL/CPO use `currency` units.

`scope`: `kind`, `start`, `endExclusive`, `timezone`, `asOf`, `offer` and `channel` (bounded source codes or null), `attributionState` (`NOT_APPLICABLE`, `UNKNOWN` or `SOURCE_REPORTED`). `ratio`: `numerator`, `denominator` (decimal strings or null), `numeratorUnit`, `denominatorUnit`, `formulaVersion`; both inputs must match the measurement scope or the scalar stays null. `cohort`: `followupWindowDays` (positive integer or null), `matureCount`, `pendingCount`, `convertedCount` (safe integer or null); its acquisition window/as-of comes from scope. Exported rows never carry raw lead identities.

`provenance`: `sourceClass` literal `MANUAL_REPORTED`, `modelVersion`, `collectionKnownAt` (instant or null), `watermarkDate` (date or null), `sourceTimezone` (IANA timezone or null), `timezoneState` (`ATTESTED` or `UNKNOWN`), `sourceRefIds` (IDs into envelope-level whitelisted `sourceReferences`). `sourceReferences`: up to 32 strict objects with `refId`, `kind` (`CAMPAIGN_STATE`, `LEGACY_REVIEW`, `LEGACY_DECISION`), `sourceEntityId`, `sourceRevision`, `sanitizedHash` (SHA-256 or null); they are identifiers, not arbitrary URLs or file contents. If no reference hash can be verified, its absence is explicit. Timezone attestation must be an explicit server-stored input with audit provenance before code enables a ready export; UI default selection is insufficient.

Payload has exactly `context`, `measurements`, `sourceReferences`, `weeklyReviewAssertion` and `missingFieldCodes`. Arrays are required even when empty; omission cannot become a successful complete report. Known empty counts require source coverage evidence; an empty array only means no approved measurement was exported.

Each measurement has:

| Field group | Required semantics |
|---|---|
| key and value | explicit source-reported metric key, finite decimal scalar or null, unit, currency only for money, quality `KNOWN`, `PARTIAL`, `UNKNOWN` or `UNAVAILABLE`, reasonCodes |
| provenance | `MANUAL_REPORTED` source class; source model/definition version; known collection time or null; source watermark dates plus explicit timezone/precision state; whitelisted internal reference IDs/hashes only |
| scope | `ACTIVITY` or `ACQUISITION_COHORT`, exact half-open period, dimensions at the supported campaign/offer/channel grain, as-of, attribution state; no invented platform/account/variant |
| ratio evidence | numerator, denominator and their unit/period/grain; formula version; no ratio when zero/unknown/mismatched denominator |
| cohort evidence | acquisition period, follow-up window days, mature/pending counts and as-of; conversion counts must be a subset of that same mature cohort |

Initial allowed candidates: `reported_spend`, `reported_impressions`, `reported_clicks`, `reported_new_leads`, `reported_mql_entries`, `reported_sql_entries`, `reported_paid_orders`, `reported_net_revenue`, `reported_ctr`, `reported_cpl`, `reported_cpo`, `reported_mature_lead_to_paid`. Exact source/quality rules in the gap table govern each. Do not expose ready-for-call rate, attributed ROAS, verified revenue or experiment winner without their missing source contracts.

`KNOWN` means the arithmetic/input facts are known for the **reported** scope; it never means provider-verified or independently complete. Partial records can have a known observed count while the complete-window scalar remains null or explicitly partial. A date watermark alone cannot upgrade completeness. Evidence items with unsupported/missing timezone or scope do not produce a decision-ready metric.

The current campaign model accepts inclusive date windows and its default `today` explicitly uses Asia/Bangkok. That display/default clock is not reporting-timezone metadata for each imported/manual record. v0.1 must not assume that record dates came from that timezone or an Ads account. An operator must explicitly record source reporting-timezone attestation before ready aggregates are built; absent metadata is shown in preview and held as UNKNOWN. To use a compatible daily model window, the adapter translates declared endExclusive to the prior calendar date in the attested reporting timezone; it cannot divide counts from differently scoped periods. No sum of per-day unique lead counts into a claimed unique cohort total.

`weeklyReviewAssertion` is null or a strict, bounded object: `sourceReviewId`, `recordedDate`, `settingsVersion`, `sanitizedSnapshotHash`, `reportedGateStatus`, `findingCodes`, `recommendationCodes`, `provenance` and `approvalTrust`. `reportedGateStatus` retains exactly G1's enum: `ON_TRACK`, `BLOCK`, `DATA_HOLD`, `LEARNING`, `FIX`, `HIGH`, `BASE`. Structured finding mapping is deliberately narrow: BLOCK → `GATE_BLOCKED`; DATA_HOLD → `MISSING_REVIEW_INPUTS`; LEARNING → `LEARNING_ONLY`; FIX → `RECHECK_REQUIRED`; the other statuses → empty array. It does not infer a specific cause from a natural-language message. `recommendationCodes` is an empty array in v0.1: local free-form decisions have no reviewed interoperable action enum yet. `provenance = LEGACY_REPORTED`, `approvalTrust = UNVERIFIED`. Unknown source statuses cause null assertion plus a reason, not a guessed mapping. The initial slice exports **no free-text review/reason**, embedded records, raw author identifiers or approval claims. Existing reviews/decisions can be edited through workspace state; their IDs or hashes do not prove an immutable human authorization. An omitted/unmappable assertion yields null and a reason, not a synthesized review. Store parent-native review/decision separately under existing independent-authority rules.

## Receipt and replay

Proposed HTTP 201 for first durable acceptance; HTTP 200 for exact replay. No acceptance acknowledgment before committing external evidence, receipt and audit in one transaction. `202` means pending, if a later approved design introduces asynchronous intake; it must not be treated as ACKNOWLEDGED in this v0.1 synchronous proposal.

Strict receipt: contractVersion, receiverReceiptId, reportId, bindingId, sourceCampaignId, targetInitiativeId, reportRevision, payloadHash, acceptedAt and status `ACCEPTED_REPORTED_EVIDENCE`. Sender verifies every binding/hash/reference before acknowledging. Receiver read authorization is re-evaluated on replay before returning a receipt, even when the key already exists. No receipt or projected metric is public by default.

Receiver uniqueness: authenticated binding + reportId; same bytes/hash returns the same receipt, concurrent replay creates one evidence/receipt/audit. Same key/different envelope is 409 with no overwrite. Correction uses a new reportId and incremented reportRevision; parent atomically links to the latest prior accepted version in the same source campaign/window. An older replay returns its existing receipt without moving the latest pointer backward. Concurrent corrections to one latest revision return one success and one 409. A new report UUID cannot overwrite an accepted prior report.

## Sender delivery states and bounded recovery

| Outcome | Sender state / next action |
|---|---|
| frozen but unsent | QUEUED |
| one leased explicit send | SENDING; one active attempt per report via atomic claim |
| validated durable receipt | ACKNOWLEDGED; terminal success |
| 429 before receiver processing | RETRY_SCHEDULED; honor Retry-After within configured bound |
| timeout/network/5xx or unmatched receipt, possible commit | UNKNOWN; store attempt result and next eligible retry; replay identical bytes/key |
| strict schema/target/auth/idempotency conflict | REJECTED; no automatic changes or fallback identity; operator reviews |
| maximum attempts or age exhausted without receipt | EXHAUSTED, with last outcome and operator action; never success |

Approved limits: 20 seconds per network call; maximum four total sends within 24 hours of the first committed claim, retry delays 1/5/15 minutes. The committed-claim clock is conservative: a crash before sending consumes the attempt and starts the age clock. If Retry-After reaches/exceeds the remaining age window, exhaust rather than shorten the requested delay. Manual retry checks eligibility and active lease. An interrupted SENDING lease becomes UNKNOWN after expiry, not QUEUED success. Rebinding, source correction or new credentials never mutates frozen envelope bytes; incompatible binding requires a newly reviewed report identity. State updates cannot modify report payload or accepted receipt.

## Review gates

Paired wire/physical approval and isolated native QA authorization are recorded above. Implementation and native receiver/sender acceptance remain pending. Real migrations, provisioning, sending and deployment require separately scoped operational approval. Live receiver acceptance remains NOT_RUN; [verification.md](verification.md) lists required adversarial cases.

Version diff 0.3.0 → 0.4.0: records owner approval of paired wire/physical scope and the first-committed-claim age clock. ContractVersion, envelope fields and immutable P2 bytes stay unchanged. Isolated native QA is authorized; real migrations, provisioning, transfer and deployment remain separate operations.
