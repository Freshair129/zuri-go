# RCA — ADR-008 transcript upload consent bypass — 2026-10-05

Risk: HIGH. Complexity: C-3. Scope: ADR-008's schema-12 implementation candidate on `codex/adr008-shared-business-access`. Production remains on schema 11. The original ReviewGate finding preceded the current isolated QA migration and fix; no Production or restored Local migration or deployment has been made for this candidate.

## Symptom

An active Member who is not listed as a meeting participant can add themself to the editable participant roster through the ordinary workspace update, then upload that meeting's withheld transcript in a subsequent request. The upload changes custody from local-only to cloud, where ADR-008 makes the non-secret transcript readable to Guests.

## Evidence

- `apps/api/api.mjs` routes `PUT /businesses/:b/workspace` into `writeDomain`.
- `apps/api/workspace.mjs` replaces `meeting_participants` using the caller-supplied `participantIds` and records an audit event.
- `apps/api/workspace.mjs` authorizes `uploadTranscript` by checking the session Member against the current `meeting_participants` rows.
- `apps/api/migrations/012_business_wide_access.sql` repeats that current-roster check inside the transcript upload SQL routine.
- `docs/features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-010-transcript-custody.md` requires explicit participant upload consent. ADR-008 grants Members full CRUD on mutable Business records and makes uploaded non-secret transcripts Guest-readable.
- ReviewGate statically confirmed the sequential API path. Database replay, database regressions, and this HTTP sequence are NOT_RUN.

## Root Cause

The transcript-transfer guard treats the current participant roster as proof of consent, while ADR-008 makes that same roster editable by any active Member. Both the service and SQL routines enforce the same check, but neither uses evidence independent of the roster the caller can modify.

## Why the issue escaped detection

The existing nonparticipant tests attempt an upload without first changing the roster. They verify denial for a nonparticipant in the current row set, but not the two-request sequence that first adds the caller and then uploads. The broad Member CRUD review did not trace this special local-to-cloud transfer through its participant check.

## Approved Prevention

The owner approved participant-only consent with authorization evidence independent of the editable roster. Migration 012 now captures eligible Member UUIDs once when custody first becomes `local_only`, after roster writes in the same transaction. Ordinary runtime CRUD cannot edit this evidence or directly flip custody; the service and SQL upload routine require both current participation and captured eligibility. Existing held meetings without evidence fail closed. Isolated schema-11-to-12 QA passed the roster-self-add sequence through the hosted handler, service and direct SQL, proving denial with unchanged custody, revisions, Business revision and upload audit state. The original participant upload and nonempty-revisions/zero-batches paths passed. Production remains schema 11; release and deployment were not performed.
