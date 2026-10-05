---
title: P3 explicit delivery — physical design for review
status: draft
superseded_by: null
version: 0.1.0
date: 2026-10-05
source_document: SDD-015
complexity: C-3
risk: HIGH
---

# P3 — delivery ledger, lease and receipt

Final main gate: parent main `07779662` issued FR-278 for a different dashboard subject. The parent subject references below belong to inspected task branch `fcb7ade3`, not active main. Parent `ZURI-GO-REPORT-MAIN-RECONCILIATION.md` proposes fresh coordinated issuance while preserving both histories; latest-main integration/coding is BLOCKED pending that decision. This does not redefine local Go identities or change wire bytes.

This chapter of [SDD-015](design.md) elaborates approved [P3](p3-delivery-receiver.md), [FR-015-004](requirements/FR-015-004-durable-delivery-receipt.md) and [FR-015-005](requirements/FR-015-005-source-preserving-receiver.md). Physical design approval is OPEN. The [wire contract](contract.md) v0.3.0 remains the only field/hash/receipt SoT; its complete cross-system delivery scope needs approval with this design. Revision 1/null supersedes only in the first slice; wire descriptions of future corrections do not authorize implementation.

Source inspected at Go `f06ef4d3e2321ff9ab24f125503bf32900343e37`, schema 11. Parent composition `fcb7ade3a022029cf47530643edc74fab2e49420` includes main `3506129f`; its reviewed physical counterpart is proposed at `docs/change-requests/marketing/ZURI-GO-REPORT-PHYSICAL-DESIGN.md` v0.1.0. Parent owns credential/current machine gate/SQLite evidence. Go owns PostgreSQL delivery and receipt validation. Pin both approved document blobs before coding; these external ZAI references are not local ID aliases.

[ASSUMPTIONS]

1. Explicit local operator send/retry only; no startup worker, hosted sending, browser token or automatic network retry. Existing operator/Business/DOM-CAM gates remain mandatory.
2. Frozen reports/outbox from migration 011 stay immutable. New delivery schema is additive; allocate the next migration/API/component/test IDs only after approval and fresh-main check.

## PostgreSQL storage proposal

Every new table carries Business scope with same-Business composite FK relations, forced RLS and operator-only policies. Restricted runtime has scoped SELECT and narrow SECURITY DEFINER finalizers only, no direct INSERT/UPDATE/DELETE. Functions pin search_path, revoke PUBLIC execution, validate trusted transaction principal/Business/current domain grant internally and never trust caller-supplied principal or scope. Operator role is the existing trusted local execution mode, not a Member impersonation.

| Table | Proposed columns / constraints |
|---|---|
| `marketing_report_deliveries` | One row per frozen report; composite Business/report FK; delivery state, positive row_version; attempt_count 0..4; first_sent_at, next_eligible_at; nullable UUID lease_id/expiry; nullable accepted receipt FK; safe outcome code. Report/Business identity immutable. ACK requires a validated same-report receipt and is terminal |
| `marketing_report_delivery_attempts` | UUID attemptId; Business/report/delivery identity, UNIQUE(report,attemptNumber), lease UUID, start/lease expiry, expected association row_version, bounded outcome/http-status and finish time. Claim identity/times immutable; result may transition exactly once from null to a safe terminal result. No request/response body, URL token, raw exception or credential |
| `marketing_report_delivery_receipts` | UUID local id; Business/report/attempt FK; parent receiverReceiptId, exact strict receipt fields, bounded canonical receipt bytes, acceptedAt, locally observedAt; UNIQUE(report), UNIQUE(bindingId,receiverReceiptId). All fields immutable; matching report binding/campaign/initiative/revision/hash required |

Runtime direct-write-denial and cross-Business FK tests are required, including function bypass attempts. Original `marketing_reports`, associations and QUEUED outbox from 011 are not modified. Migration can create QUEUED delivery projections for existing frozen outbox rows with count zero, without sending or changing original rows; validate every source FK before that additive backfill. Failed validation aborts migration. No real association is provisioned by migration.

