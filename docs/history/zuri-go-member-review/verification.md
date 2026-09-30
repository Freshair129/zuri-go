# Zuri-Go 0.4.0 — Member identity release

Verified and promoted 2026-09-30. Complexity C-3; risk HIGH (authentication, actor identity and schema migration). User approved `ZGO-AUTH-002` before implementation.

## Released version
- Production: https://zuri-metrics-map.vercel.app/
- Deployment: `dpl_ATse1zzLoR3sqbeu4RsFR8zqmbWF`, READY, promoted successfully.
- Unique URL: https://zuri-metrics-nae2xc7zx-pornpons-projects.vercel.app/
- Initial staged verification: `dpl_FW5sidNvrQDUBAyAGrqjqvJnbrjS`, https://zuri-metrics-6fs100q7q-pornpons-projects.vercel.app/ . Final rebuild removed the obsolete shared-password environment variable.
- Main-domain HTML equals packaged SHA-256 `afe09e664a0b039665ae83d28ed8803d7eaafa063ea585b5842bdd71d7fce777`.
- Existing Vercel project, Neon Singapore database and Business retained. App ID and protected runtime remain unchanged; runtime SHA-256 `9e3ede84b28aded3c7379b6e6a5611f0d95b9977eb0f781e279ceefabfcbd27e`.

## Version diff: 0.3.1 → 0.4.0
| Before | After |
|---|---|
| Shared team password | Independent 24-character random passwords for four Members |
| Business-only team cookie | Signed Member UUID + credential-version cookie |
| Team badge | Signed-in Member name + PID |
| Member UUID / legacy ID only | Stable public PID; existing UUID PK and relationships retained |
| Shared actor / client task-event label | Server-derived Member UUID + PID on new authenticated writes |
| Guest read-only workspace | Preserved, including task evidence downloads |

Full authored source/doc diff: [version-diff.patch](version-diff.patch). Generated HTML and duplicate deploy copies are identified by build hashes rather than embedded as multi-megabyte patches.

## Identity and handover
| Member | PID | Existing canonical Member UUID |
|---|---|---|
| Chef | ZGO-P0001 | c0a536e6-b701-4868-a2dd-b2fe0517ea47 |
| Boss | ZGO-P0002 | c058670c-8808-4a8a-af5b-26fc92462156 |
| Tong | ZGO-P0003 | d94913fc-0c84-46ff-ac0a-b7a69e2bbdd0 |
| K’jeab | ZGO-P0004 | 9cff23e9-3992-4819-a3f8-9746fb4b5f75 |

Credentials were provisioned once, version 1. Each private handover is `projects/zuri-go/.local/member-access/production/<PID>.json`. They are not included here, in frontend output, generic JSON backups or deployment files. No messages were sent to Members. The old shared password is rejected by the production login API; the old team cookie is not a supported session contract.

## Migration and architecture review
- Private checkpoints: local full SQL dump and `.local/backups/cloud-pre-member-identity-2026-09-30.sql` (576,888 bytes), before migration. Cloud PostgreSQL 18 required matching pg_dump 18; the initial pg_dump 17 mismatch produced no valid dump and was replaced with a successful matching-version dump. Restore was not exercised.
- Migration 005 applied locally and in Neon. Backfill uses preserved import identities, leaves UUID PK/FKs intact and sets unique immutable PIDs. The existing `change_events.actor_member_id` FK is reused. See the migration RCA for the pre-cloud duplicate-column correction.
- Credential table has forced Business RLS. Actual production runtime role is non-superuser, NOBYPASSRLS, with SELECT only on credentials (INSERT/UPDATE/DELETE denied). No API exposes credential rows.
- Every hosted mutation validates the current Member/credential version in the same transaction as the mutation. Business-row locking serializes reset/disable and writes; repeatable-read conflicts fail rather than authorize from a stale snapshot. Actor context is reset before and after pooled transactions.
- New task events override supplied actor identity using the authenticated session; old history is retained. Attachment upload/delete gains canonical Member FKs. PID cannot be assigned or changed by ordinary requests, and profile metadata excludes credential fields.
- Operator CLI remains outside deployment; initial provisioning is idempotent. Explicit reset/disable/enable increments credential version. Active-profile checks apply independently. Local loopback-only access stays trusted local operator, with no inferred Member identity.
- Four production server variables remain: restricted database URL, Business ID, session secret and allowed origin. `ZURI_GO_TEAM_PASSWORD_HASH` was removed before final deployment. Prior deployments are historical artifacts; this release does not delete them.

## Verification evidence
- **28/28 backend tests**: PostgreSQL constraints/RLS, cross-Business denial, existing domain behavior, PID allocation/immutability, provisioning idempotence, credential reset/disable/enable, inactive Member, valid/invalid/expired/tampered/wrong-Business sessions, old cookie rejection, four PID/password bindings, server actor attribution, forged actor rejection, Guest writes, evidence bytes/limits/deletion and persistent login limits.
- **5/5 unified-site packaging tests** and protected Data app build passed. **46 allowlisted deployment files** scanned against actual private credential/config values. No private handover, provisioning CLI, migrations or backups deployed. `.gitignore` is explicitly excluded by packaging, not counted as a deployment file.
- Staged API: all four actual Members authenticated; each created a disposable QA content record and archived it. PostgreSQL change events matched the canonical Member UUID and PID. Guest reads 200; Guest POST/PUT/PATCH/upload 401; wrong PID/password pair and old shared password 401. See [staged-identity.json](staged-identity.json).
- Production API repeated four real logins, isolated creates, actor checks and QA archives. Main-domain HTML matches the built artifact. User workspace data stayed identical except expected aggregate revision increments: **1 campaign, 11 tasks, 4 Members, 11 weekly entries**. See [production-identity.json](production-identity.json).
- Production browser: Guest add-task opens PID/password modal; real Chef login shows `Chef · ZGO-P0001` and resumes the add-task editor. Cancelled without creating a task. Member cards show all four PIDs; details show immutable PID and copy action. Logout returns to Guest and keeps Members readable. Actual DOM width 1265, scroll width 1265. Screenshots: [member-identity.png](member-identity.png), [login-modal.png](login-modal.png).
- Public guide route returns 200. Private environment file, per-member handover path and backend source path return 404. [package-database.json](package-database.json) records production role, credential permissions and Member mapping without secrets.
- Two verification assumptions were corrected with evidence: PID scope trigger rejects earlier than table RLS, and isolated content writes legitimately increment the shared workspace revision. See `.brain/rca/zuri-go-member-verification-expectations.md`. A transient first deploy returned `Not authorized`; authenticated account/team inspection succeeded and the retry deployed normally.

## Limits and exit criteria
All approved release acceptance paths above passed; no known regression in tested paths. This release keeps shared editor permissions for active Members, with no granular roles or self-service password recovery. New Member profiles receive PID automatically but need the trusted operator to provision login. Disabling a profile blocks sessions while inactive; use credential disable/reset for permanent session revocation before later reactivation. Full database restore, external FUNG operation and AI provider execution were not part of this identity release. Guest visibility and local/cloud separation remain as previously approved. Only disposable QA content was archived; user tasks and history were preserved.
