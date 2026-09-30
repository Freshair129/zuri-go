# Zuri-Go 0.4.2 — single identity code

User-approved C-2 / HIGH authentication change. Active source: D:/workspace/zuri-go.

## Version diff: 0.4.1 → 0.4.2

| Before | After |
|---|---|
| PID plus personal password | One masked field: รหัสระบุตัวตน |
| Lookup by caller PID | Resolve one code owner across Business credentials; ignore caller PID/memberId |
| Potentially duplicated generated codes | Provisioning rejects a collision before persistence |
| Relocation verifier froze authored content | Honors existing editablePaths while preserving protected-runtime, asset and handover checks |

Existing personal codes, stable PID/UUID, Guest access and PostgreSQL schema 5 are preserved.

## Verification

- npm run build: passed protected runtime, authored ownership and packaging checks. Runtime SHA remains 9e3ede84b28aded3c7379b6e6a5611f0d95b9977eb0f781e279ceefabfcbd27e.
- npm test: 92 Node tests and 5 Python tests passed; metrics and extraction checks passed.
- New tests: ambiguous code including disabled duplicate, reversed candidate order, inactive account, invalid type/length, empty candidates; existing four-identity tests now use code alone and verify spoofed PID/memberId cannot change identity.
- Existing tests retain reset/revocation, signed sessions, origin/rate limits, Guest write denial, audit identity, file persistence and RLS coverage.
- Source form has one password input, new Thai label, no PID input, password-only POST and clear-on-close/success. Build hash matches the exact HTML served by both staged and public deployments.
- Staged and production HTTP/API: all four existing member codes authenticated to the correct PID and session; invalid code denied; Guest session readable and Guest writes denied. See stage.json and production.json.
- All local/cloud Business rows, credentials, tasks and attachments match pre-verification row digests. Only team_login_limits counters excluded because real login checks intentionally update them. See database-preservation.json. No migrations, imports or real code resets executed.
- Browser visual/interactions: NOT_RUN. Previous local browser tool was policy-blocked; no workaround attempted. HTTP/API and source/build evidence do not claim visual verification.

## Deployment

Production: https://zuri-metrics-map.vercel.app/
Deployment: dpl_5RcxZp63VibqbopFvSRboNmZhMaQ
Unique URL: https://zuri-metrics-h2lz95q39-pornpons-projects.vercel.app
HTML SHA256: 8fd179c7019e8a2b517079ad5676415c5ed6662354d274d02f452da79fd824b8
Snapshot SHA256 unchanged: 91b8e50eb23e5946ef83398ce2d32690cfa81577040aa75716e01fe05f4f1484

Deployment was staged with --prod --skip-domain, authenticated API tests ran before promotion; public-domain tests passed after promotion. Staged HTML comparison passed before promotion. Two operator verification-script issues (incorrect local HTML path, literal Thai text check against compiled encoding) were corrected without application changes; cached staged responses were revalidated. Rollback target: dpl_ATse1zzLoR3sqbeu4RsFR8zqmbWF (old PID/password form).

No known failing automated checks. Browser visual and resumed-write interaction remain unverified in this release. Implementation diff: version-diff.patch. Private test payloads and database digests remain under .local and outside the deploy allowlist.