Reports frozen after migration enter delivery through atomic lazy initialization inside Claim: after locking/checking Business and association and verifying the scoped immutable report/outbox, insert the missing QUEUED projection under its unique Business/report key, then lock it and run claim checks in that same transaction. A uniqueness contender reads the existing row; it cannot create a second delivery or reset an existing state/count. Initialization has no attempt, first_sent_at or network effect by itself; a failed claim rolls back its new projection. Migration backfill is optional convenience, not the only initialization path; no trigger/change to the 011 freeze finalizer is needed.

## Operator operations and transaction boundary

Candidate local API operation is a POST send/retry for one report; no new public route or automatic scheduler. Exact path/issued API ID is a later approval-scoped allocation. `apps/api/api.mjs` must retain hosted/Guest/Member denial before any claim/network action, matching current local report routes. Operator commands use private server config mapping association UUID + exact row_version + external binding to one HTTPS receiver origin and credential; credentials/URLs are not accepted from request bodies. Exact path is `/api/growth/external-marketing-reports`, no redirects. Synthetic loopback HTTP is permitted only by isolated test injection, never production config fallback.

| Operation | Atomic PostgreSQL result |
|---|---|
| Claim | Lock Business → association → delivery, check current operator/domain permission, active unchanged reviewed association and frozen envelope parity, state/time/count/lease eligibility; allocate attempt/lease UUID, increment count, insert attempt, set SENDING and first_sent_at once; commit |
| Complete | Same lock order; compare exact current lease UUID/attempt number and unexpired lease; verify current grants/active association; classify outcome; insert matching immutable receipt + set ACK together, or finish safe outcome and next eligibility; commit |
| Settle expired lease | Explicit operator recovery, same lock order and current authority; finish unfinished attempt as UNKNOWN, clear lease, compute retry eligibility; never send as part of settlement |

Each database transaction closes before network I/O. Use server DB clock after locks (`clock_timestamp`, not the transaction-start timestamp) for eligibility/lease deadlines. Bounded retry of a rolled-back 40001/40P01 transaction must recheck all grants and lease fences; it must never repeat the HTTP request. The claim commits before any send, so a crash consumes its attempt honestly. PostgreSQL pool connections are returned before HTTP and reacquired for completion.

Lease proposal: 60 seconds; network timeout includes headers/body and is 20 seconds. A claimant cannot send once its lease has expired. One claim permits exactly one HTTP call of the immutable stored bytes; no library retry, fallback credential or redirect. Finalization may wait only within the lease and must check expiry after locks. A stale worker cannot alter outcome or insert receipt. A current association/domain change prevents completion from acknowledging the response; leave SENDING for authorized expiry settlement → UNKNOWN. If authority is absent, settlement is denied and projection stays visibly unresolved; no credential fallback or silent rebind. Restoration of the exact original authority can permit later same-byte recovery; otherwise the report remains unresolved for operator review.

For every attempt, ACK requires post-lock DB now strictly before BOTH lease_expires_at and first_sent_at +24h. Here `first_sent_at` is the first committed claim, not proof that HTTP bytes reached the parent: it consumes one send attempt even after a pre-network crash. This conservative clock makes the wire's first-send age limit enforceable without trusting a worker; approval of this definition is part of the paired wire/physical review.

```mermaid
sequenceDiagram
  actor O as Local operator
  participant G as Go API
  participant PG as PostgreSQL
  participant P as Parent receiver
  O->>G: Explicit send one frozen report
  G->>PG: Claim + attempt + fenced lease
  PG-->>G: Commit; release connection
  G->>P: One bounded HTTP call; exact immutable bytes
  P-->>G: Committed receipt or uncertain response
  G->>G: Validate bounded strict receipt
  G->>PG: Complete under current authority and live lease
  PG-->>G: Commit ACK / UNKNOWN / other outcome
  G-->>O: Safe delivery state
```

## State and recovery rules

| From | Condition / explicit action | To |
|---|---|---|
| QUEUED | Eligible claim; count below 4 | SENDING |
| UNKNOWN / RETRY_SCHEDULED | Operator retry, next_eligible_at reached, age/count available, no active lease | SENDING |
| SENDING | HTTP 201/200 plus exact valid durable receipt, matching lease/current authority | ACKNOWLEDGED |
| SENDING | 429, no success receipt | RETRY_SCHEDULED, or EXHAUSTED if no remaining age/count |
| SENDING | Timeout/network/5xx/202/malformed or mismatched receipt; possible parent commit | UNKNOWN, or EXHAUSTED when bounded attempts/age unavailable |
| SENDING | 400/401/403/404/409/413/415/422 rejection | REJECTED; no automatic payload/key/target changes |
| SENDING | Expired lease, explicit authorized settlement | UNKNOWN or EXHAUSTED, never QUEUED/success |
| UNKNOWN / RETRY_SCHEDULED | Attempt 4 already used or first_sent_at +24h reached | EXHAUSTED; possible prior acceptance still recorded as uncertainty |
| ACKNOWLEDGED / REJECTED / EXHAUSTED | Any send request | Denied; no claim/network request |

