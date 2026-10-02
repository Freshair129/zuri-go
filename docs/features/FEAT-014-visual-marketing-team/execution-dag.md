# FEAT-014 verification-closure execution DAG

This companion records the bounded C/D verification closure authorized for PR #1. The approved FEAT-014 feature, SDD-014 and requirements remain canonical. This file adds no requirement or stable artifact ID. Scope is existing C behavior and minimum D registry/dispatcher; E/F, production, database migration, deployment and merge are out of scope.

## Execution record

- Worktree: `C:\Users\pc\.codex\worktrees\visual-marketing\zuri-go`
- Branch: `feat/visual-marketing-team`
- Starting revision: `b569cf0d3296dbec4285f71e751ea0cca2506310`
- Candidate revision: **unsealed** until implementation and documentation gates pass; record the final commit SHA and verifier SHA-256 before independent gates run. Gates consume that immutable candidate only.
- Complexity: **C-3/HIGH** for the approved FEAT-014 implementation and verification closure. The narrower extraction-verifier portability packet is **C-2/HIGH** because it changes a security-relevant verification tool without changing application behavior or architecture.
- Risk: **HIGH**, because the extraction verifier checks source integrity and credential leakage.
- Acceptance: focused synthetic verifier regressions pass; exact public immutable hashes, package boundaries, stable app/project IDs and all available known-secret scans remain enforced; missing private-preserved custody inputs are explicitly `NOT_RUN`; test fixtures do not write the tracked extraction report; documentation checks pass; candidate SHA and verifier hash are recorded.

## Nodes and dependencies

| Node | Depends on | Role and owned paths | Acceptance / output |
|---|---|---|---|
| N0 — Freeze scope and base | — | Root orchestrator; no source edits | Confirm branch, starting SHA, dirty state, C/D-only scope and no merge/deploy authority. |
| N1 — Confirm cause and lock verifier contract | N0 | Worker; `.brain/rca/FEAT-014-extraction-verifier-portability.md`, `docs/migrations/extraction-verifier-portability-proposal.md`, this companion | Evidence-backed RCA and minimal behavior contract are reviewed before code. |
| N2 — Add regression cases | N1 | Worker; `scripts/site/test_verify_extraction.py` | Temporary synthetic fixtures cover absent custody inputs, present matching and tampered inputs, a known secret leak, and public immutable tampering. No real credential is read; no tracked report is written. |
| N3 — Implement callable verifier and wire tests | N2 | Worker; `scripts/site/verify_extraction.py`, `scripts/run.mjs` | `npm test` invokes the isolated regression suite. Only absent manifest entries marked `private-preserved` beneath `.local/member-access/` can be `NOT_RUN`; available custody inputs retain SHA checks and available secret scanning. All other source, package, ID and path checks remain mandatory. |
| N4 — Focused verification | N3 | Worker; read-only commands | Regression tests, relevant Python packaging checks, documentation validation and generated-view check pass. Preserve any private-custody gap as `NOT_RUN`; do not fabricate full custody verification. |
| N5 — Seal candidate | N4 | Worker; no further content edits after seal | Commit the candidate locally; write full Git SHA and SHA-256 of `scripts/site/verify_extraction.py` to the ignored append-only seal record. Confirm clean status and inspect the exact diff for credentials and unrelated changes. |
| N6 — VerifyGate | N5 | Independent VerifyGate agent; read-only | Confirm the recorded SHA/hash, rerun the specified deterministic commands against that revision, and report PASS/FAIL/BLOCKED/NOT_RUN with outputs. No edits. |
| N7 — ReviewGate | N6 PASS | Independent ReviewGate agent; read-only | Review the exact same candidate for the narrow contract and integrity regressions. No self-review and no edits. Findings return to a new bounded worker packet. |
| N8 — Close this scope | N6, N7 | Root orchestrator; no merge/deploy | Report C/D verification closure and unresolved formal review/custody boundaries. Hold any push until root dispatch; merge and deployment remain outside this scope. |

## Roles, model constraint and rework

Worker, VerifyGate and ReviewGate run as independent `gpt-6-luna` agents at maximum reasoning. The authoring worker owns the listed files sequentially; the two gates own no files and must not edit. VerifyGate is an operational evidence role, not the deterministic L0 tool itself. ReviewGate is independent in agent instance and task, but uses the same model family and tier by user authorization. Record this as a task-specific same-model exception; it does **not** satisfy or claim STD-005 R10's higher-tier L1/L2 review. Formal merge review remains unresolved and merge is outside this DAG.

A failed node stops its dependents. Allow at most two evidence-driven rework iterations, each with a changed packet tied to a specific finding; never repeat a blind retry. Each content-changing iteration invalidates the previous candidate SHA and requires resealing. An unresolved design, authority or environment gap is escalated to root as BLOCKED; it is never recorded as PASS.

Use statuses precisely: **PASS** means the named check ran and met its acceptance; **FAIL** means a reproducible check failed; **BLOCKED** means the check could not proceed because an identified dependency or authority is unavailable; **NOT_RUN** means it was not executed. If production handover files are absent, only their custody hash/leak checks are NOT_RUN. Package boundaries and scans of every available known secret still run. Do not describe that result as proof that all production credentials are excluded.

## Candidate seal

After N4 passes and the candidate commit is created, write the SHA seal to an ignored append-only record under `.local/verification/`. Do not amend this document to insert a SHA before N6/N7, because that would change the candidate being gated. The final verification ledger may cite the sealed candidate in a later documentation-only follow-up.

- Candidate Git SHA: pending seal record
- `scripts/site/verify_extraction.py` SHA-256: pending seal record
- Worktree clean at seal: pending seal record
- VerifyGate result: pending
- ReviewGate result: pending

## Evidence-driven rework R1

The first sealed candidate, `27ca9e6826ac7e72a2a1e19da37036427bbb4c38`, received **N6 FAIL** because six of 46 docs tests failed in the fixture text editor; N7 was blocked. The focused reproduction confirms the failure is `Tree.read` preserving fixture CRLF while `Tree.edit` expects LF substrings, before validator assertions run. See the additional finding in the [RCA](../../../.brain/rca/FEAT-014-extraction-verifier-portability.md).

This is the first of at most two evidence-driven iterations. It is **C-1/LOW** within the parent C-3/HIGH activity: one test-only reader in `scripts/docs/tests/test_docs.py` plus one helper-contract regression. The reader uses UTF-8 text mode, which normalizes fixture line endings while retaining strict decode and BOM behavior. No validator, application, security logic, standards or production files are in scope. Acceptance is all 46 original docs tests plus the new helper regression (47/47 total), 15/15 site tests, docs validation with zero errors and 166 baseline warnings, and views with 11/0 drift. Any failure stops the next gate; a second change requires a new evidence-based packet. Candidate `27ca9e6` is superseded for gate purposes; the next candidate must be resealed before verification.

Worker-side R1 result: **PASS** — docs tests 47/47, site tests 15/15, docs validation 0 errors / 166 baseline warnings, and docs views 11 / 0 drift. VerifyGate and ReviewGate remain pending for the newly sealed candidate.
