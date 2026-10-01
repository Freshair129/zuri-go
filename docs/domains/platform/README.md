---
id: DOM-PLT
title: Platform & delivery
status: proposed
---

# DOM-PLT — Platform & delivery

One site, one origin, one deployment: navigation across the surfaces, the Data App shell, build and packaging, and the two runtimes.

## Language
- Site
- Origin
- Data App (protected runtime, stable app ID)
- Deployment package (allowlist)
- Hosted runtime
- Local operator runtime

## Owned data
- No PostgreSQL tables. Build and release tooling: `scripts/`; Vercel binding: `scripts/deploy/project.json`.

## Business rules
- UI and API share one origin; local serves `build/site` and production deploys `build/vercel` ([architecture index](../../architecture/README.md)).
- The protected Data App runtime, its integrity manifests and the stable app ID are preserved; generated output is rebuilt, never hand-edited ([AGENTS.md](../../../AGENTS.md)).
- A deployment is not a database migration or rollback authorization ([AGENTS.md](../../../AGENTS.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Declared on 2026-10-01, all `proposed`: API-001 in [contracts.md](contracts.md) (PLAN-001 WI-09); business rules BR-013…BR-017 in [rules.md](rules.md) (PLAN-001 WI-10). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand; `npm run docs:views` (scripts/docs/generate_views.py --check, PLAN-001 WI-11) reports any drift from `feature.md` and the registry._

**Classification** — subdomain `generic` · role `platform`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-008](../../features/FEAT-008-unified-site/feature.md) | Unified site | implemented |

**Participating cross-domain features** — none.

**Requirements of [FEAT-008](../../features/FEAT-008-unified-site/feature.md)** — written from the approved specification on 2026-10-01 (PLAN-001 WI-06), `status: proposed` until the owner approves them (PLAN-003 G4); delivery as in the [feature’s index](../../features/FEAT-008-unified-site/feature.md#requirement-index). Requirement files sit in the feature’s `requirements/` folder.

| Requirement | Title | Delivery |
|---|---|---|
| [FR-008-001](../../features/FEAT-008-unified-site/requirements/FR-008-001-site-menu.md) | One site menu on every section | implemented |
| [FR-008-002](../../features/FEAT-008-unified-site/requirements/FR-008-002-routes-deep-links.md) | Four routes and deep links that survive a reload | implemented |
| [FR-008-003](../../features/FEAT-008-unified-site/requirements/FR-008-003-app-identity-tabs.md) | The existing app identity keeps Marketing and the Task Manager working | implemented |
| [FR-008-004](../../features/FEAT-008-unified-site/requirements/FR-008-004-saved-data-and-backup.md) | Saved work survives navigation and reload; backup and restore stay usable | implemented |
| [FR-008-005](../../features/FEAT-008-unified-site/requirements/FR-008-005-guide-and-graph-retained.md) | The merge leaves the guide and the Graph View unchanged | implemented |
| [FR-008-006](../../features/FEAT-008-unified-site/requirements/FR-008-006-print-and-reviewed-metrics.md) | The site menu is hidden in print and no reviewed metric changes | implemented |
| [FR-008-007](../../features/FEAT-008-unified-site/requirements/FR-008-007-deployment-package.md) | One verified folder, one deployment, only allowlisted files | implemented |
| [FR-008-008](../../features/FEAT-008-unified-site/requirements/FR-008-008-protected-runtime.md) | The protected runtime and its manifest stay intact | implemented |
| [FR-008-009](../../features/FEAT-008-unified-site/requirements/FR-008-009-release-and-reporting.md) | Verify, deploy and report only what was checked | implemented |
| [NFR-008-001](../../features/FEAT-008-unified-site/requirements/NFR-008-001-menu-does-not-obscure.md) | The site menu never covers content | implemented |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