Recovery uses the same frozen report ID/key/bytes. Backoff after attempts 1/2/3 is 1/5/15 minutes measured from local completion/settlement time. Four total calls, within 24h of first claim. Retry-After (delta seconds or HTTP date) is bounded/parsed and never shortens the baseline delay; use the later instant. Invalid header uses baseline. A retry at/after the age deadline is not allowed. An outstanding fourth attempt may still ACK a valid response within its lease and age deadline; otherwise settle EXHAUSTED without asserting parent nonacceptance.

If calculated next eligibility, including Retry-After, reaches/exceeds the age deadline, complete as EXHAUSTED immediately without another call. Otherwise-unclassified responses, including 3xx and unexpected 2xx, complete as UNKNOWN (or EXHAUSTED when limits are reached); never follow redirects or infer success.

Accept a receipt body of at most 4096 UTF-8 bytes with no duplicates/unknown keys, approved contract version and all strict wire fields. Compare binding, report, source campaign, target initiative, revision and payloadHash to the frozen row; require UUID receipt identity, supported reported-evidence status and valid offset-qualified acceptedAt. Local attempt observation time is not parent acceptedAt. HTTP status alone (including 202), matching hash alone or an unvalidated JSON body is never ACK. Limit all non-success response reads likewise and persist only sanitized outcome codes, not remote error text. Replay returns the original parent receipt. Evidence/receipt minimum retention is 90 days from parent acceptedAt; no purge command. UNKNOWN retains frozen source evidence until recovery is resolved.

An obsolete worker's late response cannot bypass the fence even if genuine. Do not persist it as an authoritative receipt or overwrite a settled attempt; record a safe stale-completion diagnostic only. Operator recovery replays identical bytes after eligibility; parent must reauthorize before disclosing its stored receipt. This sacrifices immediate late-response availability to preserve single-owner completion. No new human/native Marketing approval or Commerce verified total follows from ACK.

## Proposed native acceptance bindings

These are filenames for review, not additional issued TC artifacts or executed results. Existing acceptance plans 04/05 in [verification](verification.md) remain NOT_RUN. Allocate formal bindings through existing governance after approval.

| Candidate | Required evidence |
|---|---|
| `apps/api/test/marketing-report-delivery.test.mjs` | Pure receipt/limits/state classification; router denies hosted/Guest/Member before claim; no secret/body leakage or redirects; 20s timeout covers body; unknown/202 never ACK |
| `apps/api/test/marketing-report-delivery-db.test.mjs` | Real guarded disposable PostgreSQL: forced RLS/direct-DML denial; cross-Business finalizer rejection; freeze after migration → first claim and concurrent lazy initialization produce one delivery/attempt; authority/association change vs complete; lease expiry/stale worker; rollback atomicity; count/time/Retry-After boundaries; FK/immutability/source preservation |
| Cross-repository synthetic harness, owned jointly | Actual migrated SQLite/Prisma receiver and disposable PostgreSQL sender; commit then dropped response → UNKNOWN → same bytes replay → one parent report/audit and one matching Go receipt; revoked/disabled replay denial; different bytes conflict; native totals unchanged |

Use isolated QA Businesses and synthetic credentials only. Never run destructive tests against restored Local or Neon Production. Review PostgreSQL/SQLite migrations and private-config separation independently before applying anything. Application completion requires native tests and independent review, not documentation checks. Deployment, live provisioning, real send and migration have separate authorization gates.

Version diff 0 → 0.1.0: adds proposed delivery/attempt/receipt physical storage, operator finalizer/lease transitions, late-worker recovery, bounded receipt/network handling and native test bindings. Package stays 0.5.1; no schema, API, credential, data transfer or deployment changed.
