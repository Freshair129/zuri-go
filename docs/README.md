# Zuri-Go documentation map

The structure follows the standards in [governance/standards/](governance/standards/) — chiefly [STD-003](governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md): an artifact has one canonical location, and its relationships live in metadata and generated views rather than in folder nesting, so ownership can move without moving files. Artifact types and ownership rules are in [STD-001](governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md); identifiers and relations are in [STD-002](governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md).

**Conformance: phase 1.** Layout, identifiers, ownership metadata and the registry are in place. Requirements are not yet decomposed into FR / NFR / AC / TC files, and no validation or view-generation tooling exists yet. The decisions behind this are in [ADR-001](governance/decisions.md); the remaining work is in [PLAN-001](governance/plans/PLAN-001-document-standard-adoption.md).

**Delivery status.** FEAT-001 to FEAT-009 are deployed to production — each `feature.md` cites the evidence under “Delivery evidence” — but none is `live` in the sense of [STD-001 R7](governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md), which requires FR / AC / TC files first, so they are recorded as `implemented`. FEAT-010 and FEAT-011 are `implemented` and deployed: approved on 2026-10-01 with [ADR-002, ADR-003](architecture/decisions.md) and [ADR-004](architecture/decisions.md), and released to production the same day as application 0.5.0 on PostgreSQL schema 7 ([PLAN-002](governance/plans/PLAN-002-task-and-meeting-domains.md); [verification record](releases/0.5.0/verification.md)). The owner reported the hosted Member and Business-admin checks passed on 2026-10-01; the agent did not observe them. The remaining production browser and write-flow checks are named in the release record. FEAT-012 (meeting intake, DOM-MTG) was declared on 2026-10-01 from the FEAT-004 split (PLAN-002 WI-12); its requirements were approved the same day, and it is `building` because real audio, transcription and model inference are not yet verified.

**FEAT-014 delivery.** Phase A/B is approved. The local/manual Phase C workflow and minimum-D registry/dispatcher passed the bounded R3 VerifyGate and Sol L2 review, and PR #1 is merged. The authorized production rollout on 2026-10-04 is recorded under [release 0.5.1](releases/0.5.1/verification.md); application package version remains 0.5.1. Production Guest reads and same-origin Guest write denial were verified. On 2026-10-05, a scoped Business-admin check saved one generic Creative Brief under `PRJ-0001`; the record remained at Research revision 1 after reload. Downstream stages, non-admin Member behavior, cross-member access and narrow-screen production acceptance remain unverified (release record). The pre-migration backup restore drill passed in an isolated PostgreSQL 18 container. Hosted execution and real providers remain unqualified; Variants (Phase E) and performance learning (Phase F) remain deferred.

## Reading order

1. [Root README](../README.md) — commands, layout, database and credential custody
2. [AGENTS.md](../AGENTS.md) — working rules for this repository
3. [Architecture index](architecture/README.md) — which contract wins when documents disagree (later amendments supersede earlier text)
4. [PRD-001](product/PRD-001-zuri-go.md) — surfaces and product-wide rules, then the feature folder you are changing (`features/FEAT-nnn-…/feature.md`)
5. [RB-001](operations/RB-001-runbook.md) — operating, deploying and rolling back

## Commercial pipeline source of truth

[ARCH-005 — Zuri-Go × Zuri-AI Commercial pipeline](architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md) is the entry point for the three source chapters and four diagram views (21 detail flows + 2 overviews). It records the owner-stated Marketing/Commercial edition direction while keeping process/integration details draft. The external system/context map lives in [registry/relations.yaml](../registry/relations.yaml). The former [history folder](history/zuri-ai-line-sales-flow-2026-10-03/README.md) holds evidence and the move receipt.

## Layout

