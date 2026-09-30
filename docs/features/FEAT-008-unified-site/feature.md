---
id: FEAT-008
title: Unified site
type: domain-feature
owner: DOM-PLT
runtime: SRV-001
delivery: live
status: proposed
legacy: []
relations:
  depends_on: [FEAT-002, FEAT-003, FEAT-004]
---

# FEAT-008 — Unified site

One website, one origin and one deployment, with a shared menu — Marketing · Meeting & Task Manager · ความรู้ Metrics · Graph View — linking Mission Control, the task manager, the Metrics guide and the Graph View by relative same-origin paths.

## Scope
- Routes: `/?view=1&tab=overview`, `/?view=1&tab=meeting-task-manager`, `/metrics/#overview`, `/metrics/#metrics-graph`; existing tab query links keep working.
- The deployment package has no link back to ports 4319 or 4321; the site menu is hidden in print.
- Existing app ID, reference data, storage namespace and graph presentation are preserved; KPI definitions and task-data ownership do not change.

## Ownership
- Feature owner: [DOM-PLT](../../domains/platform/README.md) — Platform & delivery. Type: domain feature, no cross-domain participants.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Specification “รวม Mission Control และ Marketing Metrics Map เป็นเว็บไซต์เดียว” | `docs/product/unified-site-spec.md` | v0.1.0 · 2026-09-30 |
| [verification.md](verification.md) | Verification and production release | `docs/product/unified-site-verification.md` | v0.1.0 · 2026-09-30 |

Text inside these documents may still name a sibling by its original file name; the **Original location** column maps each to its current file.

## Requirement index
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Acceptance and verification: [spec.md](spec.md) “Acceptance และ verification”; results in [verification.md](verification.md).

## Delivery evidence
- Review evidence: `docs/history/unified-site-review/`.
