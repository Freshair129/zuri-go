---
id: FR-006-013
title: A code is handed over once, privately, and nobody is messaged
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-006-007, FR-006-011]
---

# FR-006-013 — A code is handed over once, privately, and nobody is messaged

The system SHALL write each newly issued code to one private handover file per Member under `.local/member-access/`, with a private index, outside the deployment package and the ordinary backups, SHALL NOT show a code in the application, on a Member card, in a log or in a document, and SHALL send no message to any Member.

## Acceptance criteria
- AC-006-013-01 — Given a newly issued code, then the operator’s private folder holds one handover file for that Member with owner-only permissions, and a pending file survives an uncertain commit and is renamed only after the commit.
- AC-006-013-02 — Given the deployment package, then it holds neither a handover file, the provisioning tool nor `.local`, and a file outside the allowlist stops the build.
- AC-006-013-03 — Given the application, the Member cards, a log line or a document, then none shows a code.
- AC-006-013-04 — Given a provisioning run, then no email or other notification is sent to any Member.

## Implementation
- `apps/api/provision-members.mjs:provisionMembers` — writes `<PID>.json.pending` with mode 0o600, renames it after `COMMIT`, writes `index.md`; `.gitignore` excludes `.local/`.
- `scripts/deploy/build_cloud.py` — copies a fixed list of server files (the provisioning tool is not in it), writes `.vercelignore` with `**/.local/**`, and raises “Unexpected file in deploy package” for anything else.
- Evidence: the 0.4.0 record states that the package of 46 files was scanned against actual private values, that no handover or provisioning tool was deployed, and that no message was sent to any Member ([member review](../../../history/zuri-go-member-review/verification.md)). The current allowlist was read on 2026-10-01; no scan was rerun for this record, and no committed test covers AC-006-013-01.

## Notes
- Spec: [spec.md](../spec.md) §2 (the bullet “Provisioning writes a one-time private handover file per member…”), §5 step 3 (“No messaging to members is authorized”), §6 (“Credentials absent from … generic backups and logs. Private handover works; no email or external notification sent.”).
- The handover location is operator custody ([AGENTS.md](../../../../AGENTS.md)); this requirement states no path beyond the spec’s.
