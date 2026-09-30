---
version: "1.5.0b"
created_at: "2026-09-25T10:41:01.8243395+07:00"
last_update: "2026-09-25T21:01:05+07:00"
status: draft
superseded_by: null
attributes:
  doc_type: qc-report
  author: RWANG
  commit_hash: null
  revision: REV 02.5
  result: STATIC_PASS_BROWSER_PRINT_BLOCKED_BY_URL_POLICY
---

# Metrics Map REV 02.5 — QC and version diff

**Outcome:** REV 02.5 presents all 37 terms as shaded sphere nodes over a textured dark field and reveals names on hover or keyboard focus. Static feature checks pass while the 18-page guide remains in place. Browser behavior and print pagination are not verified: the browser URL policy blocked opening this local `file://` artifact. The screenshot/PDF evidence below predates REV 02.4. The artifact remains in `output/draft/`.

## REV 02.5 implementation and validation

- The graph builder now draws category-colored spheres with radial highlights and inset shading, uses a dark dotted/grid stage for contrast, and creates a tooltip for pointer hover and keyboard focus. The right-side detail panel remains the full explanation view.
- Static audit: [verify_metrics_map_static.py](../../../scripts/metrics/verify_metrics_map_static.py); [static-checks.json](../../history/campaign-01_metrics-map-review-rev02-5/static-checks.json).
- Static checks verify all 37 terms and categories, shaded sphere CSS, dark textured stage, tooltip event hooks, the 18-page guide, mascot pairs, local assets and anchors. JavaScript syntax is checked separately.
- Browser interaction, responsive visual layout, hover placement and print pagination remain `NOT_RUN` because direct local file access was blocked by browser security policy. No alternate browser/page-fetch path was used.
- The fresh REV 02.5 production request returned HTTP 403 with the message that the connected account lacks permission to create a Production Deployment for this project. No new deployment was created; the earlier URL remains unverified. Evidence: [vercel-deploy.json](../../history/campaign-01_metrics-map-review-rev02-5/vercel-deploy.json).

## REV 02.4 implementation and validation

