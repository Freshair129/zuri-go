---
version: "1.3.0b"
created_at: "2026-09-25T14:55:30+07:00"
last_update: "2026-09-29"
status: beta
superseded_by: null
attributes:
  doc_type: feature-spec
  author: "RWANG (อาหวัง)"
  commit_hash: null
  target_path: "D:/zuri-brand-kit/output/draft/campaign-01_metrics-map.html"
  source_path: "D:/zuri-brand-kit/graphui.html"
  campaign: campaign-01
  complexity: C-2
  risk: MEDIUM
  language: th
  approval: "REV 02.5 approved on 2026-09-25; REV 03 approved on 2026-09-29; REV 04 metric additions requested on 2026-09-29"
---

# Interactive Marketing Metrics Map — REV 04

**สถานะ:** beta — REV 03 และ REV 04 ผ่าน static, browser และ print checks; Production deployment ยังไม่มี URL ที่ยืนยันได้ตาม verification record ด้านล่าง

## เป้าหมาย

เพิ่มมุมมองศัพท์ marketing metrics แบบ 3D orbit ใน `campaign-01_metrics-map.html` โดยยึดการวาง node, การหมุน, search, category drawer และ detail panel ด้านขวาจาก `graphui.html` ผู้ใช้เลือก node แล้วอ่านคำอธิบายของศัพท์นั้นได้ทันที

## หลักฐานและขอบเขต

- REV 03 baseline มี metric cards ที่ไม่ซ้ำ 35 คำและ MQL/SQL อีก 2 nodes; REV 04 เพิ่มการ์ด 3 ใบ รวมเป้าหมาย 38 metric cards และ 40 graph terms
- `graphui.html` แสดง 3D orbit, ช่องค้นหา, หมวด/รายการ node, แถบควบคุม, สถานะจำนวน node และแผงรายละเอียดทางขวา พร้อม centroid/radius สำหรับการจัดกลุ่มสามชุด
- graph UI ต้นทางโหลด renderer ผ่าน Next.js chunks ภายนอก ดังนั้นจะย้ายหน้าตาและ interaction มาเป็น implementation ที่ฝังใน Metrics Map โดยตรง ไม่เรียก Next.js scripts, daemon ที่ `127.0.0.1:19828`, API หรือข้อมูลภายนอก
- ใช้ brand profile ของ zuri สำหรับ wordmark, โทนสี และ mascot; นำ geometry/การโคจรและโครงสร้าง UI ของ graph ต้นแบบมาปรับกับศัพท์การตลาด

## ข้อเสนอการทำงาน

