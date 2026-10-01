---
id: FR-008-001
title: One site menu on every section
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001, FEAT-003, FEAT-004, FEAT-010]
---

# FR-008-001 — One site menu on every section

The system SHALL show a site menu on every section of the site — Marketing (Mission Control), Meeting & Task Manager, ความรู้ Metrics and Graph View — with the same destinations in the same order, SHALL mark the page that is open, and SHALL let the menu be used on a small screen and with the keyboard.

## Acceptance criteria
- AC-008-001-01 — Given any of the four sections is open, when the menu is shown, then it lists the four destinations in one order and each links to its route by a relative same-origin path.
- AC-008-001-02 — Given the menu, when a destination is chosen, then the section opens on the same origin without opening another port.
- AC-008-001-03 — Given a section is open, then the menu shows which page is selected.
- AC-008-001-04 — Given a small screen or keyboard use, then every menu link can be reached and the keyboard focus is visible.

## Implementation
- Mission Control and the Task Manager: the `nav` “เมนูเว็บไซต์” in `apps/web/src/content/meeting/MeetingWorkspace.jsx`; guide and Graph View: `SITE_NAV` in `scripts/metrics/build_metrics_map.py`.
- Local and production browser checks (Marketing, Meeting, guide, graph; 390 × 844 mobile with the menu wrapping): [verification](../verification.md), “ผลตรวจ”. After 0.5.1 the production menu was seen as a Guest ([0.5.1 verification](../../../releases/0.5.1/verification.md), “Browser checks”).

## Notes
- Spec trace ([spec.md](../spec.md)): “หน้าเว็บและเมนู”, first paragraph and table (AC-01, AC-02, AC-03); US01 and US06 of “Acceptance และ verification” (AC-04: small screen and keyboard). Legacy labels: US01, US06 (part).
- The labels have moved on since the spec. The Business Overview of [FEAT-001](../../FEAT-001-business-overview/feature.md) is the first destination, and the Task Manager and Meetings of [FEAT-010](../../FEAT-010-task-manager/feature.md) are two items in the app menu, while the guide menu still reads “Meeting & Task Manager”. The destinations and their relative order are the spec’s; the exact labels are not restated here.
