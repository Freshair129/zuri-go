# Zuri-Go 0.5.1 — Member registry rules and Guest privacy

Released 2026-10-01 (Bangkok) at the owner's request (“commit แยก 2 ชุดแล้ว push แล้ว deploy”). C-2 / HIGH. Source: commit `2197186` on `main`. No database migration: production stays on PostgreSQL schema 7. Decisions: [PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md) D2–D16.

## Version diff: 0.5.0 → 0.5.1

| Before | After |
|---|---|
| Guests read every Member field, contact details and notes included | Guests read a Member's ID, PID, display name and status only (D16) |
| Any Member could add Members and change anyone's record or status | Adding a Member and changing a status need the Business admin or the operator; a Member edits only their own details, never their own status (D3) |
| The API accepted an Inactive Member in a new role; an Inactive participant blocked a restricted meeting's commit | A new R, A, C or I may not be Inactive, existing roles are kept, and viewers and participants may be Inactive (D2) |
| New task history events kept evidence quotes | New events keep no quote held in `meeting_task_links` (D14); an unchanged weekly priority writes no event (D12) |
| A meeting commit needed a connected FUNG | With a server workspace it runs without FUNG; the server checks the stored hashes (D4); stale screen text corrected (D6) |

Root-cause records: `.brain/rca/zuri-go-guest-reads-member-contact-details.md`, `zuri-go-inactive-participant-blocks-restricted-commit.md`, `zuri-go-history-events-store-evidence-quotes.md`.

## Checks

- Local, on the release commit: `npm run build` passed (55 packaged files, HTML SHA-256 `6501e6af…6574`); `npm test` passed — 169 Node tests, 5 Python tests, metrics and extraction checks. The new tests cover each decision for Guest, Member, Business admin and operator.
- Before the release, production 0.5.0 answered a Guest `/state` with every Member column, `email`, `phone`, `notes` and `legacy_metadata` included (keys recorded, values not read).
- Staged deployment `dpl_x33mhdiZRPynAd5ZrA1dMHrscC25` (`https://zuri-metrics-ayrl2ksht-pornpons-projects.vercel.app`, `--prod --skip-domain`), then promoted to `https://zuri-metrics-map.vercel.app/`. On both ([stage.json](stage.json), [production.json](production.json)):
  - a Guest's Members carry only `id`, `pid`, `displayName`/`display_name` and `status` on `/workspace` and `/state`;
  - Guests still read 0 tasks and 0 meetings; every Guest write answers 401 and a cross-origin write 403;
  - the served HTML equals the build.
- Production database after the release: schema 7; every table count equal to the 0.5.0 record except one more `change_events` row, the `admin_granted` event of ZGO-P0002 made after 0.5.0.

## Not run

- Member, Business-admin and restricted-meeting checks on the hosted site (they need a real Member code): a non-admin Member being refused when adding a Member, the admin adding one, a Member editing their own details, a commit without FUNG.
- Browser checks on production. Locally, only the operator's Members view was checked in the browser pane.

## Rollback

Code only: promoting the 0.5.0 deployment (`dpl_BWZ6s6Uqd8oZnuqdAuX5VV7Qo14v`) restores the previous behavior on the same schema, including the Guest read of Member contact details.
