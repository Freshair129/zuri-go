---
title: Zuri-AI domain 01 - marketing and campaigns
status: draft
superseded_by: null
version: 0.1.3
date: 2026-10-04
owner: user-review-pending
source_document: ARCH-005
source_role: process-chapter
---

# บท 01 — Marketing & Campaign

> Canonical chapter of [ARCH-005](ARCH-005-commercial-pipeline.md#flow-index). บทนี้เป็น source ของ flow รายละเอียด; HTML เป็น visual view. เลขบทและ MKT-Fxx ไม่ใช่ registered Domain/Feature ID. ความสัมพันธ์ข้ามระบบและสิทธิ์ผู้เขียนข้อมูลอ้าง [registry/relations.yaml](../../../registry/relations.yaml) และ ARCH-005; implementation decisions remain draft.

[เปิดภาพรวมและชุด Flow (1 + 7 หน้า)](marketing-campaign-flows.html) · พิมพ์ A4 แนวนอนหน้าเดียวต่อภาพ

เอกสารชุดนี้ลงรายละเอียดโดเมน **Marketing & Campaign** ต่อจาก [ภาพรวมเส้นทางขาย](zuri-ai-line-sales-flow.html) และ [ทะเบียนสถานะ/ตัวชี้วัดเดิม](ARCH-005-commercial-pipeline.md) แยกผู้ทำ ขั้นตัดสินใจ ทางออกเมื่อข้อมูลไม่พร้อม หลักฐานที่เก็บ และ KPI ของทุก Flow ที่เกี่ยวกับ Ads ในขอบเขตนี้

**Complexity:** C-2 · **Risk:** LOW สำหรับเอกสารการออกแบบนี้ · **สถานะ:** ร่างเพื่อทบทวน ไม่ใช่การยืนยันว่ามี integration ใช้งานแล้ว

## สมมติฐานและขอบเขต

1. คำว่า “โดเมน” ในงานนี้หมายถึงขอบเขตงานธุรกิจตาม journey ที่ผู้ใช้ขอ ไม่ได้สร้างหรือแก้ทะเบียน `DOM-CAM` ของแอป Zuri-Go เอกสาร Zuri-Go ใช้ประกอบตรวจ parent/peer เท่านั้น ผลงานนี้เป็นข้อเสนอกระบวนการของ **Zuri-AI platform**
2. แพลตฟอร์ม Ads, ชื่อสินค้า, งบ, Objective จริง, baseline, กลุ่มเป้าหมาย, sample size, sales SLA, ช่วง attribution, conversion lag, เกณฑ์หยุด และผู้อนุมัติของ Zuri-AI ยังไม่ระบุ แสดงเป็น `TBD / ต้องอนุมัติ` ไม่ใส่ค่าขึ้นเอง
3. ผู้ใช้ต้องการดูผลทุกสัปดาห์ จึงเสนอรอบรายงานสัปดาห์ จันทร์ 00:00 ถึงจันทร์ถัดไป 00:00 เขตเวลา `Asia/Bangkok`; เวลา snapshot/ประชุมให้เจ้าของธุรกิจยืนยันก่อนใช้งาน
4. ทำรายงาน Ads ทุกวันเป็น **ข้อเสนอ** เพื่อเห็นปัญหางบหรือข้อมูลสดเร็วขึ้น; ช่องทางดึงผลเป็น Ads API หรือไฟล์ export ยังต้องตัดสินใจ ค่า execution rate จริงไม่ได้ยืนยัน
5. การเผยแพร่ Ads การหยุด/เพิ่มงบ และการเลือกผู้ชนะ A/B เป็นการกระทำของผู้รับผิดชอบตามสิทธิ์ การผ่าน decision gate เพียงเสนอสิ่งที่ควรทำ ไม่ได้ทำให้สิ่งนั้นถูกเผยแพร่หรืออนุมัติโดยอัตโนมัติ
6. attribution จับคู่ได้เมื่อมีหลักฐานเชื่อม campaign/variant กับแชตที่ลูกค้าส่งจริง รายงาน impression/click ไม่เท่ากับคนทัก; หาต้นทางไม่ได้ต้องแสดง `UNKNOWN`
7. หนึ่งคนอาจมีหลาย touch/click ได้ จึงเก็บ touch แยกจาก Lead และไม่ตีความยอดรวม platform-attributed conversion เป็นจำนวนผู้ซื้อไม่ซ้ำของธุรกิจ
8. ใช้สี/ตัวอักษรตาม [คู่มือแบรนด์ Zuri](../../../brand/brand-profile.md): canvas `#F7F8FA`, ink `#1F2937`, muted `#6B7280`, accent `#E8820C`, card `#FFFFFF`, Manrope + IBM Plex Sans Thai + IBM Plex Mono ไม่วาดโลโก้ใหม่

## ข้อเท็จจริงที่ใช้เป็น guardrail

เอกสาร FEAT-002 ของ Zuri-Go เป็น peer ที่มีการตรวจอยู่ใน checkout แต่เป็นระบบอีกตัว: เลือก objective/KPI แยกราย campaign, target/model/actual ต้องแยกชนิด, ข้อมูลต้องมีแหล่งที่มา, การเปลี่ยนสัปดาห์เป็น review checkpoint, sample ไม่พอให้ `INCONCLUSIVE`/`DATA_HOLD`, และการเปลี่ยนงบหรือ offer ต้องมีคำตัดสินเจ้าของแยกจากผลการวัด เอกสารนี้รับหลักข้อมูลที่ตรวจย้อนกลับได้มาใช้เป็น **ข้อเสนอ/guardrail** เท่านั้น; ไม่ได้อ้างว่า Zuri-AI มี product requirement หรือ runtime เหล่านี้แล้ว

หลักฐานประกอบ: [Zuri-Go FEAT-002 specification §3, §5, §6](../../features/FEAT-002-campaign-mission-control/spec.md), [Zuri-Go campaign domain](../../domains/campaign/README.md), [คู่มือแบรนด์](../../../brand/brand-profile.md) และ [ข้อจำกัดการเชื่อม Ads → LINE ใน Zuri-AI](ARCH-005-commercial-pipeline.md#ads--line-attribution-ที่ทำได้และข้อจำกัด) เอกสารเหล่านี้อ่านเพื่อแยกขอบเขตเท่านั้น ไม่ได้แก้ไข

## ทะเบียน Flow และสิ่งที่ต้องได้

| ID | Flow | ผู้เริ่ม / เจ้าของงาน | ผลลัพธ์ที่ต้องบันทึก | มาตรวัดหลัก |
|---|---|---|---|---|
| MKT-F01 | ตั้ง Campaign brief, Objective, KPI และ target | ผู้ขอโฆษณา → Campaign owner → ผู้อนุมัติ | brief version, objective, target set, owner, dates, currency, budget cap, approve/reject reason | complete brief rate, time-to-approval; ไม่ตัดสินผล Ads |
| MKT-F02 | ออกแบบ A/B test ก่อนเปิด | Experiment owner / Analyst | hypothesis, control/treatment, เปลี่ยนตัวแปรเดียว, eligibility, sample/window/lag/stop rule, budget cap, version | setup pass rate, experiment coverage; ไม่มีการประกาศ significance ก่อนตั้งวิธีทดสอบ |
| MKT-F03 | ตรวจ Launch readiness และเผยแพร่ | Campaign owner + ผู้อนุมัติงบ + operator | gate evidence, approver, scope, platform campaign/ad IDs, actual active window, rejected/changed item | ผ่าน launch gate, launch-delay reason, release เทียบ cap |
| MKT-F04 | รับ Ads statistics และตรวจคุณภาพ | Data operator / Analyst | source report/snapshot, platform/account, reporting timezone, currency, fetched/exported at, date range, raw/normalized values, watermark | source freshness, row coverage, completeness, failed imports; เก็บ Spend/Impressions/Link clicks ตาม scope |
| MKT-F05 | ส่งต่อ campaign/source/variant ให้ inbound chat | Campaign owner ตั้ง map → ระบบ/LINE owner บันทึก event | campaign/ad/creative/experiment/variant, token/UTM, touch id, attribution method+evidence; map fail = UNKNOWN | tracked clicks, chats with verified source, attribution coverage; verified chat / attributable click เมื่อฐานนับตรงกัน |
| MKT-F06 | เฝ้าระวังผลและ triage ระหว่างสัปดาห์ | Campaign owner + data/operator ที่ได้รับมอบหมาย | finding, severity, affected campaign/source/window, source watermark, numerator/denominator, owner, fix/hold action, due time | cap headroom, ingestion lag, stale/missing rows, unresolved finding age; threshold ที่ยังไม่อนุมัติ = TBD |
| MKT-F07 | Review cohort รายสัปดาห์และตัดสินใจรอบถัดไป | Marketing + Sales + budget approver | period/as-of, mature vs pending cohorts, A/B evidence, decision/version, reason, approver, action scope/owner/due, next review | Cost per Ready-for-Call Lead, mature Lead-to-Paid, cost completeness, attribution coverage; แสดง n/N และ unknown |

## Flow detail: actor, transition, status, output, exception

### MKT-F01 — ตั้ง Campaign brief และเป้าหมาย

**เริ่มเมื่อ:** มีคำขอหาลูกค้า / ขายสินค้า / สร้าง awareness และ campaign ใหม่ยังไม่มีการอนุมัติ\
**เจ้าของ:** ผู้ขอกรอก intent; Campaign owner จัด scope; ผู้อนุมัติงบอนุมัติ scope และ cap\
**ทางหลัก:** `REQUESTED → BRIEF_DRAFT → OBJECTIVE_SELECTED → TARGETS_SET → READY_FOR_APPROVAL → APPROVED → READY_FOR_TEST`\
**ทางกลับ:** ข้อมูลสินค้าหรือ economics หาย → `NEEDS_INFO`; ไม่อนุมัติ → `REJECTED`; บันทึกผู้ตอบ เหตุผล และวันแก้ไขก่อนนำกลับเข้าสายอนุมัติ

ลำดับงาน: ระบุสินค้า/กลุ่มตลาด/ข้อเสนอ/ช่องทาง → เลือก business objective เพียงรายการที่ตกลง → เลือก outcome KPI หลักและ diagnostic/guardrail ที่เกี่ยวข้อง → ระบุ metric definition, unit, direction, scope, baseline พร้อม provenance, target band/วิธีประเมิน → ระบุ period, timezone, budget/cap, currency, สินค้าคงคลัง/กำลังรับ Lead ที่ต้องตรวจ → ใส่ owner และ approver → ส่งให้อนุมัติก่อนสร้าง launch request

ข้อมูลบังคับ: `brief_id`, `brief_version`, `business_scope`, `offer/product`, `objective`, `primary_kpi_id`, `metric_version`, `target_value/unit/direction/source_type`, `period_start/end`, `timezone`, `currency`, `budget_cap`, `owner_id`, `approver_id`, `status`, `decision_reason`, `effective_at`, `created_at`, `updated_at`. `source_type` แยก actual baseline, external benchmark, user target หรือ planning assumption. ช่องที่ไม่มีหลักฐานยังเป็น `TBD`; ห้ามแทนเป้าที่ไม่มีด้วย 0 หรือ baseline จาก MUJEEN

KPI/process measure: สัดส่วน brief ที่กรอกครบ, median เวลารออนุมัติ และจำนวน `NEEDS_INFO` แยกเหตุผล ตัวชี้วัดธุรกิจยังไม่มีจน campaign เริ่มรันและได้ข้อมูลจริง

### MKT-F02 — ออกแบบ A/B test ก่อนเริ่มใช้เงิน

**เริ่มเมื่อ:** brief ผ่านอนุมัติและ owner เสนอสมมติฐานที่ทดสอบได้\
**เจ้าของ:** experiment owner สร้างแบบ; analyst/data owner ตรวจวิธีนับ; ผู้อนุมัติงบยืนยัน cap/window\
**ทางหลัก:** `DRAFT → DESIGN_REVIEW → TRACKING_QA → APPROVED → QUEUED_FOR_LAUNCH`\
**ทางกลับ:** hypothesis วัดไม่ได้ / ตัวแปรหลายอย่างเปลี่ยนพร้อมกัน / audience ทับซ้อน / ไม่มี attribution plan / budget หรือ stopping rule หาย → `NEEDS_REVISION`; บันทึกสาเหตุและ design version ใหม่

ระบุ `hypothesis`, control A กับ treatment B, ตัวแปรที่เปลี่ยนเพียง 1 รายการ, ส่วน creative/copy/audience/placement ที่คงเดิม, eligibility/random split, metric หลักก่อนทดสอบ, guardrails, event mapping, expected lag, conversion window, minimum sample/precision method, duration, stop rule, spend cap และวิธีจัดการลูกค้า/แชตซ้ำ สิ่งเหล่านี้ยังตั้งค่าไม่ได้จนผู้มีอำนาจยืนยัน input ที่ขาด ห้ามอ้างว่าความต่างเป็นเหตุจาก ad creative ถ้า split หรือ population ไม่เทียบกัน

ก่อนอนุมัติต้องทดลอง click→ข้อความ test จริงที่มี variant tag, ตรวจแชตไม่สร้าง Lead ซ้ำ, ตรวจ A/B IDs คงอยู่ใน payload, ตรวจ event timestamp/timezone และ dry-run denominator ค่า sample threshold, budget และเวลาเป็น `TBD` จนมีการอนุมัติ

ข้อมูล: `experiment_id/version`, `campaign_id`, `hypothesis`, `control_variant`, `treatment_variant`, `changed_variable`, `allocation_method`, `audience_scope`, `metric_definition/version`, `sample_rule`, `conversion_window`, `expected_lag`, `stop_rule`, `budget_cap`, `tracking_qa_at`, `reviewer`, `approver`, `status`, `decision_reason`

### MKT-F03 — Launch readiness และการเปิดแคมเปญ

**เริ่มเมื่อ:** `MKT-F02 = APPROVED` และ campaign owner ส่ง launch request\
**เจ้าของ:** Campaign owner รวบรวม gate; budget approver อนุมัติงบและขอบเขต; operator ที่ได้รับสิทธิ์ลงมือบนแพลตฟอร์ม Ads\
**ทางหลัก:** `LAUNCH_REQUESTED → PREFLIGHT → READY_TO_PUBLISH → PUBLISHING_BY_OWNER → ACTIVE_CONFIRMED`\
**ไม่ผ่าน:** missing approval/asset/budget/timing/tracking → `BLOCKED`; ปรับงานแล้วขอตรวจใหม่\
**ผิดพลาดภายนอก:** publish ล้มเหลว/เวลาไม่ตรง → `LAUNCH_FAILED` พร้อม response/reference จากแพลตฟอร์มและ action owner

Preflight: brief และ target version ยังมีผล; campaign/ad/variant labels ถูกต้อง; creative ผ่านผู้อนุมัติ; landing/message path ทำงาน; click / token / first-message QA มีหลักฐาน; account, budget cap, currency, schedule, timezone และ billing authorization ผ่าน; ระบุผู้ monitor และ next review ก่อนกด publish. ระบบบันทึก **request → human action → confirmation** แยกกัน ผู้ทำบันทึก external IDs, เวลา, screenshot/reference URL ที่ไม่บรรจุ secrets และค่าที่แพลตฟอร์มยืนยันว่า active

`READY_TO_PUBLISH` หมายถึงตรวจ checklist ครบ ไม่ได้หมายถึง ad online; เมื่อ operator ไม่มีสิทธิ์ให้คง `WAITING_FOR_OPERATOR`; หากตรวจไม่ตรงหรือปัญหาความปลอดภัยหยุดที่ `BLOCKED` ไม่ให้ override gate. ห้ามบันทึกแผน schedule เป็นการโพสต์จริงหรือใช้ network/system API ที่ยังไม่อนุมัติ

KPI/process measure: `ready → actually active` elapsed time, launch failure/blocked rate แยกเหตุผล, active budget เทียบ cap ที่ปล่อยจริง; ไม่รวมงบที่ยังไม่ได้อนุมัติ

### MKT-F04 — เก็บและตรวจ Ads statistics

**เริ่มเมื่อ:** ถึงรอบรับข้อมูลที่ตกลงต่อ platform/date\
**เจ้าของ:** Data operator/import connector รับ snapshot; Analyst เจ้าของ metric ตรวจแหล่งและครบถ้วน\
**ทางหลัก:** `EXPECTED → RECEIVED → PARSED → NORMALIZED → RECONCILED → PUBLISHED_TO_REVIEW`\
**ทางพัก:** `MISSING`, `STALE`, `PARTIAL`, `SCHEMA_CHANGED`, `CURRENCY_MISMATCH` → เก็บ snapshot และ watermark ล่าสุด แต่ทำ finding เฉพาะ metric / period ที่ตัดสินไม่ได้ ห้ามทำให้สัปดาห์ที่แล้วหรือ hard cap ที่รู้แล้วหายไป

Record ขั้นรับข้อมูล: platform/account/scope, retrieved/exported time, report's own date, timezone, currency, attribution setting, metric/schema version, ad/campaign/creative/experiment/variant ID ที่มี, row count, raw reference, ingestion version, duplicate/checksum, result/error, watermark. ห้าม map `clicks` เป็น Link clicks/unique users จน dictionary ของ platform ยืนยัน scope; แยก `impressions`, `reach`, `clicks`, `link_clicks`, spend และ attributed conversions ให้ตรงชื่อจริง

Validation: source น่าเชื่อถือและสิทธิ์ถูกต้อง → schema/required dimensions → row/date coverage → duplicate event/import → timezone/currency/account scope → unit/formula compatibility → completeness/late changes → downstream release. ห้าม sum reach/unique users ทับช่วงหรือคนละ population; แก้ไขผลย้อนหลังเป็น revision เชื่อม snapshot เก่า ไม่เขียนทับโดยไม่ทิ้งรอย

Metric dictionary ที่ผู้ใช้ขอ: `impressions = ผลรวม impression ของ account/ad/date ที่เข้า scope เดียวกัน`; `link_clicks = event link-click ตาม definition ของ platform`; `CTR = link_clicks / impressions × 100` เมื่อ denominator >0; `CPC = matched spend / link_clicks` เมื่อ clicks >0; `spend = currency/period ที่ระบุจาก platform` ห้ามเปรียบเทียบคนละ currency/definition. Zero denominator = `N/A`; source stale = `DATA_HOLD`; values ทั้งหมดยัง `NOT_AVAILABLE` จนต่อแหล่งจริง

Ingestion cadence รายวันเป็นข้อเสนอเท่านั้น `source_freshness_limit`, API rate/CSV arrival time, retries, timezone, reporting lag และ monitoring SLA อยู่ `TBD` ห้ามอ้างว่า pull สำเร็จหรือ API rate ที่ยังไม่ทดลอง

### MKT-F05 — ผูก campaign touch ไปยังแชตอย่างมีหลักฐาน

**เริ่มเมื่อ:** ad click หรือ message path สามารถพก source code ได้\
**เจ้าของ:** Marketing ตั้ง source map/version; owner ของ LINE/lead service ตรวจ payload เมื่อมีข้อความจริง (ลงรายละเอียดใน domain LINE ถัดไป)\
**ทางหลัก:** `SOURCE_MAP_DRAFT → TAG_QA → ACTIVE_FOR_TEST → TOUCH_CAPTURED → VERIFIED_INBOUND_SOURCE`\
**ทางไม่รู้ที่มา:** `NO_TAG / TAG_INVALID / LINK_LOST / MULTIPLE_MATCHES → UNKNOWN/AMBIGUOUS` พร้อมเหตุผล ไม่แต่งค่าชดเชย

Marketing ออก source IDs สั้นและไม่บรรจุข้อมูลส่วนตัว: `campaign_id`, `ad_id`, `creative_id`, `experiment_id`, `variant_id`, `touch_id` ตามความสามารถของลิงก์; บันทึก `source_map_version`, validity range, destination OA/channel และ `attribution_method`. QA เปิดลิงก์ A และ B → ตรวจปลายทาง → ให้ผู้ทดสอบกดส่งข้อความเอง → ตรวจว่าข้อมูลถึง inbound record โดยไม่เปลี่ยน variant หรือทำ Lead ซ้ำ → ใช้ผล test เป็นหลักฐานว่าทดสอบได้ ไม่ใช่หลักฐานลูกค้าจริง

ต้องแยก facts: impression/click เป็น channel event; follow/add friend เป็น interaction; **first customer-sent chat** เป็น Lead acquisition event; source tag ที่เห็นบน URL ก่อนลูกค้าทักยังไม่ยืนยัน identity link. attribution report ใช้ policy/version ที่อนุมัติ (`first verified touch` เป็นตัวเลือก ไม่ใช่ default ที่ lock แล้ว) และ `conversion_window` ที่กำหนดล่วงหน้า. หากไม่มี verified match แสดง known/unknown และ coverage แยก; ห้ามยัด unknown ใส่ last-click หรือ Organic

ตัวหารที่ใช้ได้: `attribution coverage = distinct new-chat lead ที่มี verified source / distinct new-chat lead ทั้งหมด` ของ acquisition cohort เดียวกัน. `tracked click → verified chat rate` ต้องใช้ clicks และคนทักที่นิยาม match window/scope เดียวกัน; click platform aggregate อาจไม่มี person key จึงอาจรายงานเทียบแบบ descriptive เท่านั้น ค่า duplicate touch ต่อ lead เก็บใน touch table แยกจาก unique-lead count

**ส่งมอบ:** contract fields `source, campaign_id, ad_id, creative_id, experiment_id, variant_id, touch_id, attribution_method, evidence_ref, occurred_at, recorded_at, verification_state`. `lead_id` และ LINE identity เป็นเจ้าของ inbound/LINE domain ห้าม Marketing สร้างจาก click เอง

### MKT-F06 — Daily watch และ triage

**เริ่มเมื่อ:** Ads active หรือมี deliverable ค้างก่อน start date\
**เจ้าของ:** Campaign owner ติดตาม; Data operator แก้ ingest; budget approver อนุมัติ change; execution operator ทำ action บนแพลตฟอร์ม\
**ทางหลัก:** `CHECK_SCHEDULED → DATA_CHECK → GATE_EVALUATION → NO_ACTION / FINDING_OPEN → OWNER_ACTION → RECHECKED → CLOSED`

ตรวจ hard constraints ก่อน: spend/known commitments เทียบ **released cap** และเวลาหน่วงรายงาน, campaign state, source last successful timestamp, failed imports, currency/period, attribution coverage, numerator/denominator, immature window และงานติดตามถัดไป. หลังนั้นเทียบเฉพาะ approved target/rules ที่มี version และ scope ตรง campaign/phase; คืน `finding` พร้อม metric, actual/source, n/N, time window, threshold_version, priority, owner และ evidence. ระบุ `DATA_HOLD`, `LEARNING/INCONCLUSIVE`, `READY_FOR_REVIEW`, `ACTION_BLOCKED` แยกเหตุผล

ทางออกตัวอย่าง: hard cap reached→หยุดการ release งบเพิ่มตามวิธีอนุมัติที่กำหนดและแจ้ง owner; source ไม่สด→พักคำตัดสิน performance; denominator=0→`N/A`; spend/commitments ขาด→hold economics; qualified leads ค้างที่ฝ่ายขาย→ส่ง finding ให้ owner ของ Sales domain; inventory/dispatch constraint→ส่ง finding ให้ operations domain. ส่งต่อเป็น task/action มี owner/due/evidence และกลับมา recheck หลังงานเสร็จ

ทุก finding ที่ต้องเปลี่ยน budget, schedule, price, offer หรือ audience ต้องแยก `RECOMMENDED` จาก `APPROVED` จาก `EXECUTED`, กำหนด approver, scope, effective time และหลังบ้าน confirmation. Fail-safe ทางระบบยังไม่กำหนด; Flow นี้เป็นขั้นตอนปฏิบัติการเสนอ ไม่กำหนดให้หยุดโฆษณาอัตโนมัติ

### MKT-F07 — Weekly cohort review และวนรอบปรับแผน

**เริ่มเมื่อ:** ถึง weekly checkpoint หรือ review date ที่ผูกกับ experiment start\
**เจ้าของ:** Marketing เสนอบทเรียน; Sales ยืนยันคุณภาพ Lead/สถานะติดต่อ; analyst ตรวจ cohort; ผู้อนุมัติงบตัดสินคำสั่งที่กระทบ spend\
**ทางหลัก:** `REVIEW_DUE → SNAPSHOT_LOCKED → DATA_ELIGIBILITY → COHORT_READINESS → DECISION_RECORDED → ACTION_ASSIGNED → NEXT_CHECKPOINT_SET`

ส่วน snapshot ต้องเก็บ timezone/window/as-of/source watermark/experiment version. ทำรายงานสองมุม ห้ามเอามาหารข้ามกัน: **activity** = spend, impressions, clicks, inbound messages, calls, orders ที่เกิดใน calendar week; **acquisition cohort** = distinct leads ที่เริ่มทักหรือมี qualified acquisition event ในช่วงเดียวกัน และผลที่เกิดภายใน conversion window. แสดง mature / pending / unknown / lost coverage; การจ่ายเงินสัปดาห์นี้ของ W1 lead เป็น paid activity ของสัปดาห์นี้และเป็น outcome ของ W1 cohort ไม่ใช่ new W2 lead

แต่ละ variant แสดง numerator / denominator / formula-version / source coverage / spend completeness / sample maturity / confidence method ที่ลงทะเบียนก่อน launch. ถ้า attribution ขาด denominator 0, late data, cohort ยังไม่ครบ conversion lag, sample ไม่ถึง rule หรือ split ไม่เทียบกันให้ `INCONCLUSIVE`/`DATA_HOLD` พร้อม checklist งานที่จะทำต่อ ห้ามประกาศผู้ชนะเพราะ CTR สูงกว่าแค่สัปดาห์เดียว

ผู้อนุมัติเลือก `CONTINUE`, `FIX_TEST`, `HOLD`, `PAUSE/STOP`, `SCALE_REVIEW` หรือ `CLOSE`; บันทึก rationale, evidence, scope, approver, owner, due date, metric target / budget version / next review. `SCALE_REVIEW` เป็นการยื่นพิจารณา ไม่ใช่เพิ่มงบจริงทันที ผู้ไม่มีสิทธิ์อนุมัติให้อยู่ `WAITING_APPROVAL`. เกณฑ์ statistical winner, minimum N, absolute stop, budget cap, cap headroom reserve, mature lag/late-conversion policy และ margin/capacity check ต้องตกลงก่อนใช้

ผลตามรอบถัดไป: keep/fix/retest พร้อม hypothesis ที่เปลี่ยนเพียงหนึ่งตัว → สร้าง experiment version ใหม่; pause/close พร้อม action ที่ผู้มีสิทธิ์ทำ; ทุกการเปลี่ยนต้องอ้าง review ID เพื่อวัดว่าการตัดสินคราวก่อนสร้างผลอย่างไร

## Shared data contract และ status history

หนึ่งแถว event status ไม่แทน snapshots ของ Ads และไม่แทน order/payment event. ชุดระเบียนเสนอ:

| Record | Keys / fields ขั้นต่ำ | ข้อควรระวัง |
|---|---|---|
| Campaign brief | `business_id, campaign_id, brief_version, objective, kpi_definition_version, target_version, period, timezone, currency, cap, owner, approver, status` | versioned facts; unknown ไม่เป็น 0 |
| Experiment | `experiment_id, version, hypothesis, control, treatment, changed_variable, population_rule, primary_metric, guardrails, N/window/lag/stop rules, cap, QA, approvals` | freeze before test; change creates new version |
| Ad entity map | `platform, account_ref, campaign/ad/creative IDs, experiment/variant, effective_from/to, map_version, match_method` | retain unknown IDs and remap history |
| Ads measurement snapshot | `source_ref, fetched_at, reporting_date, reporting_timezone, currency, scope IDs, schema/metric version, impressions, link_clicks, spend, row watermark, freshness, import_state` | aggregate scope only; document source latency |
| Touch / attribution | `touch_id, campaign/ad/creative/experiment/variant, method, evidence_ref, occurred_at, verified_state` plus lead link only once verified | impressions/click aggregate cannot invent identity; unknown stays unknown |
| Decision / action | `decision_id, review_id, rule_id/version, evidence_ref, recommendation, approved action/scope, approver, actor, effective_at, due_at, recheck_at, outcome` | separate recommended/approved/executed |
| Status history | `entity_id, prior_status, new_status, occurred_at, recorded_at, actor_type/id, reason, idempotency/source_event_id` | append transitions; dedupe source events and retain revisions |

Common campaign status: `DRAFT → NEEDS_INFO → READY_FOR_APPROVAL → APPROVED → READY_TO_PUBLISH → WAITING_FOR_OPERATOR → ACTIVE → PAUSED → CLOSED`, with explicit `BLOCKED`/`LAUNCH_FAILED`. Experiment status แยก: `DESIGN_DRAFT → DESIGN_REVIEW → TRACKING_QA → APPROVED → RUNNING → REVIEW_DUE → INCONCLUSIVE / RESULT_RECORDED → CLOSED`. Data import: `EXPECTED → RECEIVED → VALIDATED/PARTIAL/REJECTED → SUPERSEDED` โดยไม่เขียนทับ source record. Decision: `RECOMMENDED → WAITING_APPROVAL → APPROVED/REJECTED → EXECUTED/PENDING_ACTION → RECHECKED/CLOSED`.

เปลี่ยน status ทุกครั้งต้องเก็บ `occurred_at`, `recorded_at`, owner, actor, reason และ evidence reference (ถ้าขั้นนั้นต้องมี) แยกเวลาที่ข้อมูลเกิดและเวลาที่รับเข้า; ไม่มี successful attempt ให้คง stale/missing watermark ล่าสุดแทนสรุปยอดใหม่ปลอม

## Metrics และ KPI dictionary

| KPI | สูตร | ตัวหาร/eligibility | Stage / source |
|---|---|---|---|
| Spend use | confirmed spend + eligible commitments / released budget cap | currency/account/phase/window เดียวกัน; cap=0 = N/A | Ads snapshot; commitments เป็นยอด ณ as-of |
| CTR | platform-defined `link_clicks / impressions × 100` | reporting scope/attribution window ตามนิยาม source; 0 denominator=N/A | ad/day variant ถ้ารู้จริง; ไม่ใช้ generic clicks เงียบ ๆ |
| CPC | spend / platform-defined link clicks | matched spend/currency/timezone และ clicks>0 | ad/day variant; scope provenance required |
| Click→message diagnostic | verified-inbound chats in matching population/window / eligible clicks | แสดงว่ามี person-level match หรือเป็น aggregate comparison; ถ้าคนละ population ห้ามตีความ CVR | ad source map + inbound verified touch; not unique unless established |
| Attribution coverage | distinct new-chat leads with eligible verified source / distinct new-chat leads | cohort first-message period เดียวกัน; unknown แสดงใน denominator ถ้าประชากรครบ | inbound/CRM + source verification history |
| CPL | spend / distinct new-chat leads ที่ attributed ตาม policy | แสดง matched share; แยก untracked และ channel definition | Ads spend + CRM acquisition cohort |
| Cost per Ready-for-Call Lead | matched spend / distinct Leads ผ่าน `phone_confirmed + product_interest + call_permission` | ready rule/version เดียวกันใน acquisition cohort; ขั้นเก็บข้อมูล/การให้อนุญาตเป็น LINE domain ถัดไป | Ads + Lead status/policy consent; metric หลักเสนอ |
| Cost per MQL/SQL | scope-matched spend / distinct eligible stage-entry MQL/SQL | รายงานแต่ละ stage แยกกัน; ห้ามบวก MQL+SQL เพราะอาจเป็นคนเดียวกัน | Lead qualification domain |
| Reach/Frequency | platform-defined deduplicated reach; frequency = impressions/reach เมื่อ reach>0 | platform/account/window ของ unique reach เดียวกันเท่านั้น | Ads aggregate; ห้าม sum weekly reach เป็น unique monthly |
| Mature Lead-to-Paid | distinct leads acquired in cohort with qualifying paid order in conversion window / eligible Leads in same acquisition cohort | pending maturity แยก; Lead≤1 conversion; repeat orders เก็บ Order เพิ่ม; refund policy แยก | Lead↔order payment evidence |
| Attributed ROAS | attributable net paid revenue / matched spend | revenue/attribution policy/window/currency ต้องสอดคล้อง; coverage แสดง; 0 spend=N/A | payment + verified attribution; ไม่ใช่ profit/ROI |
| Data completeness | eligible received expected rows / expected rows from source manifest | manifest/population ต้องครบ; ถ้าไม่มี expected manifest ให้ completeness=unknown | collector/source watermarks |
| Data freshness | as-of minus last-successful source timestamp; SLA status เทียบ approved freshness threshold | timezone/expected cadence per platform; limit ยัง TBD | source health/ingestion history |
| Experiment compliance | checks passed / checks configured in frozen experiment version | rule version frozen; blank/unset rule = readiness failure ไม่ใช่ pass | experiment QA/review |

ทุก metric แสดง `value | numerator | denominator | period & timezone | currency/units | source/as-of | coverage | maturity | definition version | decision eligibility`. คนละ source, population, currency, window หรือ attribution model ห้ามรวมโดยไม่มี mapping ที่ตรวจได้. Derived forecast, planning assumption, observed actual และ attributed platform report มี tag คนละประเภท.

## Acceptance checklist — โดเมน 01

- [x] ครอบคลุม F01–F07 ตามทะเบียนเดียวกับลิงก์ในภาพ
- [x] ทุก Flow มี trigger, accountable actor, path, branch/failure status, evidence fields, owner ของ next action, KPI/formula และ source boundary
- [x] ไม่มีการปล่อย/เพิ่มงบ/ประกาศ A/B winner จากเวลาเปลี่ยนสัปดาห์เพียงอย่างเดียว
- [x] No-data, zero denominator, late conversion, unattributed, duplicate และ mismatched timezone/currency แสดงเป็น unknown/hold แทนค่าที่เดา
- [x] Activity-week แยกจาก mature acquisition-cohort report; Lead ข้ามสัปดาห์ยังอยู่กับ cohort เดิม
- [x] ไม่มี external account call, API write, personal customer record หรือ product code change ใน artifact
- [x] HTML/SVG กำหนดหน้า A4 landscape, mobile scroller และ accessible title/desc (ตรวจ source; browser print preview ยังไม่ได้ตรวจ)

## Verification

- **PASS:** `diagram-design/scripts/self_check.py` ตรวจ HTML/SVG ผ่าน
- **PASS:** มี 8 section/8 navigation targets: Full Pipeline 1 หน้า + 7 detail flows; ทุก SVG มี accessible title/desc
- **PASS:** Full Pipeline มี 8 nodes, 10 labeled edges, 8 edge types และ 7 Zuri-Go token colors; ตรวจ SVG/geometry ไม่พบ node หรือ label ทับกัน
- **PASS:** relative links ใน README และ UTF-8 decoding ผ่าน
- **NOT RUN:** browser screenshot / print preview; loopback server ไม่ได้ทำงาน และ browser policy ไม่อนุญาต `file:` URL จึงตรวจการ render จริงไม่ได้
- **NOT RUN:** API, Ads account, LINE OA, production data หรือ application tests ไม่ได้เชื่อม/เรียกใช้ในงานเอกสารนี้

## ขอบเขตที่ส่งต่อให้โดเมนถัดไป

จบ Marketing domain ที่ `source-map version + touch reference` พร้อมรับ inbound event และคำอธิบาย `UNKNOWN` ที่ตรวจสอบได้. Domain ถัดไปคือ **LINE OA & Conversation**: รับ webhook/first message, deduplicate inbound, AI response/timeout, consent/phone capture, unsupported question และ human handoff. Lead identity, เก็บเบอร์, สิทธิ์เข้าถึง PII, การสนทนา และ bot handoff ไม่ใช่ข้อมูล Campaign ที่สรุปเอาเอง และไม่ได้อ้างว่าทำแล้วในชุดนี้

## Risk / deferred setup decisions

| Decision pending | Why needed | Proposed owner |
|---|---|---|
| Marketing Ads platform/account ที่ใช้ | นิยาม IDs, reports, authorization, actual cadence/rate | Campaign owner |
| Objective & offer ต่อ campaign | เลือก metric families และ economics | Business owner |
| Spend cap, currency, allowed operators | ป้องกันการปล่อยงบเกินอำนาจ | Budget approver |
| Experiment sample/window/lag/statistical method | ป้องกัน false winner และ conversion-lag bias | Analyst + owner |
| Attribution method + click↔LINE verified identity path | กำหนด source truth, lookback, missing coverage | Marketing + LINE domain owner |
| Data connector route, freshness SLA, schema change plan | กำหนด API/export handling และ health states | Data operator |
| Targeting consent/compliance/creative-review rules | ระบุ legal/brand review ก่อน launch | Business + compliance |
| Weekly snapshot hour and approver roster | ทำให้ report cutoff และ approvals ลงมือได้ | Business owner |

จนกว่าจะมีผู้รับผิดชอบอนุมัติ รายการปฏิบัติงานและกติกาที่ยังไม่กำหนดถือเป็นข้อเสนอ ห้ามใช้เอกสารนี้สร้างข้อมูล Ads จริงหรือทดลองบนบัญชี production.

## Version diff

| ก่อน | หลัง (Domain 01 v0.1.2 draft) |
|---|---|
| มีเพียงภาพ overview sale journey ยังไม่แยกโดเมน | แยก Marketing เป็น 7 Flow |
| KPI/source details กระจัดกระจาย | เพิ่ม record contract, metric formula, n/N, freshness, unknown และ cohort safeguards |
| ยังไม่กำหนด platform/account, sample, cap | แสดงเป็น `TBD` และระบุ owner ที่ต้องตัดสินใจ |
| ไม่มีการแก้แอป | เพิ่ม README โดเมนและ HTML ภาพ 7 หน้า; ไม่มี code/schema/deployment change |
| HTML v0.1.0 เป็นหน้าแยก 7 Flow | เพิ่ม Full Pipeline overview 1 หน้า เชื่อม MKT-F01–F07 ด้วย flow colors และ edge legend; คง 7 หน้า detail |
| HTML v0.1.1 ใช้สีและ tint ที่ไม่ได้อ้าง token role โดยตรง | HTML v0.1.2 ใช้ named Zuri-Go tokens, brand tint และ Manrope/IBM Plex type rules; คง flow logic เดิม |


## SoT placement update — 2026-10-04

ย้ายจาก dated history/domain tree มาเป็นบทเดียวของ ARCH-005; rebased links และ source backlinks. Flow IDs, business steps, metric rules และ existing verification boundaries retained. Chapter version: 0.1.3.
