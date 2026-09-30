# Attachment task identity — 0.3.1 pre-release review
Symptom: the first attachment implementation would return 404 for imported tasks.
Evidence: workspace.mjs readLegacy returns legacy_metadata.id, while writeDomain stores safeId(business, task, legacy ID) as the PostgreSQL task PK. The initial attachment query matched only the PK.
Root cause: attachment API treated the compatibility-view task ID as a canonical database UUID.
Why escaped: initial API fixture used a canonical-only task, so round-trip tests did not exercise imported identifiers.
Prevention: resolve both canonical and legacy task identity inside the scoped Business query, store only canonical FK, and test a legacy ID fixture and cross-Business isolation before deployment promotion.