1. เพิ่มส่วน interactive graph แบบ web-only หลัง navigation ก่อนคู่มือ 18 หน้า โดยไม่เปลี่ยนเลขหน้าและเนื้อหาในหน้าพิมพ์เดิม
2. สร้าง node จาก metric cards ทั้งหมด 38 คำ และเพิ่ม MQL/SQL จาก Conversion; แต่ละ node เก็บชื่อศัพท์ หมวด หน้าอ้างอิง และรายละเอียดจากคู่มือ ห้ามสร้าง benchmark หรือผลลัพธ์จริงขึ้นใหม่
3. จัดเป็น 3 กลุ่ม Acquisition, Lead & Conversion และ Revenue & Operations ด้วยรูปแบบ centroid/radius และการกระจาย node ในวงโคจรตามต้นแบบ; คง auto-orbit, ลากเพื่อหมุน, scroll เพื่อซูม และปุ่ม fit view
4. คงตำแหน่งและหน้าที่ของ topbar, search, category drawer, node count, controls และ right-side detail panel; ใช้ brand tokens ของ zuri แทนสีและแบรนด์ของต้นแบบ
5. แผงรายละเอียดแสดงชื่อ, คำเต็ม, คำอธิบาย, สูตร, หน่วย, ตัวอย่างสมมติ, วิธีอ่านผล และลิงก์กลับไปหน้าคู่มือที่เกี่ยวข้อง
6. Search และรายการหมวดเลือก node เดียวกันกับกราฟได้; ปุ่ม export ดาวน์โหลดข้อมูลศัพท์ที่ฝังอยู่ ส่วนปุ่ม sync เปลี่ยนเป็น refresh จากคู่มือในหน้านี้ เพื่อไม่กล่าวอ้างว่าต่อแหล่ง live
7. จัดแผงเป็น drawer บนจอแคบ รองรับ keyboard/ปุ่มเลือก node และหยุด auto-orbit เมื่อผู้ใช้ตั้งค่า reduced motion
8. แสดงภาพและชื่อ zuri กับ น้องวางใจในส่วน graph นี้ด้วย ใช้ลายจุดและสีเน้น amber ตามหน้า Metrics Map
9. ซ่อน graph section ใน print เพื่อคงคู่มือเดิม 18 หน้า และรันทดสอบ desktop/mobile, search, node selection, detail content, local asset paths และ pagination
10. เมื่อเกณฑ์ข้างต้นผ่าน ให้ทำ production deployment ใหม่ของโปรเจกต์ `zuri-metrics-map` ตามคำสั่ง deployment ที่ผู้ใช้อนุมัติไว้แล้ว
11. แสดงแต่ละ metric เป็นลูกบอลทรงกลมมีแสงและเงาแบบ 3D ใช้สีหมวดที่อนุมัติแล้ว; วางบนพื้นกราฟสีเข้มที่มีลายจุดและเส้นกริดจางเพื่อแยก node ออกจากพื้นหลัง
12. ซ่อนชื่อ node ขณะปกติ แล้วแสดงชื่อใน tooltip เมื่อ pointer hover หรือ keyboard focus; การเลือก node ยังเปิดคำอธิบายเต็มทางขวาเหมือนเดิม

## Implementation record

- REV 03 baseline มี 35 metric cards และ MQL/SQL รวม 37 graph terms; REV 04 เพิ่ม metric cards/nodes อีก 3 คำ รวมเป้าหมาย 38 cards, 40 terms
- JavaScript syntax, HTML structure, anchors, local asset paths, page count, mascot roles, CTA, category counts และ interaction hooks ผ่าน static checks
- REV 02.5 เปลี่ยนป้ายข้อความแบนเป็นทรงกลม 3D เพิ่มพื้นหลัง textured dark และ tooltip สำหรับ hover/focus; ข้อความนี้เป็นบันทึกตามสถานะใน revision นั้น โดย REV 03 ได้ยืนยัน browser และ print rendering แล้ว
- Production deployment: REV 02.5 request was denied with HTTP 403 because the connected account lacks permission to create a Production Deployment for this project. No new deployment was created; the earlier URL remains unverified.

## เกณฑ์รับงาน

- แสดง node ครบ 40 คำ ไม่ซ้ำ และทุกคำมีหมวด/หน้าอ้างอิง
- คลิก node, search result หรือรายการหมวดแล้วเปิดรายละเอียดด้านขวาของ node เดียวกันได้
- การหมุนแบบ auto และ drag, การซูม และ fit view ทำงาน; active node แสดงสถานะชัดเจน
- Node ทั้ง 40 คำเป็นทรงกลมมีแสงเงา มองเห็นชัดบนพื้นหลัง textured ทั้งสามแบบ; ชื่อแสดงเมื่อ hover หรือ keyboard focus และไม่ค้างเป็นป้ายรอบ node
- layout ทำงานบน desktop/mobile โดยไม่ทำให้เอกสารล้นแนวนอน
- graph section มี mascot ทั้งสองตัวและชื่อทั้งสอง; 18 หน้าเดิมยังครบและ print ได้ 18 หน้า
- ไม่มีการพึ่งสคริปต์ Next.js ภายนอก, live daemon, API หรือ font/image ที่ไม่ได้อยู่ในแพ็กเกจ
- Playwright ยืนยันการเลือก node และการแสดงรายละเอียดจริง; static checks ยืนยันจำนวนศัพท์, anchors และไฟล์อ้างอิง

