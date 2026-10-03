# FEAT-014 implementation verification findings — 2026-10-03

## Symptom

The first isolated-QA migration failed before creating the feature; a full regression run later stopped at the historical extraction verifier. Review also identified that the provider deadline depended on adapter cooperation and that concurrent requests needed transaction replay.

## Evidence

- PostgreSQL 17 rejected `CREATE TRIGGER freeze` with 42601. Migration 008 rolled back; migrations 001–007 remained in the separate `zuri-go-visual-qa` database. Renaming only that trigger allowed 008 to apply.
- `npm test`: Node suites and Python packaging tests passed; `verify_extraction.py` stopped at the byte hash for `apps/web/AGENTS.md`. This file has no changes in this PR. Historical manifest and protected runtime were not edited.
- Provider execution awaited an adapter promise with an AbortSignal but no promise race; an adapter ignoring cancellation could exceed the deadline. Execution now races cancellation and removes the event listener afterward.
- API transactions use REPEATABLE READ. Two identical requests can collide on a project lock and abort with 40001; Visual Marketing now retries the complete transaction at most twice, allowing the stored receipt to replay.

## Root cause

`freeze` is a PostgreSQL keyword. The worktree used CRLF checkout bytes although the historical hash matches the canonical Git blob exactly. Restoring unchanged tracked bytes from Git resolved that mismatch without changing manifests or Git content. The next failure is the absence of private production Member handover files in the isolated worktree; these must not be copied just to satisfy a historical check. Cooperative cancellation alone is not a bounded execution guarantee. Idempotent receipts alone do not replay an aborted transaction under concurrent isolation.

## Why detection escaped

Pure contract tests do not parse PostgreSQL DDL, exercise the transport transaction wrapper or simulate a non-cooperative adapter. The extraction check runs after the other regression suites.

## Prevention

Apply new migrations to an isolated real PostgreSQL database, test timeout and concurrent HTTP requests, retain stale-lease tests and use canonical repository bytes for byte-hash checks and record unavailable private handovers separately. Do not update a protected manifest to hide drift. Packaging's explicit file count changes only for the six newly allowlisted modules.

## Additional regression evidence

Tests for public revision and truly concurrent HTTP requests exposed two defects before release. PostgreSQL applies the restrictive SELECT policy to UPDATE checks, so setting a public projection inactive failed with 42501. The policy must let an authorized private-project viewer see historical projections while Guests still see only active public output. The concurrent enqueue can raise 23505 on `visual_one_active` rather than 40001 because enqueue locks but does not update the project row; transport replay is restricted to these domain uniqueness constraints. Earlier serial replay tests did not exercise either case. An asset metadata check also now compares SHA-256 of downloaded UTF-8 bytes, rather than the separate JSON bundle hash used for approval. These tests prevent recurrence.

## Theme verification

Desktop browser inspection in the existing dark theme exposed white cards with inherited light text. The new stylesheet referenced undefined mc-card/mc-line variables and fell back to white. Builds and DOM checks do not test visual contrast. The fix uses existing --background, --text and --border theme tokens with an explicit button text color; verify desktop and narrow screenshots after rebuilding.

Optional provider configuration was also checked during review: throwing from registry capability discovery would make an invalid URL block the entire manual Studio. Capability discovery now reports unavailable, while explicit generation requests retain validation errors; a regression test covers this boundary.