| Path | Holds | Standard |
|---|---|---|
| `product/` | BRD-001 and PRD-001 (product level) | STD-003 R1 |
| `domains/<slug>/` | one folder per domain: purpose, language, owned data, rules, and a view of its features | STD-003 R2 |
| `features/<FEAT-ID>-<slug>/` | every feature: `feature.md` plus its specification, design and verification documents | STD-003 R3 |
| `architecture/` | ARCH-* documents and the authority-order index | STD-003 R1 |
| `services/SRV-<nnn>-<slug>/` | one `SERVICE.md` per deployable | STD-003 R4 |
| `operations/` | runbooks RB-* | STD-003 R1 |
| `governance/` | standards, procedures, decisions and plans | STD-003 R1 |
| `templates/` | copy-and-fill templates for new artifacts; they use placeholder IDs such as `FEAT-<nnn>` and are not artifacts themselves | STD-003 R7 |
| `../registry/` | domain and service registers, crosswalk from pre-standard IDs | STD-003 R5 |
| `history/` · `migrations/` · `releases/` | evidence, see below | not artifacts (STD-001 R1) |

<!-- BEGIN GENERATED: doc-map -->
_Maintained by hand and checked by `npm run docs:views` (PLAN-001 WI-11): the tables below are views of `feature.md`, `SERVICE.md` and [registry/domains.yaml](../registry/domains.yaml), which remain the only places these values are written._

## Features

| ID | Feature | Owner | Delivery | Folder |
|---|---|---|---|---|
| [FEAT-001](features/FEAT-001-business-overview/feature.md) | Business Overview | DOM-BIZ | implemented | `features/FEAT-001-business-overview/` |
| [FEAT-002](features/FEAT-002-campaign-mission-control/feature.md) | Campaign Mission Control | DOM-CAM | implemented | `features/FEAT-002-campaign-mission-control/` |
| [FEAT-003](features/FEAT-003-metrics-map/feature.md) | Marketing Metrics Map and Graph View | DOM-MET | implemented | `features/FEAT-003-metrics-map/` |
| [FEAT-004](features/FEAT-004-meeting-task-manager/feature.md) | Meeting & Task Manager | DOM-TSK | implemented | `features/FEAT-004-meeting-task-manager/` |
| [FEAT-005](features/FEAT-005-guest-access/feature.md) | Guest read-only access and task evidence | DOM-IAM | implemented | `features/FEAT-005-guest-access/` |
| [FEAT-006](features/FEAT-006-member-identity/feature.md) | Member identity (PID and individual sign-in) | DOM-IAM | implemented | `features/FEAT-006-member-identity/` |
| [FEAT-007](features/FEAT-007-single-code-login/feature.md) | Single-code login | DOM-IAM | implemented | `features/FEAT-007-single-code-login/` |
| [FEAT-008](features/FEAT-008-unified-site/feature.md) | Unified site | DOM-PLT | implemented | `features/FEAT-008-unified-site/` |
| [FEAT-009](features/FEAT-009-logo-placement/feature.md) | Zuri-Go logo placement | DOM-BRN | implemented | `features/FEAT-009-logo-placement/` |
| [FEAT-010](features/FEAT-010-task-manager/feature.md) | Task Manager for every department | DOM-TSK | implemented | `features/FEAT-010-task-manager/` |
| [FEAT-011](features/FEAT-011-visibility-and-confidential-meetings/feature.md) | Visibility, teams and confidential meetings | DOM-IAM | implemented | `features/FEAT-011-visibility-and-confidential-meetings/` |
| [FEAT-012](features/FEAT-012-meeting-intake/feature.md) | Meeting intake | DOM-MTG | building | `features/FEAT-012-meeting-intake/` |
| [FEAT-013](features/FEAT-013-emar-local-access/feature.md) | Emar local service access from Zuri-Go | DOM-PLT | implemented | `features/FEAT-013-emar-local-access/` |
| [FEAT-014](features/FEAT-014-visual-marketing-team/feature.md) | Visual Marketing Team | DOM-VIS | implemented | `features/FEAT-014-visual-marketing-team/` |

## Domains

