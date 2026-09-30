# Zuri-Go 0.3.0 — production verification

Verified 2026-09-30. Includes the 0.2.1 logo correction.

## Released version
- Production: https://zuri-metrics-map.vercel.app/
- Final deployment: `dpl_AQ7V9Ap7dGbKBQ8k2u4chhbZ8aXv`, READY.
- Deployment URL: https://zuri-metrics-jlijr7prj-pornpons-projects.vercel.app/
- Vercel project: `prj_8f3zf1qaZnRcAvWabOv1PWAPIABG` / `pornpons-projects`.
- Function region: Singapore (`sin1`). Vercel hosted build ran in `iad1`.
- Database: Neon `zuri-go-postgres`, Free plan (`free_v3`), Singapore.

## State and persistence
- Exact user file SHA256: `2bb504ad273595858c84af4f8b6ce7e94f414e5f6e364b88e8ec2678d907b938`.
- Imported into local and hosted PostgreSQL: 1 campaign, 11 tasks, 4 members, 1 weekly plan, 45 events; no transcript/audio.
- Local receipt: `c35a2ba1-8dd0-4f09-8bd5-91fd47bad325`.
- Cloud receipt: `9f4d4be5-522b-494f-8ee1-3c883a299837`.
- Source task/member fields and weekly assignments reconciled. Database IDs, row versions and canonical timestamps are normalized. All 45 original events preserved; ordering of events sharing timestamps may differ.
- Imported campaign lifecycle remains unconfirmed; no active/queued state or follower goal was invented.
- Actual Vercel API: create content, change its description, log in independently, read matching description from PostgreSQL. Test content `933c7fdd-80a1-4c5c-ba45-7d9f96276f52` was archived after the probe; no user task was edited or removed.
- Final production HTML SHA matched the local allowlisted package; public-origin authenticated read returned all imported campaigns/tasks/members.

## Access and packaging
- Anonymous API returns 401; wrong password rejected; same-origin shared login succeeds.
- Tampered/expired/wrong-business sessions rejected; cross-origin write returns 403.
- Secure, HttpOnly, SameSite=Strict cookie; 12-hour lifetime; persistent login attempt limits.
- Runtime role `zuri_go_app` verified non-superuser and non-BYPASSRLS; migration/admin credentials excluded from Vercel runtime environment.
- Marketplace initially injected owner connection variables. That automatic connection was removed after provisioning; the database remains provisioned and the application uses the restricted runtime URL via its own encrypted server variable.
- Only five ZURI_GO server variables remain in production. Secret and backup checks passed on the 44-file deployment package.
- Public requests for backend source, `.env.local` and `.local/team-access.txt` return 404.
- Shared login audit subject is `shared_team`; member attribution is not claimed by shared authentication.

## UI and logo
- Original source: `assets/logos/zuri-go/download.png`, SHA256 `e29d1b6a161c87728671ea94575fa84680ac7a311ed9d6afa54556623b9460d8`.
- App/guide copies match source bytes. CSS displays the Main Logo panel; no redraw or recoloring.
- Overview, navigation, campaign detail, all 18 guide masts and graph branding use this source.
- Production browser login, Overview and Weekly To-do verified; Weekly To-do displays 11 tasks, with 2 of 7 selected-priority tasks completed, matching imported state.
- Overview and guide at 390px viewport have 375px content/client width with no page overflow. Kanban retains its contained horizontal lane scroller. Protected tab-strip scrolling is unchanged.
- Initial anonymous probe no longer shows a false session-expired message; existing old shell title migrates to Zuri-Go before login.

## Checks
- 35 campaign model tests, 28 meeting/FUNG-contract model tests, 23 PostgreSQL/model/auth/API tests passed (86 total).
- Immediately after local restart, two HTTP probes raced startup and got ECONNREFUSED. Re-run after the listener was ready passed all 3 HTTP tests; no runtime error was recorded.
- 5 unified-site packaging tests passed.
- Metrics static audit: 18 pages, 38 metric cards, 40 graph terms; every page retains both mascots; no missing files/anchors.
- Protected Data app content/integrity build passed; app ID unchanged.

## Operational limits
- Use production as the team's canonical workspace. Local and cloud databases contain the imported baseline but do not synchronize future edits automatically.
- Shared password is in the private local `projects/zuri-go/.local/team-access.txt`; it is absent from public output and this report. Session signing and password hash are server secrets.
- AI still uses the documented rule-based summary unless separately configured. FUNG access to a local app is not made publicly reachable by deployment.
- Native UI backup exports campaigns/tasks; it is not a complete backup of the new content/goals/observation tables. Source backup and pre-import full local database dump remain private.
