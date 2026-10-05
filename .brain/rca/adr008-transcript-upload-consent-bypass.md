# RCA — ADR-008 transcript upload consent bypass — 2026-10-05

Risk: HIGH. Complexity: C-3. Scope: ADR-008's schema-12 implementation candidate on `codex/adr008-shared-business-access`. Production remains on schema 11. No commit, push, database migration, or deployment has been made for this candidate.

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

## Proposed Prevention

Do not authorize transcript transfer using the mutable current roster alone. If participant-only consent remains the rule, establish a session-attributed authorization record that a Member cannot grant or alter through ordinary workspace CRUD, enforce it in both the service and database routine, and test the roster-edit-then-upload sequence for denial plus unchanged custody, revisions, and audit state. If the intended policy is that any active Member may transfer any transcript, amend the approved transcript-custody contract first because that transfer exposes content to Guests. The product-policy decision is pending; no code fix is authorized until it is resolved.
