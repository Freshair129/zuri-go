# ADR-008 follow-up RCA — immutable observations and Visual Guest reads — 2026-10-05

Risk: C-3 / HIGH. Scope: the local schema-12 implementation candidate only. Production remains on schema 11; no production migration or deployment is authorized here. This RCA records findings made against the earlier pre-FEAT-015 candidate numbered 011 and the resulting corrections now carried in `apps/api/migrations/012_business_wide_access.sql`; fresh schema-11-to-12 database verification is NOT_RUN after the command runner rejected bootstrap.

## Finding 1 — Metric observations can be updated by the runtime role

### Symptom

In the pre-FEAT-015 ADR-008 migration candidate (then numbered 011, now migration 012), an active Member using the ordinary runtime database role could directly UPDATE `metric_observations`, including immutable measurement fields and the `is_current` marker. That permits changing or retiring historical observations outside the approved correction flow.

### Evidence

- `apps/api/migrations/012_business_wide_access.sql` carries forward the generic Member policy but adds explicit direct-update denial and a scoped correction routine for `metric_observations`.
- `apps/api/migrate.mjs` grants table-level `UPDATE` on every table after applying migrations; the current schema-12 runner now re-revokes UPDATE on observations and revisions after the broad grant on every run.
- `apps/api/service.mjs` `observe()` serializes on the metric series, locks the current row, checks `expected_id` and `correction_reason`, changes the old row's `is_current` to false, inserts a superseding revision, then appends an audit event in the request transaction.
- `docs/architecture/ARCH-002-postgresql-data-model.md` describes immutable facts/revisions; ADR-008 D2 preserves immutable measurement history.

### Root Cause

The schema-11 generic Business CRUD policy and migrator-wide UPDATE grant were applied to an append-only history table without a table-specific exception. The correction service's legitimate current-marker update was not separated from direct row UPDATE authority.

### Why the issue escaped detection

Existing correction tests exercised the service path as the trusted operator and checked superseding history, but did not attempt direct UPDATE as the restricted runtime role after the ADR-008 candidate. The migration test also did not assert the effective runtime table grant for observations.

### Prevention

Revoke runtime table UPDATE and deny it at the observation RLS boundary. Preserve first observations through the existing INSERT path. Perform corrections through one tightly scoped `SECURITY DEFINER` routine that checks the transaction Business and session-derived active Member/operator, the expected current row and non-empty reason, then atomically retires only that current marker, inserts its successor and writes an actor-attributed audit event. Keep the existing JavaScript validation and table constraints. Test direct UPDATE denial and unchanged history, plus a successful supersession and its audit attribution.

## Finding 2 — Guest reads of Visual public-output history remain narrower than ADR-008

### Symptom

Guest RLS can see only trusted, active public projections in `visual_public_outputs`; non-public, untrusted, inactive or retracted rows in the same Business are hidden, despite the ADR-008 contract that Guests read every non-secret Business record.

### Evidence

- `apps/api/migrations/010_visual_approval_boundary.sql` creates restrictive SELECT policy `public_read` on `visual_public_outputs`, allowing Guests only trusted, active outputs whose parent Project is public.
- The earlier ADR-008 migration candidate preserved that policy while adding Business-wide record access; migration 012 now drops the obsolete Guest projection predicate and leaves the Business-scope policy in effect.
- FEAT-014-009 and ADR-008 require Guest reads of every non-secret Visual Business record; provider/publication authority remains separately gated.

### Root Cause

The schema-10 projection policy remained as a restrictive SELECT predicate in the first schema-11 candidate. Adding Business-scope access did not widen reads through a restrictive policy because restrictive predicates still intersect; migration 012 now removes that obsolete predicate.

### Why the issue escaped detection

Existing Visual tests checked Guest access to Visual project context and the active public projection path, but did not query an inactive/retracted output as a Guest under the restricted runtime role.

### Prevention

