---
id: NFR-003-002
title: The guide can be read and printed with no network and no script
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-008]
---

# NFR-003-002 — The guide can be read and printed with no network and no script

The guide SHALL need no network to be read or printed and no script to be read, because its fonts, images and styles ship with it.

## Measurement
- The static audit finds every font, image and stylesheet the guide references as a local file that exists; the bundled font licenses are included.
- No request to a font or script host is made when the guide is opened (the browser run records no failed request).
- With script disabled, all 18 pages are in the document in order and can be read; an external reference link (a source article) needs the internet and is the only exception.
- The result is recorded with the release evidence.

## Implementation
- `scripts/metrics/verify_metrics_map_static.py` (local references checked: 16, none missing in the extraction-time report [static-checks.json](../../../migrations/verification/metrics/static-checks.json)); fonts and OFL licenses in `apps/web/src/content/assets/`.
- The Google Fonts request that was denied in the REV 02 run was replaced by bundled fonts ([qc.md](../qc.md), “Verification issues resolved”, item 1).

## Notes
- Spec trace: [brief.md](../brief.md), “Visual direction” (“no network required to read/print”) and “Maintenance” (“Reading the HTML requires neither Python nor JavaScript”); [spec-graph.md](../spec-graph.md) “เกณฑ์รับงาน”, sixth bullet. No AC label.
- The no-script reading is a structural property of the generated HTML; no run with script disabled is on record.
