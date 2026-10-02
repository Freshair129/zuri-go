---
id: FR-013-001
title: The local Zuri-Go site launches the separate Emar service
delivery: implemented
status: approved
legacy: []
relations:
  specified_by: [SDD-013]
  decided_by: []
---

# FR-013-001 — The local Zuri-Go site launches the separate Emar service

The canonical local Zuri-Go site SHALL provide a clearly labelled launcher to the separately operated Emar local service and SHALL preserve the existing four same-origin site destinations.

## Acceptance criteria

- AC-013-001-01 — Given a Zuri-Go page served from exactly `http://127.0.0.1:4319`, when the page renders, then the separate **Emar (local)** service launcher is available from the site sections.
- AC-013-001-02 — Given the launcher, when selected, then it opens exactly `http://localhost:8788/` in a new tab with `rel="noopener noreferrer"` and sends no Zuri-Go identity, tenant, campaign, or token data.
- AC-013-001-03 — Given a hosted or other-origin Zuri-Go page, when it renders, then the local Emar launcher is absent.
- AC-013-001-04 — Given the existing site navigation, when Emar is added, then the four existing internal destinations retain their route, order, selected state, keyboard use, and responsive behavior.
- AC-013-001-05 — Given Emar is not running, when a user opens Zuri-Go, then Zuri-Go makes no automatic request to Emar and its other sections remain usable.

## Implementation

Implemented in `apps/web/src/content/meeting/MeetingWorkspace.jsx` and `scripts/metrics/build_metrics_map.py`; generated Metrics HTML and site packages are rebuilt, not hand-edited. See [FEAT-013 verification](../verification.md).

## Notes

- This is a service-launch contract only; it does not add an Emar REST or MCP client to Zuri-Go.
- The external `localhost` host is deliberate: Emar's `Path=/` cookie must not be shared with the Zuri-Go `127.0.0.1` host.
