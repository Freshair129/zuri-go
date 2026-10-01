# DOM-TSK — business rules

The invariants of [DOM-TSK](README.md) ([STD-001 R1](../../governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md): BR). Each is declared by its heading ([STD-002 R2](../../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)) and promoted, without changing the source, from a sentence of the “Business rules” of the domain README or of [AGENTS.md](../../../AGENTS.md) ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10); each quotes that sentence. All are `proposed`. The README's other rules are already requirements and are not repeated: a task from a name alone is FR-010-001, the MoSCoW rules are FR-010-020 to FR-010-022, RACI and Inactive Members are FR-010-018 and FR-010-019, and the audience of a task is FR-011-004. The location of this file extends [STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md), which names no file for a domain's rules (see the notes of this change).

### BR-018 — A task keeps at most 5 evidence files of 2 MiB each
Relations: relates_to: FEAT-005, API-018
Owner: DOM-TSK

**Status:** proposed. **Statement.** A task SHALL hold at most 5 active evidence files, each at most 2 MiB; a file is added to a saved task, never to an unsaved one.

**Source.** [DOM-TSK README](README.md): “Evidence files: at most 5 active files per task and 2 MiB each” ([FEAT-005 spec](../../features/FEAT-005-guest-access/spec.md), “Evidence attachments”). **Enforced by.** `apps/api/attachments.mjs` (`MAX_ATTACHMENT_BYTES`, the count of files not removed) and the `byte_size` check of `apps/api/migrations/004_task_attachments.sql`.

### BR-019 — Task ownership, RACI, MoSCoW, attachments and existing data survive every change
Relations: relates_to: FEAT-010, FEAT-004, FR-010-023, NFR-010-002, SEC-017, BR-017
Owner: DOM-TSK

**Status:** proposed. **Statement.** A change to the application, the schema or the data SHALL retain the ownership, RACI roles, MoSCoW priorities, attachment records and other existing data of every task.

**Source.** [AGENTS.md](../../../AGENTS.md): “Retain task ownership, RACI, MoSCoW, attachment records and existing data during changes.” **Enforced by.** additive migrations with reconciled counts in each release record (NFR-010-002), and the whole-workspace save refusing a body that omits stored tasks (API-008).
