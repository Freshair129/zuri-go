# System security requirements

The security requirements of Zuri-Go that apply to the whole system ([STD-003 R1](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md): `architecture/requirements/`). Each is declared by its heading ([STD-002 R2](../../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)). They are promoted from the sentences of [AGENTS.md](../../../AGENTS.md) “Identity and data custody” and of the “Business rules” of the domain READMEs ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10); the sources are not changed and each entry quotes the sentence it comes from. All are `proposed` and were checked on 2026-10-01 against the code of release 0.5.1 (`apps/api/`), not run. Business rules are in the `rules.md` of each domain folder.

### SEC-001 — Guest mode is read-only, and the API enforces it independently of the UI
Relations: relates_to: FEAT-005, FR-011-007, API-001, API-002; decided_by: ADR-004

**Status:** proposed. **Statement.** The hosted API SHALL answer every write that does not carry a valid Member session with 401 `AUTH_REQUIRED` before it looks at the route (only the sign-in and sign-out routes and the 503 configuration, origin, method and write-gate checks come earlier; API-001 gives the exact order), whatever the page shows or hides, so that a Guest changes no data.

**Source.** [AGENTS.md](../../../AGENTS.md): “Production opens in **Guest mode**, read-only. A write attempt prompts login; API authorization must enforce writes independently of UI state.” **Enforced by.** `apps/api/cloud.mjs` (the 401 before routing), `apps/api/member-auth.mjs:authorizeWrite` (a second check inside the write transaction). **Tests.** `apps/api/test/cloud-handler.test.mjs`: “hosted API allows guest reads, denies writes …”, “guest write attempts cannot alter state …”.

### SEC-002 — Sign-in accepts exactly one matching credential of an active Member, and every failure looks the same
Relations: relates_to: FEAT-007, FEAT-006, API-002; decided_by: ADR-004

**Status:** proposed. **Statement.** Sign-in SHALL compare the submitted code with every credential of the Business, count disabled and inactive candidates when it looks for ambiguity, accept the code only when exactly one credential matches and its Member is active and its credential enabled, and answer a missing, ambiguous, inactive, disabled or malformed code with the same response.

**Source.** [AGENTS.md](../../../AGENTS.md): “Resolve exactly one matching credential across the Business, including disabled/inactive candidates when detecting ambiguity, then require an active/enabled owner.” and [FEAT-007 spec](../../features/FEAT-007-single-code-login/spec.md) (one rejection for no match, several matches, an inactive Member or a disabled credential). **Enforced by.** `apps/api/member-auth.mjs:loginMember`, `apps/api/cloud.mjs` (`/login`). **Tests.** `apps/api/test/member-auth.test.mjs`: “single code rejects ambiguity even with a disabled duplicate and validates input”.

### SEC-003 — The actor is never chosen by the caller
Relations: relates_to: FEAT-006, FEAT-007, FR-010-010, API-001, API-002, API-016, EVT-001; decided_by: ADR-004

**Status:** proposed. **Statement.** The system SHALL take the acting Member only from the verified session; a PID, member ID, actor or credential field sent by the caller SHALL NOT select, replace or be recorded as the actor.

**Source.** [AGENTS.md](../../../AGENTS.md): “Caller PID/memberId must never select the authenticated actor.” **Enforced by.** `apps/api/member-auth.mjs:loginMember` (the body carries only the code), `apps/api/tasks.mjs` and `apps/api/projects.mjs` (`actor`, `memberId`, `pid` ignored), `apps/api/service.mjs:save` (an unlisted field such as `pid` is refused), `apps/api/service.mjs:audit` (the actor is `c.zuriActor`, set from the session).

### SEC-004 — Sessions are signed, versioned, bounded and carried in a hardened cookie
Relations: relates_to: FEAT-006, API-002; decided_by: ADR-004

**Status:** proposed. **Statement.** A session SHALL be a token of version 2 signed with HMAC-SHA256 and bound to one Business, one Member UUID and one credential version, valid for at most 12 hours, and SHALL travel only in a `__Host-` cookie that is `HttpOnly`, `Secure` and `SameSite=Strict`.

**Source.** [AGENTS.md](../../../AGENTS.md): “Preserve versioned signed sessions, credential rechecks, origin checks, persistent rate limits, RLS and audit attribution.” **Enforced by.** `apps/api/member-auth.mjs` (`memberToken`, `readMemberSession` with a constant-time comparison, `memberCookie`). **Tests.** `apps/api/test/member-auth.test.mjs`: “member session is versioned, signed, bounded and distinct from team cookie”.

### SEC-005 — There is no shared-password or Business-only session fallback
Relations: relates_to: FEAT-006, FEAT-007, API-002; decided_by: ADR-004

