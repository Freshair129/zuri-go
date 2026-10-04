---
title: Marketing report exchange verification and acceptance plan
status: approved
superseded_by: null
version: 0.2.0
date: 2026-10-05
---

# Verification — FEAT-015

## Git publication and next packet — 2026-10-05

P1 was committed/pushed at `11283e34d98130f1ee1f7c73e788e577624394a4` to `origin/codex/marketing-exchange-contract` at the owner's request. Remote HEAD matched the local commit after push; no PR/merge/deployment was performed. The 26-file staged diff passed whitespace/private-path/credential-pattern review; ignored config, dependencies and builds were excluded. Earlier “no commit performed” below describes the prior P1 implementation turn, not the later publication.

Continued work: [P2 design packet](p2-freeze-outbox.md), draft only. Parent checkout was rechecked read-only at clean `a6e295a5`; no receiver implementation was found in the inspected growth/Marketing paths. Local DB config was absent in this and the documented D:/workspace checkout, and Docker was not found in PATH; no environment was created or real DB touched. No P2 runtime/migration code is implemented by this packet.

P2 document checks: 0 validator errors / 166 unchanged baseline warnings, 11 views / 0 drift, scoped diff/whitespace PASS. Its preparation, migration and database acceptance cases are proposals and remain NOT_RUN.

The owner approved detailed FEAT-015 for the proposed next step, P1 source snapshot and sanitized preview, on 2026-10-05. Delivery is BUILDING. The local preview exists in source; real database/live HTTP acceptance, durable report/outbox, parent receiver and production remain unverified or unimplemented. [Gap evidence](gap-analysis.md) pins prior inspected sources; [contract](contract.md) distinguishes P1 from the wire proposal.

## P1 checks — 2026-10-05

Command: `node --test tests/campaign/*.test.mjs apps/api/test/marketing-report*.test.mjs apps/api/test/team-auth.test.mjs apps/api/test/visibility.test.mjs`.

Result: **66 PASS, 0 FAIL, 1 SKIP (NOT_RUN)**. This includes 15 new source/projection tests, the existing 35 campaign tests and 16 auth/visibility tests. Synthetic tests cover local/hosted/Member/Guest/cross-Business denial, one scoped SELECT, raw-state hash parity, exact bigint revisions, unknown/zero and activity/cohort calculation, refunds and late payments, strict request parsing, privacy, sanitized legacy gate assertions, source immutability and canonical preview hash.

| Check | Result / boundary |
|---|---|
| P1 source/projector and denial tests | PASS — mocked DB source and pure arithmetic/whitelist cases; no real DB or HTTP success claim |
| Packaging regression | PASS — Python site suite 16/16, including TC-015-004 import closure/private exclusion. A synthetic package exercises the real packager; this is not an app build or deployment |
| Documentation / views / diff | PASS — 0 errors / 166 baseline warnings; 11 views / 0 drift; scoped whitespace and diagram-preservation checks |
| Real PostgreSQL TC-015-003 | NOT_RUN — no databaseUrl/businessId is configured in this checkout. A read-only connectivity probe returned ECONNREFUSED; no database was started, provisioned or migrated |
| Live local preview POST / hosted API / browser | NOT_RUN — no configured local runtime; no hosted deployment or UI change |
| Freeze stale-source conflict, envelope/outbox, delivery and parent receiver | NOT_IMPLEMENTED / NOT_RUN |
| Mandatory review before merge (STD-005 L2) | NOT_RUN — this turn implements P1; no commit, PR, merge or deployment performed |

Source review: every new actual measurement is held UNKNOWN/null; request/state timezone fields cannot enable readiness. Reader uses the existing resolved-viewer repeatable-read transaction and a current Business-setting predicate. One explicit SELECT reads campaign/state/Business only. Preview returns safe campaign/revision fields, no raw state, no write/network path. This bounded review does not replace independent merge review.

### TC-015-001 — Source scope and router denial
Relations: verifies: AC-015-001-01, AC-015-001-02
Test: `apps/api/test/marketing-report-source.test.mjs`

PASS 4/4 — query/hash/revision contract mocked; denial calls reach the actual router and reject before database access. AC-015-001-01 real snapshot execution is separately NOT_RUN.

### TC-015-002 — Observed calculations and safe preview
Relations: verifies: AC-015-002-01, AC-015-002-02, AC-015-002-03, AC-015-002-04
Test: `tests/campaign/marketing-report-projection.test.mjs`

PASS 11/11 — includes strict window/body and preview hash cases. Known arithmetic remains internal; no audited source timezone/coverage exists, so ready-metric export is not implemented. Pure-fixture source immutability passed; real DB immutability is TC-015-003.

### TC-015-003 — Real scoped transaction and source preservation
Relations: verifies: AC-015-001-01, AC-015-001-02, AC-015-002-04
Test: `apps/api/test/marketing-report-db.test.mjs`

NOT_RUN (1 skipped test). Requires an already configured local PostgreSQL; refuses cloud targets. Creates only random-ID synthetic QA records within a transaction that always rolls back. No schema operation. Confirms repeatable-read, actual scoped SELECT, revisions, source preservation and absence of audit writes. Does not exercise a live HTTP success or concurrent freeze.

