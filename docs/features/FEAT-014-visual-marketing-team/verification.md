# FEAT-014 — verification and implementation gate

Proposal only. No application behavior, migration or first-PR Definition of Done is claimed complete. Application 0.5.1 → 0.5.1; source migration ceiling 007 unchanged (live database not queried). Feature absent → proposed 0.1.0.

## Planned test bindings

Files below are planned under apps/api/test/visual-marketing/; studio-ui also needs approved browser checks. Every AC becomes an AC-named test. Allocate TC IDs and bind them only when real test files exist: the current validator rejects nonexistent Test paths. This remains an implementation-entry deliverable, not fabricated test evidence or full STD-001 R7 completion.

| Requirement | Planned test file | Phase | Status |
|---|---|---|---|
| FR-014-001 | `structured-brief.test.mjs` | C/D | NOT RUN |
| FR-014-002 | `agent-registry.test.mjs` | C/D | NOT RUN |
| FR-014-003 | `bounded-workflow.test.mjs` | C/D | NOT RUN |
| FR-014-004 | `delegation.test.mjs` | C/D | NOT RUN |
| FR-014-005 | `providers.test.mjs` | C/D | NOT RUN |
| FR-014-006 | `durable-jobs.test.mjs` | C/D | NOT RUN |
| FR-014-007 | `creative-qa.test.mjs` | C/D | NOT RUN |
| FR-014-008 | `human-approval.test.mjs` | C/D | NOT RUN |
| FR-014-009 | `visibility.test.mjs` | C/D | NOT RUN |
| FR-014-010 | `asset-metadata.test.mjs` | C/D | NOT RUN |
| FR-014-011 | `studio-ui.test.mjs` | C/D | NOT RUN |
| FR-014-012 | `variants-contract.test.mjs` | E | NOT RUN |
| FR-014-013 | `performance-contract.test.mjs` | F | NOT RUN |

## Verification after approval

1. Lock SDD signatures, create real AC tests and allocate TC bindings before implementation packets. Follow STD-005 test/schema/service/contract/UI ordering, boundary @trace tags and independent review. No local-model security delegation.
2. Test RLS with isolated QA Businesses and restricted runtime role in a separately approved local QA database. Never reset user data.
3. Run focused Node suites, npm run build and npm test when documented local PostgreSQL/server prerequisites exist. Preserve existing tests.
4. Browser-check the complete authored flow, polling, revision, approval, failure states and mobile overflow; preserve shell and app identity.
5. Real LLM/image quality is separate from fake adapter tests. Missing provider/executor remains unavailable.
6. Hosted auth, provider integration and production checks remain NOT RUN. No deploy or cloud migration.

## Approval gate

Phase A/B documents are proposed for owner review. C–F remain pending; this is not the completed implementation PR. Exact documentation checks and audit limitations are recorded in [provenance](../../architecture/visual-marketing/upstream-provenance.md).