**Status:** proposed. **Statement.** The system SHALL NOT accept a shared team password or the retired Business-only session cookie to sign in or to write; the only way to act is a personal credential and the Member session it earns.

**Source.** [AGENTS.md](../../../AGENTS.md): “Do not restore shared-password fallback.” **Enforced by.** `apps/api/cloud.mjs` reads only the member cookie and clears the retired `__Host-zuri-go-team` cookie on login and logout; `validSession` in `apps/api/team-auth.mjs` has no caller. **Tests.** `apps/api/test/cloud-handler.test.mjs`: “four individual identities, single-code binding, audit actors, disabled/reset sessions and legacy rejection”.

### SEC-006 — The credential is rechecked in the transaction of every request
Relations: relates_to: FEAT-006, FR-011-003, API-001, API-002; decided_by: ADR-004

**Status:** proposed. **Statement.** On every request the system SHALL re-read the Member's status, the credential's enabled flag and its version from PostgreSQL inside the request's own transaction, treat a session that no longer matches as a Guest, and, for a write, hold the Business row lock from that point, so that a disabled, reset or inactivated Member loses access at once and a concurrent revoke is serialized with the write.

**Source.** [AGENTS.md](../../../AGENTS.md): “credential rechecks” (same sentence as SEC-004) and [FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md) (every write validates the credential and the Member from PostgreSQL in the same scoped transaction). **Enforced by.** `apps/api/viewer.mjs:resolveViewer` and `apps/api/member-auth.mjs:resolveMember`, `authorizeWrite` (`SELECT … FOR UPDATE` on the Business).

### SEC-007 — Only the site's own origin may use the API
Relations: relates_to: FEAT-006, API-001; decided_by: ADR-004

**Status:** proposed. **Statement.** The hosted API SHALL answer only requests for the site's own HTTPS host and not marked `cross-site`; a write SHALL also carry an `Origin` equal to that host, `X-Zuri-Go: 1` and a JSON content type; the local server SHALL answer only requests whose `Host` is `127.0.0.1` and its port and whose `Origin`, when present, is the same.

**Source.** [AGENTS.md](../../../AGENTS.md): “origin checks” (same sentence as SEC-004). **Enforced by.** `apps/api/team-auth.mjs:cloudOriginAllowed`, `apps/api/cloud.mjs`, `apps/api/http.mjs:allowedRequest`, `apps/api/api.mjs` (write gate). **Tests.** `apps/api/test/team-auth.test.mjs`: “cloud requests pin HTTPS Host and require same-origin writes”; `apps/api/test/http.test.mjs`: “same-origin local API is available and cross-origin requests fail closed”.

### SEC-008 — Login attempts are limited persistently, without keeping addresses
Relations: relates_to: FEAT-006, API-002; decided_by: ADR-004

**Status:** proposed. **Statement.** The system SHALL count every login attempt in PostgreSQL before checking the code, in one global bucket (400) and one of 1,024 buckets chosen by a keyed digest of the client address (20), each for 15 minutes, SHALL answer 429 with `Retry-After` when a bucket is full, and SHALL NOT store the address.

**Source.** [AGENTS.md](../../../AGENTS.md): “persistent rate limits” (same sentence as SEC-004). **Enforced by.** `apps/api/team-auth.mjs:consumeLoginAttempt` (table `team_login_limits`), `apps/api/cloud.mjs`. **Tests.** `apps/api/test/team-auth.test.mjs`: “login limit counts attempts without keeping raw IPs and refuses exhausted bucket”; `apps/api/test/cloud-handler.test.mjs`: “rate limiting is persisted in PostgreSQL and denies after the per-bucket threshold”.

### SEC-009 — Row-level security is forced on every Business table
Relations: relates_to: NFR-010-001, NFR-011-001, ARCH-002, BR-001; decided_by: ADR-004

**Status:** proposed. **Statement.** Every table that holds Business data SHALL have row-level security enabled and forced, with a policy that admits only rows of the Business set for the request, and the role the application connects with SHALL NOT bypass row-level security.

**Source.** [AGENTS.md](../../../AGENTS.md): “RLS” (same sentence as SEC-004) and the [DOM-BIZ](../../domains/business/README.md) rule “row-level security is forced on the Business tables”. **Enforced by.** `apps/api/migrations/001_core.sql` (a `business_scope` policy and `FORCE ROW LEVEL SECURITY` on its tables) and the same pair in `003`, `004`, `005`, `006` and `007` for the tables they add; `apps/api/setup-local.mjs` creates the local role `zuri_go_app` with `NOSUPERUSER NOBYPASSRLS`. The production role is created outside this repository and its attributes were not checked here. The audience policies on top are NFR-011-001.

### SEC-010 — Every change is attributed to the server-derived actor
Relations: relates_to: FEAT-006, EVT-001, API-001; decided_by: ADR-004

