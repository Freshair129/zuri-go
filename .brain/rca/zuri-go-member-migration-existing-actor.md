# Member migration: existing actor FK
Symptom: local migration 005 failed with duplicate actor_member_id.
Evidence: 001_core.sql already defines change_events.actor_member_id and its composite Member FK; migration 005 attempted to add it again. Transaction rolled back, including PID backfill.
Root cause: the new identity design treated a dormant existing column as a new column.
Why escaped: initial source review focused on audit call sites that left that column null.
Prevention: reuse the existing actor_member_id FK, add only actor_pid, and run migration plus schema tests before cloud deployment. This narrows the approved schema amendment without changing behavior.
