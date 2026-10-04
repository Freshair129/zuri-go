---
title: Marketing report exchange verification and acceptance plan
status: approved
superseded_by: null
version: 0.7.0
date: 2026-10-05
---

# Verification — FEAT-015

## Local Production-backup restore — 2026-10-05

Current operator result: **Local and Production schema 11 PASS**. The owner explicitly approved creating Local from the verified Production backup. This section supersedes the dated Local NOT_RUN statements below. Complexity C-2, risk HIGH (data restore/migration). No application code changed; package remains 0.5.1 and Production deployment is unchanged.

Preflight confirmed a new empty destination, absent Local config and free loopback ports. PostgreSQL 18.6 uses the already verified portable runtime in `.local/marketing-native/runtime/pgsql`; persistent data is separately owned at `.local/postgres-local/data`, listening only on `127.0.0.1:55412`. Retain that runtime: it now serves this persistent Local as well as the separate QA engine. No old database/volume was overwritten, Docker installed, Windows service registered or firewall changed. Private folder ACL permits only the current Windows operator and SYSTEM.

| Check | Result / boundary |
|---|---|
| Source backup | PASS — same pre-011 schema-10 Production dump/checksum recorded below; never substituted the synthetic QA database |
| Actual persistent restore | PASS — `psql 18.6`, ON_ERROR_STOP and one transaction into new `zuri_go`; all 48 original table counts and ordered JSON hashes match the exported snapshot, including migration ledger |
| Local identity/custody | PASS — restored Business matches the backup; new Local admin/runtime credentials, SCRAM-SHA-256; restored Member credential hashes unchanged; restricted private `.local/config.json`; Production untouched |
| Actual Local migration 011 | PASS — reviewed `node apps/api/migrate.mjs`, loopback target guard, 5-second lock / 60-second statement limits; schema exactly 001–011 |
| Local source preservation | PASS — all 47 original application table counts/content hashes unchanged after migration, HTTP checks and tests; four new ledger tables empty |
| Actual Local runtime connection | PASS — real `zuri_go_app` login, non-superuser/non-BYPASSRLS/non-CREATEROLE; all 12 direct INSERT/UPDATE/DELETE probes denied with 42501, using savepoints/rollback; enabled/forced RLS and helper permissions verified |
| Existing Visual function ACLs | PASS after independent review correction — the ACL-free dump omitted four migration-010 function permissions. Exact six approved REVOKE/GRANT statements reconciled atomically on Local only; PUBLIC EXECUTE false on all four, runtime only record-review/finalize, two actual runtime internal-helper calls denied 42501 without invoking finalizers. All 47 source hashes/counts still match after reconciliation |
| Local server | PASS — existing server on `127.0.0.1:4319`, correct configured Business and `postgresql-local`; root, metrics, bootstrap, state and tasks GET 200; no pending Visual jobs at startup |
| Actual API-024 preview | PASS — existing campaign POST 200, HELD, 12 UNKNOWN/null measurements and valid canonical preview hash; no source writes or fabricated source attestation |
| Focused regression | PASS — 22 tests, 0 FAIL, 0 SKIP, including actual Local runtime snapshot test with rolled-back synthetic QA records |
| Build | PASS — protected Data App verification and packaging; 63 allowlisted files; private backups excluded; generated output was not deployed |
| Real API-025 preparation/freeze HTTP | NOT_RUN — no reviewed real parent association provisioned; isolated native concurrency/lock acceptance remains the separate PASS evidence below |
| Browser visual/interaction | NOT_RUN — browser tool unavailable; opening the Local URL in a queued panel is not browser acceptance |
| Direct Production runtime login | Still NOT_RUN — Local login evidence does not replace the unrecovered Production runtime-session check |

Actual test command: `node --test apps/api/test/marketing-report-db.test.mjs apps/api/test/marketing-report-source.test.mjs apps/api/test/marketing-report-ledger.test.mjs tests/campaign/marketing-report-projection.test.mjs`. `npm run build` used the installed Python 3.13 override; no protected manifest was rewritten. No broad/destructive suite ran against restored user data.

