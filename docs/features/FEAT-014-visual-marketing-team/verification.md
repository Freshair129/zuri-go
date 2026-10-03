# FEAT-014 — implementation verification

Owner approved Phase A/B on 2026-10-02. This record covers the C manual/local-provider vertical slice and minimum D registry/dispatcher. E/F execution, hosted worker and image storage remain unavailable by design. The sealed source candidate is **`771bbf70e437bf26cbfaa3a4ab643540155d8c59`** (tree `cf402db6884ec54a09400a1784d58fd1992d210a`); resumed N6 tested this source with docs HEAD `a111d1c7a375cfc2d5db7d854c27e8ceb14ceb7d`. This documentation-only follow-up is a later commit and does not change the tested source candidate. R2 operational gates passed; formal higher-tier, provider and production acceptance remain open.

Version diff: application **0.5.1 → 0.5.1** (no release); feature **0.1.0 → 0.1.0**; migration source **008 → 009**; isolated synthetic QA database **8 → 9**. Migration 009 was applied only to isolated QA. Existing local user and cloud databases were not migrated. Protected runtime hash and stable app ID remain unchanged.

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
| R1 full regression on `fef741976664e64cd38f29a6acf92fcd633d6f4f` | PASS — historical | 199/199 Node tests, 15/15 site tests, 47/47 docs tests, metrics and extraction checks; docs validation 0 errors / 166 baseline warnings; views 11 / 0 drift. This candidate is superseded and is not R2 evidence. |
| R2 worker focused checks on `771bbf70e437bf26cbfaa3a4ab643540155d8c59` | PASS | Restricted-role DB tests 8/8; docs tests 47/47; docs validation 0 errors / 166 baseline warnings; views 11 / 0 drift; migration syntax and schema-9 grant reconciliation passed. Synthetic QA only. |
| R2 VerifyGate focused database and privilege checks | PASS | DB regression 8/8; `zuri_go_app` has no table UPDATE, has `active` column UPDATE, and lacks `payload` and `decision_id` column UPDATE. Seal SHA and tree match. |
| R2 extraction check | PASS with custody gap | `--no-write` checked 236 unchanged source files and 61 deployment files; available known-secret scan checked 2 values and passed; protected extraction report stayed unchanged. Private custody is **NOT_RUN**: 0 of 5 inputs available. |
| R2 first N6 attempt | BLOCKED — historical | `npm test` was rejected at process creation with the generic reason “blocked by policy”; it did not execute. Record remains at `.local/visual-dag/verifygate/verifygate-r2.json`; the resumed result supersedes only its full-suite status. |
| R2 resumed full regression / N6 | PASS | `npm test` exit 0 on source `771bbf7` plus docs HEAD `a111d1c`: 200/200 Node, 15/15 site and 47/47 docs tests; 0 docs errors / 166 baseline warnings; 11 views / 0 drift. Evidence: `.local/visual-dag/verifygate/verifygate-r2-resumed.json`. |
| R2 ReviewGate / N7 | PASS — bounded delta review | Reviewed only the R2 delta; prior C/D coverage was carried forward. R2 public-output ACL, one-way visible-project retraction and regression checks passed; RG-N7-001 is closed, with no confirmed new issue. This was not a new whole-PR review. Evidence: `.local/visual-dag/reviewgate/n7-review-r2-resumed.json`. |
| QA runtime recovery | Recorded | The existing isolated QA container was restarted after host reset and remains running. Resumed N6 temporary server PID 19800, session 47820, was stopped; port 4319 had no listener. No user or cloud database was used or migrated. |
| Browser download | PASS — prior app source only | Saved 407-byte `visual-prompt.txt`, SHA-256 `394A76B79BDC41AFC7C55A970300C18CAFEF0963CF3818B7E962EEAE2F7CFB65`, while app source was `b569cf0d3296dbec4285f71e751ea0cca2506310`. Not repeated on R2. |
| Real provider / image quality | NOT RUN | No feature-specific model endpoint/model configuration; provider behavior and image quality are unverified. |
| Hosted deployment / production | NOT RUN | No deployment, promotion, cloud migration, credential provisioning or user-data mutation. |
| Formal STD-005 higher-tier review | BLOCKED | Worker, VerifyGate and ReviewGate used independent all-Luna Max agents. This operational separation does not meet the higher-tier L1/L2 model-diversity requirement in STD-005 R10. |

The resumed R2 full regression passed; the earlier process-policy block remains historical and was superseded only for N6 full-suite status. R2 no-write extraction checks passed for available files, but absent private handover inputs remain **NOT_RUN** and do not prove that every production credential is excluded. See the [RCA](../../../.brain/rca/FEAT-014-verification-findings.md) and the [public-output integrity RCA](../../../.brain/rca/FEAT-014-public-output-integrity.md).

## Remaining gates

Formal higher-tier review under STD-005 R10, real local-model quality and timeout/restart behavior, hosted execution design/authorization, binary image providers/storage, E variants and F performance learning remain open. No hosted CI, production-readiness or release-acceptance claim follows from these local checks. Live credentials and user records were not used in the recorded QA checks.

The resumed N6 suite on docs HEAD `a111d1c` included `docs:validate` (0 errors / 166 baseline warnings) and `docs:views` (11 views / 0 drift). This later documentation-only follow-up is not the source candidate used for `npm test`.
