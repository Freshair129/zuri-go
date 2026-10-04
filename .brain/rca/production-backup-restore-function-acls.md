---
title: RCA — omitted existing function permissions after Local restore
status: approved
superseded_by: null
date: 2026-10-05
source_document: RB-001
risk: HIGH
---

# Symptom

Independent review of restore closeout `483cc4f` found incomplete existing-function permission verification. Read-only Local inspection confirms PUBLIC EXECUTE on all four Visual functions constrained by migration 010; the runtime also incorrectly executes the two internal helpers. Production is unchanged.

# Evidence

The source dump used `--no-owner --no-privileges`, omitting function ACLs. `.local/postgres-local/all-function-acl-before.json` records all 29 Local functions. `visual_bundle_is_current`, `visual_calculate_review_result`, `visual_finalize_approval` and `visual_record_review` all have PUBLIC/runtime EXECUTE after restore. Migration `010_visual_approval_boundary.sql` lines 201–206 revoke all four from PUBLIC/runtime, then grant only record-review/finalize to the runtime. The restored migration ledger already contains 010, so the actual migrator skips it and reconciles only table permissions; migration 011 governs its own functions.

# Root cause

An ACL-free data/schema restore does not restore existing function permissions. Migration-ledger completeness was treated as sufficient permission reconciliation, but the migrator does not replay 010's function ACLs.

# Why the issue escaped detection

Row hashes prove data preservation, not function authority. Initial restore postchecks covered the new marketing functions and direct ledger writes, omitting the pre-existing Visual function contract. Native fresh-database tests apply 010 initially and therefore cannot reproduce this restore path.

# Proposed prevention

Within the authorized new Local restore, atomically replay only the exact six approved migration-010 function REVOKE/GRANT statements. Verify all four effective PUBLIC/runtime permissions plus actual runtime helper denial without invoking a mutating finalizer. Recheck all 47 source hashes/counts and four empty ledger tables. Include existing function ACL reconciliation in the canonical restore runbook; keep the evidence private. No migration file/application code, source data, existing credential or Production permission change is needed.
