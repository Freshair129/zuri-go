---
version: "2.6.0b"
created_at: "2026-09-25T10:41:01.8243395+07:00"
last_update: "2026-09-29"
status: draft
superseded_by: null
attributes:
  doc_type: campaign-brief
  author: RWANG
  commit_hash: null
  scope: campaign-01
  revision: REV 04
---

# campaign-01 — Marketing metrics, mapped

**Status:** REV 04 adds actual Media Spend, Revenue, and Overstock SKU definitions to the approved REV 03 guide. Static, browser, and 18-page print verification passed; Production deployment remains blocked by the Vercel connector/permission issue recorded in the current spec.
**Audience:** Thai SME owners and junior marketers.
**Current artifact:** `output/draft/campaign-01_metrics-map.html`.

## Purpose and approval

A Thai reference guide connecting marketing metrics to customer growth, team responsibilities and planning. REV 04's three metrics were explicitly requested on 29 September 2026; the user also approved the REV 02 content expansion and REV 03 page/graph design in this task.

The earlier externally hosted REV 01 is a historical draft and was not updated by this task. The local file is the current deliverable.

## Content and structure

One static HTML file with a web-only interactive graph before the 18 numbered guide pages, linked contents, and 6 print categories. REV 04 has 38 guide metric cards plus MQL and SQL (40 graph terms), grouped into Acquisition (10), Lead & Conversion (10), and Revenue & Operations (20). Node search, category browse/filter, 2D/3D mode, 360° rotation, three textured backgrounds, zoom, fit, JSON export, refresh-from-guide, and a right-side detail panel are included. Graph examples are hypothetical and definitions are read from guide cards; the graph does not show live performance data.

Guide page structure:

| Category | Pages | Contents |
|---|---|---|
| Overview | 01 | Contents and funnel overview |
| A · Metrics | 02–06 | Awareness, Consideration, Conversion (including MQL/SQL), Revenue & Profit, Customer Value |
| B · Growth | 07 | AARRR, event/cohort/time definitions |
| C · Team & Workflow | 08–09 | Data & Strategy, execution roles, working loop, skill levels |
| D · Planning | 10–13 | KPI, Budget, RACI, 90-day Roadmap, 12-month Outlook |
| E · Commerce & Operations | 14–17 | Lead and sales efficiency, order and offer mix, contribution and returns, inventory and fulfillment |
| F · Reading & Sources | 18 | Interpretation checklist and source index |

All 11 original metrics retained: Impressions, CPM, Clicks, CTR, CPC, CVR, ROAS, ROI, CPO, CAC and LTV. Additions cover Reach, Frequency, Conversions, CPA, AOV, gross-profit LTV, MQL/SQL, CPL/Qualified CPL, lead-to-sale rate, response SLA, lost reason mix, actual Media Spend, Revenue, orders, Units per Order, Offer Mix, packaging cost/order, contribution before/after acquisition cost, media share of revenue, cancellation/return rates, sellable stock by SKU, units sold by SKU, inventory velocity, stock cover, Overstock SKU and bundle capacity. Define Revenue separately from attributed Revenue; calculate Overstock SKU against an explicit per-SKU target, not a universal benchmark. The budget page retains formulas for required leads and estimated media spend.

The user-supplied M1 planning document is used only for metric categories and formula structure. Its offer names, prices, CPL and conversion assumptions, targets, budget totals, segmentation and routing rules are not adopted as zuri data or benchmarks. Existing AOV, CAC, ROAS, CTR and MQL/SQL definitions are extended or reused rather than duplicated.

The 8 images under `output/draft/gvm/` are mapped as G01–G08. Supporting sources are mapped as S01–S12, including the user-supplied M1 planning reference for selected metric structures only. Planning tables are educational templates, not actual zuri operations or approved spending plans.

## Visual direction

- Original outlined `assets/logos/zuri-wordmark.svg`.
- White/canvas surfaces, ink type, restrained amber `#E8820C`, existing dark surface treatment.
- Manrope, IBM Plex Sans Thai and IBM Plex Mono bundled with OFL licenses; no network required to read/print.
- Both mascots on every logical page in three distinct reference-based pose illustrations saved in `output/draft/assets/mascot/`.
- zuri explains; น้องวางใจ identifies checks. Pair placement alternates and selected pages place the guide before the metrics content.
- A short practical situation and linked amber action button appear on every page; the Consideration page shows how CTR helps compare content under similar conditions.
- The dotted field continues across all pages; white metric cards keep the reading surfaces clear. Amber marks section labels, formulas, page numbers and actions.
- The web-only graph uses the reference's orbit layout with shaded 3D sphere nodes, a dotted/grid texture over a dark stage, and metric names shown on hover or keyboard focus; brand-token colors, wordmark, both named mascots, and links back to guide terms remain. Print CSS hides the graph to preserve page numbering.
- Responsive presentation; wide RACI/Budget tables scroll internally on mobile.

## Deliverables and verification

