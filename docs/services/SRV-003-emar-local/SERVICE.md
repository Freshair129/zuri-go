---
id: SRV-003
title: Emar standalone local email execution service
status: approved
hosts: [DOM-PLT]
implements: [FEAT-013]
relations:
  relates_to: [SRV-002]
---

# SRV-003 — Emar standalone local email execution service

Emar is a separate local Node.js service. Zuri-Go provides a local launcher; Emar is not started, proxied, authenticated, or managed by Zuri-Go.

Service identity: **SRV-003** · implementation name: **EmailMar** · UI name: **Emar** · registry slug: `emar-local`. This external service is registered once; FEAT-013 is the approved Zuri-Go discovery/launch contract owned by DOM-PLT, not a new email execution implementation in Zuri-Go.

| | |
|---|---|
| Deploy unit | `http://localhost:8788/` — Emar 0.3.0-beta.0, started separately |
| Code roots | None in this repository; Emar source is maintained separately |
| Runbook | Emar `README.md` and `docs/GMAIL-OAUTH.md` in the Emar project |

## Facts

External runtime facts below are the baseline recorded by approved FEAT-013, not a fresh check of the separate Emar installation. Only Zuri-Go registration, launcher and generated packages were verified in this task.

- Emar binds to loopback and accepts `localhost`; use `http://localhost:8788/` from the Zuri-Go launcher.
- Emar owns campaign execution, approval snapshots, queue and tracking. A suppression projection is execution state; CRM remains the authority for consent and suppression. Provider credentials and connection state belong to the Integration boundary, even when maintained inside the standalone Emar deployable.
- Emar requires Node.js 22.13 or newer and stores durable local state in its SQLite database by default.
- Gmail OAuth and encryption-key configuration remain with the external service's Integration operator; Zuri-Go does not read or hold them.
- The source and runtime are external to the Zuri-Go repository and are not included in its Vercel package.

## Integration boundary

| Owner | Authority | FEAT-013 connection |
|---|---|---|
| Identity | Authentication and membership | NOT_CONFIGURED; no session/code delegation |
| CRM | Contacts, consent and suppression | NOT_CONFIGURED; no contact or consent transfer |
| Files | Binary attachments | NOT_CONFIGURED; no file adapter |
| Integration | Provider credentials and connection state | NOT_CONFIGURED in Zuri-Go; external configuration not inspected |
| Emar | Execution, human approval, queue and tracking | Standalone only; no execution client in Zuri-Go |
| Zuri-Go DOM-PLT | Service catalog and passive local launcher | Registered as SRV-003 under FEAT-013 v0.1.0 |

- Zuri-Go only opens Emar after an explicit user click from its canonical local site.
- The service link uses a distinct loopback hostname to avoid sharing host-scoped cookies across ports.
- No REST/MCP requests, identity delegation, CRM/Files/Marketing adapters, data synchronization, automatic startup, or provider operation is part of FEAT-013.
- Gmail OAuth from `localhost` requires the Emar callback configuration and Google authorized redirect URI to match `http://localhost:8788/v1/integrations/gmail/callback`.
