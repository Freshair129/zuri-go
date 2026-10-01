---
id: NFR-008-001
title: The site menu never covers content
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-003]
---

# NFR-008-001 — The site menu never covers content

The site menu SHALL NOT cover page content on a desktop or a mobile viewport, including after a hash navigation, and SHALL keep the selected page and the keyboard focus clearly visible.

## Measurement
- At 1440 px and 390 px wide, in each of the four sections, no content is hidden under the menu and the page does not scroll sideways.
- After a hash navigation inside the guide at 390 px, the menu is still on screen and its wrapped rows are measured into the sticky offset.
- The selected page and the focused link are visible in a screenshot at both widths.
- The result is recorded in the verification note of the release that changes the menu.

## Implementation
- Mobile 390 × 844: the menu wraps and stays on screen after a hash navigation; the return link to Meeting was tapped ([mobile-guide.png](../../../history/unified-site-review/mobile-guide.png), [verification](../verification.md), “Version diff” and “ผลตรวจ”). 0.5.1: no horizontal scroll at 375 px as a Guest ([verification](../../../releases/0.5.1/verification.md)).

## Notes
- Spec trace ([spec.md](../spec.md)): “หน้าเว็บและเมนู”, first paragraph (usable on a small screen and with the keyboard); US06 (“แถบเมนูไม่บังเนื้อหาบน desktop/mobile; ชื่อหน้าที่เลือกและ keyboard focus ชัดเจน”). Legacy label: US06.
- An NFR carries a measurement, not AC IDs (STD-002 R1). The thresholds are those of the spec’s check; the spec sets no pixel limit.
