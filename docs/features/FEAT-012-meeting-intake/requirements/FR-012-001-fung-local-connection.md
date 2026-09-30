---
id: FR-012-001
title: Connection to FUNG on this machine
delivery: implemented
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
---

# FR-012-001 — Connection to FUNG on this machine

The system SHALL connect only to a FUNG Desktop at a loopback address on the same machine, using the Connect URL the user pastes from FUNG › Settings › Runtime; SHALL show FUNG as connected only after FUNG has answered an authenticated request; and SHALL keep the connection token in browser memory only.

## Acceptance criteria
- AC-012-001-01 — Given a pasted Connect URL whose host is not `127.0.0.1`, `localhost` or `[::1]`, or that carries a user name, a password, a query, a path other than `/`, or no token in its fragment (or a token longer than 512 characters or containing a space), when the user connects, then it is refused before any request is sent, with “เชื่อมต่อได้เฉพาะ FUNG บนเครื่องนี้” or “Connect URL ต้องมี token ของรอบที่เปิด FUNG”.
- AC-012-001-02 — Given a valid Connect URL, when the user connects, then the first request is `GET /recordings` with the token only in an `Authorization: Bearer` header (never in a URL), redirects refused and credentials omitted; the screen shows “FUNG connected” and the recording list only after that request succeeds.
- AC-012-001-03 — Given that connection, then the client asks `/integrations/meeting-task-manager/v1/capabilities`; a 404 leaves the connection in legacy mode (no snapshot or action-draft route), and a `protocolVersion` other than 1 is refused with “Protocol ตัวเชื่อม FUNG ยังไม่รองรับ”.
- AC-012-001-04 — Given a FUNG that answers 401, then the message begins “Token หมดอายุหรือไม่ถูกต้อง”; given a FUNG that does not answer, then it reads “ติดต่อ FUNG ไม่ได้ …”; given another status, then it reads “FUNG ตอบ HTTP nnn”; in none of these cases is the connected state shown.
- AC-012-001-05 — Given a connection, then the token is not stored in any task, meeting or backup, and not in the page URL; when the user chooses “ยกเลิกการเชื่อมต่อ” (or write access is lost) the token is cleared and a later request is refused with “ยกเลิกการเชื่อมต่อแล้ว”; after FUNG restarts, a new Connect URL is needed.
- AC-012-001-06 — Given no FUNG connection, then meetings already imported can still be opened and reviewed; playing reference audio and requesting drafts are refused until the user connects again (“เชื่อม FUNG เพื่อเล่นเสียง”, “เชื่อมต่อ FUNG ก่อนสร้างร่างด้วยโมเดล”).

## Implementation
- `apps/web/src/content/meeting/fung-client.mjs`: `parseConnection` (AC-012-001-01), `createFungClient` with `request` (origin check, `redirect: 'error'`, `credentials: 'omit'`, the 401 / network / HTTP messages), `connect` (AC-012-001-02 to -04) and `disconnect` (AC-012-001-05).
- `apps/web/src/content/meeting/Meetings.jsx`: `Meetings` (`connect`, `disconnect`, the connection panel with the password-type field and the note “Token ใช้เฉพาะการเปิดหน้านี้ ไม่รวมใน Backup”); `connect` goes through `requestWrite`, so a Guest is asked to sign in first and the connection is dropped when write access is lost.
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “connector refuses non-loopback, credentials, paths and query secrets”, “connection checks authenticated recordings; bearer never goes in URL”, “unauthorized connection remains an error”. AC-012-001-06 has no test of its own.
- Run locally on 2026-10-01: the 36 tests of `model.test.mjs` pass (no database needed).

## Notes
- Origin: FEAT-004 MT-05 ([spec](../../FEAT-004-meeting-task-manager/spec.md) §5). The [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PASS for the authenticated connection and its errors against a fixture (2026-09-30).
- Not run: a connection to an installed FUNG Desktop (the adapter routes live in the separate FUNG repository and were not built into the installed app), and a connection from the production page to a FUNG on the user’s machine. The 0.5.0 production checks did not cover it ([verification](../../../releases/0.5.0/verification.md)).
- The design is in [SDD-004](../../FEAT-004-meeting-task-manager/design.md) section 3.1 (Thai): loopback only, no proxy through the server, no LAN listener, no port scan.
