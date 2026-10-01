# DOM-BIZ — business rules

The invariants of [DOM-BIZ](README.md) ([STD-001 R1](../../governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md): BR). Each is declared by its heading ([STD-002 R2](../../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)) and promoted, without changing the source, from a sentence of the “Business rules” of the domain README or of [AGENTS.md](../../../AGENTS.md) ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10); each quotes that sentence. All are `proposed`. Rules that apply to the whole system are in the [security requirements](../../architecture/requirements/security-requirements.md). The location of this file extends [STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md), which names no file for a domain's rules (see the notes of this change).

### BR-001 — Every Business row carries business_id, and a child is keyed within its Business
Relations: relates_to: ARCH-002, SEC-009
Owner: DOM-BIZ

**Status:** proposed. **Statement.** Every table that holds Business data SHALL carry `business_id`, and a child row SHALL reference its parent by `(business_id, parent_id)`, so that no row can point at data of another Business; the global catalog `metric_definitions` is the one exception.

**Source.** [DOM-BIZ README](README.md): “Every business-owned row carries `business_id` and child keys are composite `(business_id, parent_id)`” ([ARCH-002 §1](../../architecture/ARCH-002-postgresql-data-model.md)). **Enforced by.** the composite foreign keys of `apps/api/migrations/001_core.sql` and of the later migrations (for example `FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id)` in `004_task_attachments.sql`); row-level security on top of it is SEC-009.

### BR-002 — Overview numbers are computed from source rows, never stored as counters
Relations: relates_to: FEAT-001, ARCH-002, API-006
Owner: DOM-BIZ

**Status:** proposed. **Statement.** The numbers of the Business Overview SHALL be computed from the source rows each time they are asked for, and SHALL NOT be kept in a stored counter that could drift from them.

**Source.** [DOM-BIZ README](README.md): “Overview numbers are computed from source rows and never stored as counters” ([ARCH-002 §1](../../architecture/ARCH-002-postgresql-data-model.md): no `active_campaign_count` column). **Enforced by.** `apps/web/src/content/business/model.mjs:overview` computes the counts and goal progress from the snapshot of `GET /state`; the schema has no such column (`next_campaign_no` and its siblings allocate codes and are not Overview numbers).
