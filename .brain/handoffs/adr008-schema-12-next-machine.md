# Handoff — ADR-008 / schema 12 — 2026-10-05

## Checkout and branch

- Repository: `https://github.com/Freshair129/zuri-go`
- Branch: `codex/adr008-shared-business-access`
- Base: `origin/main` at `89b525aa250a7a757ddd0b287dac590309e1c107`
- This branch is being pushed only to transfer the candidate to the machine with the owner-confirmed `O:\zuri-go` checkout. It is incomplete and must not be merged, deployed, or used to migrate a database yet.

## Goal and current candidate

Implement approved ADR-008: Guests read all non-secret Business records; every active authenticated Member has the same Business CRUD and internal-approval rights; preserve Business isolation, session-derived identity, append-only audit history, and existing lifecycle rules.

FEAT-015 migration `011_marketing_report_ledger.sql` remains intact. The ADR-008 candidate is migration `012_business_wide_access.sql` targeting schema 12. Production and restored native Local remain schema 11. No database migration or deployment has been run. Application version remains 0.5.1.

## Blocking ReviewGate finding — fix before merge or release

ReviewGate returned **REWORK**. Transcript upload currently checks the mutable `meeting_participants` roster as proof of participant consent. An active Member can update that roster through `PUT /businesses/:b/workspace`, add themself, then call the transcript upload route. The service check is in `apps/api/workspace.mjs` near `uploadTranscript`; the SQL routine repeats the same current-roster check in migration 012 near line 286. The custody change makes the transcript cloud-readable, including by Guests under ADR-008.

Keep the existing participant-consent rule from FEAT-011-010. Make its authorization evidence independent from the ordinary editable roster, enforce it in both the service and SQL routine, and add a regression that attempts roster self-add followed by transcript upload and proves denial with unchanged custody, revisions, and audit state. The RCA is `.brain/rca/adr008-transcript-upload-consent-bypass.md`. Current database replay and database/HTTP regressions are **NOT_RUN**.

Do not relax consent to all Members without changing the approved custody contract first. Do not run migration 012 against Local or Production until the consent finding is fixed and schema-11-to-12 verification passes.

## Checks already completed on this candidate

- `npm run build` — PASS
- `npm run docs:validate` — 0 errors, 159 warnings
- `npm run docs:views` — 11 views, 0 drift
- Node syntax checks — PASS
- `node --test apps/api/test/visibility.test.mjs` — 13/13 PASS
- `git diff --check` — PASS
- High-confidence secret scan and forbidden-path scan — PASS
- Fresh schema-11-to-12 replay / PostgreSQL regressions — **NOT_RUN** (runner bootstrap was rejected)

The two stale-document findings were corrected in FR-011-010 and ARCH-002 and the docs checks above rerun. Other release, deployment, hosted-runtime, and production claims remain unverified or unchanged.

## Next actions on the owner-confirmed checkout

1. Fetch `codex/adr008-shared-business-access` and verify the pushed commit and working tree.
2. Complete the participant-consent design/source correction and focused service/SQL regression before any merge decision.
3. Run the required schema-11-to-12 database verification using isolated QA, then update docs and request fresh independent VerifyGate and ReviewGate.
4. Treat Production migration 012 and deployment as separate release gates; this handoff does not authorize either.

## Earlier local candidate (superseded by gate rework) — 2026-10-05

The owner approved preserving participant-only upload consent with evidence independent of the editable roster. Work continued in an isolated `O:/zuri-go-adr008` worktree because two unrelated FEAT-015 files became modified in the original `O:/zuri-go` checkout; those files were preserved. Migration 012 now captures a protected eligibility snapshot on the first `local_only` transition, and the service plus SQL upload routine require both that snapshot and current participation. Runtime direct custody changes and evidence edits are denied. The hosted HTTP roster-self-add/upload regression and direct SQL checks deny the nonparticipant while custody, revisions, Business revision and upload audit count remain unchanged; the original participant upload and nonempty-revisions/zero-batches path pass.

On disposable native PostgreSQL 18 QA databases, migrations 001–011 replayed and migration 012 applied. The affected API/meeting/visibility/lifecycle suite passed 59/59; a separate schema-11 fixture with one held meeting migrated without manufactured eligibility and denied upload with `42501`. Build passed; documentation validation reported 0 errors/159 existing warnings, and 11 views had 0 drift before the final documentation status edit. Production and restored native Local were read-only checked at schema 11, migration 012 absent, with zero held meetings and withheld revisions. FEAT-015 migration 011 remains unchanged. The earlier NOT_RUN items above describe the state at handoff; the [current ADR-008 QA record](../../docs/architecture/decisions.md#current-schema-11-to-12-qa-record-2026-10-05) supersedes them. Production migration, deployment, promotion, hosted production/browser checks and release acceptance remain NOT_RUN.

## Rework after independent gates — 2026-10-05

VerifyGate and ReviewGate returned REWORK on local commit `963516d`. The custody-time snapshot still admitted a self-add before first restriction, the Member-callable transition could re-hold an uploaded transcript, and SQL checked the roster before acquiring its meeting lock. Seven feature documents retained stale database-verification NOT_RUN text. The owner approved the revised creation-time / migration-baseline design before code changes.

Migration 012 now seals new-meeting eligibility at creation and existing cloud-meeting eligibility during the operator-controlled migration; a prior `transcript_upload` audit marks an already-completed first hold. Existing held meetings remain without inferred eligibility. The database starts local custody on first restriction, records that one-time transition, and has no Member-callable custody function. Roster writes bump the meeting row, and SQL upload locks it before final roster/eligibility checks. Fresh isolated QA7 replayed 001–012 with a cloud, held and prior-upload fixture; the cloud roster was sealed, the held meeting received no eligibility, and re-restriction after historical upload kept cloud custody. The affected suite passed 61/61 against QA7, including new pre-restriction self-add, repeat-hold and concurrent-removal regressions. Separate QA6 direct runtime upload for a held meeting was denied with custody unchanged. The seven stale status statements were corrected. Build passed, docs validation reported 0 errors/159 existing warnings, and docs views had 11 views/0 drift. Fresh exact-commit gates are still pending at this handoff update. Production and restored native Local remain schema 11; no deployment, promotion or merge is authorized.

The first exact-commit gates on `e251dd6` returned REWORK only because ADR-008 acceptance criterion 6 still named schema-10 QA. VerifyGate independently passed 34/34 focused QA7 checks, build and docs checks; ReviewGate found no remaining code/security defect in the transcript path. Criterion 6 was corrected to schema 11→12 before requesting another exact-commit gate.
