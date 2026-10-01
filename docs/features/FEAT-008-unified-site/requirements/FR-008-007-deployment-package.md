---
id: FR-008-007
title: One verified folder, one deployment, only allowlisted files
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-003, ARCH-003]
---

# FR-008-007 — One verified folder, one deployment, only allowlisted files

The system SHALL assemble the site as one folder published as one deployment from the verified Mission Control build, its snapshot and identity evidence, and the guide with its assets, SHALL refuse any file whose bytes do not match the build manifest, and SHALL leave out private and generated material that is not on the list.

## Acceptance criteria
- AC-008-007-01 — Given the packaging, then the output holds `index.html`, the snapshot of the same build, `data-app-build.json`, `metrics/index.html` and the assets and source images the guide links to.
- AC-008-007-02 — Given a build whose manifest hash or size does not match its file, or whose HTML was changed after the build, then the packaging is refused and nothing is published.
- AC-008-007-03 — Given the package, then it contains no source worktree, browser backup JSON, user-entered Members or tasks, meeting audio, token or QA fixture.
- AC-008-007-04 — Given the guide in the package, then it has no link to port 4319 or 4321 and loads no other localhost through an iframe.

## Implementation
- `scripts/site/build_unified_site.py` (`app_files`, `metrics_files`, `write_package`; refuses a local preview link) → `build/site`; `scripts/deploy/build_cloud.py` → `build/vercel` (allowlist).
- Tests: `scripts/site/test_unified_site.py` (verified bytes only, modified HTML rejected, path escape rejected, private files preserved, only previously generated files replaced; 5 tests, run by `npm test`). Production payload files matched by hash ([unified-site-review](../../../history/unified-site-review/production-http-checks.json)).

## Notes
- Spec trace ([spec.md](../spec.md)): “โครงสร้าง build ที่เสนอ” — tree (AC-01), the paragraph after it and step 4 (AC-02, AC-03); “หน้าเว็บและเมนู”, second bullet (AC-04); US08. Legacy label: US08 (part).
- The spec’s output folder `output/draft/unified-site/` is `build/site/` in this repository (see [AGENTS.md](../../../../AGENTS.md), “Source ownership”).