### TC-015-004 — Hosted package import closure
Relations: verifies: AC-015-001-02
Test: `scripts/site/test_marketing_preview_package.py`

PASS — reproduces missing router dependency before the packager allowlist adds marketing-report.mjs, then confirms all static relative imports exist and .local/test paths are excluded in a synthetic package. The actual router's hosted denial is TC-015-001; package success does not prove hosted acceptance or deployment. Command: `python -m unittest discover -s scripts/site -p 'test_*.py'` (16/16 including existing packaging tests).

## Executed checks

| Check | Result | Scope |
|---|---|---|
| Zuri-Go baseline and branch | PASS | clean merged main `28d084e`, then `codex/marketing-exchange-contract`; no staged work overwritten |
| Parent source scope | PASS, read-only | inspected clean main `d72bee57`; final parent main `a6e295a5` adds an executive KPI proposal and governance link only, with all inspected code/charter unchanged. New peer proposal reviewed; no parent write by this task |
| Existing campaign model suite | PASS, 35/35 | `node --test tests/campaign/model.test.mjs`; existing calculation behavior only, not FEAT-015 acceptance |
| Documentation validator / views | PASS with existing warnings | `npm run docs:validate`: 0 errors / 166 baseline warnings; `npm run docs:views`: 11 views / 0 drift. Executed with the documented installed-Python override |
| Flow/source/context-map checks | PASS | all MKT-F01–F07 covered; 18 ACs mapped to five acceptance plans; one declared FEAT-015 and SDD-015; scoped registry references and contract path resolve |
| Existing diagram preservation | PASS | source-version backlink updated to ARCH-005 v0.2.1; all 23 SVG hashes unchanged; packaged diagram-design checks pass on all four HTML views |
| Documentation diff / custody (0.1.0 preparation) | PASS | prior documentation-only checks; P1 later adds scoped runtime/test files described above |
| Schema migration / parent acceptance / live API / production | NOT_RUN | no schema, credentials, receiver or deployment changed |

## Required future acceptance

TC-015-001/002/003/004 now bind actual P1 files above. The later cases below remain acceptance plans, not additional TC artifact declarations. Passing P1 tests does not complete their FRs or the full exchange.

### Acceptance plan 01 — Source scope and consistent snapshot
Coverage: FR-015-001; AC-015-001-01, AC-015-001-02, AC-015-001-03.

Status: PARTIAL — TC-015-001 PASS, TC-015-003 NOT_RUN. AC-015-001-03 stale-source freeze conflict is NOT_IMPLEMENTED/NOT_RUN. Concurrent source/preview-freeze acceptance remains future work.

### Acceptance plan 02 — Truthful measurements and sanitized opinions
Coverage: FR-015-002; AC-015-002-01, AC-015-002-02, AC-015-002-03, AC-015-002-04.

Status: PARTIAL — TC-015-002 PASS on fixtures; real DB preservation and ready values after audited source attestation remain NOT_RUN. No existing watermark or caller timezone can make a complete metric.

### Acceptance plan 03 — Envelope identity and strict limits
Coverage: FR-015-003; AC-015-003-01, AC-015-003-02, AC-015-003-03; NFR-015-001.

Status: NOT_RUN for the frozen wire envelope. P1 parsing/preview tests cover duplicate JSON keys, exact bigint revisions, rejected source decimal precision and key/array hash ordering only; no target binding or durable report exists. Proposed future test file: `apps/api/test/marketing-report-contract.test.mjs`.

### Acceptance plan 04 — Bounded delivery and receipt recovery
Coverage: FR-015-004; AC-015-004-01, AC-015-004-02, AC-015-004-03, AC-015-004-04; NFR-015-001.

Status: NOT_RUN. Proposed test file: `apps/api/test/marketing-report-delivery.test.mjs`. Holdout: commit then dropped response, 429 Retry-After, mismatch receipt, worker/lease interruption, fifth send, stale age, concurrent send and redirect to other origin.

### Acceptance plan 05 — Parent writer and authorization boundaries
Coverage: FR-015-005; AC-015-005-01, AC-015-005-02, AC-015-005-03, AC-015-005-04.

Status: NOT_RUN. Proposed parent test files require allocation in Zuri-AI's own reviewed record. Holdout: inactive/revoked credential after acceptance, Tenant-wide key without Business grant, valid key/crossed target, replay receipt disclosure, same key/new hash, concurrent corrections, immutable native Plan/review/decision and verified revenue.

## Completion gate and version diff

Docs completion: all seven flow rows and field lineage have inspected sources; spec and FR/AC references resolve; declared delivery and unexecuted cases stay explicit. Runtime completion: both reviewed contracts are implemented and all required unit/database/cross-repository acceptance has executed evidence with allocated TC IDs and actual test-file bindings. No production or live-provider claim follows from docs completion.

0.1.0 → 0.2.0: FEAT-015/FR-015-001/002 advance declared → building; approved P1 adds CMP-002, API-024, a bounded source/preview adapter, necessary packager dependency and four bound TCs. 15 new Node unit/synthetic checks and the new packaging test pass; one actual database test is explicitly skipped. Later envelope/outbox/receiver cases remain NOT_RUN. Package version stays 0.5.1; no database, credential, parent, UI or deployment operation occurred.