**Status:** proposed. **Statement.** Every authenticated write SHALL record the Member and PID of the session in its change event, and a local write SHALL be recorded as the local operator; an event SHALL NOT claim a person the system did not authenticate.

**Source.** [AGENTS.md](../../../AGENTS.md): “audit attribution” (same sentence as SEC-004). **Enforced by.** `apps/api/service.mjs:audit`, `apps/api/workspace.mjs:writeDomain` (history events are stamped with the session's Member).

### SEC-011 — Local access is a trusted operator, never a Member session
Relations: relates_to: SRV-002, FEAT-006, API-001; decided_by: ADR-004

**Status:** proposed. **Statement.** The local server SHALL listen on `127.0.0.1` only and act as the local operator; no document, screen or event SHALL present that access as an authenticated Member session, and the hosted runtime SHALL refuse the operator viewer.

**Source.** [AGENTS.md](../../../AGENTS.md): “Local access is a trusted operator on `127.0.0.1:4319`; do not claim it is an authenticated Member session.” **Enforced by.** `apps/api/server.mjs` (`listen` on `127.0.0.1`, `allowedRequest`), `apps/api/viewer.mjs:resolveViewer` (an operator principal throws `VIEWER_OPERATOR_HOSTED` when `VERCEL` is `1`), `apps/api/api.mjs` (`GET /session` answers no member).

### SEC-012 — Every read resolves a viewer, and row-level security enforces the same audience
Relations: relates_to: FR-011-003, FR-011-004, FR-011-007, NFR-011-001, API-001; decided_by: ADR-004

**Status:** proposed. **Statement.** Every read SHALL resolve its viewer (Guest, Member or local operator) before it queries, and a read that sets no viewer SHALL read as a Guest; row-level security SHALL enforce item visibility through `zuri_go.viewer_kind` and `zuri_go.viewer_member`, so that a missed filter in application code does not leak an item.

**Source.** [AGENTS.md](../../../AGENTS.md): “every read resolves a viewer (Guest, Member or local operator), and row-level security enforces item visibility through `zuri_go.viewer_kind` and `zuri_go.viewer_member`. Do not add a read path that skips the viewer.” **Enforced by.** `apps/api/db.mjs:transaction` (the viewer is resolved first; no principal means Guest), `apps/api/viewer.mjs`, `apps/api/audience.mjs`, `apps/api/migrations/006_visibility.sql` and `007_tasks_projects.sql`. The behaviors are FR-011-003 and NFR-011-001; this entry is the standing rule that a new read path may not bypass them.

### SEC-013 — The Business-admin flag is set only by the operator tool
Relations: relates_to: FR-011-002, FR-011-001, API-003, EVT-001; decided_by: ADR-004

**Status:** proposed. **Statement.** The Business-admin capability SHALL be granted and removed only by the operator tool (`npm run members -- --admin <PID>` or `--no-admin <PID>`, with `--cloud` for production), the runtime database role SHALL be unable to set it, and being admin SHALL NOT widen what the admin may read.

**Source.** [AGENTS.md](../../../AGENTS.md): “The Business-admin flag (`members.is_business_admin`) is set only by `npm run members -- --admin <PID>` or `--no-admin <PID>` (add `--cloud` for production); the runtime role cannot change it.” **Enforced by.** the trigger `members_admin_guard` of `apps/api/migrations/006_visibility.sql` (error `42501` unless the session user owns the table), `apps/api/provision-members.mjs` (writes an `admin_granted` or `admin_revoked` event).

### SEC-014 — Registering a Member issues no credential
Relations: relates_to: FR-006-001, FR-006-007, API-004

**Status:** proposed. **Statement.** Registering or editing a Member through the API SHALL NOT create, change or disable a credential; only the operator tool issues, resets, disables or enables one.

**Source.** [DOM-IAM README](../../domains/identity-access/README.md) “Business rules”: “Registering a Member issues no credential; only the operator does.” **Enforced by.** `apps/api/migrate.mjs` (`REVOKE INSERT,UPDATE,DELETE ON zuri_go.member_credentials FROM zuri_go_app`), `apps/api/provision-members.mjs`.

### SEC-015 — Secrets and private custody never leave their place
Relations: relates_to: SRV-001, SRV-002, SEC-016, API-021

**Status:** proposed. **Statement.** Admin database URLs, session secrets, passwords, credential hashes, member-code handovers and backup contents SHALL stay private: they SHALL NOT be printed, committed, put in a browser bundle, a deployment package, a source snapshot, a patch, a screenshot or a public report; the FUNG connection token SHALL stay in browser memory and out of every record, backup and URL.

**Source.** [AGENTS.md](../../../AGENTS.md): “Admin URLs, session secrets, passwords, hashes and backup contents stay private. … Never print credentials or put them in browser bundles, source snapshots, patches, screenshots or public reports.” **Enforced by.** `.gitignore` (`.local/`, `.env*`), `scripts/deploy/build_cloud.py` (an allowlisted package), `apps/api/provision-members.mjs` (handovers written under `.local/` with mode `0600`), `apps/web/src/content/meeting/fung-client.mjs` (token in memory, FR-012-001).

### SEC-016 — The application connects with a restricted database role
Relations: relates_to: SEC-009, SRV-001, SRV-002

**Status:** proposed. **Statement.** The running application SHALL connect with the restricted runtime role (`zuri_go_app`, with only the grants `apps/api/migrate.mjs` gives it); the admin connection SHALL be used only by operator tools.

**Source.** [AGENTS.md](../../../AGENTS.md): “Use the restricted runtime role for application access.” **Enforced by.** `apps/api/config.mjs` (`databaseUrl` for the application, `adminUrl` for `migrate`, `provision-members`, `backfill-workboard`), `apps/api/migrate.mjs` (grants: no update of `change_events`, `ai_briefs`, `meeting_task_links`; no write to `member_credentials` or `metric_definitions`).

### SEC-017 — Destructive operations on a Business need specific authorization
Relations: relates_to: SEC-015, BR-015, BR-016

**Status:** proposed. **Statement.** Resetting or re-importing a Business, removing a database volume, rotating real codes and running a destructive migration SHALL NOT be done without the owner's specific authorization for that operation; a source move, a build, a Git push or a deployment SHALL NOT count as that authorization.

**Source.** [AGENTS.md](../../../AGENTS.md): “Never reset/reimport a Business, remove a database volume, rotate real codes, or run destructive migrations without specific authorization. A source move, build, Git push or deployment does not imply that authorization.” **Enforced by.** procedure, not code: the operator tools refuse some cases (`apps/api/backfill-workboard.mjs` needs `--production-authorized` to write in production; the import route refuses a Business that already has data, API-009).

### SEC-018 — The AI summary receives evidence only and cannot act
Relations: relates_to: FEAT-001, API-006, NFR-012-001

**Status:** proposed. **Statement.** The AI summary SHALL receive only the facts the API supplies, with no tool, no credential and no write access to campaigns or tasks; its answer SHALL be limited to choosing among the fact IDs it was given; the model endpoint SHALL be an explicitly configured loopback address, with no fallback to a cloud model.

**Source.** [DOM-BIZ README](../../domains/business/README.md) “Business rules”: “The AI summary receives only evidence supplied by the API and has no write access to campaigns or tasks” ([ARCH-001 §1](../../architecture/ARCH-001-baseline-architecture.md)). **Enforced by.** `apps/api/service.mjs:brief` (loopback host check, fixed prompt, `validateSummarySelection`, rule-based fallback), `apps/web/src/content/business/model.mjs:validateSummarySelection`.

### SEC-019 — A transcript leaves the recording machine only by an explicit, audited choice
Relations: relates_to: FR-011-010, API-020, API-022, FEAT-012; decided_by: ADR-004

**Status:** proposed. **Statement.** The content of a transcript SHALL NOT be sent to the cloud database as a side effect: the user chooses it and sees its scope first, and a confidential meeting's transcript stays on the recording machine until a participant uploads it with a reason that is recorded.

**Source.** [DOM-MTG README](../../domains/meetings/README.md) “Business rules”: “Sending a transcript to the cloud sends its content to a new destination: the user chooses and sees the scope first” ([ARCH-001 §5](../../architecture/ARCH-001-baseline-architecture.md)). **Enforced by.** `apps/api/workspace.mjs` (`custodyRevision`, `custodyBatch`, `uploadTranscript`), the `transcript_custody` column; FR-011-010 states the behavior.

### SEC-020 — Interim: no HR, accounting, salary or customer-personal content in records a Guest can read
Relations: relates_to: ADR-004, API-005, FR-011-007, PLAN-002

**Status:** proposed. **Statement.** Until a Guest's read of campaign, content, publication, goal and metric records is narrowed, the people who write them SHALL keep HR, accounting, salary and customer-personal content out of those records; a Guest reads of a Member only the ID, PID, display name and status.

**Source.** [AGENTS.md](../../../AGENTS.md): “Guests still read campaign records and, since 0.5.1, only each Member's ID, PID, display name and status (PLAN-002 Q1 defers the other levels, D16), so keep HR, accounting, salary and customer-personal content out of those records.” **Enforced by.** nothing in code (the snapshot does not filter those records, API-005); this is the interim rule of ADR-004 D9 and it ends with the decision on the visibility of campaign records (PLAN-003 V1).
