---
id: FR-008-009
title: Verify, deploy and report only what was checked
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [ARCH-003]
---

# FR-008-009 — Verify, deploy and report only what was checked

The system SHALL deploy the package to the one existing Vercel project as one deployment, SHALL confirm it is READY and open the four main routes on the URL actually obtained before calling it released, SHALL report the deployment ID, the URL and the FUNG limit as they were checked, and SHALL NOT report a local build as production.

## Acceptance criteria
- AC-008-009-01 — Given a verified package, then it is deployed to the single existing project and no new project or account is created.
- AC-008-009-02 — Given a deployment, then its state is READY and the four main routes open on the URL obtained.
- AC-008-009-03 — Given the release report, then it names the deployment ID, the URL and what is known of the FUNG connection from HTTPS.
- AC-008-009-04 — Given the destination cannot be reached, then the report names the steps done and those pending, and a local build is not reported as production.
- AC-008-009-05 — Given the release, then the regression tests of the app and the Metrics Map have run, the document links are checked, and the real results are recorded in a verification note.

## Implementation
- Operator steps: `scripts/run.mjs`, [RB-001](../../../operations/RB-001-runbook.md); binding `scripts/deploy/project.json`.
- Release of the unified site and its checks: [verification](../verification.md), “Production” (READY, four routes, hash match, FUNG limit stated); later releases are recorded under `docs/releases/`, for example [0.5.1](../../../releases/0.5.1/verification.md).

## Notes
- Spec trace ([spec.md](../spec.md)): “ทางเผยแพร่และข้อเท็จจริงที่ตรวจแล้ว”, first paragraph and last paragraph (AC-01, AC-04); “ข้อมูลและการย้ายไป URL จริง”, last bullet (AC-03); US09 (AC-05); US10 (AC-02, AC-03); the paragraph after the table (Definition of Done: local verification and hosted verification are separate). Legacy labels: US09, US10.
- The current release procedure — stage with `--prod --skip-domain`, verify, then promote — is in [AGENTS.md](../../../../AGENTS.md) and RB-001; the spec’s own steps (deploy, verify the candidate, promote) are the earlier statement of it.
