# FEAT-014 — implementation verification

The opening R2 evidence below is historical. The current R3 implementation changes application source and awaits a new immutable seal and independent gates; its focused worker evidence is recorded separately below.

Owner approved Phase A/B on 2026-10-02. This record covers the C manual/local-provider vertical slice and minimum D registry/dispatcher. C/minimum-D operational exit and closure-document review are PASS, including NFR-014-001. The sealed source candidate is **`771bbf70e437bf26cbfaa3a4ab643540155d8c59`** (tree `cf402db6884ec54a09400a1784d58fd1992d210a`). Resumed N6 tested that source with docs HEAD `a111d1c7a375cfc2d5db7d854c27e8ceb14ceb7d`; an isolated build and the NFR probe used the same application source at later documentation HEAD `cc03af66e533ad9bc4a788912df91a8bd389f25e`. These documentation-only follow-ups do not change the tested application source. The later whole-PR L2 review at HEAD 3fc3fb0 returned REWORK with five findings; L1 strict-schema review is NOT DEMONSTRATED. Real-provider, private-custody and production acceptance remain open.

Version diff: application **0.5.1 → 0.5.1** (no release); feature **0.1.0 → 0.1.0**; R2 added migration 009 and advanced isolated synthetic QA schema **8 → 9**. R3 adds migration 010 and advances isolated QA schema **9 → 10**. The user/cloud baseline remains schema 7 and was not inspected or migrated. Protected runtime hash and stable app ID remain unchanged.

R3 focused result (2026-10-03): migration 010 applied only to isolated QA; legacy fixture rows and old hashes remained intact, old reviews/outputs remained untrusted, and Guest visibility changed from one legacy output to none. The migrator rerun preserved function/table ACLs. Unit and DB suites passed 11/11 each, including source-ref API→QA, forged review/decision/output, terminal job/root-run status, and HTTP `status_url` coverage. The synthetic transition fixture remains for independent VerifyGate. Fresh VerifyGate/whole-PR ReviewGate and full regression/build/browser checks are pending or assigned there; no user/cloud migration or provider action was performed.

## Architecture and upstream reuse

The feature adds a Visual Marketing domain inside Zuri-Go. A `visual_projects` record extends an existing Project by UUID; briefs, immutable brand snapshots, stages, delegated runs, jobs, reviews and outputs are persisted in PostgreSQL. The first slice uses the existing local SRV-002 runtime, bounded server-side role/provider ports, viewer-scoped RLS and an attributable human approval. Hosted execution, direct shell or filesystem tools, binary image storage, autonomous publishing and E/F behavior are not part of this implementation. The approved design and contracts are in [ARCH-004](../../architecture/ARCH-004-visual-marketing.md), [SDD-014 and domain contracts](../../domains/visual-marketing/README.md), and the [data model amendment](../../architecture/visual-marketing/data-model.md).

