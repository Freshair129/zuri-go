---
title: RCA — transient ledger write grants during migration
status: approved
superseded_by: null
date: 2026-10-05
source_document: SDD-015
risk: HIGH
---

# Symptom

Independent L2 review of sealed commit b64da2c found that a migration rerun briefly permits the runtime role to create admin-managed marketing associations. An interruption after the broad grant preserves this authority indefinitely.

# Evidence

`apps/api/migrate.mjs` issues `GRANT SELECT,INSERT,UPDATE ON ALL TABLES` and the marketing `REVOKE INSERT,UPDATE,DELETE` as separate autocommitted statements. The reviewer reproduced all migrations in disposable PGlite, ran the exact broad grant, set the scoped runtime operator and inserted a synthetic association with `review_ref='fake-review'`. The association guard protects UPDATE/DELETE, not an unauthorized INSERT. No application database was accessed.

# Root cause

Permission reconciliation is not atomic. The migrator's final restrictive ACL is correct only if every later statement executes successfully. The published broad grant is externally visible before its matching revocation.

# Why the issue escaped detection

The initial rerun test executed GRANT and REVOKE before checking permissions. A single-connection test cannot establish intermediate ACL visibility to another runtime connection or simulate interruption between committed statements.

# Proposed prevention

Keep the approved final ACL unchanged, but execute the complete grant/revoke batch inside one explicit transaction. Roll back the batch on failure; announce success only after COMMIT. Add a native two-connection regression that pauses after the real broad grant, proves runtime INSERT is still denied, interrupts/rolls back and checks privileges remain denied, then verifies the successful full batch. Independent L2 must review the fresh sealed correction and native evidence before merge or application migration.
