---
id: SRV-001
title: Hosted site and API (Vercel + Neon PostgreSQL)
status: proposed
hosts: [DOM-BIZ, DOM-CAM, DOM-MET, DOM-WRK, DOM-IAM, DOM-PLT, DOM-BRN]
implements: [FEAT-001, FEAT-002, FEAT-003, FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008, FEAT-009]
---

# SRV-001 — Hosted site and API (Vercel + Neon PostgreSQL)

Static site (`build/site`) plus one same-origin API function (`api/index.mjs` → `apps/api/cloud.mjs`) under `/api/zuri-go/v1`. Production opens in Guest mode; writes need a signed Member session. The database is the production Neon PostgreSQL instance.

| | |
|---|---|
| Deploy unit | Vercel project `zuri-metrics-map` — package `build/vercel`, binding `scripts/deploy/project.json` |
| Code roots | `apps/api`, `apps/web`, `apps/metrics`, `scripts/metrics`, `scripts/site`, `scripts/deploy` |
| Runbook | [RB-001](../../operations/RB-001-runbook.md) |

## Facts
- Package is an allowlist assembled by `scripts/deploy/build_cloud.py`; no `.local`, backups, credentials or test files are packaged.
- Runtime environment: `ZURI_GO_DATABASE_URL`, `ZURI_GO_BUSINESS_ID`, `ZURI_GO_SESSION_SECRET`, `ZURI_GO_PUBLIC_ORIGIN` (values are private and never recorded in documents).
- Release sequence and rollback: [RB-001](../../operations/RB-001-runbook.md); hosted architecture: [ARCH-003](../../architecture/ARCH-003-hosted-deployment.md).

## Hosts and implements
Hosts every domain listed in the frontmatter and realises every feature in its `implements` list ([STD-003 R4](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). The `hosts` / `implements` lists are service-level declarations; they are not graph edges (ADR-001 D7).
