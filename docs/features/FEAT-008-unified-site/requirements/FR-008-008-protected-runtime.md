---
id: FR-008-008
title: The protected runtime and its manifest stay intact
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-002]
---

# FR-008-008 — The protected runtime and its manifest stay intact

The system SHALL add the site links in the authored content of Mission Control without covering or hiding the protected shell, SHALL pass the protected-runtime integrity check, and SHALL NOT edit the Mission Control HTML after its build.

## Acceptance criteria
- AC-008-008-01 — Given Mission Control, then the links to the two Metrics sections are in the authored domain bar and do not cover or hide the protected shell.
- AC-008-008-02 — Given the build, then the protected-runtime integrity check passes and the manifest of Mission Control matches the packaged files.
- AC-008-008-03 — Given the packaging, then the built Mission Control HTML is copied as built, not edited.

## Implementation
- `apps/web/scripts/verify-protected-runtime.mjs` and `apps/web/protected-runtime.json`, run by `npm run build`; `app_files` in `scripts/site/build_unified_site.py`.
- Build with integrity passed: [verification](../verification.md), “ผลตรวจ”. 0.5.1: `npm run build` passed ([verification](../../../releases/0.5.1/verification.md), “Checks”).

## Notes
- Spec trace ([spec.md](../spec.md)): “หน้าเว็บและเมนู”, fifth bullet (AC-01); “โครงสร้าง build ที่เสนอ”, paragraph after the tree and step 2 (AC-02, AC-03); US08 (AC-02). Legacy label: US08 (part).
- Editable boundaries are in [apps/web/AGENTS.md](../../../../apps/web/AGENTS.md); a build is never made to pass by weakening a check ([AGENTS.md](../../../../AGENTS.md)).
