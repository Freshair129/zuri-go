---
id: NFR-006-001
title: The database isolates the credential table from the runtime role
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-006-011]
---

# NFR-006-001 — The database isolates the credential table from the runtime role

The database SHALL let the runtime role only read `member_credentials`, within the row-level security of one Business, and SHALL keep that role non-superuser and NOBYPASSRLS, so that a flaw in the application cannot create, change or delete a credential.

## Measurement
- Given the runtime role, when it runs an `UPDATE`, `INSERT` or `DELETE` on `member_credentials`, then PostgreSQL answers “permission denied”; measured by `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”, an `UPDATE` of `enabled`).
- Given a query under another Business’s scope, then it reads no row of this Business’s credentials (forced row-level security with policy `business_scope`).
- Given the production runtime role, then it is non-superuser and NOBYPASSRLS with SELECT only on credentials; recorded for 0.4.0 in `package-database.json` of the [member review](../../../history/zuri-go-member-review/verification.md) and not rechecked for this record.

## Notes
- Spec: [spec.md](../spec.md) §3 (the row for `member_credentials`: “forced Business RLS; no public list/read endpoint”).
- Implementation: `apps/api/migrations/005_member_identity.sql` (`FORCE ROW LEVEL SECURITY`, policy `business_scope`); `apps/api/migrate.mjs` — `REVOKE INSERT,UPDATE,DELETE ON zuri_go.member_credentials FROM zuri_go_app`.