Drop only the obsolete `public_read` restriction so `visual_public_outputs` reads inherit the existing Business RLS boundary. Keep runtime INSERT revoked, preserve immutable output fields and one-way retraction, and leave internal approval separate from trusted publication. Test that Guests can read in-Business active and retracted output rows but cannot mutate or publish; retain direct runtime INSERT denial and the explicit trusted publication regression.

## Finding 3 — Broad runtime UPDATE also reaches immutable meeting revisions

### Symptom

The schema-11 generic Member UPDATE policy and global runtime UPDATE grant include `meeting_revisions`. A runtime Member can directly alter immutable revision identity, source metadata, transcript segments or lineage. The legitimate transcript-custody upload path also updates a held placeholder, so a blanket table revoke without a narrow exception would break that path.

### Evidence

- `docs/architecture/ARCH-002-postgresql-data-model.md` §6.2 calls `meeting_revisions` immutable.
- `apps/api/migrations/012_business_wide_access.sql` includes `meeting_revisions` in the generic UPDATE policy loop; `apps/api/migrate.mjs` applies a table-wide UPDATE grant after migrations.
- `apps/api/workspace.mjs` `uploadTranscript()` validates that submitted source/review metadata matches the held `local_only` stub, checks segment structure and review hashes, and then updates only `segments` and `legacy_metadata` before switching the meeting to `cloud` and appending the upload audit event.
- The test covers the service upload and save-path stub protection but did not attempt direct runtime SQL UPDATE on the revision table.

### Root Cause

The generic mutable-record policy/grant treated an immutable evidence table as ordinary Member CRUD. The only legitimate UPDATE was an explicit, audited custody transition, but it had no narrow database path of its own.

### Why the issue escaped detection

Tests exercised the transcript upload service after its JavaScript validation, but did not test direct UPDATE as `zuri_go_app`. They therefore proved the API's allowed upload, not the database's denial of unrelated revision rewrites.

### Prevention

Revoke runtime table UPDATE and deny direct UPDATE through RLS. Route transcript completion through one `SECURITY DEFINER` operation that requires the same Business, an active session Member, a non-empty upload reason, a `local_only` meeting and the complete set of withheld revision stubs; require immutable revision metadata/lineage to match and valid non-empty segments. Complete the revision fill, switch custody to `cloud`, increment the Business revision and append the session-attributed upload audit atomically. Keep the existing API content/hash checks and batch handling. Test direct revision metadata/content UPDATE denial and unchanged history, plus the ordinary upload route, Guest visibility after upload and its audit event.

## Finding 4 — Transcript routine metadata comparison had an ambiguous JSONB operator

### Symptom

The focused PostgreSQL 17 regression on the earlier migration candidate failed while exercising rejection of an uploaded transcript still marked `withheld`, with `operator is not unique: unknown - unknown` from the transcript-completion routine.

### Evidence

- The failure occurred in the direct `complete_meeting_transcript_upload()` regression after the pre-FEAT-015 ADR-008 migration candidate (then 011, now 012) was applied to the isolated QA database.
- The metadata equality check subtracted two string literals in sequence from JSONB values without explicitly typing the operator's key argument.

### Root Cause

The overloaded JSONB subtraction expression left the literal operands ambiguous to PostgreSQL's resolver in this context. The intended operation is a JSONB key-list removal before comparing the remaining metadata.

### Why the issue escaped detection

The earlier transcript tests covered the service validation and successful upload path, but the newly added database-level forged-metadata test was the first to execute this full comparison branch against PostgreSQL.

### Prevention

Pass an explicitly typed `text[]` key list to both JSONB operands and retain exact equality for every field outside `segments` and `withheld`. Keep the NULL-array and forged-withheld rejection cases in the schema-12 regression suite. This correction is present in the final SQL source, but its fresh schema-11-to-12 replay and DB regression remain NOT_RUN after the command runner rejected the bootstrap command.

## Finding 5 — Empty transcript upload can switch custody without transcript content

### Symptom

