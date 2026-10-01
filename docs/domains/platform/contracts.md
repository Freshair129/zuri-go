# DOM-PLT — API contracts

API contracts owned by [DOM-PLT](README.md) ([STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)); each is declared by its heading ([STD-002 R2](../../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)). Every other contract of the HTTP API under `/api/zuri-go/v1` states only what is particular to its own routes and relies on this one for the shared transport, authorization and error rules. All contracts are `proposed`: they were written on 2026-10-01 from the code of release 0.5.1 (`apps/api/`), not from an earlier design, and each says where the code and an approved document differ. Contract index: the domain folders `identity-access`, `business`, `campaign`, `metrics`, `tasks` and `meetings` hold `contracts.md` for API-002…API-022 and EVT-001; [SRV-001](../../services/SRV-001-hosted/SERVICE.md) and [SRV-002](../../services/SRV-002-local/SERVICE.md) list which of them they serve.

### API-001 — HTTP API transport, authorization and error envelope
Relations: relates_to: FR-011-003, FR-010-009, FR-010-010, SDD-010, SDD-011, ARCH-001, ARCH-003, SRV-001, SRV-002; decided_by: ADR-004
Owner: DOM-PLT

**Status:** proposed. **Served by:** SRV-001 (hosted) and SRV-002 (local). **Code:** `apps/api/cloud.mjs` (hosted entry), `apps/api/server.mjs` (local entry), `apps/api/api.mjs` (`handleApi`, `send`, `sendError`), `apps/api/http.mjs`, `apps/api/db.mjs`, `scripts/deploy/build_cloud.py` (rewrite).

**Base path and entries.**

- Base path `/api/zuri-go/v1`. Hosted: the Vercel function `api/index.mjs` exports `apps/api/cloud.mjs`; the rewrite `/api/zuri-go/v1/:path*` → `/api/index?route=:path*` (`build_cloud.py:38`) puts the route in the `route` query parameter, which the handler prefers, and `maxDuration` is 30 seconds (`build_cloud.py:37`). Local: `server.mjs` passes every path that starts with the base path to `handleApi` as the trusted operator.
- Methods: `GET`, `POST`, `PATCH`, `PUT`. Any other method answers 405 `Method not allowed`.
- Business scope: every business route is `/businesses/{businessId}/…`. `businessId` is 36 characters of lowercase `a-f`, `0-9` and `-`, and must equal the one Business the runtime is configured for; anything else, including any route that does not match the route table, answers 403 `Business access denied` (code null), never 404. The Business is never taken from the request body.
- IDs in paths and bodies are UUIDs (lowercase hexadecimal in routes), except the task reference of the attachments route (API-018).
- Success is always status 200 with a JSON body (no 201 and no 204), except the attachment download (API-018).

**Write gate.** A request that is not `GET` must carry `X-Zuri-Go: 1` and a `Content-Type` that starts with `application/json`, otherwise 403 (hosted `ใช้แบบฟอร์มจากเว็บไซต์`, local `Use the same-origin application`; code null). The body is JSON of at most 26 MiB (`26*1024*1024` bytes): larger answers 413 `ข้อมูลเกิน 26 MB`, unparseable answers 400 `JSON ไม่ถูกต้อง`.

**Principals and authorization.**

| Principal | How it arrives | May |
|---|---|---|
| Guest | Hosted request without a valid Member cookie (or whose Member is no longer active, enabled and at the same credential version) | Read what a Guest may read (FR-011-007); no write |
| Member | Hosted request with the `__Host-zuri-go-member` cookie (API-002) | Read within the Member's audience; write |
| Operator | Local server only; `viewer.kind` `operator` (FR-011-003) | Read everything; write, attributed as `local_operator` in the audit |

- Hosted order of checks (`cloud.mjs`): 503 `Workspace ยังตั้งค่าไม่ครบ` when the runtime is not fully configured (no code) → 403 `เปิดผ่านเว็บไซต์ Zuri-Go เท่านั้น` when the host or origin is not the site's own HTTPS origin, or `Sec-Fetch-Site` is `cross-site` (a write also needs an `Origin` equal to the site's origin) → 405 → 403 write gate → `POST /login` and `POST /logout` (API-002) → 401 for a write without a valid session → `GET /session` → 403 for any `/businesses/{id}/imports…` route (API-009) → `handleApi`.
- Hosted write without a session: 401 `{"error":"เข้าสู่ระบบด้วย รหัสระบุตัวตนก่อนแก้ไข","code":"AUTH_REQUIRED"}`, before the route is looked at. With a session, every write transaction locks the Business row (`SELECT … FOR UPDATE`) and re-resolves the Member; a Member whose credential was disabled, reset or changed since the cookie was issued is a Guest again and the write answers 401 `AUTH_REQUIRED` (`กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน`). A read that needs a Member (teams, the `mine` board) answers 401 with code null.
- Local: a request whose `Host` is not `127.0.0.1:{port}`, whose `Origin` is not `http://{host}`, or whose `Sec-Fetch-Site` is `cross-site` answers 403 `Local access only`. There is no session and no login.
- Every request runs in one PostgreSQL transaction at `REPEATABLE READ` with the Business and the viewer set for row-level security (`db.mjs`); the actor of a write is derived from the session, never from the body (SEC-003).

