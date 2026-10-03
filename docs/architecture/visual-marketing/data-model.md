# Visual Marketing — approved amendment to ARCH-002

Canonical physical design detail for SDD-014/ADR-006, approved 2026-10-02. Additive migration `008_visual_marketing.sql` implements the C/D slice; migration `009_visual_public_output_immutability.sql` protects its approved public projection. Both are applied only to isolated synthetic QA on 2026-10-03; user-local/cloud and production databases were not migrated. No reset, reimport or reinterpretation of existing records.

## Common custody

Every table has business_id, UUID identity (or composite link identity), timestamps and composite Business foreign keys. Mutable records use row_version; outputs/decisions are append-only revisions with hashes. Public outputs are immutable after insertion except for one-way retraction by changing active from true to false; payload, approval hash and provenance remain immutable. ENABLE/FORCE RLS, Business scope, audience policies and Member/operator write checks apply to every operation. The runtime role has no owner/BYPASSRLS powers. Missing viewer fails closed.

Every brief requires an existing project_id. All creative descendants follow that Project's public/business/team/restricted audience, including jobs, logs, counts, assets and decisions. Intermediate artifacts, prompts, brief context, run details and approval audit additionally require Member/operator access. Guests may read only a minimal approved-output projection of a public project; it does not embed private input context. Related labels must independently pass their own viewer gates.

Destination audience must be a subset of every source audience. If this cannot be proved, linking/reuse is denied. C confines context to the same Project, public-safe Campaign fields and human-confirmed brand snapshots. No shared memory access that bypasses source RLS, and no independent child visibility setting. A later parent audience change must not expose a previously private child; immutable production audience constraints intersect current parent access, and a widened audience requires a separately initialized Project context; a revision never widens this extension. Narrowing takes effect immediately.

## Physical design

| Entity / table | Key data and invariants | Phase |
|---|---|---|
| BrandProfile / visual_brand_profiles | id, project_id, version, structured context, provenance/hash, human confirmation; immutable | C |
| CampaignCreativeBrief / visual_briefs | id, project_id, campaign_id nullable, brand_profile_id, revision, input_hash, brief JSON, creator | C |
| CreativeProject / visual_projects | project_id PK/FK to projects; current_brief_id, workflow_stage, revision, human PIC UUID, strategy gate; no duplicated project name/owner/status | C |
| CreativeTask | stage assignment in AgentRun; optional existing task_id, no new Task master | C |
| AgentRun / visual_runs | id, project_id, root_run_id, parent_run_id, agent_id, depth, stage, status, server-derived actor binding, input_hash | C/D |
| AgentArtifact, CreativeConcept / visual_artifacts | id, project_id, run_id, kind, immutable revision/payload/hash, source IDs; concept is an artifact kind | C |
| GenerationJob / visual_jobs | id, run_id, stage/state, idempotency key/hash, lease token/expiry, attempt, authorization hash, provider submission ref, error class | C |
| ProviderRun / visual_provider_runs | id, job_id, provider/model, attempt, input hash, external ref, status, nullable usage/cost, timestamps, sanitized error | C |
| CreativeReview / visual_reviews | id, artifact_id/hash, structured findings/evidence/blockers/suggestions, reviewer run; immutable | C |
| ApprovalDecision / visual_decisions | id, artifact_id/hash, decision/reason, actor kind/member, reviewed revision, timestamp, idempotency key; append-only | C |
| PublicProjection / visual_public_outputs | project_id, artifact_id, decision_id, approved copy/prompt and approval hash; immutable except one-way active retraction | C |
| CreativeAsset / visual_assets | id, project_id, artifact_id, later variant_id, MIME, width/height/duration, storage_provider/object_key, checksum, created_by_agent_run, approved_by through decision | C metadata |
| CreativeVariant / visual_variants | id, project_id, parent variant/artifact, brief revision, hypothesis, changed dimensions, branch status; fresh approval | E |
| PerformanceObservation | references existing immutable observation IDs and read timestamps; no editable copy of actuals | F |
| CreativeLearning / visual_learnings | id, project/campaign/variant refs, observation refs, derived metrics/formula version, AI interpretation, recommendation, human acceptance/rejection | F |

Composite FKs prohibit cross-Business identities. Run parent/root must match Project and workflow revision. Root has parent null/depth 0; children have parent depth + 1, default maximum 2. Immutable lineage and server checks prohibit cycles. Only server-validated DTOs are persisted; provider text never selects columns.

## Structured BrandProfile

Fields: identity, positioning, audience, toneOfVoice, colors, typography, visualLanguage, photographyStyle, compositionRules, messagingRules, approvedClaims, forbiddenClaims, positiveExamples, negativeExamples. Unknown facts are null/empty, exposed as gaps. Claims need source references and human confirmation. Agents cannot mutate the snapshot. A new brand revision invalidates downstream approval. Existing Zuri-Go brand/logo files remain canonical for the product itself.

## Structured creative brief

Fields: campaignId, brandProfileId, objective, product, offer, audience, insight, message, proofPoints, channel, format, aspectRatio, CTA, tone, visualDirection, mandatoryElements, forbiddenElements, references, dueDate. API DTOs map these to the existing snake_case convention at one boundary and additionally require project_id. campaign_id may be null. Required nonblank text: objective/product/audience/message/channel/format/cta. Other unknown text is null, arrays explicit; unsupported claims stay blocked by QA.