## ความเสี่ยงและข้อจำกัด

**ความเสี่ยง MEDIUM · Complexity C-2.** เพิ่ม JavaScript สำหรับ graph interaction ใน builder ของ HTML เดียว ไม่มี backend หรือการเปลี่ยน schema ข้อจำกัดคือ node เป็นข้อมูลอธิบายจากคู่มือ ไม่ใช่ผล analytics live; โทนสีและ wordmark ต้องยึด brand profile แม้ layout มาจาก graphui

## Version diff

REV 02.4 เพิ่ม interactive graph สำหรับ 37 marketing terms, 3D orbit, search/category navigation, right-side explanation panel และ responsive controls; หน้าอ้างอิง 18 หน้าและการพิมพ์คงเดิม
REV 02.5 เปลี่ยน node เป็นลูกบอล 3D เพิ่ม texture เข้มเพื่อเพิ่ม contrast และแสดงชื่อเมื่อ hover/focus; ณ revision นั้น static checks ผ่าน แต่ browser/print visual QC ยังไม่ได้รัน (REV 03 ยืนยันผลแล้ว)
REV 03 แบ่งคู่มือเป็น viewer ทีละหน้า เพิ่มปุ่มก่อนหน้า/ถัดไปและ hash navigation; แยก graph เป็นมุมมอง 2D/3D ที่หมุนได้ครบ 360 องศา พร้อมพื้นหลัง textured 3 แบบ
REV 04 เพิ่ม Media Spend, Revenue และ Overstock SKU เป็น metric cards/nodes โดยแยก actual spend จาก planned budget, แยก net revenue จาก attributed revenue และคำนวณ overstock เทียบ target ของแต่ละ SKU

## CHANGELOG

| Version | Date | Status | Summary | Commit Hash | Agent |
|---|---|---|---|---|---|
| 1.3.0b | 2026-09-29 | beta | REV 04 adds Media Spend, Revenue, and Overstock SKU definitions and graph nodes; static, browser, and print checks passed | N/A | RWANG |
| 1.2.0b | 2026-09-29 | beta | REV 03 adds the one-page guide viewer, full-turn 2D/3D graph controls and three textured brand background presets; static, browser and print checks passed | N/A | RWANG |
| 1.1.0b | 2026-09-25 | beta | User requested and approved 3D sphere nodes, textured contrast stage and hover/focus labels; static implementation checked | N/A | RWANG |
| 1.0.0b | 2026-09-25 | beta | User approved interactive graph spec; implementation and static checks completed, browser/print visual QC blocked | N/A | RWANG |

## REV 03 implementation — Page navigation, graph modes, and backgrounds

**Status:** approved on 2026-09-29 and implemented in the existing static HTML builder. This revision covers the page and graph UI requested on 2026-09-29; REV 02.5 content and graph styling remain the baseline.

### [ASSUMPTIONS]

1. Keep the current 18 numbered guide pages, existing definitions, examples, sources, per-page CTAs, and the zuri / น้องวางใจ pair. REV 04 adds only the three metrics listed in its addendum.
2. “แบ่งเป็นหน้า” means a web page viewer with one guide page active at a time, plus table-of-contents links and previous/next controls. The graph remains a separate, unnumbered view; print continues to show all 18 guide pages.
3. In 2D, dragging spins the flat layout through 360° around its center. In 3D, dragging completes a full 360° horizontal orbit while vertical tilt remains bounded so labels and groups stay readable.
4. “เปลี่ยนพื้นหลัง” means selecting an approved preset for the graph stage, not a free-form color picker. Presets use the existing textured dark `#12161C`, canvas `#F7F8FA`, and brand surface `#FFF8F0` colors. Dots remain visible in every preset.

