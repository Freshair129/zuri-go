---
status: active
superseded_by: null
---

# AGENTS.md — Zuri-Go

## Project and authority

- Active source: `O:/zuri-go` (owner-confirmed checkout, 2026-10-05). The former `D:/zuri-brand-kit` checkout is a historical checkpoint, not a build dependency or editing target.
- Product: **Zuri-Go** — **Let’s Go to Market. Together.** Marketing made simple: business overview, campaign KPIs, metrics guide/graph, and Meeting & Task Manager.
- Platform relationship: Zuri-Go is the light Marketing/Commercial edition of Zuri-AI. Read [ARCH-005](docs/architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md) and [registry/relations.yaml](registry/relations.yaml) for the canonical context and source chapters. Existing local IDs remain stable; parent schema/identity parity and live integration must be verified, not inferred. Process definitions are edited there; the dated history folder is evidence only.
- GitHub: https://github.com/Freshair129/zuri-go — private repository, default branch `main`.
- Production: https://zuri-metrics-map.vercel.app/ — Vercel project `zuri-metrics-map`, scope `pornpons-projects`.
- Read [README](README.md), the [documentation map](docs/README.md) and the [architecture index](docs/architecture/README.md) first. Follow the user's current instructions, approved parent/peer contracts, and applicable nested AGENTS.md. Historical documents are evidence, not newer requirements.
- Baseline at this update: application 0.5.1 (0.5.0 plus the Member-registry and Guest-privacy fixes; FEAT-014 Visual Studio production rollout is recorded in [the 0.5.1 verification record](docs/releases/0.5.1/verification.md), with no package-version bump); PostgreSQL schema 12 in both Production and persistent native Local `zuri_go` after the authorized 2026-10-06 migration ([FEAT-015 evidence](docs/features/FEAT-015-marketing-report-exchange/verification.md#local-and-production-migration-012--2026-10-06)). Local was created by the separately authorized Production-backup restore ([restore evidence](docs/features/FEAT-015-marketing-report-exchange/verification.md#local-production-backup-restore--2026-10-05)). The former Docker Local was last recorded at schema 8 and is unavailable here. The isolated Visual QA database used for tests is schema 10. Release 0.5.0 first went live on 2026-10-01 (code commit `7bb538c`; deployment ID and checks in the [verification record](docs/releases/0.5.0/verification.md)). Read `package.json`, migration files and release evidence for later versions; verify live deployment rather than assuming this baseline is current forever.

## Working method

1. State material assumptions, complexity (C-1 direct / C-2 documentation-driven / C-3 architecture-driven), risk (LOW/MEDIUM/HIGH), and acceptance checks before implementation. Ask about unresolved material uncertainty.
2. Inspect parent intent and peer contracts. Non-trivial code changes require approved documentation; use existing approval for its stated scope. Do not infer a requirement to ask again when that scope is already approved.
3. For bugs, confirm the root cause from evidence and record symptom, evidence, root cause, detection gap and prevention under `.brain/rca/` before fixing. Trivial typo/syntax fixes follow the existing hotfix exception.
4. Make surgical changes in the existing style. No unrelated refactors, speculative abstractions, destructive cleanup or opportunistic feature additions.
5. Verify acceptance and relevant tests, update documentation and show the version diff. Distinguish local checks, hosted API checks, browser checks and production status; never claim an unperformed check passed.

## Source ownership

| Path | Purpose and rules |
|---|---|
| `apps/web/` | Data App authoring unit; obey its nested `AGENTS.md` before editing. |
| `apps/web/src/content/` | Authored UI, domain models and approved assets. |
| `apps/api/` | API, auth, PostgreSQL services, migrations, operator scripts and tests. |
| `apps/metrics/` | Generated metrics guide/graph with its assets and GVM source material. Edit guide generation through `scripts/metrics/`, not generated HTML. |
| `assets/`, `brand/` | Approved logo sources and brand rules. |
| `scripts/` | Local startup, metrics generation, site assembly and Vercel packaging. |
| `tests/campaign/` | Campaign regression tests; meeting tests also live with authored models. |
| `docs/features/`, `docs/domains/`, `docs/architecture/`, `docs/services/`, `docs/operations/`, `docs/product/`, `docs/templates/`, `registry/` | Current contracts, product requirements, ownership metadata and operator instructions, structured by the governance standards: one canonical location per artifact, stable IDs, ownership in metadata. Start at [docs/README.md](docs/README.md); add or move documents following [STD-003 R7](docs/governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md) and never change an ID. The standards STD-001…005 and ADR-001 were approved by the owner on 2026-10-01. |
| `docs/governance/` | Standards (STD, approved 2026-10-01) and procedures (PROC, still `proposed`); governance decisions (ADR) and adoption plans. |
| `docs/history/`, `docs/migrations/`, `docs/releases/` | Historical evidence, extraction provenance and versioned verification. |
| `build/site/`, `build/vercel/`, `apps/web/dist/` | Generated output; rebuild rather than hand-edit. |
| `.local/` | Private configuration, member-code handovers, backups, logs and test payloads; never commit or deploy. |

Preserve the Data App protected runtime, integrity manifests, stable app ID and existing user layout. Editable boundaries are defined by `apps/web/AGENTS.md` and `protected-runtime.json`; never weaken a check or manually rewrite a manifest to make a build pass. Historical copy verification must not be mistaken for a freeze on approved authored content.

For visual work, read `brand/brand-profile.md` and [logo contract](docs/features/FEAT-009-logo-placement/spec.md). Use existing approved Zuri-Go assets and the documented Zuri / น้องวางใจ designs. Do not redraw logos or invent brand tokens, names or taglines. Brand promotion remains human-only. Keep Thai user-facing copy and existing English technical/product labels.

## Identity and data custody

- Production opens in **Guest mode**, read-only. A write attempt prompts login; API authorization must enforce writes independently of UI state.
- Login has one masked field labelled **รหัสระบุตัวตน**, transported as `{password}`. No PID input is required. Follow [single-code login](docs/features/FEAT-007-single-code-login/spec.md) and [Member identity](docs/features/FEAT-006-member-identity/spec.md).
- Resolve exactly one matching credential across the Business, including disabled/inactive candidates when detecting ambiguity, then require an active/enabled owner. Caller PID/memberId must never select the authenticated actor.
- PID remains a stable public Member identifier; UUID remains PK/FK and canonical actor identity. Preserve versioned signed sessions, credential rechecks, origin checks, persistent rate limits, RLS and audit attribution. Do not restore shared-password fallback.
- Local access is a trusted operator on `127.0.0.1:4319`; do not claim it is an authenticated Member session.
- Visibility ([FEAT-011](docs/features/FEAT-011-visibility-and-confidential-meetings/feature.md), schema 6): every read resolves a viewer (Guest, Member or local operator), and row-level security enforces item visibility through `zuri_go.viewer_kind` and `zuri_go.viewer_member`. Do not add a read path that skips the viewer. Released to production on 2026-10-01 with 0.5.0 ([verification](docs/releases/0.5.0/verification.md)). After `npm run db:migrate` applies schema 6 locally, restart the local server: one started earlier sets no viewer, reads as a Guest and shows no business work; stop only the identified listener on 4319.
- The Business-admin flag (`members.is_business_admin`) is set only by `npm run members -- --admin <PID>` or `--no-admin <PID>` (add `--cloud` for production); the runtime role cannot change it.
- Guest mode reads public items only since 0.5.0 (2026-10-01): production tasks are all `business`, so Guests see no task and no meeting, and Guest writes answer 401 ([verification](docs/releases/0.5.0/verification.md)). The interim rule of ADR-004 D9 (no confidential content in production because Guests read everything) therefore ended for tasks and meetings on that date. Guests still read campaign records and, since 0.5.1, only each Member's ID, PID, display name and status (PLAN-002 Q1 defers the other levels, D16), so keep HR, accounting, salary and customer-personal content out of those records. The Business-admin flag was set for the owner's Member after the release (recorded there, no credential changed); the hosted Member, participant and Business-admin checks and the browser checks are not yet done. Rollback has no down-migration, so the chosen fallback is to fix forward on schema 7.
- Local PostgreSQL (native on this machine; historical Docker on the former machine) and production Neon are separate persistent databases, not automatically synchronized. Source control contains migrations, not live database storage.
- Never reset/reimport a Business, remove a database volume, rotate real codes, or run destructive migrations without specific authorization. A source move, build, Git push or deployment does not imply that authorization.
- Admin URLs, session secrets, passwords, hashes and backup contents stay private. Use the restricted runtime role for application access. Never print credentials or put them in browser bundles, source snapshots, patches, screenshots or public reports.
- Retain task ownership, RACI, MoSCoW, attachment records and existing data during changes. Use isolated QA Businesses for destructive tests, not user records.

## Commands and verification

Run from the project root. See [runbook](docs/operations/RB-001-runbook.md) for prerequisites and custody details.

| Command | Meaning |
|---|---|
| `npm run setup` | Install API dependencies from the lockfile; does not provision a database. |
| `npm start` | Docker startup wrapper on port 4319; this machine uses the native start procedure in RB-001. |
| `npm run build` | Verify/build the Data App and metrics guide, then assemble the allowlisted site and Vercel package. |
| `npm test` | Node suites, Python packaging tests, metrics checks and extraction checks; requires local PostgreSQL and HTTP server. Tests create isolated QA data. |
| `npm run backup` | Docker-only backup wrapper; native backup procedure is in RB-001. |
| `npm run db:migrate` | Explicit operator schema operation; not a routine build/start prerequisite. Refuses a non-local target host; `-- --cloud` migrates production from `.local/cloud-config.json` and prints only the host's last two labels and the database name. |
| `npm run members -- --cloud` | Operator credential provisioning; use only when requested, not as a login test. |
| `npm run deploy` | Always staged (`--prod --skip-domain`): deploys the existing package/project and prints the unique deployment URL; the public domain does not move. Use only within deployment authorization. |
| `npm run promote -- <deployment-url>` | Moves the public domain to a verified staged deployment; refuses a URL that does not match `https://zuri-metrics-*-pornpons-projects.vercel.app`. Use only within deployment authorization. |

Build uses the installed Codex Data plugin and Node runtime. Machine overrides are `ZURI_GO_DATA_PLUGIN`, `ZURI_GO_BUILD_NODE`, and `ZURI_GO_PYTHON`. Do not copy plugin infrastructure into the repo or bypass protected-runtime checks. Read the runner and README for current defaults.

Run checks appropriate to changed behavior. A documentation-only change needs link/path and diff validation, not a fabricated application test result. Use approved browser tools for UI checks; never run legacy browser automation or work around a policy rejection. Report visual/interactivity checks as unverified when blocked.

## GitHub and Vercel

- Inspect `git status` and preserve unrelated edits. Before staging, confirm `.local/`, `.env*`, dependencies, generated builds and logs remain ignored; review the staged diff for private data. A private repository is not a secret store.
- Keep the existing `origin` and repository visibility unless the user requests a change. GitHub setup is documented in [repository operations](docs/operations/RB-002-github-repository.md).
- Git push does not itself prove deployment. GitHub-to-Vercel automatic deployment was not configured during repository creation; verify any later integration before relying on it.
- Durable Vercel binding is `scripts/deploy/project.json`; the packager restores it under `build/vercel/.vercel/`. Do not create another Vercel project or silently replace a conflicting binding.
- For an authorized release: build and run relevant tests, deploy the existing package with `--prod --skip-domain`, verify the unique deployment using authenticated Vercel access where required, then promote and verify the public production URL. Use CLI/version instructions from the runbook and current tooling.
- Check Guest reads/write denial and changed auth behavior on the hosted API. For identity changes, verify the correct Member owner without exposing codes or rotating credentials. Compare served artifacts with the verified build when applicable.
- Record deployment ID, target URL, checks actually run and material limitations under `docs/releases/<version>/`. Keep secret-bearing payloads and cookies in `.local/`.
- Deployment is not database migration or rollback authorization. Do not assume a source rollback is compatible after a later schema change; assess current schema and the intended rollback first.

## Documentation update record

2026-10-06 (Go code rollout): owner-authorized deployment from main `197fe6c` staged and promoted `dpl_EGUg7uHqGE1Pf3brpcipgzR6X4mc` to the existing public domain. Stage/public Guest and artifact checks passed 15/15 each; desktop Guest Overview, Task Manager login prompt and Visual Studio loaded. Package remains 0.5.1; both databases remain schema 12; no parent deployment or real report send. Canonical deployment details and check limitations are in release 0.5.1 verification.

2026-10-06: recorded the owner-authorized merge and migration 012 on actual persistent Local and Production, both schema 11 → 12. Fresh consistent backups, preservation of existing data/ACLs/functions, exact new catalog checks and independent receipt review passed; existing hosted Guest reads/write denial passed. Production restricted-runtime login and new backup restore drills remain NOT_RUN. Application/deployment unchanged; canonical evidence is FEAT-015 verification. Documentation-only update.

2026-09-30: expanded the post-extraction instructions for the private GitHub repository, 0.4.2 single-code login, source ownership, data custody, verification and staged Vercel releases. Documentation-only; no application version, database or deployment change.

2026-10-01: restructured `docs/` to the governance standards STD-001–STD-003 (decisions in `docs/governance/decisions.md`, remaining work in `docs/governance/plans/`): features, architecture, operations, domains and services now sit at canonical locations with stable IDs and ownership metadata; added `registry/` and `docs/templates/`. Moved specifications keep their text — only link targets changed, and six documents that became artifacts (ARCH-001–003, SDD-004, RB-001, RB-002) gained STD-002 frontmatter. Documentation-only; no application version, database or deployment change. Requirement decomposition (FR/AC/TC) and validation tooling are pending.

2026-10-01: recorded the approval of ADR-004 and FEAT-011 and the local build of phase P1 (schema 6, migration `006_visibility.sql`, local database only; production still schema 5 and not deployed): baseline, viewer and row-level security facts, local server restart after migrating, the operator-only Business-admin flag, and the Guest rule that still reads the whole workspace until release (interim rule ADR-004 D9). ARCH-002 gained a schema 6 amendment; PRD-001 and BRD-001 reflect the approval. ADR-002 and ADR-003 remain proposed. Documentation-only; no application version, database or deployment change.

2026-10-01: recorded the approval of ADR-002, ADR-003 and FEAT-010 and the local build of phase P2 (schema 7, migration `007_tasks_projects.sql`, local database only; production still schema 5, not deployed): baseline and the Task Manager runbook section. Application version unchanged.

2026-10-01 (release 0.5.0): recorded the production release of 0.5.0: application 0.5.0 on schema 7 (migrations 006 and 007 applied to production the same day), Guests reading public items only, and the end of the ADR-004 D9 interim rule for tasks and meetings. Baseline, Visibility and Guest-mode bullets updated; the release record is [docs/releases/0.5.0/verification.md](docs/releases/0.5.0/verification.md). Documentation-only change; the release itself is recorded there.

2026-10-01 (release 0.5.1): baseline 0.5.1 on schema 7; Guests read only a Member's ID, PID, display name and status; adding Members and changing statuses need the Business admin (ZGO-P0002) or the operator. Documentation of the release is [docs/releases/0.5.1/verification.md](docs/releases/0.5.1/verification.md).
