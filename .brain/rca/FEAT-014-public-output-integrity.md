# FEAT-014 public projection integrity RCA — 2026-10-03

## Symptom

A restricted `zuri_go_app` session for a visible non-owner Member could update an existing `visual_public_outputs` row's copy and `content_hash`. A Guest then read the modified copy even though the linked owner decision and approved artifact were unchanged.

## Evidence

- VerifyGate reproduced this against one synthetic public QA Project in `.local/visual-dag/verifygate/review-finding-validation.json`; the runtime role was non-superuser and had no `BYPASSRLS` privilege.
- The non-owner update affected one row, changed the copy to a synthetic unapproved marker, and replaced the payload hash. The approval still named the owner and original artifact hash; the changed payload hash no longer matched that decision. Guest read returned the changed copy.
- A separate `active=false` retraction affected one row and hid it from Guest reads. The verifier restored the original synthetic payload and active value afterward.
- `apps/api/migrate.mjs` grants table-level `SELECT, INSERT, UPDATE` on all `zuri_go` tables, then does not revoke table-level UPDATE on `visual_public_outputs`.
- `apps/api/migrations/008_visual_marketing.sql` has a `public_update` policy allowing a Member/operator update without field immutability or one-way retraction checks.
- The service publication path checks the owner, current passing QA, bundle hash and revision before inserting the output; the brief revision path retracts by setting `active=false` only.

## Root Cause

The runtime role's table-level UPDATE grant and permissive row policy let a visible non-owner mutate the stored public projection after owner approval. Row-level audience controls determined which rows could be touched but did not preserve the approved payload/hash invariant or distinguish retraction from content replacement.

## Why the issue escaped detection

Existing tests verified service-mediated approval, Guest projection and successful retraction, but did not attempt payload/hash mutation as a visible non-owner using the restricted runtime database role. The HTTP service rejected non-owner approval; that did not test direct role SQL.

## Prevention

Keep the approved output as an immutable projection after insertion. Revoke table-level runtime UPDATE and grant UPDATE on `active` only; constrain the RLS update policy to a one-way active-to-inactive retraction while retaining Business and project-audience scope. Reconcile these grants after the migrator's general grants so later migration runs cannot restore table-level UPDATE. Add a restricted-role regression that rejects payload, hash and approval-reference changes and reactivation, while proving owner-approved publication still works and the established retraction path only changes `active`.

## Bounded remediation contract

This correction implements the existing approved FEAT-014 data amendment; it adds no approval actor, workflow state or API behavior. Use additive migration `009` because schema 8 is already installed in isolated QA. Apply it only to the synthetic QA database. Do not migrate the user's local or cloud database or touch production data.
