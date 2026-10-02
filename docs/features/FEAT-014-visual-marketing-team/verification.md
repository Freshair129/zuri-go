# FEAT-014 — implementation verification

Owner approved Phase A/B on 2026-10-02. This draft implements the C manual/local-provider vertical slice and minimum D registry/dispatcher. E/F execution, hosted worker and image storage remain unavailable by design. This is not production or merge acceptance.

Version diff: application **0.5.1 → 0.5.1** (no release); feature **proposed 0.1.0 → implemented first slice 0.1.0**; migration source **007 → 008**; isolated QA database **7 → 8**. Existing local user and cloud databases were not migrated. Protected runtime hash and stable app ID remain unchanged.

## Executable test bindings

Tests use synthetic QA Businesses and the restricted runtime role. Provider tests use fake adapters: they do not establish real model quality. The hosted-handler suite invokes the actual cloud handler locally with signed QA sessions, not a hosted deployment.

### TC-014-001 — Structured brief and workflow
Relations: verifies: FR-014-001, AC-014-001-01, FR-014-003, AC-014-003-01, AC-014-003-02, AC-014-003-03
Test: `apps/api/test/visual-marketing-db.test.mjs`

### TC-014-002 — Schemas, registry and delegation
Relations: verifies: FR-014-001, AC-014-001-02, FR-014-002, AC-014-002-01, FR-014-004, AC-014-004-01, AC-014-004-02
Test: `apps/api/test/visual-marketing.test.mjs`

### TC-014-003 — Bounded providers and safe fallback
Relations: verifies: FR-014-005, AC-014-005-01, AC-014-005-02, AC-014-005-03, NFR-014-001
Test: `apps/api/test/visual-marketing.test.mjs`

### TC-014-004 — Durable jobs and concurrent receipts
Relations: verifies: FR-014-006, AC-014-006-01, AC-014-006-02
Test: `apps/api/test/visual-marketing-db.test.mjs`

### TC-014-005 — Hosted denial and no executor
Relations: verifies: FR-014-006, AC-014-006-03, FR-014-009
Test: `apps/api/test/cloud-handler.test.mjs`

### TC-014-006 — Creative QA findings
Relations: verifies: FR-014-007, AC-014-007-01, AC-014-007-02
Test: `apps/api/test/visual-marketing.test.mjs`

### TC-014-007 — Human authority, visibility and text assets
Relations: verifies: FR-014-008, AC-014-008-01, AC-014-008-02, AC-014-008-04, FR-014-009, AC-014-009-01, AC-014-009-03, AC-014-009-04, FR-014-010, AC-014-010-01, AC-014-010-02
Test: `apps/api/test/visual-marketing-db.test.mjs`

### TC-014-008 — Manual Studio browser acceptance
Relations: verifies: FR-014-011, AC-014-011-01, AC-014-011-03, AC-014-008-03
Test: `tests/visual-marketing/browser-checklist.md`

## Check ledger — 2026-10-03

| Check | Status | Evidence / boundary |
|---|---|---|
| Fresh migrations 001–008 | PASS | Separate PostgreSQL 17 QA database; runtime role has no superuser/BYPASSRLS |
| Focused Visual Marketing tests | PASS | 16 tests: contracts, real PostgreSQL, concurrency, lease fencing, cancel/retry, public retraction, strategy gate, QA and checksums |
| Hosted handler local tests | PASS | 13 tests including Guest mutation denial and EXECUTOR_UNAVAILABLE; no hosted invocation |
| Full regression | PARTIAL / command exit 1 | 199/199 Node tests and 9/9 Python packaging tests passed; extraction check requires unavailable private production handover files |
| Build/protected runtime | PASS | Both local and hosted packages; six explicitly allowlisted domain modules; no protected manifest change |
| Browser | PASS with download limitation | QA manual brief → Research → Strategy → Concept → Copy → Visual prompt → QA → operator approval and reload; desktop/narrow screenshots; download file saving UNVERIFIED because browser event tool timed out; no provider used |
| Real provider/image quality | NOT RUN | No feature-specific model configuration; image provider unavailable |
| Hosted deployment / production | NOT RUN | No deployment, promotion, cloud migration, credential provisioning or user-data mutation |
| Independent L1/L2 review | NOT RUN | Required before merge under STD-005 R10; PR remains draft and this turn has no merge authority |

The full extraction command is not reported green: canonical Git bytes resolved the initial Windows CRLF mismatch, then it stopped on `.local/member-access/production/index.md`. Private production handovers are deliberately absent from this worktree. The separate packaging checks inspect all 61 deployment files and do not include private data. See [RCA](../../../.brain/rca/FEAT-014-verification-findings.md).

## Remaining gates

Independent review before merge; real local-model quality and timeout/restart behavior with the chosen installed model; hosted execution design/authorization; binary image providers/storage; E variants and F performance learning. No production readiness claim follows from local tests. Live credentials and user records were never used in tests.

Documentation checks: `npm run docs:validate` PASS, 0 errors / unchanged 166 baseline warnings; `npm run docs:views` PASS, 11 views / 0 drift. Full regression exit 1 is retained as FAIL (environment prerequisite), not rewritten as PASS.