The three source repositories were pinned as recorded in the [upstream analysis](../../architecture/visual-marketing/upstream-analysis.md#selective-integration-matrix). No upstream application code was copied or adapted; only the verified license texts were copied. Exact source paths below are relative to their pinned repositories.

| Source | Copied / adapted | Reimplemented | Skipped or deferred |
|---|---|---|---|
| `citedy/adclaw` | `LICENSE` copied to `licenses/adclaw-LICENSE.txt`; none adapted | `src/adclaw/agents/persona_manager.py`; `src/adclaw/agents/tools/delegation.py`; `src/adclaw/providers/models.py`; `src/adclaw/agents/tools/shared_memory.py`; `src/adclaw/app/crons/persona_sync.py` | `src/adclaw/app/mcp/manager.py` skipped |
| `DV0x/creative-ad-agent` | `LICENSE` copied to `licenses/creative-ad-agent-LICENSE.txt`; none adapted | `server/lib/orchestrator-prompt.ts`; `server/lib/nano-banana-mcp.ts` | `server/lib/ai-client.ts` skipped; `server/lib/session-manager.ts` deferred to E |
| `E-mmanuelM/brandcrew` | `LICENSE` copied to `licenses/brandcrew-LICENSE.txt`; none adapted | `rules/brand-guidelines.md`; `config/voice.md`; `agents/quality/SKILL.md`; `rules/quality-standards.md`; `agents/social_media_designer/SKILL.md` | `agents/analytics/SKILL.md` skipped; `agents/marketing_director/SKILL.md` deferred to F |

## First-PR acceptance and phase exit

The first-PR 16-item DoD from the approved request is recorded here against the source and verification evidence. “PASS” is bounded by the local/manual and synthetic-test scope described in this report.

| # | First-PR criterion | Result |
|---:|---|---|
| 1 | Zuri-Go builds | PASS — isolated `npm run build`, exit 0 |
| 2 | Existing functionality remains intact | PASS — full regression suite below |
| 3 | Visual Marketing domain is documented | PASS — approved feature, domain, service and architecture artifacts |
| 4 | Agent roles are registered | PASS — eight-role registry and dispatch tests |
| 5 | Creative Brief is structured data | PASS — schema and API regression tests |
| 6 | One vertical creative workflow executes | PASS — persisted manual/fake-provider workflow; no real provider claim |
| 7 | Outputs are persisted | PASS — database and browser evidence |
| 8 | UI displays workflow and Project state | PASS — manual Studio acceptance |
| 9 | QA step works | PASS — eight QA categories and regression tests |
| 10 | Human approval works | PASS — attributable local-operator approval and regression tests; not a Member-browser sign-off |
| 11 | Provider secrets stay server-side | PASS for reviewed boundaries and available scans; private custody remains NOT RUN (0/5 inputs) |
| 12 | No production deployment was performed | PASS — none performed |
| 13 | No production migration was performed | PASS — none performed |
| 14 | Third-party attribution is complete | PASS — three license files and `THIRD_PARTY_NOTICES.md` |
| 15 | Upstream provenance is documented | PASS — pinned path-level matrix linked above |
| 16 | Relevant tests pass | PASS — N6 full regression and focused R2 checks below |

| Phase exit | Result | Evidence / boundary |
|---|---|---|
| C — persisted manual workflow and Studio UI | PASS | Full regression, isolated build, prior manual browser flow and the no-provider/manual label; download evidence is from app source `b569cf0` and UI paths are unchanged through source candidate `771bbf7`. |
| D — minimum eight-role registry and controlled dispatcher | PASS | Registry, permission, scoped-context, lineage/depth and R2 database tests; bounded ReviewGate coverage described below. |
| NFR-014-001 — 20-client enqueue/status p95 | PASS | Command: `node .local/visual-dag/verifygate/nfr014-001-probe-20261003.mjs`. The harness reads the ignored `.local/config.json`, verifies its target is the designated isolated QA database, then supplies `ZURI_GO_ADMIN_URL`, `ZURI_GO_DATABASE_URL`, `ZURI_GO_VISUAL_ENDPOINT` and `ZURI_GO_VISUAL_MODEL`; values are not recorded here. 20/20 enqueue requests returned 202 (p95 91.66 ms, max 91.72 ms); 20/20 status requests returned 200 with matching job id and queued state (p95 19.94 ms, max 20.07 ms). During an 8-second delayed fake-provider wait, the application pool held zero open transactions. Synthetic QA only; worker was stopped after measurement. Evidence: `.local/visual-dag/verifygate/nfr014-001-probe-20261003-validated.json`. |
| Closure of this C/minimum-D record | PASS | Independent Luna Max ReviewGate on 2026-10-03 reviewed the six-document closure update and found no remaining C/minimum-D requirement. This scoped result does not establish whole-PR merge readiness. |

## Whole-PR review and merge readiness

| Review gate | Result | Evidence / boundary |
|---|---|---|
| STD-005 L2 whole-PR review | REWORK | Independent Sol Max review of merge-base `9e224c851b6c5c2b25232d41e183bf8623b5bb7a` through HEAD `3fc3fb01ba424aa75b9006936bb0bb68d03dfc76` found five issues. VerifyGate confirmed findings 1–4 in isolated QA/API checks; finding 5 is a static parent-document mismatch. Evidence: `.local/visual-dag/reviewgate/l2-review-3fc3fb0.md` and `.local/visual-dag/verifygate/l2-public-insert-validation.json`. |
| STD-005 L1 strict-schema review | NOT DEMONSTRATED | No L1 review evidence is claimed by the L2 result. |

## Changed files and database

The implementation range is `9e224c851b6c5c2b25232d41e183bf8623b5bb7a..cc03af66e533ad9bc4a788912df91a8bd389f25e`: 66 files, 2,509 insertions and 69 deletions. Grouped paths:

| Group | Files |
|---|---|
| Docs and RCA | `docs/README.md`; `docs/architecture/{ARCH-002-postgresql-data-model.md,ARCH-004-visual-marketing.md,README.md,decisions.md,visual-marketing/{data-model.md,upstream-analysis.md,upstream-provenance.md}}`; `docs/domains/visual-marketing/{README.md,contracts.md}`; `docs/features/FEAT-014-visual-marketing-team/{feature.md,design.md,execution-dag.md,verification.md,requirements/FR-014-001…013.md,requirements/NFR-014-001…002.md}`; `docs/migrations/extraction-verifier-portability-proposal.md`; `docs/operations/RB-001-runbook.md`; `docs/product/PRD-001-zuri-go.md`; `docs/services/SRV-002-local/{CMP-001-visual-marketing.md,SERVICE.md}`; `.brain/rca/FEAT-014-{extraction-verifier-portability,public-output-integrity,verification-findings}.md`. |
| Backend | `apps/api/{api.mjs,migrate.mjs,server.mjs}`; `apps/api/visual-marketing/{api,contracts,jobs,providers,registry,service}.mjs`. |
| Frontend | `apps/web/src/content/meeting/MeetingWorkspace.jsx`; `apps/web/src/content/visual-marketing/{VisualStudio.jsx,visual-studio.css}`. |
| Database | `apps/api/migrations/008_visual_marketing.sql`; `apps/api/migrations/009_visual_public_output_immutability.sql`. |
| Tests and verification tooling | `apps/api/test/{cloud-handler.test.mjs,visual-marketing-db.test.mjs,visual-marketing.test.mjs}`; `scripts/docs/tests/test_docs.py`; `scripts/site/{test_verify_extraction.py,verify_extraction.py}`; `tests/visual-marketing/browser-checklist.md`. |
| Build and registries | `scripts/{run.mjs,deploy/build_cloud.py}`; `registry/{domains.yaml,services.yaml}`. |
| Licenses and notices | `docs/architecture/visual-marketing/licenses/{adclaw-LICENSE.txt,brandcrew-LICENSE.txt,creative-ad-agent-LICENSE.txt}`; `THIRD_PARTY_NOTICES.md`. |

Migration 008 adds the FEAT-014 persistence model and RLS policies. Migration 009 replaces broad runtime update authority on `visual_public_outputs` with column-level `UPDATE(active)` and a one-way visible-project retraction policy. The R2 migration was applied only to isolated QA, advancing that database from schema 8 to 9. User-local and cloud databases remain untouched.

## Security boundaries

The API uses the restricted runtime database role and existing viewer context/RLS. Agent roles receive server-defined scoped inputs and tool grants; no upstream shell, file-edit or hot-loaded MCP runtime was imported. Human approval remains attributable to the local operator in manual mode. Migration 009 prevents runtime changes to output payload, hash, artifact and decision references and disallows reactivation; tests confirmed that retraction removes Guest-visible output. No model/provider key or real credential was configured or sent to a provider. Available known-secret scanning checked two values and passed; private-preserved custody is NOT RUN because 0/5 handover inputs were available, so complete production-secret custody is not claimed.

## Git and pull request chronology

| Item | Recorded state |
|---|---|
| Branch / base | `feat/visual-marketing-team`, based on `9e224c851b6c5c2b25232d41e183bf8623b5bb7a` |
| Main milestones | `218911e` architecture and contracts; `b569cf0` initial Studio/workflow; `27ca9e6` extraction-verifier portability; `fef7419` docs-fixture CRLF fix; `771bbf7` public-output immutability correction; `a111d1c` initial blocked-gate record; `cc03af6` resumed-gate record. |
| Code candidate | `771bbf70e437bf26cbfaa3a4ab643540155d8c59`, tree `cf402db6884ec54a09400a1784d58fd1992d210a` |
| Verification overlays | N6 full suite and R2 delta review used docs HEAD `a111d1c7a375cfc2d5db7d854c27e8ceb14ceb7d`; isolated build and validated NFR probe used docs HEAD `cc03af66e533ad9bc4a788912df91a8bd389f25e`. Application source remained `771bbf7`. |
| Pushed HEAD and diff | Branch was pushed through `cc03af66e533ad9bc4a788912df91a8bd389f25e`; the base-to-pushed-HEAD diff is 66 files, +2,509 / −69. This closure documentation is a separate docs-only change after that HEAD and does not change the source candidate. |
| Pull request | Draft PR #1 targets `main`. Its user-authorized push was completed through `cc03af6`; no merge, deployment or cloud migration was performed. |

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
| Isolated build | PASS | `npm run build` exit 0 in the isolated verification snapshot; application source matches sealed `771bbf7`, docs HEAD `cc03af6`. Evidence: `.local/visual-dag/verifygate/build-feat014-cc03af6.raw.log`. |
| R2 ReviewGate / N7 | PASS — bounded delta review | Reviewed only the R2 delta; prior C/D coverage was carried forward. R2 public-output ACL, one-way visible-project retraction and regression checks passed; RG-N7-001 is closed, with no confirmed new issue. This was not a new whole-PR review. Evidence: `.local/visual-dag/reviewgate/n7-review-r2-resumed.json`. |
| NFR-014-001 delayed-provider probe | PASS | `node .local/visual-dag/verifygate/nfr014-001-probe-20261003.mjs`; reads ignored `.local/config.json`, validates the isolated QA target, and supplies local `ZURI_GO_*` settings (values are not recorded). 20/20 concurrent enqueues returned HTTP 202 (p95 91.66 ms, max 91.72 ms); 20/20 status reads returned HTTP 200 with matching id and queued state (p95 19.94 ms, max 20.07 ms); zero application-pool transactions during the 8-second fake-provider wait. Synthetic QA only. Evidence: `.local/visual-dag/verifygate/nfr014-001-probe-20261003-validated.json`. |
| Closure-document checks | PASS | `npm run docs:validate` exit 0 (0 errors, 166 known baseline warnings); `npm run docs:views` exit 0 (11 views, 0 drift); `git diff --check` PASS. Logs are retained under ignored `.local/visual-dag/worker/`. |
| Phase-closeout VerifyGate | PASS | Final closeout record parsed SHA-256 `97E07A3F3D2370A40CB1B6413ACCF318DF5356C34BABFD461738F7A0E7C757B8`; evidence: `.local/visual-dag/verifygate/phase-closeout-verifygate-20261003.json`. Operational checks and cleanup were PASS. |
| Closure-document ReviewGate | PASS | Independent Luna Max ReviewGate on 2026-10-03 passed the six-document closure diff with no remaining C/minimum-D requirement. This bounded review remains historical and does not clear the later whole-PR L2 findings. |
| Whole-PR STD-005 L2 ReviewGate | REWORK | Independent Sol Max review returned five findings on the full PR at HEAD `3fc3fb0`; see `.local/visual-dag/reviewgate/l2-review-3fc3fb0.md`. |
| STD-005 L1 strict-schema review | NOT DEMONSTRATED | No L1 review evidence is claimed. |
| Whole-PR L2 VerifyGate validation | PASS - findings confirmed | Isolated QA/API checks confirmed the public-output INSERT read by Guest, source-less approved claims, job/run terminal mismatches, and status_url route mismatch. No HTTP exploit was demonstrated. Evidence: .local/visual-dag/verifygate/l2-public-insert-validation.json. |
| QA runtime recovery and cleanup | PASS — isolated scope | The existing isolated QA container remains running as `zuri-go-visual-qa` on `127.0.0.1:54339`; resumed N6 temporary server PID 19800, session 47820, was stopped and its gate recorded no 4319 listener. Final cleanup removed exactly 3 synthetic Businesses, 63 Projects and their child rows in FK-safe order; 0 remained. No owned ephemeral server process remained, and cleanup did not start a server on 4319 or 4329; existing preview state is unchanged. Evidence: `.local/visual-dag/verifygate/nfr014-001-probe-cleanup-20261003.json`. No user or cloud database was used or migrated. |
| Browser download | PASS — prior app source only | Saved 407-byte `visual-prompt.txt`, SHA-256 `394A76B79BDC41AFC7C55A970300C18CAFEF0963CF3818B7E962EEAE2F7CFB65`, while app source was `b569cf0d3296dbec4285f71e751ea0cca2506310`. Not repeated on R2. |
| Real provider / image quality | NOT RUN | No feature-specific model endpoint/model configuration; provider behavior and image quality are unverified. |
| Hosted deployment / production | NOT RUN | No deployment, promotion, cloud migration, credential provisioning or user-data mutation. |

The resumed R2 full regression passed; the earlier process-policy block remains historical and was superseded only for N6 full-suite status. R2 no-write extraction checks passed for available files, but absent private handover inputs remain **NOT_RUN** and do not prove that every production credential is excluded. See the [verification RCA](../../../.brain/rca/FEAT-014-verification-findings.md), [R2 public-output integrity RCA](../../../.brain/rca/FEAT-014-public-output-integrity.md), and [whole-PR L2 findings RCA](../../../.brain/rca/FEAT-014-l2-review-findings.md).

## Remaining work and limits

The C/minimum-D operational exit and closure-document ReviewGate remain PASS for their bounded scope. The later whole-PR L2 review is REWORK with five findings; focused R3 implementation and synthetic-QA checks pass, while fresh independent VerifyGate and whole-PR ReviewGate remain pending. L1 strict-schema review is NOT DEMONSTRATED. Provider execution and model quality are NOT RUN. Per the approved [design](design.md), the current adapter is local Ollama and nonbillable; before enabling chargeable providers, implement durable reconciliation for ambiguous paid submissions (no `SUBMISSION_UNKNOWN` path is currently reachable). Provider unit tests do not establish paid-provider reconciliation. Process-restart behavior, hosted execution design/authorization, binary image providers/storage, E variants and F performance learning also remain future work. Private-preserved custody is NOT RUN for 0/5 inputs. No hosted CI, production-readiness or release-acceptance claim follows from these local checks; no production credentials or user records were used.

The resumed N6 suite on docs HEAD `a111d1c` included `docs:validate` (0 errors / 166 baseline warnings) and `docs:views` (11 views / 0 drift). This later documentation-only follow-up is not the source candidate used for `npm test`.
