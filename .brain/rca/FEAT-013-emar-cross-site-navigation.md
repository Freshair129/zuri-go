# RCA — Emar rejects navigation from the local Zuri-Go launcher

Date: 2026-10-03 · Initial runtime diagnosis, followed by the separately approved external Emar fix and local QA recorded below.

## Symptom

The launcher opens a new tab at the approved fixed URL `http://localhost:8788/`, but the independently running Emar service returns HTTP 403. Opening the same URL directly loads the UI successfully.

## Evidence

- Source baseline: Zuri-Go commit `9e224c8`, FEAT-013 v0.1.0; external Emar package `0.3.0-beta.0` at `C:/Users/pc/workspace/emailmar` (not a Git checkout).
- Zuri-Go was served from `build/site` using a temporary static preview on `127.0.0.1:4319`, without its API/database. Emar ran as a separate disposable `EMAR_STORAGE=memory` QA process on port 8788, with a minimal environment containing no provider credentials or adapter configuration. Existing SQLite storage and private configuration were not read.
- Clicking the Metrics launcher created a new browser tab at `http://localhost:8788/`. A temporary request audit recorded only method, pathname, status and presence flags: `GET /`, no query, HTTP 403, `Sec-Fetch-Site: cross-site`, and no Referer, Authorization or cookie on this first navigation. No header values, request bodies or credentials were logged.
- Direct browser navigation recorded `GET /`, HTTP 200, `Sec-Fetch-Site: none`; the UI displayed temporary Memory storage and Demo mode OFF. Its own same-origin session/workspace/status requests succeeded. These are Emar's internal requests after direct navigation, not Zuri-Go integration calls.
- External `src/http/server.mjs:183-185` applies `assertLocalRequest()` before serving the standalone UI. `src/http/local-session.mjs:18-27` validates the loopback peer and Host, then rejects every supplied `Sec-Fetch-Site` other than `same-origin` or `none`, including document navigation to `/`.
- Zuri-Go Graph navigation remained usable after the failed launch. Task-owned QA processes were stopped afterward; no listener remained on 4319 or 8788.

## Root Cause

The approved different-host launcher is cross-site browser navigation from `127.0.0.1` to `localhost`. Emar applies the same blanket cross-site denial to its initial UI document as to protected requests. `rel="noreferrer"` suppresses Referer but does not change the browser's `Sec-Fetch-Site: cross-site` classification. The destination guard therefore rejects the intended navigation even though the fixed URL and safe anchor attributes are correct.

## Why the issue escaped detection

The launcher tests verify origin gating, destination, passive behavior and package exclusion. Previous browser verification used only a static Zuri-Go preview without a running destination and did not capture the real destination response. It could not detect Emar's policy incompatibility.

## Proposed prevention and scope boundary

FEAT-013 authorizes registration and a local launcher, not changes to external Emar security policy. No guard was changed, no target hostname was substituted, and no cross-service API, credential or data integration was added. Runtime acceptance remains blocked pending an independently approved Emar change.

A candidate for that separate review is a narrowly defined exception for top-level document `GET /` navigation to the public UI, retaining loopback/Host restrictions and strict same-origin session/API/mutation/CSRF checks. Its security documentation and positive/negative regression tests must precede implementation. This is an option for review, not an approved specification. Opening the approved URL directly is the currently verified manual workaround.

This evidence applies to the disposable local QA process only. Existing persistent Emar readiness, Zuri-Go trusted-operator API runtime, deployment and production remain unverified.

## Candidate Emar fix for owner review — 2026-10-03

