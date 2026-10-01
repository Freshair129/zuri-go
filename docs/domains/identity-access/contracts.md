# DOM-IAM — API contracts

API contracts owned by [DOM-IAM](README.md) ([STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). Transport, authorization and the error envelope are [API-001](../platform/contracts.md#api-001--http-api-transport-authorization-and-error-envelope). All are `proposed` and written on 2026-10-01 from the code of release 0.5.1.

### API-002 — Session, login and logout
Relations: relates_to: FEAT-005, FEAT-006, FEAT-007, FR-011-003, API-001; decided_by: ADR-004
Owner: DOM-IAM

**Status:** proposed. **Code:** `apps/api/cloud.mjs` (`/login`, `/logout`, `/session`), `apps/api/api.mjs` (local `/session`), `apps/api/member-auth.mjs`, `apps/api/team-auth.mjs` (`consumeLoginAttempt`, `sessionCookie`), `apps/api/viewer.mjs`.

| Operation | Served by | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| `GET /session` | SRV-001 | Guest, Member | none | 200 `{authenticated, member, admin, teamIds, businessId, storage:"postgresql-cloud"}`. `member` is `{memberId, pid, displayName}` or null; `admin` is the Business-admin flag; `teamIds` are the Member's team IDs (`[]` for a Guest) | none beyond API-001 |
| `GET /session` | SRV-002 | operator | none | 200 `{authenticated:true, storage:"postgresql-local", businessId}`; no `member`: the loopback workspace is not a Member session | none |
| `POST /login` | SRV-001 only | Guest | `{"password": string}`, 1 to 256 characters | 200 `{authenticated:true, member:{memberId, pid, displayName}, businessId, storage}` and two `Set-Cookie` headers (below) | 401 `{"error":"รหัสระบุตัวตนไม่ถูกต้อง"}` for no match, more than one match, an inactive Member, a disabled credential, a non-string or oversize value (one answer for all, no `code`); 429 `{"error":"ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที"}` with `Retry-After: 900` |
| `POST /logout` | SRV-001 only | none needed | `{}` (the write gate of API-001 applies) | 200 `{authenticated:false}` and the same two cookies cleared | none |

- **Cookie.** Login sets `__Host-zuri-go-member=<token>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200` and, in a second header, clears the retired Business-only cookie `__Host-zuri-go-team` (`Max-Age=0`). Logout clears both. The token is `base64url(payload).base64url(HMAC-SHA256)` with payload `{v:2, b: businessId, m: memberId, cv: credentialVersion, exp, n}` and a lifetime of at most 12 hours; a token of another version, Business, signature or age is treated as no session.
- **The request names no Member.** The login body carries only the code; a `pid` or `memberId` sent with it has no effect on which Member is found (FEAT-007; SEC-002, SEC-003). The server compares the code with every credential of the Business and signs in only when exactly one matches and its Member is active and its credential enabled; when the Business holds no credential at all it still pays one dummy hash comparison.
- **Rate limit.** Every login attempt, successful or not, is counted before the code is checked: one global bucket of 400 and one of 1,024 buckets chosen by an HMAC digest of the client address, 20 per bucket, each for 15 minutes, in `team_login_limits` (SEC-008). The address itself is not stored.
- **Idempotency.** None: each login counts an attempt and issues a new token.
- **Local.** `/login` and `/logout` do not exist on SRV-002; they answer 403 `Business access denied` (API-001).
- **Specified by.** [FEAT-007 spec](../../features/FEAT-007-single-code-login/spec.md), [FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md), [FEAT-005 spec](../../features/FEAT-005-guest-access/spec.md); the viewer behind `GET /session` is [FR-011-003](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-003-viewer-identity.md). The sign-in and Guest requirements have no FR files yet (PLAN-001 WI-06).

### API-003 — Teams
Relations: relates_to: FR-011-001, FR-011-002, API-001; decided_by: ADR-004
Owner: DOM-IAM

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/teams.mjs`, routed in `apps/api/api.mjs`.

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /businesses/{b}/teams` | Member, operator | none | 200 an array of `{id, business_id, name, archived_at, created_at, updated_at, row_version, memberIds}`, active teams first then by name; `memberIds` are the Members' IDs as the workspace names them | 401 (code null) for a Guest |
| `POST /businesses/{b}/teams` | Business admin, operator | `{name, memberIds?}` | 200 the team as above | 403 `เฉพาะผู้ดูแลธุรกิจจัดการฝ่ายได้`; 422 `ระบุชื่อฝ่าย` (create without a name); 422 `ระบุชื่อฝ่ายไม่เกิน 80 ตัวอักษร` (a `name` that is empty after trimming, on create or `PATCH`, or over 80 characters, on either); 422 `ข้อมูลไม่รองรับ: …` (a field not listed); 422 `รายชื่อสมาชิกไม่ถูกต้อง` (`memberIds` is not an array); 422 `ไม่พบสมาชิกในธุรกิจนี้` (an ID that is no Member of the Business) |
| `PATCH /businesses/{b}/teams/{id}` | Business admin, operator | `{row_version, name?, archived?, memberIds?}` | 200 the team | as above, plus 404 `ไม่พบฝ่าย`, 409 `ข้อมูลถูกแก้แล้ว กรุณาโหลดใหม่` |

- `archived: true` sets `archived_at` (kept if already set) and `false` clears it; `memberIds` replaces the whole membership and accepts a Member's ID or the ID the workspace uses; a duplicate active name is refused by PostgreSQL as 422 (`23505`, an index on the lower-cased name).
- A change to a team raises the Business revision, because membership decides who sees team items. Being a Business admin widens no read (FR-011-002).
- **Idempotency.** None on create; update by `row_version`.
- **Specified by.** [FR-011-001](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-001-teams.md), [FR-011-002](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-002-business-admin.md).

### API-004 — Member registry
Relations: relates_to: FR-006-001, FR-006-002, FR-006-003, FR-006-004, FR-006-006, FR-010-019, API-001
Owner: DOM-IAM

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/service.mjs` (`save` resource `members`, `checkMemberWrite`, `canEditMembers`, `guestMember`), `apps/api/workspace.mjs` (the same checks on the workspace save, API-008).

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /businesses/{b}/members` | Business admin, operator | `display_name` and any of `full_name`, `nickname`, `team`, `position`, `email`, `phone`, `notes`, `status` | 200 the member row, with the server-assigned `pid` | 403 `เฉพาะ Business admin แก้ทะเบียนสมาชิกของคนอื่นหรือเพิ่มสมาชิกได้` for another Member; 422 for a field not listed (a `pid` is refused) or a value PostgreSQL refuses (`status` is `active` or `inactive`) |
| `PATCH /businesses/{b}/members/{id}` | the Member for their own details; Business admin or operator for any Member | the fields above and `row_version` | 200 the member row | 403 `เปลี่ยนสถานะของตัวเองไม่ได้ ติดต่อ Business admin` when a Member (admin included) changes their own `status`; the 403 above for another Member's record; 404; 409 |

- A request that changes nothing in the stored row is not refused for lack of the role. The PID is assigned and made immutable by PostgreSQL (BR-008). A Guest reads only `id`, `pid`, `display_name` and `status` of a Member on every read route (`guestMember`, FR-011-007).
- The registry issues no credential and sends nothing to a Member (SEC-014, FR-006-007).
- The rule that a new R, A, C or I must be an Active Member is enforced on the task routes (API-016, API-008), not here.
- **Idempotency.** None on create; update by `row_version`.
- **Specified by.** [FR-006-001](../../features/FEAT-006-member-identity/requirements/FR-006-001-register-member.md) AC-006-001-07, [FR-006-002](../../features/FEAT-006-member-identity/requirements/FR-006-002-rename-keeps-references.md) AC-006-002-04, [FR-006-003](../../features/FEAT-006-member-identity/requirements/FR-006-003-inactive-not-offered.md), [FR-006-004](../../features/FEAT-006-member-identity/requirements/FR-006-004-inactive-history-and-reactivation.md) AC-006-004-05.
