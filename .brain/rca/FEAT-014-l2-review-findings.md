# FEAT-014 L2 findings RCA and approved R3 packet

**Status:** Sealed repair `8592f21` passed independent VerifyGate and bounded Sol L2; all five original R3 findings and RG-R3-001 are closed for the approved C/manual + minimum-D scope. Under STD-005 R8 E6, the authorization-sensitive packet was ineligible for local-model L1 and escalated to the Architect's L2 tier, which passed under R10. See the current [verification record](../../docs/features/FEAT-014-visual-marketing-team/verification.md).
**Reviewed source:** merge-base 9e224c851b6c5c2b25232d41e183bf8623b5bb7a through HEAD 3fc3fb01ba424aa75b9006936bb0bb68d03dfc76. At that review, application source matched sealed candidate 771bbf70e437bf26cbfaa3a4ab643540155d8c59.
**R3 source baseline:** HEAD b50841b350f1089e22b055d06dae4eec077cf90a, tree 343c0ddaf65056f7e8bd1aa20bb49c4bca625af4; working tree was clean before this packet.
**Independent review:** .local/visual-dag/reviewgate/l2-review-3fc3fb0.md (Sol Max, whole-PR L2 REWORK).
**Dynamic evidence:** .local/visual-dag/verifygate/l2-public-insert-validation.json (isolated synthetic QA, cleanup complete). No HTTP exploit was demonstrated. No user/cloud database was inspected or migrated during this review.

The earlier C/minimum-D operational exit, closure-document ReviewGate and bounded R2 delta ReviewGate remain PASS for their stated scopes. This later whole-PR L2 review returned REWORK with five findings and reopens merge readiness. L1 strict-schema review is NOT DEMONSTRATED. Findings 1-4 received targeted isolated-QA/API confirmation; finding 5 is a static documentation mismatch. At the R3 baseline no application fix had been applied.

## Owner approval and R3 design lock — 2026-10-03

### R3 rework 1 — RG-R3-001 current Project audience (2026-10-04)

**Symptom.** An active Member who lost current Project access could invoke `visual_record_review` directly and append a trusted passing review for a known BUNDLE.

**Evidence.** Sol identified the missing check in migration 010's SECURITY DEFINER review function. VerifyGate reproduced it on sealed `3425a6b` in a new isolated QA Business: an originally public Project was made restricted, the nonowner was excluded from Project/team audiences, and the runtime role's correctly resolved Member session still inserted a validated passing review (no SQLSTATE). The function owner was `postgres` with superuser/BYPASSRLS; `zuri_go_app` had neither. Exact fixture cleanup left zero rows. Evidence: ignored `.local/visual-dag/verifygate/rg-r3-001-runtime-validation.json`.

**Root cause.** The privileged review function checked active credentials and the frozen Visual audience but omitted the current Project audience check. Its owner bypassed RLS, so loading the Project inside the function did not enforce the caller's current read scope. The normal API precheck did not protect direct calls to the granted SQL function.

**Detection gap.** The R3 regressions covered fabricated INSERTs and valid approval, but did not narrow current visibility after recording an originally public audience and invoke the review function under an excluded Member session.

**Prevention and bounded repair.** Before further source changes, this record locks the correction: call the existing current-Project audience predicate inside `visual_record_review` using the locked Project row, in addition to the frozen-audience and active-Member checks. Add a direct-function regression for visibility narrowing, preserve valid caller/operator behavior, and verify denied calls append no trusted review. Amend unreleased migration 010; refresh only its exact function definition in isolated schema-10 QA without resetting data or applying the whole migration again. Reseal and independently verify the corrected candidate. Application/UI versions and all external authority boundaries remain unchanged; the earlier bounded PASS does not clear this later finding.

**Initial repair checkpoint (before fresh gates).** The worker added the fail-closed current `project_audience` predicate and one regression. Only the updated function was refreshed with CREATE OR REPLACE in isolated schema-10 QA; its SECURITY DEFINER owner remains `postgres`. The focused new test passed 1/1: the excluded Member receives SQLSTATE 42501 and adds no review, while the current owner records a validated passing review. Syntax and diff checks passed. The following final evidence supersedes the then-pending seal and gates.

**Final correction evidence — 2026-10-04.** The repair is sealed at `8592f21b337c1e6c3217623cc825cc0c78808b6f` (tree `544bcdcc52d08ea870ba3e5fc355431280fbe3c7`). VerifyGate confirmed 5/5 changed-file hashes against its isolated snapshot; the installed `visual_record_review` body matches the sealed migration body, retaining SECURITY DEFINER ownership by `postgres`. The focused DB suite passed 12/12; full `npm test` passed 206/206 Node, 15/15 site, 47/47 docs; build exited 0. Exact QA fixtures were cleaned, with zero business rows or dependent rows, and the owned server stopped with port 4319 free. Sol's bounded L2 result is PASS_BOUNDED_R3. Evidence is recorded in ignored `.local/visual-dag/verifygate/r3.1-verifygate.json` and `.local/visual-dag/reviewgate/r3-review-8592f21.md`.

