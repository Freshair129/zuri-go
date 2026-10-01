---
id: SRV-001
title: Hosted site and API (Vercel + Neon PostgreSQL)
status: proposed
hosts: [DOM-BIZ, DOM-CAM, DOM-MET, DOM-TSK, DOM-MTG, DOM-IAM, DOM-PLT, DOM-BRN]
implements: [FEAT-001, FEAT-002, FEAT-003, FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008, FEAT-009]
relations:
  exposes: [API-001, API-002, API-003, API-004, API-005, API-006, API-007, API-008, API-010, API-011, API-012, API-013, API-014, API-015, API-016, API-017, API-018, API-019, API-020, EVT-001]
  consumes: [API-021, API-022]
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

## Contracts served
The HTTP API under `/api/zuri-go/v1`, as declared in the `contracts.md` of each domain folder (all `proposed`, written on 2026-10-01 from the code of release 0.5.1). The shared transport, authorization and error rules are [API-001](../../domains/platform/contracts.md#api-001--http-api-transport-authorization-and-error-envelope).

| Domain | Contracts | Notes on this service |
|---|---|---|
| [DOM-PLT](../../domains/platform/contracts.md) | API-001 | Entry `api/index.mjs` → `apps/api/cloud.mjs`; every route needs the origin and write gate |
| [DOM-IAM](../../domains/identity-access/contracts.md) | API-002 Session, login and logout; API-003 Teams; API-004 Member registry | `/login` and `/logout` exist only here |
| [DOM-BIZ](../../domains/business/contracts.md) | API-005 Bootstrap, state and name; API-006 Overview and brief; API-007 Channel accounts; API-008 Workspace; EVT-001 Change event | API-009 (backup import) is not served: every `/imports` route answers 403 |
| [DOM-CAM](../../domains/campaign/contracts.md) | API-010 Campaigns; API-011 Content items; API-012 Publications; API-013 Campaign tasks | |
| [DOM-MET](../../domains/metrics/contracts.md) | API-014 Goals; API-015 Metric observations | |
| [DOM-TSK](../../domains/tasks/contracts.md) | API-016 Tasks; API-017 Projects; API-018 Task attachments | |
| [DOM-MTG](../../domains/meetings/contracts.md) | API-019 Meeting commit; API-020 Transcript upload | Reachable by a Member only |

Contracts consumed, not served: API-021 and API-022, the FUNG Desktop interfaces that the site's meeting screen calls from the user's browser on the same machine ([DOM-MTG](../../domains/meetings/contracts.md)). The security requirements that bind these contracts are in [security-requirements.md](../../architecture/requirements/security-requirements.md).

## Hosts and implements
Hosts every domain listed in the frontmatter and realises every feature in its `implements` list ([STD-003 R4](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). The `hosts` / `implements` lists are service-level declarations; they are not graph edges (ADR-001 D7).
