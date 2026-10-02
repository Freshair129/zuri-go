# Visual Marketing — proposed amendment to ARCH-002

Canonical physical design detail for SDD-014/ADR-006, proposed 2026-10-02. No migration created or executed. Use the next available migration number after approval and refreshed main; current source ends at 007. No reset, reimport or reinterpretation of existing records.

## Common custody

Every table has business_id, UUID identity (or composite link identity), timestamps and composite Business foreign keys. Mutable records use row_version; outputs/decisions are append-only revisions with hashes. ENABLE/FORCE RLS, Business scope, audience policies and Member/operator write checks apply to every operation. The runtime role has no owner/BYPASSRLS powers. Missing viewer fails closed.

Every brief requires an existing project_id. All creative descendants follow that Project's public/business/team/restricted audience, including jobs, logs, counts, assets and decisions. Intermediate artifacts, prompts, brief context, run details and approval audit additionally require Member/operator access. Guests may read only a minimal approved-output projection of a public project; it does not embed private input context. Related labels must independently pass their own viewer gates.

Destination audience must be a subset of every source audience. If this cannot be proved, linking/reuse is denied. C confines context to the same Project, public-safe Campaign fields and human-confirmed brand snapshots. No shared memory access that bypasses source RLS, and no independent child visibility setting. A later parent audience change must not expose a previously private child; immutable production audience constraints intersect current parent access, and widening requires a new human-reviewed input revision. Narrowing takes effect immediately.

## Physical proposal

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
