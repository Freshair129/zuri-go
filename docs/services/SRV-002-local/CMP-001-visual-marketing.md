---
id: CMP-001
title: Visual Marketing orchestration
owner: DOM-VIS
runtime: SRV-002
status: approved
delivery: implemented
relations:
  exposes: [API-023, EVT-002]
  consumes: [API-005, API-010, API-017]
  decided_by: [ADR-006]
---
# CMP-001 — Visual Marketing orchestration

Implemented first-slice component inside the existing local Node runtime. Code root `apps/api/visual-marketing/`; no new deployable. [SDD-014](../../features/FEAT-014-visual-marketing-team/design.md) owns exported signatures, failure modes, provider ports and workflow; [ARCH-004](../../architecture/ARCH-004-visual-marketing.md) owns system boundaries.

The existing API adapter calls this component inside viewer-scoped transactions. The local executor invokes bounded provider calls outside transactions and persists results through fenced job commits. It consumes the same business/Project/campaign domain contracts as existing handlers, without loopback HTTP or direct peer mutations. RB-001 remains the service runbook; executor startup, shutdown, reconciliation, backups and QA migration instructions are recorded there for local operation.
