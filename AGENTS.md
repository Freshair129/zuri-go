# Zuri-Go working source

This is the active standalone project. Read README.md and docs/architecture/README.md first. Approved extraction: docs/migrations/001-project-extraction.md.

- Follow documentation-driven development: inspect parent and peer contracts; approve documentation before non-trivial code changes. State assumptions, complexity (C-1/C-2/C-3), risk and acceptance checks. Ask about material uncertainty.
- Keep changes surgical. No unrelated refactors, speculative features or destructive cleanup. For bugs, confirm evidence-supported root cause and write RCA under .brain/rca before fixing.
- Verify acceptance, relevant tests, documentation and version diff before declaring completion.
- apps/web/AGENTS.md controls the copied Data App. Preserve its protected runtime, app ID, build integrity and UI behavior. Never bypass integrity checks.
- Read brand/brand-profile.md for visual work. User-approved Zuri-Go logo/tagline exceptions are documented in docs/architecture/logo-correction-spec.md. Use existing approved assets; do not redraw logos or rename mascots. Brand promotion remains human-only.
- .local contains secrets, database config, private handovers and backups. Never publish it or log credentials. Public assets and deploy files are explicitly allowlisted.
- PostgreSQL databases and Docker volume are persistent state, not generated files. No reset, reimport, credential rotation or destructive migration without specific authorization.
- Local is trusted operator access; production is public Guest read-only with per-Member identity-code writes. Current login contract is docs/architecture/identity-code-login-spec.md; stable identity contract is docs/architecture/member-identity-spec.md.
- Build/test/start must use this project root, without reading the previous brand-kit checkout. Historical source paths in docs/history and migration provenance are not active dependencies.
- Do not run legacy browser automation scripts: use the current session's approved browser tools. Keep production deployment separate from local verification.