**Initial worker checkpoint (before fresh gates; superseded above).** The implementation was written and isolated QA reached schema 10. Pure tests and DB tests passed 11/11 each; the repeated migrator preserved the restricted INSERT and function EXECUTE grants. A fresh schema-9 fixture retained its legacy data and hashes after migration, while Guest visibility changed from one old output to zero. The generated-hash expression initially failed PostgreSQL's immutability check and rolled back; replacing the STABLE `convert_to` call with the IMMUTABLE `digest(text,text)` overload allowed migration 010 to apply. At that checkpoint the transition fixture and full regression/build/browser and independent gates were pending; later VerifyGate completed transition checks and cleanup.

The owner approved remediation of all five findings in this R3 packet. Complexity is C-3; risk is HIGH because the first item changes database write authority and migration behavior. R3 is a new implementation packet beyond R2's historical two-iteration limit. Source work is confined to the five findings and necessary trust-transition invariants.

Before source edits, SDD-014 was advanced from 0.1.0 to 0.2.0 and records the approved write boundary and flow diagram. Migration 010 will add a PostgreSQL-derived `canonical_hash` for every artifact payload while preserving legacy `content_hash`, add `validated_pass=false` to old reviews and `trusted_publication=false` to old outputs, and restrict runtime INSERT on review/decision/projection rows to two fixed-path SECURITY DEFINER functions. The review function accepts only assessments and derives its result against current persisted data; the finalizer locks the Project, derives actor from the existing resolved viewer settings, checks current owner/operator, audience, stage/revision, canonical BUNDLE and latest validated passing review, then atomically writes decision/stage/projection. Guest reads exclude legacy untrusted outputs; Member/operator history remains.

This reuses the existing app-resolved `zuri_go.business_id`, `viewer_kind`, and `viewer_member` settings as the identity boundary. It does not claim to defend against a stolen runtime credential that can rewrite those settings. The API field named `content_hash` will expose the new canonical hash; decision/review/public-projection hashes use that same value. Old hashes and approvals are not silently rewritten; the current artifact requires a fresh validated review before it can be approved.

Version plan: application 0.5.1 and FEAT-014 0.1.0 remain unchanged; SDD-014 0.1.0 → 0.2.0; migration source schema 9 → 10; the designated isolated QA database schema 9 → 10 only. The last-recorded user/cloud schema baseline remains 7 and will not be live-inspected or migrated in this packet.

## 1. P1 - Public-output INSERT is not bound to a genuine approval chain

**Symptom.** A restricted runtime-role session for a non-owner Member inserted an active public projection that used a different same-Project artifact, a legitimate decision reference, and altered payload/hash. A Guest then read the unapproved marker.

**Evidence.** L2 static review found independent same-Project artifact/decision foreign keys and a public_insert policy that checks Member/operator visibility and originally-public audience, but does not bind artifact, decision, content hash, and minimal canonical payload: apps/api/migrations/008_visual_marketing.sql:89-100,112-138. The migrator grants runtime INSERT on all tables at apps/api/migrate.mjs:29; migration 009 narrows UPDATE only. VerifyGate dynamically reproduced one invalid INSERT with a non-superuser runtime role lacking BYPASSRLS, then read the marker as Guest. Guessed public-output POST routes returned 404; this is a database-boundary finding, not an HTTP exploit.

**Root cause.** The insertion policy enforces audience and same-Project row scope, while the separate foreign keys prove only that each referenced row exists in the same Project. They do not prove that the current owner/operator approved that artifact and hash or that the projection equals its canonical bundle. Runtime INSERT authority also exists for reviews and decisions; their DML path cannot be trusted as a substitute for the final publication invariant.

**Why detection missed it.** R2 addressed mutation after insertion: UPDATE was reduced to one-way active retraction, and regressions covered payload/hash changes to an existing output. They did not attempt an adversarial INSERT under the restricted role with a mismatched artifact and decision.

**Prevention.** Make publication a single database-enforced finalization boundary. It must derive or validate the content hash from the immutable canonical BUNDLE payload, recheck the trusted owner/operator, current Project audience/stage/revision and latest passing QA, and atomically bind the decision to that artifact and projection. Do not trust matching caller-inserted hash fields or a directly inserted passing `visual_reviews.result`. Restrict ordinary runtime DML from fabricating the review/decision chain, or enforce the complete invariants at each insert path. Use additive migration 010 only if required by the approved design.

## 2. P2 - Terminal job transitions leave the linked run running

**Symptom.** VerifyGate confirmed that the third claim after two expired attempts leaves the job failed while its root run remains running. Creating a new Brief cancels an active job but also leaves its run running.

**Evidence.** The exhausted/stale branch updates only visual_jobs at apps/api/visual-marketing/jobs.mjs:43-45. Brief creation cancels jobs at apps/api/visual-marketing/service.mjs:49-51 without updating their runs. The verifier checked both cases in synthetic QA.

**Root Cause.** Terminal state is maintained in two linked records, but these paths update only the job. Ordinary failure and explicit cancel paths update both records, so the omission is path-specific.

**Why the issue escaped detection.** Earlier tests checked job fencing and ordinary failure/cancel behavior but did not assert root-run status after lease exhaustion or Brief revision.

