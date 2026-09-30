---
id: DOM-PLT
title: Platform & delivery
status: proposed
---

# DOM-PLT — Platform & delivery

One site, one origin, one deployment: navigation across the surfaces, the Data App shell, build and packaging, and the two runtimes.

Classification ([registry/domains.yaml](../../../registry/domains.yaml)): subdomain `generic` · role `platform`.

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
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-008](../../features/FEAT-008-unified-site/feature.md) | Unified site | live |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
