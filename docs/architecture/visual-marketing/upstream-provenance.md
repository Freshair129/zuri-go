# Visual Marketing provenance and discovery audit

Date: 2026-10-02 (Asia/Bangkok). Phase A/B documentation proposal. Scope: target Freshair129/zuri-go, source main f8026a81518ec6454548cb262a1f3bc1e758af20, application 0.5.1.

## Audit and custody

- git status first found unrelated Emar work on F:/zuri-go main. Work is isolated in managed worktree C:/Users/pc/.codex/worktrees/visual-marketing/zuri-go on feat/visual-marketing-team; original dirty files were not staged, reset, stashed or copied into this branch.
- git fetch origin main confirmed origin/main equals the base SHA above at discovery time.
- gh repo view Freshair129/zuri-go --json visibility,defaultBranchRef returned PUBLIC and main. Root AGENTS.md/older docs still describe private visibility. This is a documentation audit discrepancy only; visibility was not changed. Historical D:/workspace paths are not this machine's checkout.
- Source migration list ends at 007. No database connection, schema execution, member provisioning, secret inspection, provider invocation, production deployment or promotion was performed.
- Upstream clones were read-only source references outside the target repository. Their instructions were not executed. Pins/license hashes and exact source mapping are in [upstream-analysis.md](upstream-analysis.md).

## ID allocation and status

Commands: npm run docs:next-id -- FEAT / ADR / ARCH / API / EVT / CMP. Main returned FEAT-013, ADR-006, ARCH-004, API-023, EVT-002 and CMP-001. FEAT-013 already exists in unrelated uncommitted Emar work; npm run docs:next-id -- FEAT --root F:/zuri-go returned FEAT-014, which is used here. No existing ID was renamed. FR/AC/NFR IDs were allocated sequentially through scripts/docs/next_id.py, the implementation behind the npm command. SDD-014 derives from FEAT-014; DOM-VIS is a chosen registered code as required by the allocator.

All new artifacts are proposed/declared. No approval is inferred from writing the proposal. Application 0.5.1 → 0.5.1; source schema ceiling 007 → 007; specification absent → 0.1.0 proposed. No migration file created. No code copied/adapted/reimplemented yet; license texts alone are copied byte-for-byte.

## Verification record

Baseline npm run docs:validate: PASS (exit 0), 0 errors and 166 existing warnings: 1 BOM, 131 unverified FRs, 10 historical links, 2 dangling historical relations and 22 relation-type warnings. These warnings are not repaired or hidden by this change. Exact final results are appended after checks.

Application build, npm test, browser, real provider, live DB/RLS and hosted/production checks: NOT RUN, documentation-only proposal. They remain implementation exit gates. Existing functionality was not modified, but no unperformed application test is claimed to pass. TC bindings await real tests rather than pointing to nonexistent files.

## Remaining work and approval

Owner review of FEAT-014, ARCH-004, ADR-006, SDD-014, API-023/EVT-002 and data amendment; then implementation C/D with actual tests, schema, API and UI. E variants and F performance remain later increments. Hosted durable execution and real provider/storage qualification are explicitly unresolved future release prerequisites, not secretly simulated.

STD-005 requires independent implementation review; this proposal is self-reviewed only. No subagent, local-model packet or external reviewer was dispatched. A documentation draft PR can carry this approval package, but it does not satisfy the requested first implementation PR Definition of Done.

## Documentation checks before integration refresh

- PASS: npm run docs:validate — exit 0, 0 errors, 166 existing warnings (unchanged baseline).
- PASS: npm run docs:views — exit 0, 11 views, 0 drift findings. The installed view tool is check-only; its documented workflow requires updating the derived table rows by hand, then checking them. No validator/generator code was changed.
- PASS: git diff --check — no whitespace errors after correcting new table placement and added-line endings.
- PASS: git check-ignore for .local, .env, .env.local, node_modules, build/site, apps/web/dist and logs.
- PASS: three retained LICENSE files match the pinned upstream bytes; 17 inventory source paths exist at those pins.

During work, another activity committed/pushed the previously dirty Emar work as 9e224c851b6c5c2b25232d41e183bf8623b5bb7a. This task did not modify or commit those files. The Visual Marketing branch is refreshed onto that main revision before draft PR creation; FEAT-014 avoids its FEAT-013 allocation.

## Final checks after rebasing onto current main

Base: 9e224c851b6c5c2b25232d41e183bf8623b5bb7a. Preserved Emar feature/service declarations while resolving three documentation/registry conflicts.

| Status | Exact command/check | Result |
|---|---|---|
| PASS | npm run docs:validate | exit 0; 0 errors, unchanged 166 warnings |
| PASS | npm run docs:views | exit 0; 11 views, 0 drift findings |
| PASS | git diff origin/main --check | exit 0; no whitespace errors |
| PASS | git diff --cached --name-only plus allowlist/credential-pattern inspection before commit | 37 documentation/registry/notice files only; no credential-pattern match; not a comprehensive secret-scanner guarantee |
| PASS | git check-ignore .local/audit-check .env .env.local apps/api/node_modules/audit-check build/site/audit-check apps/web/dist/audit-check probe.log | all seven ignored |
| PASS | Pinned source-path and license-byte comparisons | 17 source files exist; three license copies match byte-for-byte |
| NOT RUN | npm run build; npm test | documentation-only; no application build/test result claimed |
| NOT RUN | Browser, provider, live RLS, hosted and production checks | implementation not started |
| BLOCKED | Phase C application implementation | owner approval of the new documentation required by user R5/SOP |

No remaining failing documentation check. Initial table-placement drift and added-line CRLF whitespace were corrected before these final checks; existing warnings were neither suppressed nor changed.

## Files changed and security summary

- Docs: feature/spec with 13 FRs, 2 NFRs and ACs; SDD and verification plan; domain/contract definitions; architecture/ADR/data amendment; component design; parent/index/service metadata and registries; upstream audit.
- Backend: none. Frontend: none. Database/migrations: none. Application tests: none (planned, not falsely bound).
- Licenses: THIRD_PARTY_NOTICES.md and three exact upstream LICENSE files.
- Credentials/provider keys: none accessed, provisioned or committed. Planned keys remain server-side. Tools deny by default; no shell/MCP catalogue import. Agents cannot approve, widen scope or write historical performance. Viewer/RLS applies to every planned data/status/asset route.
- Runtime behavior/version: 0.5.1 unchanged. Proposed feature spec: 0.1.0. No production action, merge or visibility change.

## Implementation follow-up — 2026-10-03

Owner approved the documentation and the C/D first slice is implemented on the same draft PR. The earlier NOT RUN/BLOCKED rows above are the historical Phase A/B record. Current source/test/QA/browser results and remaining gates are in [verification](../../features/FEAT-014-visual-marketing-team/verification.md). The three license pins and copied license bytes are unchanged. New JavaScript/SQL/JSX are independent Zuri-Go implementations; no upstream app or runtime source was copied.