Maximum JSON 64 KiB, text fields 4,000 characters, arrays 50 entries. Reject unknown fields. UUIDs must be valid; due_date is null or an actual YYYY-MM-DD date. aspect_ratio is a positive width:height supported by selected capability. Source refs are bounded data, never fetch instructions.

## Asset storage and retention

No image/video binaries in PostgreSQL. Store metadata and server-generated opaque object keys; validate MIME/dimensions/checksum. Downloads pass viewer authorization and never expose filesystem paths. An optional local store is private and outside static/package paths. No new object-store dependency in C; absent provider/store yields visual prompt only, never a fake image preview.

No destructive retention operation is introduced. Metadata and private assets need operator backup coverage. Secrets and byte stores remain excluded from Git, deployment and public exports. Existing snapshot/export paths do not gain these tables automatically.

## Concrete first-slice mapping

The SQL migration is authoritative for physical column names. Brand snapshots have immutable UUIDs and input hashes; Brief has the per-Project revision counter. Human PIC is the existing Project owner, read through a join. Stage assignments use visual_runs, with no task mutation or extra Task table. visual_receipts stores action idempotency keys, input hashes and responses; visual_public_outputs stores only human-approved copy/prompt plus the approval hash, never the source context. Its runtime update is limited to active=true to active=false retraction; payload and approval references cannot be changed or reactivated. Project, job and run state are mutable; briefs, brands, artifacts, provider attempts, reviews, decisions and receipts are append-only for the runtime role.

Only local loopback text generation is executable. Provider submission references, binary stores, variant tables and learning tables are not fabricated. ProviderRun links job → run → brief for provenance. CreativeReview links the exact BUNDLE/hash, while the matching QA artifact and role run persist separately. Asset provenance links asset → artifact → run → actor; its checksum is SHA-256 of downloadable UTF-8 text. Its dimensions/duration are null. Artifact approval uses a separate canonical JSON hash.

## R3 approved approval-chain write boundary — 2026-10-03

Migration 010 adds the following trust state without rewriting existing values:

| Table / field | Authority and transition |
|---|---|
| `visual_artifacts.canonical_hash` | `GENERATED ALWAYS` SHA-256 of the stored `jsonb` payload via `pgcrypto`; every new artifact receives a database-derived value, including INSERTs by the runtime role. Legacy `content_hash` remains unchanged and is not an approval authority. API artifact DTOs expose `canonical_hash` as `content_hash` for the existing contract. |
| `visual_reviews.assessment` | The validated human category inputs accepted by `visual_record_review(business_id, project_id, artifact_id, assessment)`. The function re-reads the current revision's BUNDLE, Brief, Brand and stage outputs under the Project lock and derives persisted findings/status itself. It does not accept caller `result`, `status`, `blockingIssues` or a pass flag. |
| `visual_reviews.validated` / `validated_pass` | Set by the definer function only after deriving all blocking rules; `validated_pass` is true only when all eight required assessments pass, required COPY/ART_DIRECTION output exists, claims are supported, forbidden terms are absent, and any nonempty approved Brand claims have bounded source references. Existing rows default false and require re-review; their result and history remain intact. |
| `visual_public_outputs.trusted_publication` | Set true only by `visual_finalize_approval`; existing rows default false and remain visible to Members/operators as history, but are hidden from Guest reads until a trusted republication. New publication rows are keyed by their decision so legacy projections remain preserved. |

`visual_record_review(business_id, project_id, artifact_id, assessment)` and `visual_finalize_approval(business_id, project_id, artifact_id, expected_row_version, artifact_hash, qa_revision, decision, reason)` are SECURITY DEFINER entry points with a fixed safe search path and schema-qualified objects. They derive Business, viewer kind, and Member identity from the existing resolved transaction settings. Direct runtime INSERT into `visual_reviews`, `visual_decisions`, and `visual_public_outputs` is revoked; PUBLIC EXECUTE on the functions is revoked and EXECUTE is granted only to `zuri_go_app`. The migrator reapplies these function/table grants after its general table grants on every invocation.

Finalization takes the Project row lock shared with review, then validates the current owner/operator, current and frozen audience, `HUMAN_REVIEW` stage, revision/current Brief/input hash, canonical BUNDLE hash and payload against persisted same-revision stage outputs, and the latest `validated` review for that BUNDLE. `approve` additionally requires `validated_pass=true`. It derives actor fields from the viewer settings, inserts the decision, advances the stage, and—only for a Project that was frozen public and remains public—creates the minimal `{copy, visual_prompt, content_hash, deliverable}` projection with the canonical hash and `trusted_publication=true` in the same transaction. The Guest RLS read policy requires both `active` and `trusted_publication`; the existing one-way active-row retraction remains unchanged.

This boundary trusts the current `zuri_go.business_id`, `viewer_kind`, and `viewer_member` settings established by the API's authenticated transaction. It does not protect a stolen runtime credential that can replace those settings. Migration 010 is additive; source history remains append-only and no legacy approval or output is promoted into the new trusted state automatically.