### Implemented behavior

1. Retain 18 `data-page` sections and their current order/content. Add previous/next controls, a current-page indicator, and direct table-of-contents selection. Update the URL hash when navigating so each page is linkable. Keep all pages readable if script execution is unavailable; activate one-page display only after the viewer initializes.
2. Add an accessible 2D / 3D switch to the graph controls. 2D uses a flat top-down radial arrangement; 3D retains the current shaded spherical nodes, perspective, and depth ordering. Search, category filters, all 40 REV 04 terms, and the right-side detail panel continue to work identically in both modes.
3. Keep pointer and touch drag. In 2D it rotates the flat layout; in 3D it supports full horizontal orbit and bounded vertical tilt. Keep the existing pause-orbit, zoom, and fit-view controls. Reduced-motion preferences continue to disable automatic rotation.
4. Replace the binary light/dark graph toggle with a labeled background selector for the three presets above. Apply background and dot contrast to the graph stage only; do not recolor guide pages or change node category colors.
5. Keep both mascots and their names on all 18 guide pages. The graph view continues to show both. Preserve hover/focus node names, keyboard operation, the wordmark, and responsive layout.
6. Print hides the interactive graph and viewer controls, then prints the existing 18 guide pages in order with one guide page per printed sheet.

### Dependencies and impact

- Parent-layer authority: `brand/brand-profile.md` for color tokens, wordmark, mascots, and accessible contrast; `projects/campaign-01/brief.md` for the existing 18-page content and audience.
- Peer-layer authority: this feature spec and `projects/campaign-01/build_metrics_map.py`, which emits the one-page guide viewer and embedded 2D/3D graph with three textured stage presets.
- Scope is a static HTML/CSS/JavaScript change in the existing builder and its generated file. No backend, data schema, or external graph library is added; REV 04 defines three additional metrics.
- Complexity **C-2**; risk **MEDIUM** because the page viewer and graph interactions change across desktop, mobile, keyboard, and print views.

### Acceptance and verification

- Exactly 18 guide pages remain; previous/next, page indicator, table of contents, deep links, and direct page navigation select the same page.
- 2D/3D mode switching preserves all 40 nodes, category filtering, search, node selection, and detail content.
- Drag completes a visible full 360° spin in 2D and a full 360° horizontal orbit in 3D; touch, pause, zoom, fit, and reduced-motion behavior remain correct.
- Each background preset applies only to the graph stage, keeps the dotted texture visible, and maintains readable labels and spherical nodes.
- Both mascots and per-page CTAs remain on all 18 pages; no missing local assets or anchors; no horizontal overflow on mobile.
- Static audit and embedded-JavaScript syntax checks pass. Browser testing covers page navigation, both graph modes, rotation, background selection, search, and node details at desktop/mobile sizes. Print verification confirms exactly 18 guide pages.
- After these checks, the user-requested Production deployment was attempted through the connected Vercel deploy tool. The connector returned `McpServerError: Tool deploy_to_vercel not found`, so it did not accept or create a deployment. The prior REV 02.5 attempt returned HTTP 403 (`You don't have permission to create a Production Deployment for this project.`). The current workspace has no `.vercel/project.json` or Vercel CLI, and the connected team listing is empty. No deployment URL or production state is verified; do not switch account/project or bypass Vercel permissions.

### Version diff

- **REV 02.5 baseline:** 18 numbered guide sections in a continuous page, a separate 3D-only graph, manual/automatic orbit, zoom, fit view, and a Light/Dark stage toggle.
- **Implemented REV 03:** one-page-at-a-time guide navigation; 2D and 3D graph modes with 360° rotation; three brand-token background presets.
- **REV 04 approved additions:** Media Spend on KPI & Budget, Revenue on Revenue & Profit, and Overstock SKU on Inventory & Fulfillment. Definitions must distinguish actual/planned spend, net/attributed revenue, and target-based stock excess.