Private receipts under `.local/postgres-local/`: `restore-receipt.json`, `restore-verification.json`, `migration-receipt.json`, `post-migration-verification.json`, `http-verification.json`, `final-data-verification.json`, `marketing-tests.log`, `build.log`. Config, operator credentials, dump and raw responses stay private. Startup, shutdown and native backup commands are canonical in [RB-001](../../operations/RB-001-runbook.md#native-local-on-this-machine--2026-10-05). Local and Production are independent persistent states; this snapshot restore creates no automatic sync. No real parent association, send, parent write, Member credential rotation or Production deployment was performed.

Independent restore/documentation review of `483cc4f` returned REWORK for the native backup environment and omitted existing Visual function ACL checks. Both root causes and corrective scope are documented in [backup environment RCA](../../../.brain/rca/native-local-backup-environment.md) and [restore ACL RCA](../../../.brain/rca/production-backup-restore-function-acls.md). Additional private receipts: `backup-env-verification.json`, `all-function-acl-before.json`, `all-function-acl-after.json`, `visual-acl-reconciliation.json`, `after-acl-data-verification.json`. The backup example now uses separate validated child-environment connection parameters, clears inherited PG settings and retains ACLs in future native dumps. Its read-only connection/syntax checks passed; a new full dump was not executed.

Independent follow-up review of corrected candidate `f5c004a5a3088013c9470616f3f378c1d8808cd3` returned **PASS**: both findings resolved, restore/data/runtime/build/API evidence consistent and remaining limitations explicit. The reviewer made no database connections, process changes or edits. [PR #9](https://github.com/Freshair129/zuri-go/pull/9) carries the closeout; no GitHub CI checks are configured. Recording this result does not change the reviewed operations or commands.

Version diff 0.6.0 → 0.7.0: new persistent Local restored from verified Production schema-10 backup, migrated to 11 and verified with actual runtime/API/build/tests; former Local NOT_RUN is superseded. The earlier Production entry remains the dated operation receipt. Application stays 0.5.1.

## Production migration 011 — 2026-10-05

At this earlier Production operation: **Production PASS, schema 10 → 11; Local NOT_RUN**. The later Local restore section above supersedes only the Local and restore status. The following dated native/implementation sections are prior snapshots; this section supersedes their missing-Production-config and unapplied-schema statements. Application remains 0.5.1; no build/deployment/promotion, real parent association, sender or credential rotation was performed.

The owner authorized both targets and supplied the existing Neon owner connection directly into ignored private `.local/cloud-config.json`. Vercel CLI 59.6.2 login and project identity verification passed. All four Production env entries are Sensitive and pull yielded placeholders; none was used as a credential. The existing Neon resource `zuri-go-postgres` matched the open Neon project. Its admin connection was normalized to the direct endpoint with `sslmode=verify-full`. The Node TLS socket was encrypted/authorized with TLSv1.3; backend `pg_stat_ssl` is behind the Neon proxy and is not client TLS proof. Server PostgreSQL 18.6, schema 001–010, table owner and the existing public site's Business all matched before applying.

| Check | Result / boundary |
|---|---|
| Full Production backup | PASS — matching `pg_dump 18.6`, `--no-owner --no-privileges`, verified TLS root bundle; exported REPEATABLE READ snapshot |
| Backup completeness | PASS — 852,385 bytes; all 48 COPY sections/counts match that same snapshot; complete trailer; SHA-256 `9e16a8d8158f06e6c899f19648ee52d853b73c696a150574bddfe0dfc2c12110` |
| Backup restore drill | NOT_RUN for this new backup; completeness checks are not restore proof |
| Actual Production migration | PASS — reviewed migrator `node apps/api/migrate.mjs --cloud`, 5-second lock / 60-second statement limits; schema ledger now exactly 001–011; atomic grant reconciliation completed |
| Existing data preservation | PASS — counts and ordered JSON content hashes unchanged for all 47 pre-existing zuri_go tables; migration ledger is the only expected existing-table addition |
| New private ledger | PASS — four tables all empty; no real association, report, queue or audit fixture created |
| Production security metadata | PASS — enabled/forced RLS, Business/operator restrictive policies, private audit policy, enabled immutable triggers; runtime direct INSERT/UPDATE/DELETE revoked; only prepare/freeze runtime EXECUTE, no PUBLIC helper EXECUTE; runtime non-superuser/non-BYPASSRLS |
| Direct Production runtime session | NOT_RUN — runtime credential remains unrecovered and owner SET ROLE is denied (42501); no role membership/grant/password was changed to run the check. Native isolated runtime checks passed separately above |
| Existing hosted API | PASS — Guest bootstrap/state/tasks GET 200, configured Business matches, Member fields remain limited; same-origin form-header Guest task POST with empty invalid payload answers 401 |
| Local migration / API-024/025 HTTP | NOT_RUN — no Local database/config/Docker runtime available here; owner decision requested for locating the old Local database versus a separately authorized restore from the verified backup |
| New marketing API deployment / parent integration | NOT_RUN / not implemented; merged source and applied schema do not prove API rollout, binding or sending |

Source gate: the applied migrator and migration SQL match independently reviewed code `99ed23a66f3abebafa68a3a2ceec02b17a99468f`, merged through PR #6 at `001489f54de335a3cf563db8060e010d201d157c`. Postcheck comparison saved exact counts/hashes privately. The initial HTTP probe used unsupported standalone Member/meeting GET paths and omitted the required form header, giving 404/403; corrected documented state/task routes and the proper header passed. Those initial responses do not establish a database regression. A production source/RLS fix or permission escalation was neither needed nor performed.

Private backup is `.local/backups/zuri-go-production-pre-011-20261005.sql`. Private evidence is under `.local/vercel-recovery/`: `production-preflight.json`, `production-tls.json`, `production-baseline.json`, `production-backup-receipt.json`, `production-migrate.log`, `production-apply-receipt.json`, `production-post-migration.json`, `hosted-post-migration.json`; configs, backup contents and connection metadata stay ignored and are not published. Local has not been relabelled as the synthetic native QA cluster.

Version diff 0.5.0 → 0.6.0: restored private Production access; verified snapshot backup; authorized schema 10 → 11 applied; production source/security metadata and existing Guest API checks passed. Local is still NOT_RUN. No application version or deployed artifact changed.

## Native acceptance and independent review correction — 2026-10-05

The owner authorized native concurrency/lock testing, independent review before merge, and migration 011 to **both Local and Production**. Read-only preflight confirms that `O:/zuri-go/.local/config.json`, `cloud-config.json` and `postgres.env` are absent, the historical D:/workspace checkout is absent and no Docker/native PostgreSQL application listener was found. Vercel CLI whoami rejected its existing token as invalid. No real database target/identity/version or backup has therefore been verified; **Local and Production migration remain NOT_RUN**. No credential value was printed or provisioned for a real account.

Independent higher-tier L2 review of sealed candidate `b64da2cc1515431d58e2015089aedbf9f1b05167` returned **REWORK**: `migrate.mjs` committed its broad table grant separately from the marketing revocation. The reviewer reproduced runtime insertion of a synthetic unreviewed association during that window, and independently passed 29 marketing tests. [RCA](../../../.brain/rca/marketing-report-migrator-grants.md) records the evidence, root cause, detection gap and prevention. The correction puts the existing complete grant/revoke batch in BEGIN/COMMIT with explicit rollback on failure; final permissions are unchanged. A two-connection test now checks the intermediate state, interruption and successful final batch.

Independent higher-tier L2 review of corrected code candidate `99ed23a66f3abebafa68a3a2ceec02b17a99468f` returned **PASS**, with no remaining blocking code findings. The reviewer independently created fresh disposable database `zuri_go_marketing_qa_review_fd0e856898` in the same verified isolated PostgreSQL 18.6 cluster, ran the actual migrator twice (initial migration and rerun PASS), and passed all five native ledger cases plus the original P1 snapshot case. Private evidence is retained in `.local/marketing-native/independent-review-{native,snapshot}.log` and `independent-review-migrate-{0,1}.log`. Final closeout changes only documentation, without changing the reviewed runtime.

| Check | Result / boundary |
|---|---|
| Native P2 TC-015-007 | **PASS 5/5, 0 FAIL, 0 SKIP**, PostgreSQL 18.6, real separate admin/runtime connections; REPEATABLE READ concurrency, writer/audit waiting, clock after lock and intermediate ACL/interruption |
| Native P1 TC-015-003 | **PASS 1/1, 0 FAIL, 0 SKIP**, same synthetic QA engine; scoped read/revision/hash, source preservation, no audit; test rolls back its synthetic records |
| Regression after correction | **PASS 87, FAIL 0, SKIP 6**, campaign/marketing/operator-guards/auth/visibility; explicit native overrides omitted for this command. Its 5 native P2 and 1 P1 skips were separately executed and passed above, not counted as PASS in that command |
| Disposable WASM SQL | Included in regression: 8/8 PASS with the explicit ignored QA module; no application connection |
| Local/Production migration | **NOT_RUN** — private target config absent; no application DB schema/data/credential modified |
| Independent L2 | **PASS** — corrected code candidate `99ed23a`; independent migration/rerun and 6 native cases PASS |
| PR #6 | Review complete; no GitHub checks configured (`statusCheckRollup: []`). Merge must match the final pushed head |

The native engine is the official EDB portable Windows archive downloaded via `https://sbp.enterprisedb.com/getfile.jsp?fileid=1260609`, linked from the [EDB binaries page](https://www.enterprisedb.com/download-postgresql-binaries). Archive bytes 384,620,317; SHA-256 `e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2`. `postgres --version` and SHOW server_version both report **18.6**. It is extracted only under ignored private `.local/marketing-native/runtime`; no Windows service, Docker install, firewall change or application runtime upgrade. A fresh cluster under that directory listens only on `127.0.0.1:55411` and uses one-use synthetic QA passwords with scram-sha-256. Its folder ACL allows the current Windows operator and SYSTEM. No credentials enter tracked files or command output.

The new initially empty database `zuri_go_marketing_qa_20261005` was inspected, synthetic `zuri_go_app` was created only in that separate cluster, and the actual `apps/api/migrate.mjs` applied 001–011 there. The native suite then verified schema 11, zero initial Businesses and non-superuser/non-BYPASSRLS runtime before creating synthetic fixtures. Private runner/logs remain under `.local/marketing-native/` (`bootstrap-run.mjs`, `native-test.log`, `snapshot-run.mjs`, `snapshot-native-test.log`); runner credentials are private, so the public command is `node --test apps/api/test/marketing-report-ledger-postgres.test.mjs` with the two private QA target environment overrides. Native committed synthetic records are QA evidence only. This does not initialize or replace the user's Local Business.

Regression command: `node --test tests/campaign/*.test.mjs apps/api/test/marketing-report*.test.mjs apps/api/test/operator-guards.test.mjs apps/api/test/team-auth.test.mjs apps/api/test/visibility.test.mjs` with only the PGlite module override. Native P1 command: `node --test apps/api/test/marketing-report-db.test.mjs` with the synthetic runtime URL passed privately through its process environment.

Version diff 0.4.0 → 0.5.0: independent L2 correction review and an independent fresh-database native rerun are PASS; current acceptance statements distinguish isolated QA from real application operations. Real-target migration remains NOT_RUN. Application package stays 0.5.1. Authorization is recorded for both real targets; inability to resolve/connect/backup them is an environment limitation, not a new approval requirement.

## P2 approval and implementation — 2026-10-05

The owner approved [P2](p2-freeze-outbox.md) after reviewing draft commit `f9ca5aa`. CMP-003/API-025 now implement server-issued preparation, immutable freeze/read and QUEUED outbox. Additive migration file 011 exists; no ordinary local/production schema was applied. Main was fetched/read-only at `1188ec0` before allocating migration/API/CMP/TC identifiers; the intervening main commit contains only Visual Studio acceptance documentation. Branch changes do not include that unrelated document update.

P2 is **BUILDING / native exit open**, not deployment-ready. No application version bump, source-data mutation, real association/credentials, sender/worker, parent write, PR/merge or deployment is performed. The earlier sections below preserve P1 and the pre-approval packet history; current P2 status is this section.

| Check | Result / scope |
|---|---|
| Pure contract/parser/router P2 | PASS 6/6 — nested/escaped duplicate keys, UTF-8/surrogate/4096-byte rejection, exact fields/revisions, held envelope/hash whitelist, correctly hashed forged/private objects, local authority denial, precise retry classifier |
| Disposable WASM PostgreSQL P2 | PASS 8/8 — actual migrations 001–011 compile; strict finalizers, JS/SQL golden vectors and projection/envelope parity; stale source/hash/preview, original replay/expiry, one report/queue/audit, fault rollback, scoped RLS, direct-write/helper denial, immutability and migrator regrant/revoke behavior |
| Relevant Node regression | PASS 80, FAIL 0, SKIP 5 — 66 existing P1/campaign/auth/visibility cases plus 14 P2; skipped P1 local DB case and four native P2 cases |
| Packaging regression | PASS 16/16 — real allowlisted packager in synthetic site fixture; new router dependency included, private config/tests/migrations excluded; not an application build/deployment |
| Documentation / views / diff | PASS — validator 0 errors / 166 unchanged baseline warnings; 11 views / 0 drift; scoped diff whitespace and private-path review |
| Native PostgreSQL / locks / concurrency | NOT_RUN — no explicitly configured empty schema-11 local QA admin/runtime target. PGlite has one connection and does not prove REPEATABLE READ concurrency, source-writer waiting, retry races or expiry after waiting |
| Live local success / hosted API / browser | NOT_RUN — no application DB/config/server provisioned; actual router denial tests are synthetic. No UI or hosted rollout |
| Independent architecture/security merge review | NOT_RUN — required by STD-005; implementation remains on its feature branch |

Executed Node command (PowerShell, from repository root):

```powershell
$env:ZURI_GO_MARKETING_QA_MODULE = (Join-Path (Get-Location) '.local/marketing-qa/node_modules/@electric-sql/pglite/dist/index.js')
node --test tests/campaign/*.test.mjs apps/api/test/marketing-report*.test.mjs apps/api/test/team-auth.test.mjs apps/api/test/visibility.test.mjs
```

QA dependency: `@electric-sql/pglite@0.3.15`, installed only in ignored `.local/marketing-qa` with `npm install --prefix .local/marketing-qa --no-audit --no-fund @electric-sql/pglite@0.3.15`. It is **not** an application dependency or deployed package. The test instantiates a new in-memory database each run, loads pgcrypto and migrations, uses synthetic records and closes/discards the instance. It never reads application configuration or connects to a network DB. The [official extension documentation](https://pglite.dev/extensions/) describes pgcrypto support. Running without the module override explicitly skips those eight SQL cases; such skips are not PASS.

Source review: narrow SQL finalizers receive only typed operation requests and construct safe source projections, routing, IDs and clock; helpers are revoked from runtime/PUBLIC. Stored text has canonical/hash/typed-column parity constraints and ≤256-KiB bounds. All actual metrics and ratio/cohort counts remain UNKNOWN/null. Business NO KEY UPDATE → campaign → state → association → preparation lock order protects source/revocation while permitting a campaign writer's audit FK KEY SHARE. The actual clock is checked after acquiring locks. Marketing audit SELECT is operator-only. Whole-transaction router retries are limited to two, for 40001/exact ledger unique collisions. This source assessment is not independent merge review or native lock execution evidence.

### TC-015-005 — P2 request, envelope and route boundaries
Relations: verifies: AC-015-001-02, AC-015-003-02
Test: `apps/api/test/marketing-report-ledger.test.mjs`

PASS 6/6 — pure projection/strict nested parser and actual router denial before DB; correctly hashed private/ready-field forgeries still reject. No network or real DB success claim.

### TC-015-006 — Disposable SQL preparation/freeze/privacy/atomicity
Relations: verifies: AC-015-001-01, AC-015-001-02, AC-015-001-03, AC-015-002-03, AC-015-002-04, AC-015-003-01, AC-015-003-02, AC-015-003-03
Test: `apps/api/test/marketing-report-ledger-sql.test.mjs`

PASS 8/8 with the explicit ignored QA module. Real SQL functions, RLS/roles, append-only triggers, typed parity/hash constraints, source checks, replay and transaction fault rollback execute in a disposable in-memory PostgreSQL engine. Synthetic association identifiers remain distinct from campaign/Business IDs; no real parent review/grant is proven. Shortened expiry fixtures are owner-mutated only inside that disposable instance, preserving timestamp/hash/text parity; this proves expiry/replay branches, not waiting-lock behavior. The suite executes the migrator's actual post-broad-grant revocation statement again and checks INSERT/UPDATE/DELETE privileges, not a complete real operator migration rerun.

### TC-015-007 — Native concurrent freeze and waiting-source/expiry
Relations: verifies: AC-015-001-02, AC-015-001-03, AC-015-003-01, AC-015-003-02
Test: `apps/api/test/marketing-report-ledger-postgres.test.mjs`

PASS 5/5 in native PostgreSQL 18.6, following the initial four NOT_RUN cases. Opt-in target variables are `ZURI_GO_MARKETING_QA_ADMIN_URL` and `ZURI_GO_MARKETING_QA_RUNTIME_URL`, kept private. The runner refuses non-loopback targets, mismatched databases, names outside `zuri_go_marketing_qa_*`, a non-empty Business table, a schema other than 11 or a runtime other than non-superuser/non-BYPASSRLS `zuri_go_app`. It requires an already migrated separate test-owned database; the test itself performs no migration/credential provision. It checks identical-key replay, different-key/preparation weekly conflicts, campaign update/audit while freeze waits, actual-clock expiry after waiting in REPEATABLE READ with bounded retries, and grant/revoke permission visibility/interruption across separate connections. Committed synthetic QA records remain private QA evidence; no application database cleanup is attempted. An initially empty fresh QA database is required for a later run.

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

Status: PARTIAL — TC-015-001/005/006 PASS; TC-015-003/007 NOT_RUN. AC-015-001-03 stale-source freeze has executed disposable SQL evidence; native concurrent source/preview-freeze acceptance remains open.

### Acceptance plan 02 — Truthful measurements and sanitized opinions
Coverage: FR-015-002; AC-015-002-01, AC-015-002-02, AC-015-002-03, AC-015-002-04.

Status: PARTIAL — TC-015-002 PASS on fixtures; real DB preservation and ready values after audited source attestation remain NOT_RUN. No existing watermark or caller timezone can make a complete metric.

### Acceptance plan 03 — Envelope identity and strict limits
Coverage: FR-015-003; AC-015-003-01, AC-015-003-02, AC-015-003-03; NFR-015-001.

Status: PARTIAL — TC-015-005/006 pass strict frozen-envelope and persisted SQL hash/identity checks; native TC-015-007 and real parent binding remain NOT_RUN. No transport/receiver capability is claimed.

### Acceptance plan 04 — Bounded delivery and receipt recovery
Coverage: FR-015-004; AC-015-004-01, AC-015-004-02, AC-015-004-03, AC-015-004-04; NFR-015-001.

Status: NOT_RUN. Proposed test file: `apps/api/test/marketing-report-delivery.test.mjs`. Holdout: commit then dropped response, 429 Retry-After, mismatch receipt, worker/lease interruption, fifth send, stale age, concurrent send and redirect to other origin.

### Acceptance plan 05 — Parent writer and authorization boundaries
Coverage: FR-015-005; AC-015-005-01, AC-015-005-02, AC-015-005-03, AC-015-005-04.

Status: NOT_RUN. Proposed parent test files require allocation in Zuri-AI's own reviewed record. Holdout: inactive/revoked credential after acceptance, Tenant-wide key without Business grant, valid key/crossed target, replay receipt disclosure, same key/new hash, concurrent corrections, immutable native Plan/review/decision and verified revenue.

## Completion gate and version diff

Docs completion: all seven flow rows and field lineage have inspected sources; spec and FR/AC references resolve; declared delivery and unexecuted cases stay explicit. Runtime completion: both reviewed contracts are implemented and all required unit/database/cross-repository acceptance has executed evidence with allocated TC IDs and actual test-file bindings. No production or live-provider claim follows from docs completion.

0.2.0 → 0.3.0: approved P2 adds CMP-003/API-025, three actual bound test files and unapplied migration 011; FR-015-003 declared → building. Preparation remembers server capture time; freeze builds immutable original wire bytes and atomically inserts report/QUEUED/private audit. P1 stays read-only. 14 new P2 cases pass (6 pure/router, 8 disposable SQL); four native concurrency/lock cases are NOT_RUN. Parent receiver/transport remains unimplemented. Package version stays 0.5.1; no application DB, real association/credential, parent, UI or deployment operation occurred.
