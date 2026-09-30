# Zuri-Go 0.3.1 — Guest access and task evidence

Verified and promoted on 2026-09-30. Complexity C-3; risk HIGH (authorization and file storage). Production: https://zuri-metrics-map.vercel.app/

Deployment: `dpl_C1VEVMPK1NrQwBKTDcnn18FF6YdT`, READY, unique URL https://zuri-metrics-r5hpfpfks-pornpons-projects.vercel.app . Main-domain HTML matches the built artifact SHA-256 `78ede59109560d27e9370de120ad2ec20a696e7d1fd4170ecc67a0b1edc9600a`.

## Version diff: 0.3.0 → 0.3.1
- Mandatory login wall → immediate PostgreSQL read-only Guest workspace and upper-right Guest mode badge.
- Write intent → shared-password modal. Successful login resumes the selected editor. Cancel changes nothing. Logout retains readable data.
- Existing task/member details are readable with disabled edit fields and an explicit login/edit action. Task status changes, campaign/business editors, inline reviews, meeting transcription/FUNG write controls, restore and AI brief generation are gated. Server write authentication remains authoritative.
- Task evidence text/links now has a files/images panel: 2 MiB each, 5 active files per task, preview for PNG/JPEG/GIF/WebP, download for other formats. Upload and removal save immediately. New tasks are saved before adding attachments.
- PostgreSQL migration 004 adds `task_attachments` with UUID PK, composite Business/Task FK, forced RLS, metadata/hash/bytea, and soft-delete. Legacy IDs resolve inside the configured Business to canonical task PKs.

## Evidence
- 25/25 backend tests passed, including actual PostgreSQL RLS/FKs, auth, all anonymous write denials, session tampering/expiry, origin checks, persistent rate limits, attachment byte round-trip, imported task IDs, invalid names/base64, 2 MiB size, concurrent 5-file limit, soft deletion and cross-Business isolation.
- 5/5 unified packaging tests passed. Protected Data app runtime hash remains `9e3ede84b28aded3c7379b6e6a5611f0d95b9977eb0f781e279ceefabfcbd27e`. 45 allowlisted deploy files; no private config/backup/password included.
- Hosted staging: public session/workspace GET 200, all 11 imported task attachment lists 200, POST/PATCH/PUT without session 401, login 200. See hosted-access.json.
- Production browser: no login wall after logout/reload/fresh navigation; Guest badge; create-campaign/status-change/edit-task/remove-file intents open the modal; cancellation retains read state. Login enables the task editor and resumes selected create-campaign form; test campaign form cancelled without creating data.
- Production browser uploaded both a WebP image and TXT file through the actual file chooser. Preview loaded (1215×1295). Reloaded in Guest and downloaded TXT; downloaded bytes match the local fixture. Independent HTTP downloads match both stored SHA-256 hashes. Authenticated removal returns 200 and subsequent public downloads return 404. See production-files.json.
- Temporary QA task `aebb53e1-7ad8-4487-a5d4-7a90c5022831` was archived, its own weekly membership removed, and its two files soft-deleted. Final visible data: 11 user tasks, 4 members, 11 weekly entries. QA audit history retained. No original task was used for upload tests.
- Desktop Overview verified at actual DOM width 1265 with no body overflow. Task attachments and login verified at narrow mobile width. Browser viewport overrides reset; screenshot files include guest-overview.png, attachments-mobile.png, attachments-guest-mobile.png and login-modal.png. Earlier files with desktop in their names were captured from an existing narrow tab; guest-overview.png is the verified wide view.
- Local server restarted with migration 004; three local HTTP checks pass. Local and production remain separate databases.

## Architecture and documentation review
Guest GET routes are restricted to the configured Business. Mutations require signed team cookies plus same-origin JSON headers. Login remains scrypt-verified with PostgreSQL attempt counters. Uploads are bounded and serialized by Business revision; metadata/audit rows exclude bytes. Downloads enforce no-store, nosniff, safe raster preview MIME or attachment octet-stream with sandbox CSP. No credentials are embedded in frontend assets. Parent cloud spec and peer data model amended, README updated; no protected shell or app-ID changes.

## Operating limits
Shared password gives team write access but not individual member identity. Anyone with the URL can read workspace data and evidence, as requested. Files larger than 2 MiB use the existing link field. v2 JSON backup does not contain attachment bytes; full PostgreSQL backups do. FUNG still requires the user's local FUNG instance; its external connection/audio/AI behavior was not exercised in this guest/file release. Existing archive-only QA content from 0.3.0 remains unchanged.

No known regression in the tested paths. Full source diff: version-diff.patch.