- Builder: [build_metrics_map.py](../../../scripts/metrics/build_metrics_map.py); output: [campaign-01_metrics-map.html](../../../apps/metrics/index.html).
- Static audit: [verify_metrics_map_static.py](../../../scripts/metrics/verify_metrics_map_static.py); [static-checks.json](../../history/campaign-01_metrics-map-review-rev02-4/static-checks.json).
- JavaScript syntax validation passed for the embedded graph script; the static audit found 18 ordered guide pages, 35 unique metric cards plus MQL and SQL (37 terms), category counts 9/10/18, 18 mascot-role pairs, 13 local file references present, and no missing anchors.
- The browser refused the direct local HTML URL under its security policy. No alternate browser, DevTools, or page-fetch path was used. Browser interactions, responsive visual layout, image appearance in context, and PDF pagination remain `NOT_RUN`.
- The saved REV 02 PDF and screenshots below are historical evidence only. They do not support a REV 02.4 print pass.
- Vercel deployment creation returned `INITIALIZING` and a production URL, but subsequent deployment lookup returned 404, project listing still showed only the unrelated `resume` project, and build-log access returned 401. The production deployment is therefore unverified; do not treat the returned URL as evidence of a ready site.
- Returned URL: [zuri-metrics-map deployment](https://zuri-metrics-2vsz1toqh-pornpons-projects.vercel.app); expected alias: `zuri-metrics-map-pornpons-projects.vercel.app`.

## Evidence

- [HTML](../../../apps/metrics/index.html)
- [PDF print output](../../product/campaign-01_metrics-map-review/metrics-map-rev02-print.pdf)
- [Browser checks](../../history/campaign-01_metrics-map-review/browser-checks.json)
- [Print checks](../../history/campaign-01_metrics-map-review/print-checks.json)
- Review directory: desktop/mobile screenshots 01–14, dark-theme samples and print renders 01–14.
- Browser verification at `2026-09-25T03:34:03.118Z` (10:34 ICT).
- Original preserved as `campaign-01_metrics-map-review/rev01.html`.

HTML SHA256 (REV 02 baseline, not current): `8995E9AEC11D7B96B8B489322811C1FBFB8837851044602135916E5813D73BB3`.

PDF SHA256: `B8A53A41E9C879B41847BB2578E773092322424C0D726428384AA510B4EBDED9`.

## REV 02.3 current artifact inspection

The builder regenerated the current HTML as 18 pages, 125,591 bytes. Static inspection found 18/18 guide blocks containing both named roles, one short scenario and one CTA; three distinct paired illustrations resolve to local files; the CTR scenario is present. All internal fragment links resolve to an element ID. This checks generated HTML structure and local paths only. The complete page layout has not been rendered or checked in a browser, on mobile, or in print. The three image files were reviewed individually; that does not replace full-page brand QC.

## Acceptance results — REV 02 baseline

The results below document the previous REV 02 run. They are not new verification of REV 02.1, REV 02.2 or REV 02.3.

| ID | Result | Evidence |
|---|---|---|
| AC-01 | PASS | All 11 original metrics retained; G01–G08 indexed with page mappings |
| AC-02 | PASS | 14 numbered sections, 5 categories, valid anchors; direct RACI navigation verified |
| AC-03 | PASS | 14/14 sections contain one visible Zuri and one visible น้องวางใจ in all four viewport/theme variants |
| AC-04 | PASS | Both images reference the requested local assets; old image/name removed |
| AC-05 | PASS | Example arithmetic independently recomputed; hypothetical labels and scopes included |
| AC-06 | PASS | Conversion, ROAS, ROI, revenue LTV and gross-profit LTV distinguished |
| AC-07 | PASS | Planning pages labeled educational templates; unknown values stay รอกำหนด/รอข้อมูล |
| AC-08 | PASS | All 7 RACI rows have exactly one A and at least one R |
| AC-09 | PASS | 1440/390 px × light/dark: no document overflow, missing anchors/files, page errors or failed requests; minimum visible screen text 11 px |
| AC-10 | PASS | A4 portrait PDF exactly 14 pages; each has the correct folio, both mascot names and two raster image operators; all 14 print renders visually reviewed |
| AC-11 | REVIEWED | Every checklist line assessed below; release limitations retained |
| AC-12 | PASS | Draft only; brief/spec updated, original retained, version diff recorded |

Mobile RACI scroll reached 290 px of 290 px; the region is keyboard-focusable and has a Thai scroll hint. The whole document does not scroll sideways. All three font families load locally. Optional external reference links require internet; reading/printing the guide does not.

## Independent arithmetic

Frequency 2.5; CPM 100 บาท; CTR 2%; CPC 5 บาท; CVR 5%; CPO/CPA(paid order) 100 บาท; AOV 500 บาท; ROAS 5×; ROI 11.11%; contribution before advertising 200 บาท/order and after advertising 100 บาท/order; scoped profit 5,000 บาท; CAC 300 บาท; revenue LTV 4,000 บาท; gross-profit LTV 1,600 บาท.

These are approved hypothetical examples, not customer results. Attribution assumptions and exclusions are stated in the guide.

## Full image-checklist review

PASS applies to this draft. LIMITATION is not final-release approval. N/A indicates a condition outside this deliverable.

| Checklist line | Result | Observation |
|---|---|---|
| 1.1 Shipped SVG wordmark | PASS | Original outlined asset referenced on every page |
| 1.2 Clear space ≥ cap height | PASS | Padded white plate plus internal SVG clear space; screen/print reviewed |
| 1.3 Wordmark ≥110 px | PASS | 118 px desktop; 110 px mobile/print |
| 1.4 Logo contrast | PASS | Ink/amber on white plate, also in dark mode |
| 1.5 No live SVG text | PASS | Logo has no `<text>`; original paths unchanged |
| 2.1 Amber exactly #E8820C | LIMITATION | UI variable measured exact; shaded mascot art reused, not recolored or certified exact-token |
| 2.2 Amber signal, not flood | PASS | Numbers, labels, rules and localized emphasis |
| 2.3 Ink #1F2937 | PASS | Light-theme ink exact; dark mode intentionally uses inverse text |
| 2.4 No brand gradient/glow/shadow | PASS | None added; cover dot pattern is not a tonal brand fill |
| 2.5 No color picking | PASS | UI uses profile tokens and existing dark treatment |
| 3.1 Required fonts | PASS | Three specified families loaded locally; OFL licenses included |
| 3.2 Headline/label tracking | PASS | English headings tight; labels wide; Thai body normal |
| 3.3 Thai marks/vowels | PASS | All print pages reviewed; final-size screen samples checked |
| 3.4 Minimum screen 11 px | PASS | Measured 11 px minimum in all four variants |
| 4.1 All claims in approved-copy bank | LIMITATION | Existing tagline from approved-copy; educational additions approved through this task's spec, but global copy bank and public release were not promoted |
| 4.2 No prohibited claims | PASS | No guarantees, fabricated customer results, compliance badges or superiority claims |
| 4.3 Sourced numbers/separators | PASS | Definitions and labeled examples; thousands separators present |
| 4.4 Product naming | PASS | zuri prose; original ZURI wordmark; Zuri names the human mascot |
| 4.5 No competitor/LINE marks | PASS | Source imagery linked, not used in the branded layouts |
| 5.1 Character roles | PASS | Zuri explains; น้องวางใจ points out checks |
| 5.2 Competent/modern Zuri | PASS | Selected portrait has glasses, bob, amber clip and explanatory gesture |
| 5.3 Hands/eyes at final size | PASS | Existing assets inspected in screen and print renderings |
| 5.4 Consistent identity | PASS | Same two source assets on every page |
| 5.5 Mascot palette | PASS WITH LIMITATION | Cream/ink/amber compatible; final raster color approval remains open |
| 6.1 Dimensions/safe area | PASS / N/A | Responsive web/A4 checked; no IG/LINE square asset produced |
| 6.2 Compression/upscaling | PASS | PNGs displayed below native size; no upscale introduced |
| 6.3 Transparency on colored ground | N/A | Portraits intentionally sit on white plates; no transparency assumed or synthesized |
| 6.4 Seed in generated filename | N/A | No new generation; existing asset filenames preserved |
| 6.5 White/dark surfaces | PASS | Both themes checked at 390/1440 px |
| 7.1 Thumbnail hierarchy | PASS | Title/category/page number distinct; reference body intended for full-size reading |
| 7.2 zuri identity | PASS | Outlined wordmark, named mascot pair, typography, signal and dotted cover |

## Verification issues resolved

1. Google Fonts returned `ERR_NETWORK_ACCESS_DENIED`: the online stylesheet depended on restricted network access. Official fonts/licenses were bundled under draft assets. Final checks: all families loaded, zero failed requests.
2. Initial PDF was 17 pages: AARRR, Workflow and Roadmap footers exceeded printable height. Reduced print spacing without reducing font size. Final PDF: 14 pages, both mascots and footer on each.
3. The mobile table hint wrapper initially expanded a grid item to the table's minimum width. Explicit `min-width:0` restored internal scrolling; direct scroll/no-document-overflow checks passed afterward.

Stale print-page files 15–17 from the failing run were removed. Only current 14-page print evidence remains.

## REV 01 → REV 02

| Before | After |
|---|---|
| Three funnel sections + short tips | Five categories, 14 numbered pages and linked contents |
| 11 short metric definitions | Original 11 retained plus missing explanations, units, scope and examples |
| No team/planning source coverage | AARRR, roles, workflow, KPI, Budget, RACI, 90-day/12-month plans |
| One guide with obsolete name | Both named mascots on all HTML/PDF pages |
| Recreated mark/live wordmark text | Original outlined SVG |
| Overly definitive interpretation | Explicit event/cost/cohort scope and limitations |
| Remote fonts, no verified pagination | Local fonts, responsive checks and verified A4 print output |

## REV 02 → REV 02.1

| Before | After |
|---|---|
| Conversion page lacked MQL/SQL definitions | Added both stage definitions, distinct-lead counting, cohort-based MQL-to-SQL example, and source S11 |

## REV 02.1 → REV 02.2

| Before | After |
|---|---|
| Lead, offer and inventory measures were mostly absent | Added four Commerce & Operations pages and lead-planning formulas; updated guide to 18 pages in 6 categories |
| M1 reference values could be mistaken for reusable guidance | Imported reusable metric structures only; Mujeen-specific prices, CPLs, conversion assumptions, budgets, targets, routing and SKU values are excluded |

## REV 02.2 → REV 02.3

| Before | After |
|---|---|
| Dot pattern visible only on the cover; pages felt mostly white | Dotted field carries across every page; white metric cards keep reading surfaces clear |
| Amber was limited to small labels and rules; there was no action button | Amber now marks key page hierarchy and linked action buttons |
| Same small mascot images and positions repeated on every page | Three reference-based paired poses rotate; art alternates sides and guide placement varies by page |
| Few simple situations to connect a question to a metric | Each page includes a practical scenario; Consideration shows how to use CTR to compare content under similar conditions |

Three new paired PNGs were copied into `output/draft/assets/mascot/`; generation prompts and IDs are recorded in `projects/campaign-01/image-prompt.md`. The HTML was regenerated from the builder. Static HTML inspection confirmed all CTA fragment targets exist, but browser interaction, responsive rendering, PDF pagination and print review have not been rerun for REV 02.3. Generated mascot art remains draft artwork pending a full-page brand review.

## Delivery boundary

Local rendering evidence applies to REV 02 only. REV 02.1–02.4 browser and print checks were not run. A production deployment request was accepted for initialization by Vercel, but its existence/readiness could not be verified through the available API. No customer/production analytics or final human brand approval is claimed. Exact mascot-art and full-page visual review remain open. No changes to `zuri-ai`.

## CHANGELOG

| Version | Date | Status | Summary | Commit Hash | Agent |
|---|---|---|---|---|---|
| 1.5.0b | 2026-09-25 | draft | Replace flat graph chips with shaded spheres, textured dark stage and hover/focus labels; static checks pass, browser/print remain unverified, Vercel deployment denied (403) | N/A | RWANG |
| 1.4.0b | 2026-09-25 | draft | Record REV 02.4 graph implementation, static pass, browser/print and Vercel status limitations | N/A | RWANG |
| 1.3.0b | 2026-09-25 | draft | Record REV 02.3 visual and scenario update; browser/print review pending | N/A | RWANG |
| 1.2.0b | 2026-09-25 | draft | Record REV 02.2 Commerce & Operations expansion; only REV 02 is verified | N/A | RWANG |
| 1.1.0b | 2026-09-25 | draft | Record REV 02.1 content update; prior verification remains REV 02 only | N/A | RWANG |
| 1.0.0b | 2026-09-25 | draft | REV 02 acceptance/QC evidence and release limitations | N/A | RWANG |
