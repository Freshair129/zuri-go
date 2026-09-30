---
id: NFR-012-001
title: Transcript content is data, never instructions
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FR-012-005, FR-012-008, SDD-004]
---

# NFR-012-001 — Transcript content is data, never instructions

The system SHALL treat transcript text and model drafts as data: no code path of Zuri-Go SHALL turn transcript content into a tool call, an outgoing message, a change of destination or a write the user did not choose.

## Measurement
- Given the client code, then the only hosts the meeting screens contact are the Zuri-Go API (`apps/web/src/content/business/api.mjs`; no other `fetch`, `window.open`, `mailto:` or beacon call exists under `apps/web/src/content/meeting/`, searched 2026-10-01) and the origin of the Connect URL the user pasted; `createFungClient().request` refuses any other origin and refuses redirects (inspection of `apps/web/src/content/meeting/fung-client.mjs`, with the tests “connector refuses non-loopback, credentials, paths and query secrets” and “connection checks authenticated recordings; bearer never goes in URL”).
- Given a request for drafts, then it carries only the fields listed in AC-012-005-02 (the reviewed segments and identifiers) and no Member list, contact or credential (inspection of `Meetings.extract`).
- Given the meeting screens, then transcript and quote text is rendered as text and no `dangerouslySetInnerHTML` or HTML insertion exists under `apps/web/src/content/meeting/` (searched 2026-10-01: none).
- Given a commit, then the server takes only the user’s choices and identifiers, and writes tasks from the titles and details the user confirmed; no transcript text is executed, sent to a provider or used to pick a recipient (inspection of `commitMeeting`); the code sends no notification, invitation or message on commit.
- Result recorded: the 2026-09-30 [verification](../../FEAT-004-meeting-task-manager/verification.md) row for MT-15 is PASS (“bounded local model request; no contact registry, tools or external dispatch sent”), against a fixture. Not measured: a test that feeds the screens or the commit a transcript containing instructions, and the prompt and tool boundary inside FUNG’s model call, which belongs to the separate FUNG repository and was not inspected here.

## Implementation
- `apps/web/src/content/meeting/fung-client.mjs` (`request`), `apps/web/src/content/meeting/Meetings.jsx` (`extract`, `commit`), `apps/api/meeting-commit.mjs` (`commitMeeting`).
- Design: [SDD-004](../../FEAT-004-meeting-task-manager/design.md#34-draft-request--response) section 3.4 (Thai): the transcript is an untrusted source; the model has no tool execution, no choice of destination and no power to create a task directly.

## Notes
- Origin: FEAT-004 MT-15 (“Scope / source handling”). Declared as an NFR because it is a constraint on every behavior of this feature rather than a behavior of its own; the measurement is an inspection, not a timed or counted one.
- An NFR carries a measurement, not AC IDs: STD-002 R1 defines AC IDs under an FR only.
