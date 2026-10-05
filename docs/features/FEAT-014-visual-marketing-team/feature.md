---
id: FEAT-014
title: Visual Marketing Team
type: domain-feature
owner: DOM-VIS
runtime: SRV-002
delivery: implemented
status: approved
version: 0.1.0
relations:
  depends_on: [FEAT-007, FEAT-010, FEAT-011, API-005, API-010, API-017]
  decided_by: [ADR-006, ADR-008]
---
# FEAT-014 — Visual Marketing Team

A Member creates a structured brief inside Zuri-Go, follows research, concepts, copy and art direction, reviews evidence and QA findings, and makes an internal creative decision. Zuri-Go remains the host and source of truth.

**Current access amendment — [ADR-008](../../architecture/decisions.md), approved 2026-10-05:** Guests read every non-secret Business record, including Visual briefs, artifacts, reviews and decisions, but cannot mutate or approve them. Every active Member has equal CRUD and internal approval rights regardless of Project owner, audience, team or RACI metadata. Internal approval does not authorize provider egress, external spend, publication or deployment; those gates remain separate. This policy is implemented in local source, but final-candidate database verification is NOT_RUN after the command runner rejected bootstrap; earlier phase and release evidence below remains historical.

**Approval:** Owner approved Phase A/B in this chat on 2026-10-02. C-3, HIGH risk. C/D implementation may proceed; no production deployment or cloud migration authorization.

## Scope and phase gates

| Phase | Deliverable | Exit criterion |
|---|---|---|
| A | Pinned upstream inventory and licenses | Every reuse decision names source paths and destination |
| B | Architecture, domain, API/jobs, design, data amendment, FR/AC | Owner approval and locked interfaces before implementation packets |
| C | One persisted brief-to-human-review flow and Visual Studio UI | Tests, build and browser evidence; no-provider mode labelled manual |
| D | Eight registered roles and controlled dispatcher | Registry, permissions, scoped context and depth tests pass |
| E | Variants and branches | Child independently passes QA and human review |
| F | Read-only campaign performance and learnings | Measurements, formulas and interpretations remain separate |

The first implementation PR covers C and minimum D registry/dispatcher. E/F contracts are designed here, but their execution is a later increment; unavailable actions are disabled. No publishing, paid activation, new object store, vector database, imported dashboard, Python agent runtime or required external MCP server.

## Current phase status — 2026-10-04

Phase A/B is approved. C and the minimum D registry/dispatcher are implemented. Owner-approved R3 closes the five original L2 findings; a later Sol review exposed RG-R3-001, which the sealed repair `8592f21` addresses by checking current Project audience before recording trusted QA. Independent VerifyGate passed the 12/12 DB regression, full suite (206/206 Node, 15/15 site, 47/47 docs) and build; isolated QA fixtures were removed and its owned server stopped. Final bounded Sol ReviewGate disposition is **PASS_BOUNDED_R3**. Under STD-005 R8 E6, this authorization-sensitive packet was ineligible for the local-model L1 tier and escalated to the Architect's L2 tier; Sol L2 passed. Phase E/F, real providers, hosted execution, user/cloud migration, deployment and production acceptance remain outside this closeout.

## Ownership and peer impact

DOM-VIS owns creative production records. Campaign, Project, Task and Member remain existing entities referenced by UUID. CreativeProject is a one-to-one production extension of projects.id, not a second project master. Users select/create the ordinary Project using the existing UI first. CreativeTask is a stage assignment with an optional existing task_id, not a new Task table. First-slice code reads peer contracts and never writes peer aggregates, so no cross-domain feature parts are needed.

BrandProfile is an immutable, versioned creative-context snapshot. DOM-BRN retains authority over approved product brand files and assets. This feature cannot promote brand assets or redefine product branding. A future shared editable brand master requires a DOM-BRN contract and an ownership decision.

Initial execution is inside long-running local SRV-002. Hosted SRV-001 behavior is designed but disabled until an approved durable executor exists. Local approvals record the trusted operator and are never presented as authenticated Member sign-offs. No detached background work after a Vercel response.

## User experience

Visual Studio sits inside Marketing's authored content. Overview, Creative Briefs, Projects, Agent Team, Creative Board, Assets and Reviews are views of the same production data. Learnings appears only when phase F exists. The board shows Brief, Research, Concept, Copy, Design, Review and Approved; detailed workflow stage remains visible on a card.

Cards show campaign, objective, owner, stage, assigned agent, human PIC, due date, variants and approval state. Artifacts and structured QA findings are directly visible; raw traces belong in optional details. Agent Team shows role, current task, status, last run, provider/model and nullable measured usage/cost. Unknown cost is not zero.

Thai actions: อนุมัติ / ขอแก้ไข / ไม่อนุมัติ / สร้างตัวเลือก. Guest write intent uses existing login. No developer console as the primary experience. Preserve shell, top bar, themes, stable app ID, user layout, reviewed rows, source inspection and approved logo bytes. UI lives in apps/web/src/content/visual-marketing/ with a narrow integration in existing authored content.

## Documents

- [Design and interface lock](design.md)
- [Verification plan](verification.md)
- [Architecture](../../architecture/ARCH-004-visual-marketing.md)
- [Domain and contracts](../../domains/visual-marketing/README.md)
- [Upstream inventory](../../architecture/visual-marketing/upstream-analysis.md)
- [Data model amendment](../../architecture/visual-marketing/data-model.md)

## Requirement index

| ID | Requirement | Delivery |
|---|---|---|
| [FR-014-001](requirements/FR-014-001-structured-brief.md) | Validate and persist a structured brief | implemented |
| [FR-014-002](requirements/FR-014-002-agent-registry.md) | Register independent marketing roles | implemented |
| [FR-014-003](requirements/FR-014-003-bounded-workflow.md) | Execute a finite creative workflow | implemented |
| [FR-014-004](requirements/FR-014-004-delegation.md) | Enforce delegation lineage and scope | implemented |
| [FR-014-005](requirements/FR-014-005-providers.md) | Call replaceable bounded providers | implemented |
| [FR-014-006](requirements/FR-014-006-durable-jobs.md) | Persist and reconcile durable jobs | implemented |
| [FR-014-007](requirements/FR-014-007-creative-qa.md) | Return structured creative findings | implemented |
| [FR-014-008](requirements/FR-014-008-human-approval.md) | Authorize attributable human decisions | declared |
| [FR-014-009](requirements/FR-014-009-visibility.md) | Enforce Business scope on creative records | declared |
| [FR-014-010](requirements/FR-014-010-asset-metadata.md) | Store protected asset metadata | implemented |
| [FR-014-011](requirements/FR-014-011-studio-ui.md) | Show production state inside Marketing | implemented |
| [FR-014-012](requirements/FR-014-012-variants-contract.md) | Keep variants independent of parent approval | declared |
| [FR-014-013](requirements/FR-014-013-performance-contract.md) | Separate measurements from interpretation | declared |

- [NFR-014-001](requirements/NFR-014-001-bounded-execution.md) — Bound request and provider execution

- [NFR-014-002](requirements/NFR-014-002-custody-integrity.md) — Preserve custody and protected product integrity
