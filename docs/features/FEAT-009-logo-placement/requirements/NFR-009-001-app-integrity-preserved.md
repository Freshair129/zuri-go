---
id: NFR-009-001
title: Placing the logo changes no business data, KPI, interaction, protected shell or app identity
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009]
---

# NFR-009-001 — Placing the logo changes no business data, KPI, interaction, protected shell or app identity

The system SHALL keep all business data, KPIs, interactions, the protected app shell and the app identity unchanged by any change to the logo placement.

## Measurement
- Given a build after a logo change, then the protected-runtime and authored-ownership checks of `npm run build` pass and the runtime SHA-256 and the app ID are unchanged; recorded for the logo change in the 0.3.0 record (“Protected Data app content/integrity build passed; app ID unchanged”, [cloud review](../../../history/zuri-go-cloud-review/verification.md)) and again, with the runtime hash, in the 0.4.2 record ([0.4.2 verification](../../../releases/0.4.2/verification.md)).
- Given the tests of the campaign, meeting and Business models and the metrics audit, then they pass unchanged after a logo change; recorded for 0.3.0 (86 tests and the audit of 18 pages and 38 metric cards).
- Neither measurement was rerun for this record.

## Notes
- Spec: [spec.md](../spec.md) “Approved source and scope”, the last bullet (“Preserve all business data, KPIs, interactions, protected app shell and app identity”).
- Spec item 5 of “Acceptance and verification” (“Record source hash, affected paths and before/after diff. This change updates the local site only.”) and the build and browser checks of item 4 were obligations of release 0.2.1 and were met in the 0.3.0 record; they belong to the verification of a release, not to a standing requirement.
