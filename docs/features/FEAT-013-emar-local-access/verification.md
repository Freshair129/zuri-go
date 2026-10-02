# Verification — FEAT-013

Date: 2026-10-02 · Local implementation verification

The existing registration/launcher implementation was reviewed and retained; two packaging defects were reproduced and corrected within approved FEAT-013 v0.1.0. A temporary static preview served `build/site` on the canonical local origin. The Zuri-Go API/database runtime and Emar process were not started or stopped, OAuth configuration was not inspected or changed, and no deployment was attempted.

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