**Response headers.** Every JSON answer carries `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-store`. Hosted and local both add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: same-origin`.

**Error envelope.** `{"error": <Thai message>, "code": <string or null>}`. `sendError` takes the status in this order: the `status` of the error that was thrown; otherwise a PostgreSQL error `23502`, `23503`, `23505`, `23514`, `22P02`, `22007` or `22008` is 422 with `ข้อมูลขัดกับข้อกำหนดหรือรายการที่อ้างอิง กรุณาตรวจอีกครั้ง`; `40001` (serialization failure) is 409 with `ข้อมูลถูกแก้จากอีกหน้าต่าง กรุณาโหลดใหม่`; `ENOENT` is 404 `ไม่พบรายการ`; anything else is 500 `บันทึกไม่สำเร็จ กรุณาลองใหม่` (the message is not returned and only the code or name is logged). `code` is the thrown error's code (a rule code of the contracts below, or the PostgreSQL SQLSTATE) or null. The answers that `cloud.mjs` writes itself (503, the origin and write-gate 403, 405, the login 401 and 429) carry `error` only, and the 401 `AUTH_REQUIRED` carries both.

| Status | Meaning in every contract |
|---|---|
| 401 | A write without a Member session (`AUTH_REQUIRED`), or a read that needs a Member (code null) |
| 403 | The Business does not match, the Member lacks the role the route needs, or a visibility change is not allowed |
| 404 | The item does not exist or the viewer may not read it, and the answer is the same for both (FR-011-007, FR-011-008) |
| 409 | A stale `row_version`, a reused idempotency key with other data, a serialization failure, or an item the viewer cannot see already holds the ID |
| 413 | Body or attachment too large |
| 422 | A rule violation; the `code` names the rule where one exists |

**Concurrency and idempotency, shared.** An update carries `row_version`; a different value answers 409 and nothing changes. A create is idempotent only where its contract says so (tasks, publications, the meeting commit, import commit, briefs); every other create makes a new record each time it is sent. Every successful mutation of a record raises `businesses.domain_revision`, which open clients use to reload; observations (API-015) and briefs (API-006) do not.

**Record routes (`save`).** `POST /businesses/{b}/{resource}` creates and `PATCH /businesses/{b}/{resource}/{id}` updates a record of `members`, `channels`, `campaigns`, `content`, `publications` or `goals` (API-004, API-007, API-010, API-011, API-012, API-014). The shared behavior is `apps/api/service.mjs:save`.

- An unknown `resource` answers 404 `ไม่พบ resource`. A `GET` on one of these resources answers 404 `Not found` (there is no list route; clients read `/state`, API-005).
- A field that the resource does not list is refused with 422 `ข้อมูลไม่รองรับ: …` (code null); `row_version`, `channel_ids` and `series_ids` pass this check for every resource but only the resource that uses them acts on them. A string that is empty after trimming is stored as null.
- An update needs `row_version`, compared as numbers (the value may be sent as a number or as the bigint string the response carried): a missing or different value answers 409 `ข้อมูลถูกแก้แล้ว กรุณาโหลดใหม่` (code null); an unknown `id` answers 404 `ไม่พบรายการ`; a body with nothing to change answers 422 `ไม่มีข้อมูลที่จะเปลี่ยน`.
- A field named `url`, `asset_url` or `published_url` must be an `http` or `https` URL without a user name or password (422 `URL ไม่ถูกต้อง` or `ใช้ URL http/https ที่ไม่มี credential`).
- Campaigns and content items get a code (`CAM-0001`, `CNT-0001`) from a counter locked in the transaction on create.
- The answer is the stored row with its snake_case columns; `row_version` is the PostgreSQL bigint and arrives as a string. Every create and update writes a change event (EVT-001) with the table name as the entity type.

**Not part of this contract.** The static site routes of the local server; the FUNG Desktop interfaces the browser calls (API-021, API-022); the operator command-line tools (`npm run members`, `npm run db:migrate`, `npm run backup`), which are not HTTP.