Status: **APPROVED by the owner on 2026-10-03; implemented and verified in local Memory QA**. The owner approved this concrete external Emar fix after reviewing its scope and security tradeoff. This approval is separate from FEAT-013 and does not amend approved FEAT-013 v0.1.0. The earlier blocked/proposed statements above describe the pre-approval evidence. See the [final verification](../../docs/features/FEAT-013-emar-local-access/verification.md#approved-external-emar-fix--2026-10-03).

### Contract review and baseline

- Parent: external `docs/ARCHITECTURE.md`, sections Standalone and integrated authorization / Gmail OAuth and security. Standalone trust is the local OS operator, with loopback/Host, strict browser session, exact Origin and CSRF checks. An injected host Identity authorizer disables standalone sessions.
- Peer: external `docs/STANDALONE-UI.md` and `docs/ZURI-INTEGRATION.md`. UI access, protected REST, MCP and the separate Gmail callback have different authorization rules. No callback, authorizer, provider, scope or cookie behavior is proposed to change.
- `node --test test/standalone.test.mjs` in the external Emar workspace: **7/7 PASS**, using fixture services/fake providers and ephemeral local HTTP servers. This is unchanged-code baseline evidence, not fix verification or live provider evidence.
- The existing UI HTTP test uses Node fetch without the browser navigation metadata; its session guard test checks cross-site POST rejection. Neither tests an explicit cross-site document GET. This supports the detection gap above.
- External source reviewed at these SHA-256 pins: `src/http/local-session.mjs` = `D56C6E478B53C4350412ECAF1FB783457CB599C41FA0F6FE502C751D74C87F09`; `src/http/server.mjs` = `7333BE6E033EB51E5F042846B0B79DC78BC4DD0D986F9F1AFC6983A1F414CC33`; `test/standalone.test.mjs` = `4E938357F1F28E78F4B7B01420F38CD339E45922E6A1825711E19058F0056E51`. Recheck these before implementation because this external directory has no Git history.

### Exact proposed behavior

Allow a cross-site exception only at the standalone static root-document handler when **all** these conditions hold:

1. Method is `GET`, parsed pathname is `/`, and there is no query string. The fixed FEAT-013 launcher sends no query; fragments are browser-only.
2. `Sec-Fetch-Site` is `cross-site`, `Sec-Fetch-Mode` is `navigate`, `Sec-Fetch-Dest` is `document`, and `Sec-Fetch-User` is `?1`.
3. Existing loopback peer, local Host allowlist and supplied-Origin validation succeed. No exception may bypass those checks.

The root handler explicitly opts into this exception. The generic request guard defaults to its existing strict behavior; session creation, session authorization and static JS/CSS calls do not opt in. Same-origin/direct navigation behavior stays as before. The root response remains static HTML with the current CSP, no-store and no-referrer headers; serving it must not issue a session cookie, return workspace data or invoke a provider. Emar's existing UI subsequently opens its own same-origin standalone session.

Do not enable CORS, add source-Origin allowances, change cookie policy, substitute the launcher hostname, accept Zuri-Go identities, or relax API/mutation checks. The integrated Identity-authorizer mode and separate OAuth callback remain outside the exception.

### Security tradeoff and pre-implementation uncertainty

`noreferrer` intentionally removes source attribution. Fetch Metadata describes the request context, not a verified Zuri-Go identity. The proposed exception therefore permits a user-initiated top-level link from any source to this loopback UI, not exclusively Zuri-Go. This fits the documented local-OS standalone trust model only if the owner accepts that entry behavior; it is not cross-service authentication.

At proposal time, the prior runtime audit had captured `Sec-Fetch-Site` but not mode, destination or user metadata. The complete tuple was then unverified; the later approved Memory QA observed it and loaded the UI successfully, as recorded in final verification. The acceptance rule was to capture only those non-secret metadata fields and stop on a mismatch without widening the exception. Browsers without the tuple retain direct-navigation behavior but do not receive this cross-site exception.

### Planned regression and runtime acceptance

| Case | Expected result after an approved fix |
|---|---|
| Standalone `GET /`, no query, complete user-initiated cross-site document tuple, valid peer/Host | 200 static HTML; no Set-Cookie, service state mutation or provider call |
| Same cross-site request with non-loopback peer, invalid Host or mismatched supplied Origin | 403 |
| Missing/wrong mode, destination or user metadata; iframe, fetch/XHR, script or prefetch context | 403 for cross-site requests |
| Cross-site document `GET /` with any query | 403 |
| Cross-site requests to JS/CSS, `/ui/session`, protected workspace, logout or mutation routes | Existing denial; never enters the exception, even with document headers |
| Direct/same-origin UI and existing session expiry/Origin/CSRF behavior | Existing behavior retained |
| MCP with standalone cookie and integrated mode with host authorizer | Existing authorization contract retained |
| OAuth callback fixtures | Existing separate binding/state/PKCE contract retained; no live OAuth |
| Real click from canonical Zuri-Go origin into disposable memory Emar | New tab at exact approved URL, root 200 and actual UI loaded; no Zuri-Go query/credential payload |

Extend external `test/standalone.test.mjs` with guard and HTTP cases that distinguish route/method/metadata; use existing fixture services rather than provider configuration. Run the relevant standalone/integration suites and Emar syntax checks, then verify the actual browser click against memory-only QA. Keep Zuri-Go's existing launcher/origin/package tests and approved URL unchanged. Do not claim the proposed regressions pass before implementing and executing them.

### Proposed file scope and exit conditions

After separate approval, expected external Emar files are `src/http/local-session.mjs`, `src/http/server.mjs`, `test/standalone.test.mjs`, `docs/STANDALONE-UI.md`, `docs/ARCHITECTURE.md` and the existing verification record. Record RCA under the external workspace's `.brain/rca/` before its code change. No existing data/configuration, OAuth credentials, database migration, campaign execution, worker or deployment is included. The lack of external Git history must be accounted for with pre-change hashes and a reviewable source-only patch; it is not authority to initialize or publish another repository.

Success requires positive navigation and negative security regressions to pass, actual disposable-QA browser loading to work, unchanged Zuri-Go launcher/package boundaries, and cleanup of task-owned QA processes. Otherwise runtime acceptance remains blocked. At proposal time this review added documentation only and implementation was not yet approved; the later owner approval and final verification above supersede that gate. Zuri-Go `0.5.1`, FEAT-013 `0.1.0` and external Emar `0.3.0-beta.0` are unchanged; no release-version bump was requested.
