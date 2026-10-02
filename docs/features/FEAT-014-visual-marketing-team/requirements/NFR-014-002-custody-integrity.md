---
id: NFR-014-002
title: Preserve custody and protected product integrity
status: proposed
delivery: declared
relations:
  decided_by: [ADR-006]
---
# NFR-014-002 — Preserve custody and protected product integrity

DTOs, prompts, logs and browser bundles SHALL contain zero fixture secrets. Protected-runtime verification and relevant regression tests SHALL pass unchanged.

## Measurement

Use secret canaries and inspect outputs; run protected build and campaign/meeting/auth regressions and UI checks. Fake adapters do not prove real provider or production readiness.
