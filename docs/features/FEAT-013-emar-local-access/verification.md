# Verification — FEAT-013

Date: 2026-10-02 · Local implementation verification

The existing registration/launcher implementation was reviewed and retained; two packaging defects were reproduced and corrected within approved FEAT-013 v0.1.0. A temporary static preview served `build/site` on the canonical local origin. The Zuri-Go API/database runtime and Emar process were not started or stopped, OAuth configuration was not inspected or changed, and no deployment was attempted.

Current local result (2026-10-03): after a separately approved external Emar guard fix, the clicked launcher loaded the actual standalone UI in a new tab with HTTP 200 in disposable Memory QA. The initial blocked/unapproved/uncommitted statements below are earlier checkpoints; see [approved fix and final evidence](#approved-external-emar-fix--2026-10-03). Persistent provider readiness, Zuri-Go API/database runtime and production remain unverified.

### TC-013-001 — Exact-origin launch and safe destination
Relations: verifies: FR-013-001, AC-013-001-01, AC-013-001-02, AC-013-001-03, AC-013-001-05, NFR-013-001
Test: `apps/web/src/content/meeting/emar-launcher.test.mjs`

Result: PASS, 6 tests. Both app and Metrics gates were evaluated with canonical origin, alternate hostname/port, HTTPS, LAN and hosted origins; only `http://127.0.0.1:4319` enables the launcher. Request traps confirm the gate makes no fetch/XHR/beacon request; app markup is a passive anchor without an event handler. The destination is fixed to `http://localhost:8788/` with `target="_blank"` and `rel="noopener noreferrer"`. Additional tests inspect real generated local, hosted and Vercel HTML (including decoded base64 scripts), compare snapshot/runtime identities, and check that hosted projection omits only the marked launcher and rejects missing/duplicate markers.

### TC-013-002 — Deployable package excludes local service UI
Relations: verifies: FR-013-001, AC-013-001-03, AC-013-001-04, NFR-013-001
Test: `scripts/site/test_unified_site.py`

Result: PASS, 9 tests. Local Metrics retains its launcher/gate. Hosted packaging removes exactly one of each marked block, rejects missing/duplicate blocks, and refuses launcher markers in plain HTML or encoded scripts. The four existing Metrics site destinations retain their order. Existing hash, path-containment, allowlist and untracked-output protections still pass.

## Build evidence

- `npm run build` passed: Metrics generation/static verification, verified local and hosted Data App builds, separate local/hosted site assembly, and Vercel package assembly (55 allowlisted files; `privateBackupsIncluded: false`). Hosted build uses an isolated authored-input copy plus the unchanged public API binding; the verified local HTML is copied only to preserve its existing presentation/thread marker through the normal builder. Original source, protected runtime and integrity manifests are not altered. Snapshot, app ID, runtime hash and thread marker are preserved.
- `node --test apps/web/src/content/meeting/emar-launcher.test.mjs apps/web/src/content/meeting/model.test.mjs tests/campaign/*.test.mjs` passed: 79/79 tests (6 launcher/build-boundary tests plus existing meeting/campaign regressions).
- `python -m unittest discover -s scripts/site -p test_unified_site.py` passed: 9/9 tests.
- A read-only package audit verified all three local/hosted/Vercel app manifests and confirmed the 28 hosted static files were copied byte-for-byte into Vercel (SHA-256 matches). Decoded hosted-launcher check passed; no temporary `.emar-hosted-*` staging directory remains.
- `npm run docs:validate` passed with 0 errors and 166 existing recorded warnings; `npm run docs:views` passed with 0 drift findings.

## Browser evidence — static preview only

Approved browser tooling inspected `build/site` served temporarily at `http://127.0.0.1:4319`; this was not the trusted-operator API runtime.

- App Overview, Metrics guide and Graph show the separate Emar launcher; the original site navigation remains available. The app reports workspace unavailable because the static preview has no API, so business-data operations were not tested.
- DOM attributes confirm the fixed destination, `_blank`, `noopener noreferrer` and no query payload.
- At `http://localhost:4319/metrics/#overview`, the launcher is hidden. Other origin variants are covered by gate tests, not separate browser sessions.
- Keyboard navigation reaches `emar-local-launcher`. At 390×844, the Services bar and launcher fit within the viewport at the top of the guide; existing site links wrap. This is not a full accessibility audit.
- Clicking the launcher left the Zuri-Go Graph page usable. The in-app browser listed no new Emar tab afterward; browser inventory exposes only the in-app browser and MCP Apps, with no other controllable browser. Actual popup/new-tab delivery, destination request headers, Emar availability/session and the no-Emar-running scenario remain UNVERIFIED. Safe new-tab attributes are verified in source, tests and DOM.
- The final rebuilt guide was reloaded and the launcher remained visible. The QA tab was closed and the task-owned temporary static preview was stopped afterward.
- No hosted URL, deployed API or production runtime was checked. Hosted exclusion is build/artifact evidence only.

## Limitations and NOT_CONFIGURED

- An additional attempt to include `apps/api/test/operator-guards.test.mjs` failed to load because API dependency `pg` is not installed. Its tests did not execute; no dependency installation or schema operation was performed. The focused suites above passed independently.
- Full `npm test` was NOT_RUN: API/database runtime and dependencies are unavailable, and its extraction check reads private configuration. Secret files were not read for this task.
- Zuri-Go → Emar Identity/auth, CRM contacts/consent/suppression, Files, Integration credentials/provider state, REST/MCP, database and campaign execution adapters: **NOT_CONFIGURED**, deliberately outside FEAT-013.
- External Emar Gmail/OAuth/key readiness: **UNKNOWN / not inspected**, not claimed configured or unconfigured. Zuri-Go deployment/promotion and production/browser verification: **NOT_RUN**.

## Runtime follow-up — 2026-10-03

The owner selected local launcher/Emar verification after commit/push of `9e224c8`. Complexity: **C-2** (documented verification). Risk: **LOW** for disposable QA and evidence changes; an external Emar security-policy change is **HIGH** and outside FEAT-013. Success checks were actual new-tab delivery, destination loading, absence of Zuri-Go payload/credentials, retained internal navigation, and cleanup of task-owned processes. This follow-up supersedes the earlier UNVERIFIED popup/destination result, but does not turn static-preview evidence into Zuri-Go API-runtime evidence.

### Environment and commands

- Before QA, branch `main` matched `origin/main` at `9e224c8`, the worktree was clean, and neither 4319 nor 8788 had a listener. Zuri-Go private local configuration/API dependencies were unavailable; its real API/database was not started.
- `python -m http.server 4319 --bind 127.0.0.1 --directory build/site` served the existing verified local build.
- A separate Node child imported the existing external Emar `src/index.mjs` at `C:/Users/pc/workspace/emailmar` (`0.3.0-beta.0`) with `HOST=127.0.0.1`, `PORT=8788`, `EMAR_STORAGE=memory` and only required Windows temporary/system paths inherited. No provider credential or adapter environment was inherited. No external source, existing SQLite database, secret file, campaign or OAuth configuration was modified.
- A temporary HTTP audit logged only method/path/status and query/header-presence flags. No credentials, cookies, bodies or private header values were logged. Browser interactions used approved tooling and only navigation/read-only Settings inspection.

### Observed results

| Check | Result | Evidence |
|---|---|---|
| Launcher new-tab delivery | PASS | Click from canonical-origin Metrics created a tab at fixed `http://localhost:8788/` |
| Emar loads from launcher | **FAIL / BLOCKED** | First `GET /` returned 403 with `Sec-Fetch-Site: cross-site` |
| Zuri-Go navigation payload/credentials | PASS for observed first navigation | No query, Referer, Authorization or cookie; passive anchor makes no integration call |
| Direct Emar navigation | PASS | Same URL returned 200 with `Sec-Fetch-Site: none`; actual standalone UI loaded, Demo mode OFF |
| Emar standalone session | PASS in disposable QA only | Emar's own same-origin `/ui/session`, workspace and Gmail-status requests succeeded; its own cookie was used afterward |
| Internal Zuri-Go navigation | PASS | Graph remained usable after launcher failure |
| QA configuration | NOT_CONFIGURED | Settings showed Memory storage, Gmail API, Files resolver and Zuri Identity unconfigured in this deliberately isolated process |
| Process cleanup | PASS | Both task-owned processes stopped; no listener remained on 4319 or 8788 |

[RCA](../../../.brain/rca/FEAT-013-emar-cross-site-navigation.md): Emar's standalone UI handler applies a guard that rejects cross-site document navigation; `noreferrer` does not remove `Sec-Fetch-Site`. This is a runtime interoperability gap in the destination service. No external guard or launcher URL was changed. Changing Emar's security policy requires a separately approved scope; direct URL navigation is the verified manual workaround.

### Evidence boundaries and version diff

Existing build/tests remain the 2026-10-02 results above; they were not rerun or relabelled as runtime success. Hosted/Vercel exclusion is still artifact evidence, not a deployed check. Full Zuri-Go API/database, persistent Emar/provider readiness, no-Emar-running click behavior, deployment and production remain **NOT_RUN / UNKNOWN**. No migration or provider operation was performed.

This follow-up changes only this verification record, the feature's runtime-gap notice and the new RCA. Application `0.5.1`, approved FEAT-013 `0.1.0`, registry identity and source implementation remain unchanged. Runtime status changes from popup/destination UNVERIFIED to delivery PASS / destination-load FAIL.

- `npm run docs:validate`: PASS, 0 errors / 166 existing warnings.
- `npm run docs:views`: PASS, 10 views / 0 drift findings.
- `git -c core.whitespace=cr-at-eol diff --check`: PASS. Follow-up evidence remains uncommitted; no additional push was performed.

### External guard review follow-up

The [RCA candidate review](../../../.brain/rca/FEAT-013-emar-cross-site-navigation.md#candidate-emar-fix-for-owner-review--2026-10-03) records a concrete, unapproved external Emar fix, its security tradeoff, expected file scope and positive/negative acceptance cases. External `node --test test/standalone.test.mjs` passed 7/7 on unchanged source; this is baseline evidence only. No Emar guard was changed. The proposed full navigation metadata tuple is not yet browser-verified. The existing 403 runtime gap remains open and FEAT-013's approved scope/version is unchanged.

## Approved external Emar fix — 2026-10-03

The owner explicitly approved the candidate guard fix and Memory QA after reviewing its security tradeoff. This supersedes the initial 403 / unapproved review status above. It is a separate external Emar fix, not a change to FEAT-013's approved registration/launcher scope.

### Implementation and tests

- External `src/http/local-session.mjs` has a default-off document-navigation opt-in. It accepts only exact `GET /` and the full `cross-site / navigate / document / ?1` tuple, while retaining peer/Host and supplied-Origin checks. Only the standalone root UI handler in `src/http/server.mjs` opts in; sessions/API/assets retain the default guard.
- External `test/standalone.test.mjs` adds three regressions for explicit opt-in, negative metadata/route/method/peer/Host/Origin cases, session denial even with a valid local session, and real HTTP static delivery without service access, cookies or CORS. Before the fix, the new suite failed 2 positive-entry cases (8/10 passed). Node fetch overrides Mode to `cors`; the HTTP fixture was corrected to use raw HTTP with faithful metadata rather than widening the guard. Final targeted standalone/integration suites: **20/20 PASS**.
- External `node --test test/*.test.mjs`: **81/81 PASS**, fixture-only; `npm run check`: **PASS**, 22 modules. Existing OAuth binding, MCP/Identity permissions, campaign and storage regressions remain green; no live provider operation occurred.
- Zuri-Go `node --test apps/web/src/content/meeting/emar-launcher.test.mjs`: **6/6 PASS**, including current local/hosted/Vercel artifacts and decoded-script exclusion. `python -m unittest discover -s scripts/site -p test_unified_site.py`: **9/9 PASS**. Zuri-Go source/build output was not modified or rebuilt by this external fix.

### Actual browser/runtime evidence

- The same static-preview command served the existing Zuri-Go build on `127.0.0.1:4319`. A separate actual Emar process imported the changed `src/index.mjs` with Memory storage and a minimal environment without credentials/adapters. Existing SQLite/configuration remained untouched.
- Clicking the canonical-origin Metrics launcher created a new tab at exactly `http://localhost:8788/`. Its first `GET /` returned **200**, with Site `cross-site`, Mode `navigate`, Dest `document`, User `?1`, no query, Referer, Authorization or cookie. This verifies the previously unknown complete metadata tuple.
- The actual popup was inspected and displayed Emar's Thai campaign UI with zero campaigns and Demo mode OFF. Settings showed temporary Memory storage and Gmail, Files resolver and Zuri Identity **NOT_CONFIGURED in this QA process**. Emar's own subsequent same-origin session/workspace/status calls succeeded; these are not Zuri-Go integration calls. Previously retained Emar-host cookies appeared on some own-origin follow-up requests, but no cookie was present on the cross-site entry; values were never read or logged.
- Graph remained usable after the successful launcher click. Both task-owned QA processes were stopped, with no listeners left on 4319/8788. Clicking again with Emar stopped produced a destination tab whose browser inventory reported the unavailable page; the already loaded Zuri-Go page still navigated from Graph to the Metrics guide. Inspecting the browser-generated error page was blocked by the browser URL policy because it used a `data:` document, so detailed error-page inspection was not performed or worked around.
- A screenshot of the successfully launched actual Emar UI is saved under ignored `build/emar-launcher-qa-2026-10-03.png`; it contains only empty disposable QA data. Controlled QA tabs were closed; the browser-generated unavailable tab could not be bound under that policy.

### Files, risk and version diff

External Emar changed only two HTTP modules, `test/standalone.test.mjs`, `docs/STANDALONE-UI.md`, `docs/ARCHITECTURE.md`, `docs/EMAR-0.3-VERIFICATION.md`, and the new `.brain/rca/2026-10-03-local-launcher-navigation.md`. Six pre-change source/document copies and hashes remain under external `.tmp/2026-10-03-launcher-baseline/` (the copied test has a `.baseline` suffix to prevent test discovery). A source-only review patch is retained at external `.tmp/2026-10-03-local-launcher-navigation.patch`. That directory is not a Git repository; no repository was initialized or published.

Zuri-Go follow-up files are this verification record, `feature.md`, and the RCA. They remain uncommitted; no additional push occurred. Risk remains **HIGH** because the approved fix changes a security gate. A user-initiated link from any source may meet the narrow document exception; this is local-OS trust, not proof of a Zuri-Go identity. Static entry issues no session, application data or provider operation and existing protected-request checks remain tested.

| Item | Before | After |
|---|---|---|
| Launcher destination load | 403 in Memory QA | 200 and actual standalone UI loaded from the clicked launcher |
| Cross-site protected requests | Denied | Denied; negative regressions pass |
| Application / feature / external package | Zuri-Go 0.5.1 / FEAT-013 0.1.0 / Emar 0.3.0-beta.0 | Unchanged |
| Persistent data, OAuth and deployment | Outside this QA | Untouched; no migration, provider setup/send, deployment or production check |

Full trusted-operator Zuri-Go API/database runtime and existing persistent Emar provider readiness remain **NOT_RUN / UNKNOWN**. Hosted exclusion is current artifact/test evidence; it is not a newly deployed production check.

Final documentation checks: `npm run docs:validate` PASS (0 errors / 166 existing warnings), `npm run docs:views` PASS (0 drift), and CR-aware Git diff check PASS. External documentation/RCA paths resolve; `git apply --reverse --check --whitespace=error-all` passes for the source-only patch against current files. A later listener check found a new `node.exe` process PID 42736 on 4319, rather than the task's stopped Python preview. That other process was preserved and not inspected as an application runtime. The no-listener cleanup result above describes its earlier check, not the final state of the machine.

### Documentation Git handoff — 2026-10-03

The owner continued the authorized commit/push handoff. This documentation handoff contains only FEAT-013 `feature.md`, this verification record, and `.brain/rca/FEAT-013-emar-cross-site-navigation.md`. Earlier uncommitted-status notes describe the preceding QA checkpoints. External Emar code remains in its separate non-Git workspace with its source-only patch; no repository is initialized or published there. Private configuration, dependencies, screenshots and generated outputs are excluded. Git commit/push results are reported separately; they do not prove CI, deployment or production activation. Application/feature/package versions remain unchanged.

## Out-of-scope findings

- During the owner-authorized commit/push handoff, `gh repo view Freshair129/zuri-go --json nameWithOwner,isPrivate,defaultBranchRef` reported `isPrivate: false`, default branch `main`. This differs from the historical private-repository statement in AGENTS.md. Visibility was not changed; only reviewed FEAT-013 source/docs are staged, with private configuration and generated deploy packages excluded. No migration file is added by FEAT-013; database migration requires a separately identified target.
- Documentation-tool unit tests were also attempted: 40/46 passed; 6 fixture-edit tests failed because their literal LF substrings do not match this Windows checkout's CRLF fixtures. `Tree.read()` decodes raw bytes without newline normalization. A fixture compared with `git show HEAD:<path>` is identical after EOL normalization (working copy: 22 CRLF lines; HEAD: 0); `git diff --name-only -- scripts/docs` is empty. No documentation-tool or fixture change was made. This is separate from the successful repository document validation/view checks.
- Default `git diff --check` flags CR as trailing whitespace in generated Windows Metrics HTML/static evidence. `git -c core.whitespace=cr-at-eol diff --check` passes; generated files were not manually reformatted.

## Files changed in this pass

- Runtime/build/tests: `apps/web/src/content/meeting/MeetingWorkspace.jsx` (launcher markers only), `apps/web/src/content/meeting/emar-launcher.test.mjs`, `scripts/run.mjs`, `scripts/site/build_unified_site.py`, `scripts/site/test_unified_site.py`, `scripts/deploy/build_cloud.py`.
- Documentation: root `README.md`, `docs/domains/platform/README.md`, the three `docs/services/SRV-001…003/SERVICE.md` files, FEAT-013 `feature.md`, `spec.md`, `design.md`, `requirements/NFR-013-001-local-service-boundary.md`, this `verification.md`, and `.brain/rca/FEAT-013-local-launcher-build.md`.
- Generated Metrics HTML/static-check evidence were refreshed by the build; ignored local/hosted/Vercel outputs were rebuilt. The existing single SRV-003 registry entry, product/catalog additions and other pre-existing working-tree edits were retained. No commit, push or secret-bearing file was staged.

## RCA and version diff

The [RCA](../../../.brain/rca/FEAT-013-local-launcher-build.md) records the symptom, build/decoded-script evidence, root cause, detection gap and prevention before the fix.

| Item | Before this verification | After |
|---|---|---|
| Service catalog | SRV-003 already registered once | Retained; identity and ownership boundaries documented |
| Local served Metrics/Graph | Launcher stripped by shared packaging | Launcher and exact-origin gate retained |
| Hosted Data App | Local launcher/gate remained in encoded JavaScript | Verified hosted compilation omits the marked authored block |
| Hosted Metrics | Launcher/gate stripped | Retained exclusion, with duplicate/missing-block rejection |
| Application version | `0.5.1` | `0.5.1` (no release requested) |
| Approved feature scope/version | FEAT-013 `0.1.0` | Unchanged: registration and local launch only |
| Database / deployment | No action in this task | No migration, deployment or promotion |
