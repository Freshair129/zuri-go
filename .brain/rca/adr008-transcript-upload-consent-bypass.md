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
- At the original ReviewGate finding, database replay, database regressions, and this HTTP sequence had not yet run; later isolated QA evidence is recorded below.

## Root Cause

The transcript-transfer guard treats the current participant roster as proof of consent, while ADR-008 makes that same roster editable by any active Member. Both the service and SQL routines enforce the same check, but neither uses evidence independent of the roster the caller can modify.

## Why the issue escaped detection

The existing nonparticipant tests attempt an upload without first changing the roster. They verify denial for a nonparticipant in the current row set, but not the two-request sequence that first adds the caller and then uploads. The broad Member CRUD review did not trace this special local-to-cloud transfer through its participant check.

## ReviewGate rework evidence and root cause

ReviewGate returned REWORK for local commit `963516d`. Capturing eligibility at the first `local_only` transition still trusts a roster that any Member may edit immediately beforehand. The Member-callable custody function also permits a second transition after upload. The SQL upload routine checks participation before locking the meeting, so a concurrent roster removal can leave that check stale. These escaped the first regression because it added the outsider only after custody started and did not exercise repeated transitions or concurrent edits.

## Approved Prevention

The owner approved sealing eligibility when a new meeting is created and, for existing cloud meetings, from the roster at the operator-controlled schema-12 migration. Already-held meetings without evidence fail closed. A database-enforced first restriction starts local custody once, with no Member-callable transition. Upload locks the meeting before rechecking both current participation and sealed eligibility; roster edits coordinate through that row so repeatable-read transactions cannot authorize against a removed participant. Test self-add before restriction, repeated custody attempts, concurrent removal, denial state and the legitimate upload paths. Production remains schema 11; release and deployment are not authorized.
