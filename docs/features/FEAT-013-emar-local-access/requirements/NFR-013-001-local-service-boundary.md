---
id: NFR-013-001
title: The Emar launcher stays local-only and does not exchange session or application data
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
---

# NFR-013-001 — The Emar launcher stays local-only and does not exchange session or application data

The Emar launcher SHALL be rendered only for the exact canonical local Zuri-Go origin and SHALL NOT send session, tenant, campaign, recipient, or provider data to Emar.

Hosted/Vercel output SHALL contain neither the Emar launcher nor its origin-gate script, including inside encoded Data App JavaScript. The served local package SHALL retain the launcher on app, Metrics and Graph sections.

## Measurement

- Check the rendered launcher at `http://127.0.0.1:4319` and verify it is absent at the hosted origin, `localhost:4319`, and other host/port combinations.
- Inspect the navigation request and confirm it contains no Zuri-Go query parameters or identity headers; Emar is loaded only after explicit user selection.
- Record the no-Emar-running browser check and confirm the Zuri-Go page remains usable.
