# Extraction verifier portability proposal

Status: approved task scope for this verification-closure change; this proposal does not change the source manifest, application behavior, production data, database, deployment or release state.

## Root cause and scope

The verifier hashes every manifest target under `apps/web/`, `assets/` and `.local/member-access/` as though each path must exist in a source checkout. Five member-access targets are marked `private-preserved`, and the isolated worktree deliberately omits them. Separately, the verifier gathers credentials only from files available in the worktree, scans the deploy package for those values, then reports the unconditional `secretsExcluded: true` flag. See [the RCA](../../.brain/rca/FEAT-014-extraction-verifier-portability.md).

The change is limited to making this existing verifier callable from synthetic tests and honest about unavailable private custody evidence. It does not update historical manifest digests or allowlisted package contents.

## Required behavior

1. Every present, non-editable source target retains exact SHA-256 verification. A missing public or other non-private source target remains a failure.
2. For a missing target beneath `.local/member-access/`, skip only when the manifest marks that entry `private-preserved`. Record the unavailable custody count/status as `NOT_RUN`; do not call it verified.
3. For each present private-preserved target, require the exact manifest hash. For each available supported credential/config input, collect its value without logging it and check it against every packaged file.
4. Keep package path exclusions, forbidden operator-file checks, expected deployment file count, stable Data App ID, Vercel project ID, HTML/runtime digest checks and extraction path scanning unchanged.
5. Report credential scan coverage based on inputs actually available. When production handovers are absent, a complete production credential-leak claim is `NOT_RUN`; checks against any other available known secrets and package boundaries still execute.
6. Expose the validation as a callable operation over an explicit root and return the report without writing files. Keep historical CLI report output separate. `npm test` uses a temporary fixture or explicit no-write mode and must not modify `docs/migrations/verification/extraction.json`.

## Regression acceptance

- Missing private-preserved handovers do not block repeatable source tests and report `NOT_RUN` for the missing custody coverage.
- Present matching private input passes its manifest hash check and is included in package scanning.
- Present tampered private input fails the hash check.
- A known synthetic secret embedded in a deploy file fails the package scan; the secret value is absent from diagnostics.
- A tampered public immutable source file fails, even when private custody inputs are absent.
- Existing package boundary, file count, stable IDs and runtime/content hash assertions continue to run.
- Test fixtures do not rewrite tracked migration evidence.

Risk: **HIGH**, because the changed code is itself a source-integrity and credential-leak gate. Parent activity complexity remains **C-3** for FEAT-014 C/D closure. This narrow harness packet is **C-2** under that approved scope because it changes no architecture or application data flow.

Version impact: application version remains 0.5.1; PostgreSQL schema remains 8 in isolated QA; no release or production state changes. Update the FEAT-014 verification ledger only with observed check results and the sealed candidate hash.
