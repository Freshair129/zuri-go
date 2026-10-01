---
id: SRV-002
title: Local operator runtime (Node server + Docker PostgreSQL)
status: proposed
hosts: [DOM-BIZ, DOM-CAM, DOM-MET, DOM-TSK, DOM-MTG, DOM-IAM, DOM-PLT, DOM-BRN]
implements: [FEAT-001, FEAT-002, FEAT-003, FEAT-004, FEAT-008, FEAT-009]
relations:
  exposes: [API-001, API-002, API-003, API-004, API-005, API-006, API-007, API-008, API-009, API-010, API-011, API-012, API-013, API-014, API-015, API-016, API-017, API-018, API-019, API-020, EVT-001]
  consumes: [API-021, API-022]
---

# SRV-002 — Local operator runtime (Node server + Docker PostgreSQL)

Trusted-operator workspace bound to loopback. It serves `build/site` and the same API against the local PostgreSQL database (`zuri_go`). It is not an authenticated Member session, and local and production databases are separate and never synchronised automatically.

| | |
|---|---|
| Deploy unit | `apps/api/server.mjs` on `127.0.0.1:4319` and Docker container `zuri-go-postgres`, started by `scripts/local/start.ps1` (`npm start`) |
| Code roots | `apps/api`, `scripts/local` |
| Runbook | [RB-001](../../operations/RB-001-runbook.md) |

## Facts
- Local Docker volume `zuri-go-postgres-data` is a persistent database; source control holds migrations, not database contents.
- An existing listener on the port is accepted only after its Business identity matches; unrelated processes are never stopped.
- No Guest mode and no Member sign-in: the local server calls the API without a Member-session requirement (`apps/api/server.mjs`), so FEAT-005, FEAT-006 and FEAT-007 are realised by SRV-001 only. The loopback workspace “remains a trusted operator workspace, with explicit local-operator attribution” ([FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md) §1, item 5); evidence attachments and Member PIDs still work against the local database.
- Operating instructions and rollback: [RB-001](../../operations/RB-001-runbook.md).

## Contracts served
The same HTTP API under `/api/zuri-go/v1` as [SRV-001](../SRV-001-hosted/SERVICE.md), answered by `apps/api/server.mjs` as the trusted local operator ([SEC-011](../../architecture/requirements/security-requirements.md)), as declared in the `contracts.md` of each domain folder (all `proposed`). The shared rules are [API-001](../../domains/platform/contracts.md#api-001--http-api-transport-authorization-and-error-envelope).

| Domain | Contracts | Notes on this service |
|---|---|---|
| [DOM-PLT](../../domains/platform/contracts.md) | API-001 | Only `Host: 127.0.0.1:{port}` requests from the same origin are answered |
| [DOM-IAM](../../domains/identity-access/contracts.md) | API-002 (`GET /session` only); API-003; API-004 | No `/login` and no `/logout`; `/session` answers no member |
| [DOM-BIZ](../../domains/business/contracts.md) | API-005 to API-008; API-009 Backup import; EVT-001 | API-009 is served only here |
| [DOM-CAM](../../domains/campaign/contracts.md) | API-010 to API-013 | |
| [DOM-MET](../../domains/metrics/contracts.md) | API-014; API-015 | |
| [DOM-TSK](../../domains/tasks/contracts.md) | API-016 to API-018 | |
| [DOM-MTG](../../domains/meetings/contracts.md) | API-019 Meeting commit; API-020 Transcript upload | API-020 is routed but refused: the operator is not a Member (403 for an existing meeting) |

Contracts consumed, not served: API-021 and API-022 (FUNG Desktop), as for SRV-001.

## Hosts and implements
Hosts every domain listed in the frontmatter and realises every feature in its `implements` list ([STD-003 R4](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). The `hosts` / `implements` lists are service-level declarations; they are not graph edges (ADR-001 D7).
