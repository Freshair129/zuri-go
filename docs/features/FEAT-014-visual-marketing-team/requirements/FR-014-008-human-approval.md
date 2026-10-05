---
id: FR-014-008
title: Authorize attributable human decisions
owner: DOM-VIS
status: approved
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006, ADR-008]
---
# FR-014-008 — Authorize attributable human decisions

The system SHALL allow any active authenticated Member in the Business to make an internal decision over each final artifact hash after current QA and revision checks, and SHALL preserve append-only audit. Guest and agent identities cannot approve. This internal decision does not authorize provider egress, spend, actual external publication or deployment; those remain separately gated.

> **Supersession:** [ADR-008](../../../architecture/decisions.md) (approved 2026-10-05) replaces the Project-owner-only rule with equal internal decision rights for active Members. This changed authorization is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification is NOT_RUN after the command runner rejected bootstrap; production remains on schema 11 pending separately authorized migration 012 and deployment; implementation evidence below records the earlier rule.

## Acceptance criteria

- AC-014-008-01 — Given any active authenticated Member and current passing QA, when they approve, request changes or reject, then actor/hash/decision/stage persist atomically.

- AC-014-008-02 — Given a Guest, agent identity, stale hash or blocking QA, when an internal approval is attempted, then no decision authorizes the artifact; another active Member may decide regardless of Project ownership or RACI.

- AC-014-008-03 — Given a local operator decision, when displayed, then it explicitly says operator rather than authenticated Member.

- AC-014-008-04 — Given changed brief or artifact, when revisited, then old approval remains historical and new revision requires review.

- AC-014-008-05 — Given restricted runtime-role SQL, when direct INSERT is attempted for review, decision or public projection, then it is denied. Only the fixed-path database functions can create these rows; finalization binds the current owner/operator, Project state, latest validated review, generated canonical hash and exact persisted BUNDLE payload atomically.

- AC-014-008-06 — Given a pre-migration review/output or a legacy caller hash, when finalization or Guest read is attempted, then the old review cannot authorize a decision and the untrusted output is not Guest-visible; history remains available to Members/operators and a fresh validated review is required.
