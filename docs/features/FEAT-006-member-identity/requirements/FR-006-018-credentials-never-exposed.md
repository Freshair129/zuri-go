---
id: FR-006-018
title: Credentials never appear in a response, a bundle, an export or a Member’s profile
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-006-001, FR-006-013]
---

# FR-006-018 — Credentials never appear in a response, a bundle, an export or a Member’s profile

The system SHALL keep password hashes, plaintext codes and session secrets out of every Guest response, public state snapshot, error, log, frontend bundle, generic backup and export and out of a Member’s profile metadata, and editing a Member’s profile SHALL NOT expose, create or reset a credential.

## Acceptance criteria
- AC-006-018-01 — Given a public read of the state, then it holds no `password_hash`, `credential_version` or code.
- AC-006-018-02 — Given a Member saved through the workspace, then the keys `pid`, `password`, `password_hash`, `passwordHash`, `credentials` and `credential_version` are removed from the stored profile metadata.
- AC-006-018-03 — Given the legacy v2 workspace and the Business snapshot, then neither reads `member_credentials`.
- AC-006-018-04 — Given the deployment package and the browser bundle, then neither holds a private value; the package is an allowlist.
- AC-006-018-05 — Given a Member’s profile edit by any Member, then no credential row changes.

## Implementation
- `apps/api/workspace.mjs:writeDomain` — `for(const key of [...])delete metadata[key]`; `readLegacy` and `apps/api/service.mjs:snapshot` select Member columns, not credentials; `scripts/deploy/build_cloud.py` — fixed allowlist.
- Test: `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”: the public `/state` holds none of `password_hash`, `credential_version` or the QA codes). Run on 2026-10-01 by the author of this file: passed. AC-006-018-02, -03 and -05 rest on reading the code; AC-006-018-04 on the 0.4.0 record (46 packaged files scanned against actual private values, [member review](../../../history/zuri-go-member-review/verification.md)), which was not rerun for this record.

## Notes
- Spec: [spec.md](../spec.md) §1 assumption 4 (“Editing a public profile never exposes or resets a password”), §3 (“Credentials must never be embedded in Member legacy_metadata, Business snapshots or v2 exports”), §4 (the bullets “Editing a Member profile does not grant credential-management privileges” and “No guest response … exposes password hashes, plaintext credentials or session secrets”), §6.
- Logs: the hosted handler logs only an error code for a failure (`console.error('Request failed',e.code||e.name)`).
