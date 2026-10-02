---
id: FEAT-013
title: Emar local service access from Zuri-Go
type: domain-feature
owner: DOM-PLT
runtime: SRV-002
delivery: implemented
status: approved
legacy: []
relations:
  depends_on: [FEAT-008]
  decided_by: []
---

# FEAT-013 — Emar local service access from Zuri-Go

The local Zuri-Go operator can discover and open the standalone Emar email execution service from the Zuri-Go site.

The initial 2026-10-03 local QA found an Emar cross-site navigation rejection. After separate owner approval and the external Emar guard fix, the actual launcher delivered a new tab and loaded the standalone UI with HTTP 200 in disposable Memory QA. See [verification](verification.md#approved-external-emar-fix--2026-10-03) and the [RCA](../../../.brain/rca/FEAT-013-emar-cross-site-navigation.md). Zuri-Go API/database and production runtime remain unverified; approved FEAT-013 scope/version is unchanged.

## Scope
- Register Emar as external local service SRV-003 in the Zuri-Go service catalog.
- Show a separate Emar service launcher only in the canonical local Zuri-Go UI.
- Open Emar on the distinct `localhost` hostname so its browser cookie is not shared with Zuri-Go's `127.0.0.1` host.
- Keep Emar independently started and operated; no authentication or data integration is added.

## Ownership
- Feature owner: [DOM-PLT](../../domains/platform/README.md) — Platform & delivery. Zuri-Go launcher runtime: [SRV-002](../../services/SRV-002-local/SERVICE.md). Destination: [SRV-003](../../services/SRV-003-emar-local/SERVICE.md).

## Requirement index
| ID | Requirement | Delivery |
|---|---|---|
| [FR-013-001](requirements/FR-013-001-emar-local-launch.md) | The local Zuri-Go site launches the separate Emar service | implemented |
| [NFR-013-001](requirements/NFR-013-001-local-service-boundary.md) | The Emar launcher stays local-only and does not exchange session or application data | implemented |

## Documents
- [spec.md](spec.md) — approved v0.1.0 scope and acceptance
- [design.md](design.md) — SDD-013 local service boundary
- [verification.md](verification.md) — local build and test evidence
