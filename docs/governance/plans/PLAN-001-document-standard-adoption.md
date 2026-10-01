---
id: PLAN-001
title: Document standard adoption
status: proposed
owner: governance
relations:
  relates_to: [STD-001, STD-002, STD-003]
---

# PLAN-001 — Document standard adoption

Work items for bringing the Zuri-Go documents under [STD-001](../standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md), [STD-002](../standards/STD-002-IDENTITY-AND-TRACEABILITY.md) and [STD-003](../standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md). The decisions behind the scope are in [ADR-001](../decisions.md). Phase 1 is done; everything from WI-06 is open and needs the owner's review before it changes what an approved specification says.

## Phase 1 — structure, identity, ownership (done, 2026-10-01)

| ID | Work item | Status | Note |
|---|---|---|---|
| WI-01 | Layout per STD-003 R1: `features/`, `architecture/`, `operations/`, `domains/`, `services/`, `templates/` | done | 29 documents moved with `git mv`; link targets rewritten |
| WI-02 | Registry: `registry/domains.yaml`, `registry/services.yaml` | done | Domain classification is proposed (ADR-001 D4) |
| WI-03 | Crosswalk from pre-standard IDs and paths | done | `registry/crosswalk/ZGO.csv` |
| WI-04 | Identifiers and ownership metadata on FEAT, DOM, SRV, ARCH, SDD and RB documents | done | STD-002 R5 frontmatter; original descriptive metadata kept |
| WI-05 | Templates and product-level drafts | done | `docs/templates/`; BRD-001 (draft: success measures not recorded, stakeholders only as named in existing documents) and PRD-001 |

## Phase 2 — requirements, design, contracts, tooling (open)

| ID | Work item | Standard | Suggested order / note |
|---|---|---|---|
| WI-06 | Decompose each feature's requirements into FR / NFR / AC files (and parts when cross-domain); old labels (`MT-01`–`MT-29`, `AC-01`–`AC-18`) go to `legacy:` | STD-001 R5, STD-003 R3 | Written 2026-10-01 as `proposed` for every feature (PLAN-003 S1; FEAT-004 by the WI-12 split, FEAT-010 to FEAT-012 earlier); owner review per feature (PLAN-003 G4) |
| WI-07 | SDD with an `## Interfaces` section for features that persist data or call outside systems | STD-001 R5, STD-005 R2 | SDD-004 exists but has no `## Interfaces` |
| WI-08 | Bind TC headings in each `verification.md` to the tests that prove them | STD-001 R7 | Tests: `apps/api/test/`, `tests/campaign/`, `apps/web/src/content/meeting/model.test.mjs`. Three existing `verification.md` files are pre-standard reports (ADR-001 D5); a feature can become `live` only after this item |
| WI-09 | Declare API- / EVT- contracts (`/api/zuri-go/v1`, the FUNG connector) | STD-001 R1 | Written 2026-10-01 as `proposed`: API-001…022 and EVT-001 in `docs/domains/*/contracts.md` (PLAN-003 S3) |
| WI-10 | Promote the rules now written in AGENTS.md and the specs to BR- / SEC- / NFR- artifacts; record system ADRs in `architecture/decisions.md` | STD-001 R1, STD-003 R1 | Written 2026-10-01 as `proposed`: BR-001…021 in `docs/domains/*/rules.md` and SEC-001…020 (PLAN-003 S7) |
| WI-11 | Tooling: `next-id`, `validate-docs`, `generate-views` | STD-002 R8, STD-003 R2 | Done 2026-10-01: `scripts/docs/` next-id, validate-docs, generate-views (`--check`); run by `npm test` (PLAN-003 S8) |
| WI-12 | `@trace` annotations at code boundaries | STD-002 R6 | After WI-06 gives requirements to point at |
| WI-13 | `registry/relations.yaml`: external systems (FUNG, Vercel, Neon, Docker PostgreSQL) and the context map between domains | STD-003 R5 | Needs API-/EVT- contracts from WI-09 for evidence |
| WI-14 | Ownership review and candidate splits (see below) | STD-001 R3, R4 | Owner decision |
| WI-15 | Resolve the gaps in the imported standards (ADR-001 D8) and decide whether to approve STD-001…005 | STD-001 R6 | Done 2026-10-01: the owner approved STD-001…005 and ADR-001 (PLAN-003 G5); the D8 gaps stay recorded |
| WI-16 | Decide what to do with the ten links that were already broken before Phase 1 | — | Done 2026-10-01: the ten links are marked as historical where they appear (the files were not carried into this repository) |

### WI-14 — ownership questions

1. **Task evidence attachments** are specified inside FEAT-005 (Guest access) but are task data (DOM-WRK; DOM-TSK under ADR-002): split into their own feature? *Proposed answer: the data belongs to DOM-TSK, and its visibility follows its task ([ADR-002](../../architecture/decisions.md), [ADR-004](../../architecture/decisions.md)).*
2. **Members registry**: the registry screens belong to FEAT-004, the data (`members`, PID) to DOM-IAM. Is FEAT-004 a cross-domain feature with a DOM-IAM part?
3. **Business Overview** bundles three surfaces — overview, content calendar, goals. The latter two may be features of DOM-CAM and DOM-MET.
4. **Placement of shared tables**: `channel_accounts` and `change_events` are assigned to DOM-BIZ; `members` to DOM-IAM.
5. **Metrics Map** sits in DOM-MET with the metric vocabulary; it could be a separate knowledge domain.
6. **DOM-BRN** has one feature today; merge into another domain or keep?
7. **Campaign Workboard tasks**: saving a campaign in FEAT-002 writes its Workboard tasks as `tasks` rows (`source_kind` `campaign-legacy`), which is task data. Declare FEAT-002 cross-domain, or move the Workboard into the task domain? *Proposed answer: move it — the Workboard becomes a view of the task records ([ADR-003](../../architecture/decisions.md), [PLAN-002](PLAN-002-task-and-meeting-domains.md)).*
8. **RB-002** records the one-off creation of the GitHub repository rather than a procedure. Keep it as a runbook and add the repository procedures, or move it to `history/` as evidence?

## Acceptance for closing the plan

Every FEAT has FR / AC / TC files and, where STD-001 R5 requires it, an SDD and contracts; the validator and view generator run in CI and pass; the imported-standard gaps are resolved; statuses have been reviewed by the owner.
