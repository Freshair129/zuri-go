---
id: SRV-002
title: Local operator runtime (Node server + Docker PostgreSQL)
status: proposed
hosts: [DOM-BIZ, DOM-CAM, DOM-MET, DOM-WRK, DOM-IAM, DOM-PLT, DOM-BRN]
implements: [FEAT-001, FEAT-002, FEAT-003, FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008, FEAT-009]
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
- Operating instructions and rollback: [RB-001](../../operations/RB-001-runbook.md).

## Hosts and implements
Hosts every domain listed in the frontmatter and realises every feature in it ([STD-003 R4](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). The `hosts` / `implements` lists are service-level declarations; they are not graph edges (ADR-001 D7).