| Code | Domain | Subdomain / role | Features |
|---|---|---|---|
| [DOM-BIZ](domains/business/README.md) | Business workspace | supporting / foundation | FEAT-001 |
| [DOM-CAM](domains/campaign/README.md) | Campaign & content | core / business | FEAT-002 |
| [DOM-MET](domains/metrics/README.md) | Metrics & goals | core / business | FEAT-003 |
| [DOM-TSK](domains/tasks/README.md) | Tasks & projects | supporting / business | FEAT-004, FEAT-010 |
| [DOM-MTG](domains/meetings/README.md) | Meetings | supporting / business | FEAT-012 |
| [DOM-IAM](domains/identity-access/README.md) | Identity & access | generic / foundation | FEAT-005, FEAT-006, FEAT-007, FEAT-011 |
| [DOM-PLT](domains/platform/README.md) | Platform & delivery | generic / platform | FEAT-008, FEAT-013 |
| [DOM-BRN](domains/brand/README.md) | Brand | supporting / business | FEAT-009 |
| [DOM-VIS](domains/visual-marketing/README.md) | Visual Marketing | core / business | FEAT-014 |

DOM-WRK (Work (tasks & meetings)) is superseded by DOM-TSK and DOM-MTG — [ADR-002](architecture/decisions.md), approved 2026-10-01; [its README](domains/work/README.md) stays so the code is never reused.

## Services

| ID | Service | Deploy unit |
|---|---|---|
| [SRV-001](services/SRV-001-hosted/SERVICE.md) | Hosted site and API (Vercel + Neon PostgreSQL) | Vercel project `zuri-metrics-map` — package `build/vercel`, binding `scripts/deploy/project.json` |
| [SRV-002](services/SRV-002-local/SERVICE.md) | Local operator runtime (Node server + Docker PostgreSQL) | `apps/api/server.mjs` on `127.0.0.1:4319` and Docker container `zuri-go-postgres`, started by `scripts/local/start.ps1` (`npm start`) |
| [SRV-003](services/SRV-003-emar-local/SERVICE.md) | Emar standalone local email execution service | `http://localhost:8788/` — Emar 0.3.0-beta.0, started separately |
<!-- END GENERATED -->

## Evidence (not artifacts)

- `history/` — per-review evidence: screenshots, JSON checks and version diffs; four reviews (`zuri-go-review`, `zuri-go-cloud-review`, `zuri-go-guest-review`, `zuri-go-member-review`) also keep a verification report. `task-domain-design-2026-10-01/` holds the two independent design proposals and their comparison behind ADR-002 to ADR-004.
- `migrations/` — the project-extraction plan and its provenance. `scripts/site/verify_extraction.py` reads and writes here and `scripts/metrics/verify_metrics_map_static.py` writes here, so the folder stays in place.
- `releases/<version>/` — deployment records for each release; the latest is [0.5.1](releases/0.5.1/verification.md), including the FEAT-014 production rollout (2026-10-04).

Evidence is cited but never traced to. Paths inside it describe where files lived when they were verified; the restructure changed only the link targets that pointed at moved documents.

## Finding a document by its old name

[registry/crosswalk/ZGO.csv](../registry/crosswalk/ZGO.csv) maps every pre-standard document ID and path to its new ID and location.

## Notes on moved documents

- File paths, repository names and infrastructure statements inside older feature documents describe their original version (the former `D:/zuri-brand-kit` checkout). Current build, start and deploy commands are in the [root README](../README.md).
- The 0.4.1 extraction changed source layout and operational paths only; it did not reinterpret KPI formulas, targets, RACI, MoSCoW, Guest policy or Member identity.
- Approved text was not edited to follow the rename: a moved document may still name a sibling by its former file name (for example `campaign-mission-control-verification.md`). The Documents table of each `feature.md` and the crosswalk map old names to current files.

## Visual Marketing

[FEAT-014](features/FEAT-014-visual-marketing-team/feature.md) and its Phase A/B architecture package are approved. PR #1 merged the manual C workflow and minimum-D registry/dispatcher after the bounded R3 VerifyGate and Sol L2 review passed. The production rollout and 2026-10-05 acceptance evidence are recorded in [release 0.5.1](releases/0.5.1/verification.md). Visual execution remains local/manual; hosted providers and execution are not enabled. A generic Brief save and UI readback after reload passed; downstream manual stages, non-admin Member behavior, cross-member access and narrow-screen production acceptance remain unverified. The backup restore drill passed (release record). Start with [ARCH-004](architecture/ARCH-004-visual-marketing.md), the pinned [upstream analysis](architecture/visual-marketing/upstream-analysis.md), and [FEAT-014 verification](features/FEAT-014-visual-marketing-team/verification.md).
