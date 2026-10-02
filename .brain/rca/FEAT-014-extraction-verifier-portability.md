# FEAT-014 extraction verifier portability RCA — 2026-10-03

## Symptom

The full regression runner stops in the historical extraction verifier in an isolated worktree before it can finish the extraction/package check. The failure is caused by an intentionally absent private production handover file, not by a changed public source file or a failed package boundary check.

## Evidence

- `scripts/run.mjs` invokes `scripts/site/verify_extraction.py` in its `test` branch.
- The verifier iterates `docs/migrations/source-manifest.json`; for every non-editable target under `apps/web/`, `assets/` or `.local/member-access/`, it reads the path and asserts the recorded SHA-256.
- The manifest contains five `.local/member-access/production/` entries with disposition `private-preserved`. The isolated worktree has no `.local/member-access/production/` directory, so the first missing target raises during the unconditional `read_bytes()` check.
- Later code separately collects values from existing local config files and handover JSON files for scanning every file in `build/vercel`. The final report currently writes `secretsExcluded: true` without stating whether any production handover value was available to scan.
- `tools/` and `tools/packet.mjs` are absent in this revision; PROC-001 is still proposed. The extraction runner is therefore not backed by the proposed packet tooling.

## Root Cause

The verifier conflates two evidence classes: immutable source bytes that are present in the repository and private custody files intentionally withheld from an isolated test worktree. It treats every historical manifest path as a required checkout file, including entries whose `private-preserved` disposition explicitly means they are outside ordinary source custody. Its aggregate `secretsExcluded` flag also implies complete credential coverage even when private inputs are unavailable.

## Why the issue escaped detection

The verifier was written for the original extraction environment, where the local production handover directory existed. The full regression sequence reaches it after application and packaging tests. Existing packaging tests validate the deploy allowlist, while no fixture tests exercise absent or partially available private manifest inputs or the truthfulness of the verifier's report.

## Prevention

Keep mandatory source hashes fail-closed. Treat only absent `.local/member-access/` entries marked `private-preserved` as unavailable custody evidence and report that check as `NOT_RUN`; if present, verify their manifest hashes and include every available credential value in package leak scanning. Continue all package path, file-count, stable app ID, Vercel project ID, HTML/runtime hash and immutable-source checks. Replace the blanket coverage claim with explicit available/unavailable status. Add temporary-fixture tests for missing custody inputs, matching and tampered private inputs, known-secret leakage and public immutable tampering. Run fixture tests through a callable verifier or no-write mode so they cannot rewrite the historical tracked extraction report.
