---
id: FR-009-008
title: No new logo master is created and no draft asset is promoted
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FR-009-001]
---

# FR-009-008 — No new logo master is created and no draft asset is promoted

The system SHALL NOT create a new logo master or promote a draft asset to a brand asset; brand promotion stays human-only.

## Acceptance criteria
- AC-009-008-01 — Given `assets/logos/`, then it holds only the approved source of the Zuri-Go logo.
- AC-009-008-02 — Given the application and the guide, then their logo files are copies of that source (FR-009-001) and no other logo file is added.

## Implementation
- `assets/logos/zuri-go/download.png` is the only file under `assets/logos/` (read on 2026-10-01); [brand/README.md](../../../../brand/README.md) and [AGENTS.md](../../../../AGENTS.md) state that brand promotion is human-only. No committed test checks the folder.

## Notes
- Spec: [spec.md](../spec.md) “Approved source and scope”, the bullet “Do not create a new logo master or promote draft assets.”
- This is a standing rule for anyone who changes `assets/` or `brand/`; the domain README records it as a Brand rule ([DOM-BRN](../../../domains/brand/README.md)).