A participant can submit empty `sources`, `reviews` and `batches` for a restricted `local_only` meeting with no withheld stubs. The service accepts the matching zero counts, and the database routine can switch custody to `cloud` and append a `transcript_upload` audit event with empty revision and batch ID lists. A later ordinary meeting save then follows the cloud-custody path and can store transcript content without the explicit upload operation.

### Evidence

- `apps/api/workspace.mjs` `uploadTranscript()` compared submitted revision and batch counts with the withheld stub counts; when both were zero, all checks passed and it called `complete_meeting_transcript_upload()`.
- `apps/api/migrations/012_business_wide_access.sql` now rejects a zero-revision custody transition; the earlier candidate accepted `stub_count = jsonb_array_length(p_revisions)` when both were zero, then changed `transcript_custody` and wrote the audit event.
- The same service derives whether later saves are stubbed from the stored meeting custody (`workspace.mjs` `custodyFor()`), so an empty transition bypassed the explicit content/hash validation that protects withheld revisions.

### Root Cause

Both validation layers enforced equality between submitted content and stored stubs, but neither required at least one withheld transcript revision. The valid empty-batch case obscured the distinct invariant that transcript content itself must be present before custody can move to `cloud`.

### Why the issue escaped detection

The existing database regression exercised a meeting with source/review stubs and a withheld batch. It covered mismatches and successful uploads but did not create a `local_only` meeting with zero withheld revision rows and submit empty arrays; therefore it never tested the zero-equals-zero path.

### Prevention

Require at least one withheld source or review revision in both `uploadTranscript()` and `complete_meeting_transcript_upload()` before changing custody or writing audit. Keep `batches: []` valid when transcript revisions exist and no withheld draft batches are stored. The regression must prove an empty revision set is rejected, custody remains `local_only` and no upload event is added, while a non-empty revision upload with zero batches remains valid. Fresh schema-11-to-12 replay and database regressions for this correction remain NOT_RUN because the command runner rejected database bootstrap; no production database was accessed.

## Finding 6 — Business-wide Member CRUD bypasses transcript participant consent

### Symptom

An active Member in the same Business who is not a participant of a restricted meeting can submit a valid transcript upload. This moves the meeting's transcript from `local_only` to `cloud`, exposing its transcript under the Business-wide Guest read policy without the meeting participant's explicit consent.

### Evidence

- API-020 and FR-011-010 require a meeting participant, a non-empty reason and an explicit audited upload.
- The transcript route in `apps/api/api.mjs` calls `workspace.uploadTranscript()` directly. That service checked for an authenticated Member, a reason, `local_only` custody and matching stubs, but did not check `meeting_participants`.
- `complete_meeting_transcript_upload()` independently verified the Business setting and active session Member, but did not verify that the Member was listed for the same Business and meeting.
- In `apps/api/test/visibility-db.test.mjs`, the prior nonparticipant case supplied a blank reason; it failed reason validation before demonstrating that a valid nonparticipant upload was denied. Direct database-function regressions used a participant.

### Root Cause

ADR-008 grants every active Member ordinary Business-record CRUD, while transcript upload remains a separate consent and data-custody action. Neither the service nor its SECURITY DEFINER database routine preserved the existing participant-only gate, so authentication and general write authority were treated as sufficient consent.

### Why the issue escaped detection

Tests covered participant upload success and rejected one nonparticipant request only because its reason was blank. They did not submit a valid, fully matched transcript as a nonparticipant through either the service or the database routine, and therefore missed the missing membership predicate.

### Prevention

Require the authenticated Member to have a `meeting_participants` row matching the exact Business and meeting in both `uploadTranscript()` and `complete_meeting_transcript_upload()`. Test a nonparticipant's valid service request and direct database-function call are denied while custody, revision contents and upload-audit count remain unchanged. Retain participant success and the valid zero-batch upload case. Database verification remains NOT_RUN after the command runner rejected bootstrap; no production database was accessed.