| Item | State |
|---|---|
| Static HTML, 18 pages + interactive graph | REV 04 generated; static and browser checks passed |
| Graph nodes, categories and controls | 40 unique terms (38 metric cards + MQL/SQL); counts 10/10/20; search/detail/export/refresh verified |
| Both mascots on every page | Both named roles and paired art verified on all 18 guide pages |
| PDF print output | REV 04 review PDF contains 18 pages; page numbers and both mascots verified on every page |
| Vercel production | No REV 04 deployment created: connector returned `Tool deploy_to_vercel not found`; prior attempt was denied with HTTP 403. Current deployment state remains unverified |
| Sources, anchors, RACI roles, examples | REV 04 static audit passed with no missing local files or anchors |
| Local font bundle/licenses | Included |
| IG/LINE square cutdowns | Not produced; outside this approved update |
| Public release/promotion | Not performed; human approval required |

REV 02.1 added MQL/SQL; REV 02.2 added four Commerce & Operations pages and KPI/Budget formulas; REV 02.3 updated visuals, CTA links and practical scenarios; REV 02.4 added the interactive graph; REV 02.5 added shaded spheres and hover/focus labels; REV 03 added page-by-page navigation and 2D/3D backgrounds; REV 04 adds Media Spend, Revenue and Overstock SKU. Current browser and print evidence is saved in `output/draft/campaign-01_metrics-map-review-rev04/`.

QC: `output/draft/campaign-01_metrics-map-qc.md`.
Evidence and preserved REV 01: `output/draft/campaign-01_metrics-map-review/`.

## Maintenance

`build_metrics_map.py` in this campaign directory generates the static HTML using Python 3 without third-party packages. Rebuild after editing this generator. Reading the HTML requires neither Python nor JavaScript.

`verify_metrics_map.cjs` uses Playwright and installed Chrome. `verify_metrics_print.cjs` uses pdfjs-dist and @napi-rs/canvas. Set NODE_PATH to the bundled runtime's node_modules when using the desktop runtime.

`verify_metrics_map_static.py` uses Python's standard library for page counts, term/category counts, anchors, mascot roles, CTAs, and local asset paths. REV 04 browser verification uses Playwright/Chrome against the local HTML; print verification checks the generated PDF through pdfjs-dist.

## Remaining release limitations

The paired mascot illustrations are reference-based generated draft art; exact brand-art approval remains a human check. Educational copy was approved for this draft through the specification; the global `copy/approved-copy.md` bank was not expanded. No customer or production results are claimed. Browser and print checks passed locally; no production deployment is verified.

## Version diff

REV 01: three funnel sections, one guide, obsolete mascot name, remote fonts.
REV 02: five categories/14 pages, both mascots everywhere, complete source coverage, corrected interpretation, local fonts and verified print output.
REV 02.1: added MQL/SQL definitions, distinct-lead counting, a cohort-based handoff-rate example, and Salesforce source S11; browser/print recheck pending.
REV 02.2: expanded to 18 pages/6 categories with lead acquisition, sales response/outcome, order economics and inventory metrics; added leads-needed/media-budget formulas and S12; no Mujeen offer values or targets copied; browser/print recheck pending.
REV 02.3: restored visible dot accents, stronger amber hierarchy, functional per-page CTAs, three varied reference-based mascot illustrations and a short practical scenario on every page; browser/print recheck pending.
REV 02.4: added a self-contained 37-term 3D marketing graph with search, categories, controls and detail panel; static checks pass; browser/print verification blocked by local URL policy.
REV 02.5: replaced flat text chips with shaded spherical nodes, added a textured dark stage for contrast, and moved node names to hover/keyboard focus; static feature checks pass, browser/print verification remains blocked by local URL policy.
REV 03: added one-page guide navigation and a separate 2D/3D graph with 360° rotation and three textured backgrounds; browser/print verification passed.
REV 04: added Media Spend, Revenue and Overstock SKU with scope and calculation guardrails; 38 metric cards/40 graph terms and 18 printed pages verified.

## CHANGELOG

| Version | Date | Status | Summary | Commit Hash | Agent |
|---|---|---|---|---|---|
| 2.6.0b | 2026-09-29 | draft | Add Media Spend, Revenue and Overstock SKU; static, browser, and 18-page print verification passed; Production deploy blocked by connector | N/A | RWANG |
| 2.5.0b | 2026-09-25 | draft | Refine graph with 3D spheres, textured stage and hover/focus labels; static checks pass, browser/print pending, Vercel production denied (403) | N/A | RWANG |
| 2.4.0b | 2026-09-25 | draft | Add 37-term interactive 3D graph; static checks pass, browser/print visual QC pending | N/A | RWANG |
| 2.3.0b | 2026-09-25 | draft | Restore dot/amber accents; vary paired mascot poses; add practical examples and linked CTAs | N/A | RWANG |
| 2.2.0b | 2026-09-25 | draft | Add reusable lead, commerce and inventory metrics; browser/print QC not rerun | N/A | RWANG |
| 2.1.0b | 2026-09-25 | draft | Add MQL/SQL definitions to Conversion; browser/print QC not rerun | N/A | RWANG |
| 2.0.0b | 2026-09-25 | draft | Approved 14-page expansion with source mapping, paired mascots and local verification | N/A | RWANG |
| REV 01 | 2026-09-02 | superseded | Initial funnel draft; original HTML preserved in review/rev01.html | N/A | Original draft |
