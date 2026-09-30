---
id: FR-011-007
title: Guests read public items only
part: FEAT-011-P01
owner: DOM-IAM
delivery: declared
status: approved
relations:
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

## Implementation
- Not built.
- Read paths today: `apps/api/api.mjs:15-16` (session, bootstrap), `:17-24` (attachments), `:30` (state), `:31` (overview), `:35` (workspace); the hosted handler lets every GET through (`apps/api/cloud.mjs:27`).
- Campaign records and Member profiles are outside this requirement; applying the same levels to them follows (PLAN-002 Q1).

## Notes
- Amends FEAT-005, where a Guest reads the whole workspace.