**Prevention.** Update the linked run to failed/cancelled with completed_at in the same transaction as each terminal job update. Add regressions for the exhausted-lease and new-Brief paths and retain stale-worker commit checks.

## 3. P2 - Approved brand claims can have no source reference

**Symptom.** VerifyGate submitted a brand profile with an approved claim and empty source_refs through the normal API. The API accepted it and QA passed with zero claim references.

**Evidence.** The approved amendment requires source references and human confirmation at docs/architecture/visual-marketing/data-model.md:37. apps/api/visual-marketing/service.mjs:39-41 defaults missing refs to an empty list; apps/api/visual-marketing/contracts.mjs:37-40 treats approved_claims as sufficient support; apps/web/src/content/visual-marketing/VisualStudio.jsx:33,48 collects/sends no references. VerifyGate confirmed the normal API/QA path in synthetic data.

**Root Cause.** The service treats references as optional metadata and the QA allowlist treats claim text as evidence. The UI therefore cannot supply the provenance the data contract requires.

**Why the issue escaped detection.** Tests checked that output claims match the approved_claims list, not that each approved claim has a source reference; browser acceptance did not include claim provenance.

**Prevention.** Require bounded source references for approved claims and collect/send them in the Studio. Reject missing references in service/API validation and test persistence, retrieval, and QA evidence.

## 4. P2 - Returned job status_url does not resolve to job status

**Symptom.** Following the returned status_url reached a handler response of 403; the canonical scoped API GET returned 200 for the same job.

**Evidence.** apps/api/visual-marketing/jobs.mjs:20 returns /jobs/{id}; the supported route is under /api/zuri-go/v1/businesses/{businessId}/visual-marketing/jobs/{id} in apps/api/api.mjs:24-25 and apps/api/visual-marketing/api.mjs:32-35. VerifyGate confirmed the mismatch.

**Root Cause.** The enqueue response constructs a root-relative path without the business and API prefix required by the route.

**Why the issue escaped detection.** Tests used job_id/status fields directly and did not follow the returned status_url.

**Prevention.** Return a URL accepted by the existing same-origin API route and add an integration test that follows it and verifies the returned job ID/state.

## 5. P2 - Parent documentation describes stale approval and schema state

**Symptom.** Parent/peer records still describe Visual Marketing as unapproved or unimplemented and omit migration 009 from the schema description.

**Evidence.** docs/product/PRD-001-zuri-go.md:66-68 and docs/services/SRV-002-local/SERVICE.md:47-49 say the feature is proposed/unimplemented; SERVICE.md frontmatter omits FEAT-014 from implements. docs/architecture/ARCH-002-postgresql-data-model.md:405-407 says approval/migration verification are pending. docs/operations/RB-001-runbook.md:75,83 describes schema 8 only although the source contains migrations 008/009 and the isolated QA database reached schema 9. These are static comparisons. Existing documentation's last-recorded local/cloud baseline is schema 7; it was not live-verified during this review.

**Root Cause.** The FEAT-014 approval and local implementation state were not reconciled across the parent product, service, architecture and runbook descriptions when migrations 008/009 were added.

**Why the issue escaped detection.** Prior checks covered FEAT-014 canonical documents and generated views but did not compare these parent/peer statements against the final approved implementation record.

**Prevention.** In a separately authorized documentation pass, reconcile only the referenced FEAT-014 claims, add the service ownership metadata, and distinguish source/isolated schema 9 from the last-recorded user/cloud schema-7 baseline. Do not imply user/cloud migration.

## Approved R3 packet and acceptance

This is the owner-approved new C-3/HIGH packet beyond the prior two evidence-driven implementation iterations. Source changes are authorized within the scope and design above.

1. Close the approval-chain INSERT boundary. Regression: as restricted runtime roles, attempt to INSERT a forged passing review and decision for an unreviewed artifact using matching caller-supplied text hashes, then insert an altered public projection; also reuse a genuine decision with another artifact/payload. Deny each invalid path and prove Guest sees no row. Validate the hash from the immutable canonical BUNDLE payload or make artifact creation trusted; do not treat matching review/decision hashes as proof. Restrict direct review/decision INSERT or enforce every approval invariant at that boundary. A valid owner-approved canonical bundle must still publish. Reconcile runtime grants after migration.
2. Close failed/stale/cancelled jobs and their root runs atomically. Test two expired attempts followed by exhaustion, new-Brief cancellation, and stale commit fencing.
3. Require source references for approved claims through API and UI. Test missing/valid references, persistence and retrieval, QA evidence, and focused browser acceptance.
4. Return a resolvable status_url. Test enqueue and GET through the returned URL.
5. After approval, update the listed parent documentation and verify links, docs:validate, docs:views, and git diff --check.

Run baseline-failing targeted regressions and relevant build/full regression on the new candidate, then obtain fresh independent VerifyGate and L2 ReviewGate results. Migration 010 is additive and may be applied only to the designated synthetic QA database. Application release remains 0.5.1; FEAT-014 remains 0.1.0. No user/cloud migration, provider setup, merge, deployment, or release action is authorized by this packet.
