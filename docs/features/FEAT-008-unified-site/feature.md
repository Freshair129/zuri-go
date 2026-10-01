---
id: FEAT-008
title: Unified site
type: domain-feature
owner: DOM-PLT
runtime: SRV-001
delivery: implemented
status: proposed
legacy: []
relations:
  depends_on: [FEAT-002]
  relates_to: [FEAT-003, FEAT-004]
---

# FEAT-008 — Unified site

One website, one origin and one deployment, with a shared menu — Marketing · Meeting & Task Manager · ความรู้ Metrics · Graph View — linking Mission Control, the task manager, the Metrics guide and the Graph View by relative same-origin paths.

## Scope
- Routes: `/?view=1&tab=overview`, `/?view=1&tab=meeting-task-manager`, `/metrics/#overview`, `/metrics/#metrics-graph`; existing tab query links keep working.
- The deployment package has no link back to ports 4319 or 4321; the site menu is hidden in print.
- Existing app ID, reference data, storage namespace and graph presentation are preserved; KPI definitions and task-data ownership do not change.

## Ownership
- Feature owner: [DOM-PLT](../../domains/platform/README.md) — Platform & delivery. Type: domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator also runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Specification “รวม Mission Control และ Marketing Metrics Map เป็นเว็บไซต์เดียว” | `docs/product/unified-site-spec.md` | v0.1.0 · 2026-09-30 |
| [verification.md](verification.md) | Verification and production release | `docs/product/unified-site-verification.md` | v0.1.0 · 2026-09-30 |

Text inside these documents may still name a sibling by its original file name; the **Original location** column maps each to its current file.

## Requirement index
The requirement files below were written from the approved [spec.md](spec.md) ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, [PLAN-003](../../governance/plans/PLAN-003-remaining-work.md) S1) and are `status: proposed` until the owner approves them (PLAN-003 G4). Each file holds one requirement with its acceptance criteria, cites the section of the spec it comes from, and gives the spec’s own label (US01 to US10) in its notes; those labels are not IDs. Delivery is `implemented` only where [verification.md](verification.md), the release records, the current code or a test show it. TC bindings do not exist yet (WI-08).

| ID | Requirement | Delivery |
|---|---|---|
| [FR-008-001](requirements/FR-008-001-site-menu.md) | One site menu on every section | implemented |
| [FR-008-002](requirements/FR-008-002-routes-deep-links.md) | Four routes and deep links that survive a reload | implemented |
| [FR-008-003](requirements/FR-008-003-app-identity-tabs.md) | The existing app identity keeps Marketing and the Task Manager working | implemented |
| [FR-008-004](requirements/FR-008-004-saved-data-and-backup.md) | Saved work survives navigation and reload; backup and restore stay usable | implemented |
| [FR-008-005](requirements/FR-008-005-guide-and-graph-retained.md) | The merge leaves the guide and the Graph View unchanged | implemented |
| [FR-008-006](requirements/FR-008-006-print-and-reviewed-metrics.md) | The site menu is hidden in print and no reviewed metric changes | implemented |
| [FR-008-007](requirements/FR-008-007-deployment-package.md) | One verified folder, one deployment, only allowlisted files | implemented |
| [FR-008-008](requirements/FR-008-008-protected-runtime.md) | The protected runtime and its manifest stay intact | implemented |
| [FR-008-009](requirements/FR-008-009-release-and-reporting.md) | Verify, deploy and report only what was checked | implemented |
| [NFR-008-001](requirements/NFR-008-001-menu-does-not-obscure.md) | The site menu never covers content | implemented |

## Delivery evidence
- Production release and checks: [verification.md](verification.md), “Production”; evidence in `docs/history/unified-site-review/`.
