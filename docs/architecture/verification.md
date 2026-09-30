# Zuri-Go 0.2.0 — local delivery verification

Date: 2026-09-30. Complexity C-3, risk HIGH (new local persistence and schema). Documentation approval and local-machine destination were supplied by the user. No production migration/deployment performed.

## Version diff

| Before | 0.2.0 |
|---|---|
| Overview of one selected campaign | Business Overview, explicit active/queued counts and all-campaign drilldown |
| Campaign metrics only | Monthly content inventory plus per-channel publication schedule and seven-day calendar |
| Campaign targets Low/Mid/High | Existing targets retained; new weekly/monthly Business actual/target goals |
| Browser-only workspace | PostgreSQL 17, 25 tables, UUID PKs, Business-scoped composite FKs and forced RLS |
| Separate browser persistence assumptions | Campaign/meeting compatibility adapter with optimistic revisions, stable imported identities and atomic import |
| Campaign Mission Control product title | Zuri-Go — Let’s Go to Market. Together |

Existing source modifications are captured in [version-diff.patch](../history/zuri-go-review/version-diff.patch). New authored components live in `campaign-mission-control/src/content/business/`; new backend, DDL, tests, startup and backup utilities live in `apps/api/`. This workspace is not a Git repository, so the patch compares saved before-files rather than Git commits.

## Verified

- **79 Node tests passed**: 63 existing campaign/meeting tests and 16 new business model / actual PostgreSQL / HTTP tests. [Raw output](../zuri-go-review/tests.txt).
- **5 packaging tests passed**; the existing manifest-driven static packager remains intact.
- Protected Data app authoring/build verification passed. App ID unchanged: `dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1`. Runtime SHA `9e3ede84b28aded3c7379b6e6a5611f0d95b9977eb0f781e279ceefabfcbd27e`.
- Real PostgreSQL tests: runtime role is neither superuser nor BYPASSRLS; cross-Business reads/writes/FKs rejected, R/A uniqueness, optimistic conflicts, publication approval, immutable briefs, observation revisions, and import/save/retry/reload with stable task IDs and FUNG evidence.
- Net followers: 1,320 minus 1,000 displays **320 / 500, 64%**. Missing baseline remains unknown. Zero, negative actuals, over-target progress, stale/misaligned account scopes and month/week boundaries are covered.
- Browser UI: new content persisted after reload; manual task assigned to Boss with Must priority; Business card drilldown selected the active filter; campaign detail loaded the selected SQL campaign; rule summary generated and exposed evidence; Graph route opened within the same origin.
- Mobile viewport requested at 390×844 (375 CSS content pixels after scrollbar): Overview and calendar `scrollWidth == clientWidth`, seven calendar day cells / three fixture publications, mascots loaded. Viewport override reset after testing.
- User import preview: **1 campaign, 6 tasks, 4 members, 0 meetings**. Preview only. Confirmed the configured user Business still has **zero campaign/task/member/content/goal rows**. Browser originals were not overwritten.
- Private database URL, admin URL and configured user Business ID literals were absent from the static package. Local server binds 127.0.0.1 and rejects hostile Host/Origin/cross-site requests. Thai JSON survives byte-split HTTP payloads.
- Full private PostgreSQL dump generated successfully under backend `.local/backups/`. Startup helper recognized the running local app. Restore into a fresh database was not exercised.
- Existing Metrics static QC: 18 guide pages, 38 cards, 40 graph terms, two mascots across 18 pages, 2D/3D controls, background presets and no missing local references/anchors. No new print/PDF rendering run.

## Visual / brand review

Reused the existing named mascot pair assets and corporate SVG. The user-approved Zuri-Go name/tagline is rendered as a product UI title, not supplied as a new final logo master. Exact brand ink/amber tokens, textured canvas, contrasting CTAs, readable Thai and responsive layouts are retained. No new raster/logo generation or promotion to `output/approved/` occurred.

- [Desktop fixture screenshot](../history/zuri-go-review/overview-qa-desktop.png)
- [Mobile fixture screenshot](../history/zuri-go-review/overview-qa-mobile.png)
- [Mobile content calendar](../history/zuri-go-review/content-qa-mobile.png)
- [User import preview](../history/zuri-go-review/import-preview.png)

All marketing figures in QA screenshots are **synthetic test data in a separate Business**, not user actuals.

## Operational boundaries

The live local app is `http://127.0.0.1:4319/?view=1&tab=overview`. PostgreSQL is local on 127.0.0.1:54329. The existing Vercel deployment was not changed. Current members are profiles, not login accounts; social publication is manual.

Summary fallback is **rule-based**, explicitly labeled in the UI. The optional loopback Ollama fact-selection adapter is implemented but no model is configured or verified here. FUNG compatibility was tested with fixtures; live FUNG transcription/AI generation was not exercised in this turn.

The first import remains an explicit user action in the reviewed UI. Existing SQL data cannot be overwritten through the old browser Restore action. Full DB backup instructions and local startup are in [README](../../apps/api/README.md).