### REV 04 — Spend, Revenue, and Overstock SKU

**Status:** user requested implementation on 2026-09-29. This is a content addition to existing pages; the M1 attachment supplies metric categories and formula structure, not zuri targets or actuals.

| Metric | Placement / category | Definition and formula | Guardrail |
|---|---|---|---|
| Media Spend | Page 10 · KPI & Budget / Acquisition | Actual media cost for a named campaign, channel, and period; sum platform-reported media spend for that exact scope | Keep actual separate from planned/approved budget; state currency, date range, and whether taxes/agency fees are included; do not add duplicate platform attribution costs |
| Revenue | Page 05 · Revenue & Profit / Revenue & Operations | Net revenue = paid/completed order value after discounts, minus refunds; exclude canceled/void orders according to the stated accounting policy | Show business revenue separately from attributed revenue used for ROAS; keep order status, period, and gross/net basis consistent |
| Overstock SKU | Page 17 · Inventory & Fulfillment / Revenue & Operations | Sellable stock exceeding the approved target for that SKU; overstock units = max(0, sellable units − target units) | Define target by SKU and planning horizon before use; this is a derived inventory alert, not a universal benchmark. If demand is zero, days-of-inventory is undefined |

### REV 04 acceptance and verification

- Add exactly these 3 cards without importing Mujeen offer data, targets, budgets, CPL assumptions, or sales-routing rules. MQL and SQL remain distinct stage counts.
- Generate 38 unique metric cards plus the existing MQL/SQL terms for 40 graph terms, with categories Acquisition 10, Lead & Conversion 10, Revenue & Operations 20.
- Confirm Media Spend, Revenue, and Overstock SKU appear in the guide and graph detail/search/export/refresh paths; all existing controls continue to work.
- Confirm all 18 pages retain both mascots and CTA, no broken local assets/anchors, no mobile overflow, and print output remains exactly 18 pages.
- Static, Playwright, and print verifiers passed against REV 04; evidence is saved in `output/draft/campaign-01_metrics-map-review-rev04/`.

### REV 03 baseline verification record

- Static audit: 18 pages, 35 guide metric cards, 37 graph terms, category distribution 9/10/18, mascot pair and CTA on all 18 pages, and no missing anchors or local files.
- Playwright: page navigation and direct links, exactly one visible guide page, 2D/3D mode changes, full-turn drag in both modes, 3D drag, three textured backgrounds, hover label, CTR/MQL/SQL details, category filter, search, zoom/fit, export/refresh, responsive widths 1440/390, zero horizontal overflow, and print display for all 18 pages passed.
- Browser errors and failed network requests: none. The PDF print render exposes all 18 guide pages.
- Browser screenshots and reports: `output/draft/campaign-01_metrics-map-review-rev03/`.
- Vercel Production deployment: BLOCKED; this attempt returned `Tool deploy_to_vercel not found`. No deployment was created. Full details: `output/draft/campaign-01_metrics-map-review-rev03/vercel-deploy.json`.

### REV 04 verification record

- Static audit: PASS — 18 guide pages, 38 metric cards, 40 graph terms, category counts 10/10/20, required REV 04 titles, mascot pair/CTA on all pages, and no missing files, anchors, or errors.
- Playwright: PASS — 1440/390 widths in light/dark modes; Media Spend, Revenue, Overstock SKU, CTR, MQL, and SQL search/detail links; 2D/3D, full 360° turn, backgrounds, category filtering, search, export/refresh, navigation, no overflow, no console/network errors.
- Print: PASS — 18-page PDF, each sheet includes zuri, น้องวางใจ, folio, and paired mascot image. Page 05, 10, and 17 were visually checked after adding the cards.
- Evidence: `output/draft/campaign-01_metrics-map-review-rev04/`.
- Production: no new deployment was attempted for REV 04; the prior connector failure and permission denial remain unresolved. Production is not verified.
