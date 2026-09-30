---
id: FR-011-007
title: Guests read public items only
part: FEAT-011-P01
owner: DOM-IAM
delivery: implemented
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-007 — Guests read public items only

The system SHALL return to a Guest only items whose visibility is `public`, on every read path, and SHALL NOT reveal titles, counts or IDs of any other item.

## Acceptance criteria
- AC-011-007-01 — Given production with no public tasks, when a Guest calls `/workspace`, `/state` and `/overview` of the Business, then no task, meeting, transcript, task history or attachment metadata appears.
- AC-011-007-02 — Given a Guest who requests an attachment of a non-public task by its ID, then the response is 404, the same as for a missing attachment.
- AC-011-007-03 — Given a Guest who opens the Task Manager, then the UI shows a sign-in prompt, not an empty board that implies there is no work.
- AC-011-007-04 — Given a `public` task, when a Guest reads, then it is present.
- AC-011-007-05 — Given a Member whose session expires, then their next read gets the Guest view.
- AC-011-007-06 — Given a Guest who calls `/workspace` and `/state` of the Business, then each Member is returned with only the ID, the PID, the display name and the status (`id`, `pid`, `displayName`, `status` in the workspace; `id`, `pid`, `display_name`, `status` in the state), so that the names and PIDs on the work a Guest may read resolve; no full name, nickname, team, position, email, phone, notes or seed reference of any Member appears on any Guest read path, `/overview`, `/bootstrap` and `/session` included, and the team routes answer a Guest 401 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D16).
- AC-011-007-07 — Given a signed-in Member, a Business admin or the local operator, when they read the same paths, then every Member field is returned as before, and the client still validates the state a Guest receives.

## Implementation
- Built locally 2026-10-01: `/workspace`, `/state`, `/overview` and attachments filter by the viewer (`workspace.mjs`, `service.mjs`, `attachments.mjs`); `GuestNotice` in the Task Manager.
- Tests: `apps/api/test/cloud-handler.test.mjs` (Guest read paths, 404 for attachments). The Guest notice was not browser-checked (it needs the hosted site).
- Read paths today: `apps/api/api.mjs:15-16` (session, bootstrap), `:17-24` (attachments), `:30` (state), `:31` (overview), `:35` (workspace); the hosted handler lets every GET through (`apps/api/cloud.mjs:27`).
- Released 2026-10-01 in 0.5.1 (before it, on 0.5.0, a Guest reads every Member field), for AC-011-007-06 and -07: `apps/api/service.mjs:guestMember` and `:snapshot` (the Guest’s `members` rows), `apps/api/workspace.mjs:readLegacy` (the Guest’s `domain.members`). Tests, written with the change and not run for this record: `apps/api/test/visibility-db.test.mjs` (“a Guest reads only the ID, PID, display name and status of each Member; Members and the operator read everything”) and `apps/api/test/cloud-handler.test.mjs` (“Guests read only the ID, PID, display name and status of each Member on every hosted read path”). The `.brain/rca/` record is [zuri-go-guest-reads-member-contact-details](../../../../.brain/rca/zuri-go-guest-reads-member-contact-details.md).
- Campaign records are outside this requirement; applying the same levels to them follows (PLAN-002 Q1). Member profiles: only the field narrowing of AC-011-007-06 is decided and built (D16); levels such as `business` or `team` for a Member’s profile are not.
- Released to production on 2026-10-01 with 0.5.0. Hosted Guest checks passed on the unique deployment and on the public URL: `/workspace`, `/state` and `/tasks` returned 0 tasks, 0 meetings, 0 receipts and 0 history events while the Business holds 12 tasks, `/overview` named no task, and Guest writes answered 401 ([verification](../../../releases/0.5.0/verification.md)). Guests still read the 4 Member profiles (all fields) and the 1 campaign on 0.5.0, as PLAN-002 Q1 defers those levels; D16 narrows the Member fields from the next release. Not browser-checked.

## Notes
- Amends FEAT-005, where a Guest reads the whole workspace.
