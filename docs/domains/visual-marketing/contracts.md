# DOM-VIS — proposed API and job contracts

Status proposed, 2026-10-02. No routes currently implemented. Transport, same-origin authorization and error envelope inherit [API-001](../platform/contracts.md). Never create a second API surface.

### API-023 — Visual Marketing production API
Relations: relates_to: FEAT-014, SDD-014, API-001, API-005, API-010, API-017; decided_by: ADR-006
Owner: DOM-VIS

Prefix: `/api/zuri-go/v1/businesses/{b}/visual-marketing`. b must be the server-configured Business. All inputs/outputs are bounded JSON. Every mutation is Member (hosted) or trusted operator (local); Guest writes return 401. Reads resolve viewer and apply forced RLS, with missing/unreadable records both 404. Public approved output is a separate minimal projection; lists never disclose private counts.

| Method / suffix | Request | Response / meaning |
|---|---|---|
| GET /team | none | 200 {agents}; definitions and only readable run summaries, no provider settings/secrets |
| POST /brand-profiles | project_id, idempotency_key, profile, source_refs, human confirmation | 200 immutable confirmed BrandProfile revision |
| POST /briefs | project_id, idempotency_key, structured snake_case brief fields | 200 BriefDto with id/revision/input_hash |
| GET /briefs/{id} | none | 200 BriefDto for Member/operator with Project access |
| POST /projects | project_id, brief_id, idempotency_key | 200 creative extension of existing Project; does not create a Project master |
| GET /projects | cursor, limit <=50 | 200 {projects,next_cursor}; viewer-filtered board projection |
| GET /projects/{id} | id is existing project UUID | 200 workflow/stage/cards/readable artifacts; no private DTO to Guest |
| POST /projects/{id}/run | row_version, idempotency_key, input_hash, bounded provider authorization | 202 {job_id,run_id,status,status_url}; no long provider wait |
| POST /projects/{id}/stages | row_version, idempotency_key, stage, input_hash, manual structured output | 200 validated persisted manual stage output; only legal next stage |
| POST /projects/{id}/strategy-decision | row_version, input_hash, decision, reason, idempotency_key | 200 decision; same human-authority rule as final approval |
| GET /runs/{id} | none | 200 role/stage/status, safe metadata, artifact IDs |
| GET /jobs/{id} | none | 200 job state/attempt/last safe error; retry_after_ms |
| POST /jobs/{id}/cancel | row_version, idempotency_key | 200 cancellation state, including cancel_unknown if necessary |
| POST /jobs/{id}/retry | row_version, idempotency_key, renewed grant if expired | 202 safe retry; 409 when unresolved ambiguous submission |
| POST /artifacts/{id}/review | row_version, idempotency_key | 202 QA job; result always binds the artifact hash |
| POST /artifacts/{id}/approve | row_version, artifact_hash, qa_revision, decision=approve/request_changes/reject, reason, idempotency_key | 200 immutable decision and resulting workflow state |
| GET /assets/{id} | none | 200 protected metadata; bytes available only via viewer-gated download |
| GET /assets/{id}/download | none | authorized bytes with safe Content-Type/Disposition; no path or raw store credentials |
| POST /artifacts/{id}/variants | E only: row_version, hypothesis, changed_dimensions, idempotency_key | C: 409 FEATURE_UNAVAILABLE; E: 202 child generation job, unapproved |

All create/action idempotency keys are UUID, unique by Business, actor, operation and key; persist canonical payload hash. Same key/same payload returns original result, different payload 409 IDEMPOTENCY_CONFLICT. Version/hash conflicts return 409 STALE. API derives actor, timestamps, stage, run lineage and provider eligibility; caller supplied authority fields are rejected. Body validation 422 FIELD_INVALID/FIELD_UNKNOWN; permission denied 403; missing provider 503 PROVIDER_UNAVAILABLE; hosted missing executor 503 EXECUTOR_UNAVAILABLE with no runnable job. No raw provider error/body or connection string in responses.

DTO field/type/size rules are canonical in [data-model.md](../../architecture/visual-marketing/data-model.md). The production extension reads Project through API-017 semantics; only owner Member or local operator approves, never arbitrary visible Member or agent. Visual generation permission permits only exact inputs/providers within budget and expiry; it is not creative, publish or paid-media approval. Frontend may submit a requested grant but server validates it and binds the current actor; a client boolean alone is insufficient authorization.

### EVT-002 — Visual Marketing internal generation job
Relations: relates_to: FEAT-014, SDD-014, API-023; decided_by: ADR-006
Owner: DOM-VIS

Internal PostgreSQL job contract, not a public message bus. Envelope version 1: {job_id, business_id, project_id, run_id, root_run_id, parent_run_id, delegation_depth, stage, input_revision, input_hash, initiating_actor_kind, initiating_member_id, authorization_ref, idempotency_key, created_at}. No secret, signed session cookie, raw prompt or arbitrary tool endpoint.

Executor claim returns lease_token, lease_expires_at, attempt. Claim/reclaim and completion use atomic compare-and-set and Business/project identity checks. Revalidate actor/access before provider call and commit. Network work is outside transactions. Provider submission keys/refs are persisted for reconciliation. Output + attempt metadata + next stage are atomic; at-least-once delivery never implies exactly-once external spend. Retry/cancel semantics are in SDD-014. A provider timeout after submission is submission_unknown, not proof of no side effect.

Local implementation is a bounded loop in SRV-002, started/stopped with the existing server; no new public worker endpoint. Hosted execution remains disabled pending durable executor authorization and design. Queue adoption becomes necessary when durable hosted execution or concurrency/throughput exceeds the measured local single-loop capacity; document the requirement before adding infrastructure.
