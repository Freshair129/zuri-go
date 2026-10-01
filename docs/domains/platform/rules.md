# DOM-PLT — business rules

The invariants of [DOM-PLT](README.md) ([STD-001 R1](../../governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md): BR). Each is declared by its heading ([STD-002 R2](../../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)) and promoted, without changing the source, from a sentence of the “Business rules” of the domain README or of [AGENTS.md](../../../AGENTS.md) ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10); each quotes that sentence. All are `proposed`. Rules that apply to the whole system are in the [security requirements](../../architecture/requirements/security-requirements.md). The location of this file extends [STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md), which names no file for a domain's rules (see the notes of this change).

### BR-013 — The UI and the API share one origin
Relations: relates_to: SRV-001, SRV-002, API-001, SEC-007
Owner: DOM-PLT

**Status:** proposed. **Statement.** The user interface and the API SHALL be served from one origin: the local server serves `build/site` and the API together, and production deploys `build/vercel`, whose rewrite sends `/api/zuri-go/v1` to the API function of the same site.

**Source.** [DOM-PLT README](README.md): “UI and API share one origin; local serves `build/site` and production deploys `build/vercel`” ([architecture index](../../architecture/README.md): “UI และ API ใช้ origin เดียว”). **Enforced by.** `apps/api/server.mjs` (static files and the API on one port), `scripts/deploy/build_cloud.py` (the rewrite and the allowlisted package).

### BR-014 — The protected Data App runtime and the stable app ID are preserved, and generated output is rebuilt
Relations: relates_to: FEAT-008, SRV-001
Owner: DOM-PLT

**Status:** proposed. **Statement.** The protected Data App runtime, its integrity manifests, the stable app ID and the users' existing layout SHALL be preserved; no check SHALL be weakened and no manifest rewritten by hand to make a build pass; generated output SHALL be rebuilt, never edited by hand.

**Source.** [AGENTS.md](../../../AGENTS.md): “Preserve the Data App protected runtime, integrity manifests, stable app ID and existing user layout.” and, in its source-ownership table, “Generated output; rebuild rather than hand-edit.” **Enforced by.** the build checks of `npm run build` against `apps/web/protected-runtime.json` and `apps/web/AGENTS.md`.

### BR-015 — A deployment is not a database migration or a rollback authorization
Relations: relates_to: SEC-017, SRV-001
Owner: DOM-PLT

**Status:** proposed. **Statement.** Deploying the application SHALL NOT migrate or roll back the database, and a rollback of the code SHALL NOT be assumed compatible with a later schema; the current schema and the intended rollback are assessed first.

**Source.** [AGENTS.md](../../../AGENTS.md), “GitHub and Vercel”: “Deployment is not database migration or rollback authorization. Do not assume a source rollback is compatible after a later schema change; assess current schema and the intended rollback first.” **Enforced by.** procedure ([RB-001](../../operations/RB-001-runbook.md)); `npm run db:migrate` is a separate operator command and `build/vercel` contains no migration.

### BR-016 — The local and the production database are separate and never synchronized automatically
Relations: relates_to: SRV-001, SRV-002, SEC-017
Owner: DOM-PLT

**Status:** proposed. **Statement.** The local Docker PostgreSQL and the production Neon PostgreSQL SHALL be separate persistent databases that are not synchronized automatically; source control holds the migrations, never the live database storage.

**Source.** [AGENTS.md](../../../AGENTS.md): “Local Docker PostgreSQL and production Neon are separate persistent databases, not automatically synchronized. Source control contains migrations, not live database storage.” **Enforced by.** the two runtimes use different connection settings ([SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)); `.local/` is ignored by Git.

### BR-017 — Destructive tests use an isolated QA Business, not user records
Relations: relates_to: SEC-017, BR-019
Owner: DOM-PLT

**Status:** proposed. **Statement.** A test that creates or destroys data SHALL use an isolated QA Business and SHALL NOT touch a user's records.

**Source.** [AGENTS.md](../../../AGENTS.md): “Use isolated QA Businesses for destructive tests, not user records.” **Enforced by.** the tests create their own Business (`apps/api/test/*.test.mjs`); procedure for manual checks.
