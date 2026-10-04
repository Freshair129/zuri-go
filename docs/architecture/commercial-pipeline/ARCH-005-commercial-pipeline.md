---
id: ARCH-005
title: Zuri-Go and Zuri-AI — Commercial pipeline and service boundary
status: draft
superseded_by: null
version: 0.2.1
date: 2026-10-04
complexity: C-3
risk: LOW
relations:
  relates_to: [ADR-007, PRD-001, ARCH-001, ARCH-002, SRV-001, SRV-002, DOM-CAM, DOM-MET, FEAT-002]
---

# ARCH-005 — Zuri-Go × Zuri-AI: Commercial pipeline

[เปิดคู่มือภาพหน้าเดียว](zuri-ai-line-sales-flow.html)

[หลักฐานภาพตัวอย่างเดิมจากเบราว์เซอร์](../../history/zuri-ai-line-sales-flow-2026-10-03/preview.jpg)

[สารบัญคู่มือรายละเอียดครบทุก Flow แยกตามโดเมน](ARCH-005-commercial-pipeline.md#flow-index) — 3 บท, 21 detail Flow และ 2 overview

เอกสารภาพตามคำขอของผู้ใช้ ไม่ใช่หลักฐานว่าระบบเชื่อม Ads, LINE OA, AI, CRM หรือการชำระเงินจริงแล้ว ไม่มีสถิติลูกค้าจริงในเอกสารนี้

ความซับซ้อน **C-3** · ความเสี่ยง **LOW** สำหรับงานเอกสารนี้ การเชื่อมระบบในอนาคตต้องประเมินแยกตามข้อมูลและสิทธิ์ที่ใช้

## Authority, scope and source of truth

ผู้ใช้ระบุเมื่อ 2026-10-04 ว่า **Zuri-Go คือ Marketing/Commercial edition ของ Zuri-AI ที่แยก deploy ได้ และต้องส่งข้อมูลกลับ Marketing domain ของแพลตฟอร์ม**. งานจัด SoT นี้ได้รับคำสั่งให้ดำเนินการหลังตรวจสเปกฝั่ง Zuri-AI; รายละเอียด process และ integration ในเอกสารยังเป็น draft.

- Product intent: [PRD-001](../../product/PRD-001-zuri-go.md); placement/service decision: [ADR-007](../decisions.md#adr-007--zuri-go-as-a-marketingcommercial-edition-and-a-canonical-commercial-pipeline).
- System relationship, external namespace and intended direction are written once in [registry/relations.yaml](../../../registry/relations.yaml). Service declarations remain [SRV-001](../../services/SRV-001-hosted/SERVICE.md) and [SRV-002](../../services/SRV-002-local/SERVICE.md).
- This ARCH-005 document owns the cross-system process context, shared status/metric rules and proposed integration boundary. The three Markdown chapters below own their detailed draft flow definitions. They are chapters of this architecture document, not three new registered domains or features.
- HTML files are manually maintained visual views of these Markdown sources. If wording differs, the source chapter governs its flow and this document governs cross-stage rules. Automated generation is not implemented. Changed process logic must be reconciled in source and view before verification.
- Existing approved feature/FR/API/security contracts govern implemented Zuri-Go behavior. A draft flow here does not supersede them. Deployment and acceptance status comes from feature/release verification, not from a diagram.
- The history folder holds screenshots, original verification and a move receipt. It is no longer the editing location for process definitions.

## Service and domain boundaries

| Layer | Responsibility / observed state |
|---|---|
| Zuri-AI Marketing | `ZAI:DOM-MARKETING`; charter owns planning/revisions/review/decisions and references to PM handoffs. Marketing still executes inside the core module; it is not an extracted Marketing process. |
| Zuri-Go | Existing hosted/local deployables provide the light Marketing/Commercial edition and supporting identity, metrics, task and meeting functions. Local `DOM-CAM` and `DOM-MET` identities remain stable; neither is a schema alias for the parent domain. |
| LINE / AI / CRM | Parent context includes CRM records, LINE OA Studio configuration/jobs and Agent/Conversation Runtime execution. Chapter 02 defines proposed handoffs; it does not add these writers to Zuri-Go. |
| Sales / payment / stock | Parent Commerce owns orders/payments; Inventory owns stock. Chapter 03 provides workflow context. A sales-call task is distinct from an order, payment and fulfillment record. |

Whole-platform flow: `Marketing → LINE/CRM/AI → human contact → Commerce/fulfillment → marketing outcome review`. The intended Zuri-Go exchange begins with marketing-owned summaries/decisions and reference IDs; exact fields and ownership require reconciliation below.

## Proposed exchange contract — draft, wiring unverified

Detailed first-slice proposal: [FEAT-015](../../features/FEAT-015-marketing-report-exchange/feature.md), [seven-flow gap analysis](../../features/FEAT-015-marketing-report-exchange/gap-analysis.md), [SDD-015](../../features/FEAT-015-marketing-report-exchange/design.md) and [reported-evidence wire contract](../../features/FEAT-015-marketing-report-exchange/contract.md). Gap/contract preparation was approved on 2026-10-04 and P1/P2 on 2026-10-05; implementation, independent native PostgreSQL acceptance and migration 011 on Production/restored native Local passed. Actual Local P1 HTTP preview passed; real P2 association/freeze HTTP and browser acceptance remain NOT_RUN ([current evidence](../../features/FEAT-015-marketing-report-exchange/verification.md#local-production-backup-restore--2026-10-05)). Parent schemas, authorization, delivery and receiver remain draft. That feature owns the specific report payload/delivery proposal; this checklist retains cross-stage concerns. No report becomes a native parent Plan review/decision or a provider-verified measurement.

`Zuri-Go → scoped integration adapter → Zuri-AI Marketing contract → durable receipt`

| Contract concern | Required decision / proposed minimum |
|---|---|
| Entity authority | Choose the sole operational writer for every synchronized entity. A received projection is not a second operational writer. The current separate Zuri-Go databases do not become shared parent tables because a document moved. |
| Scope and identity | Explicit verified Business/Tenant mapping; stable source-system and entity IDs. Receiver derives authorized scope from authenticated binding. Local IDs and role grants are never inferred to be parent IDs/grants. |
| Semantic mapping | Reconcile Campaign/settings/goals/observations/review with parent MarketingPlan/version/review/decision contracts. Similar names do not establish equivalent fields, formulas or lifecycle. Mapping is draft until reviewed against the receiver. |
| Envelope | Proposed contract version, source system, source entity/reference, source revision, operation/idempotency key, occurred/recorded time, correlation ID and bounded typed payload. Names/types and receiver endpoint remain TBD. |
| Measurement evidence | Preserve n/N, unit/currency, timezone, activity/cohort window, attribution method/coverage, freshness and rule version. Unknown remains unknown; a snapshot is not a measurement of another period. |
| Delivery and recovery | Proposed QUEUED → SENDING → ACKNOWLEDGED, with RETRY_SCHEDULED, REJECTED or UNKNOWN. Sender records a durable receiver receipt; retry reuses the same key; changed payload under one key is a conflict. An ambiguous timeout is not success. |
| Privacy and authorization | This first marketing exchange excludes raw phone numbers, messages and credentials. Customer/consent/order authority stays with its own reviewed owner. Existing Guest and visibility rules continue to govern local records. |
| Receiver readiness | No verified Zuri-Go receiver binding is documented in the parent specs inspected. Endpoint, transport, schema, mappings, actor trust, retention and conflict policy remain owner decisions. |

This is a contract checklist, not an API/EVT declaration. Implementing the exchange requires approved feature requirements, schemas and verification; no new FEAT/API/EVT ID or operational writer is allocated by this structural move.

<a id="flow-index"></a>
## Flow sources and visual views

There are **21 detail flows + 2 overview diagrams = 23 SVG/A4 views** across four HTML files. Flow IDs stay `MKT-F01–F07`, `LINE-F01–F07`, `SALES-F01–F07`; these are process labels, not artifact/domain IDs.

| Chapter | Canonical detailed source | Visual view | Pages |
|---|---|---|---|
| Whole-platform overview | Shared rules in this document | [Ads → LINE → Sales overview](zuri-ai-line-sales-flow.html) | 1 |
| 01 Marketing & Campaign | [marketing-campaign.md](marketing-campaign.md) | [Full Pipeline + 7 flows](marketing-campaign-flows.html) | 8 |
| 02 LINE OA & Conversation | [line-oa-conversation.md](line-oa-conversation.md) | [7 flows](line-oa-conversation-flows.html) | 7 |
| 03 Sales & Fulfillment | [sales-fulfillment.md](sales-fulfillment.md) | [7 flows](sales-fulfillment-flows.html) | 7 |

## Parent and peer specification evidence

Checked 2026-10-04 from `O:/zuri.ai`. Remote main was d4b6d613c221d0fc5e1645293144bb9b6c8332cf; the relevant source files were unchanged between local checkout `d3ae5625` and that verified remote-tracking revision. The old `D:/zuri-ai` checkout was behind and was not used as current authority. This read verifies document/source statements, not live deployment.

- [Zuri-AI Marketing charter](https://github.com/Freshair129/zuri.ai/blob/d4b6d613c221d0fc5e1645293144bb9b6c8332cf/docs/domains/marketing/CHARTER.md): `ZAI:DOM-MARKETING`, scope key `growth`, model and integration ownership.
- [Marketing Insights handoff](https://github.com/Freshair129/zuri.ai/blob/d4b6d613c221d0fc5e1645293144bb9b6c8332cf/docs/migrations/service-extraction/MARKETING-INSIGHTS-HANDOFF.md): reporting module, explicitly not Marketing service extraction; later amendments retain that boundary.
- [Conversation Runtime ADR](https://github.com/Freshair129/zuri.ai/blob/d4b6d613c221d0fc5e1645293144bb9b6c8332cf/docs/decisions/ADR-106-CONVERSATION-RUNTIME-SERVICE-EXTRACTION.md): an independently runnable process with core-owned authority and durable records.
- [CRM charter](https://github.com/Freshair129/zuri.ai/blob/d4b6d613c221d0fc5e1645293144bb9b6c8332cf/docs/domains/crm/CHARTER.md), [Commerce charter](https://github.com/Freshair129/zuri.ai/blob/d4b6d613c221d0fc5e1645293144bb9b6c8332cf/docs/domains/commerce/CHARTER.md), [Inventory charter](https://github.com/Freshair129/zuri.ai/blob/d4b6d613c221d0fc5e1645293144bb9b6c8332cf/docs/domains/inventory/CHARTER.md), [LINE OA Studio charter](https://github.com/Freshair129/zuri.ai/blob/d4b6d613c221d0fc5e1645293144bb9b6c8332cf/docs/domains/line-oa-studio/CHARTER.md): peer data owners for the wider pipeline.

Parent namespace `ZAI:` is an external reference, not a local ID declaration or an implicit alias. The charter/refactor evidence confirms architecture boundaries; it does not confirm a Zuri-Go-to-Zuri-AI integration is active.

## ขอบเขตและสมมติฐาน

1. ใช้ชื่อ **Zuri-AI platform** ตามคำขอ ไม่เปลี่ยนชื่อแอป Zuri-Go หรืออ้างว่าเป็นฟีเจอร์ที่ส่งมอบแล้ว
2. สินค้า ช่องทาง Ads งบ กลุ่มเป้าหมาย ราคา และวิธีชำระเงินยังไม่ระบุ จึงใช้ชื่อขั้นตอนทั่วไปและไม่แต่งเป้าหมายตัวเลข
3. เมื่อได้เบอร์ที่ตรวจรูปแบบและยืนยันกับลูกค้าแล้ว พร้อมอนุญาตให้โทรและมีสินค้าที่สนใจ ให้ส่งเคสแก่แอดมิน เบอร์ที่ถูกต้องตามรูปแบบยังไม่ได้พิสูจน์ว่าโทรติดหรือเป็นเจ้าของเบอร์
4. เสนอรอบสัปดาห์วันจันทร์ 00:00 ถึงวันจันทร์ถัดไป 00:00 แบบไม่รวมปลายช่วง ในเขตเวลา `Asia/Bangkok` และประชุมทบทวนทุกวันจันทร์ วันประชุมและ SLA ยังปรับได้
5. เสนอ metric หลักของ A/B รอบหาลูกค้าเป็น **ต้นทุนต่อ Lead พร้อมโทร** โดยมีกำไร ยอดขาย และภาระงานทีมขายเป็นตัวตรวจประกอบ ไม่บังคับใช้ metric เดียวกับทุกแคมเปญ
6. ใช้สีและฟอนต์จาก [brand-profile](../../../brand/brand-profile.md) ตามคำสั่งโปรเจกต์: พื้น `#F7F8FA`, ตัวอักษร `#1F2937`, รอง `#6B7280`, สีสัญญาณ `#E8820C`, พื้นสัญญาณ `#FFF8F0`; Manrope 700/800, IBM Plex Sans Thai 400/500/600, IBM Plex Mono 400/500 ไม่สร้างโลโก้หรือ brand asset ใหม่

## วิธีเปลี่ยนคำอธิบายซ้ำเป็นคู่มือภาพด้วย AI

1. บอก **จุดเริ่ม → ผลลัพธ์ปลายทาง** และคนอ่าน เช่น ทีมการตลาดกับแอดมิน
2. ระบุ **ใครทำอะไร** ในแต่ละขั้น พร้อมเงื่อนไขส่งต่อและทางออกเมื่อไปต่อไม่ได้
3. ใส่ **สถานะ + หลักฐาน + ผู้รับผิดชอบ + ตัวชี้วัด** แทนกล่องที่มีแต่ชื่อกิจกรรม
4. เลือก Swimlane เมื่อมีหลายทีมส่งงานต่อกัน เก็บไม่เกิน 7–9 ขั้นหลักในหน้าเดียว
5. ให้ AI ตรวจเส้นทางปกติ เคสค้าง เคสล้มเหลว และวงรอบทบทวน ก่อนส่งให้ทีมใช้

ตัวอย่าง prompt ใช้ซ้ำ:

> /diagram-design สร้างคู่มือภาพหน้าเดียว A4 แนวนอน ภาษาไทย สำหรับ [กระบวนการ] เริ่มจาก [จุดเริ่ม] จบที่ [ผลลัพธ์] แยกเจ้าของงาน [ทีม] ในทุกขั้นให้เห็นกิจกรรม เงื่อนไขส่งต่อ status และ KPI รวมกรณีไปต่อไม่ได้และรอบทบทวนรายสัปดาห์ ใช้แบรนด์ที่แนบ ระบุสิ่งที่ยังไม่รู้ ห้ามแต่งตัวเลขผลลัพธ์

## เส้นทางหลักและหลักฐานในแต่ละขั้น

| ขั้น | เจ้าของ | ทำอะไร / เงื่อนไขส่งต่อ | สิ่งที่ต้องเก็บ | จุดวัดผล |
|---|---|---|---|---|
| 01 Ads A/B | Marketing | กำหนดสมมติฐานและตัวแปรที่ต่างเพียง 1 ตัว กำหนดรหัส A/B และ tracking ก่อนยิง แล้วปล่อย Ads ตามแผนทดลอง | experiment, variant, campaign/ad/creative IDs, กลุ่ม/placement, เวลา, Spend, Impressions, Link clicks | CTR, CPC, ต้นทุนต่อ Lead พร้อมโทรแยก A/B |
| 02 คลิกเข้า LINE | Marketing / Data | เก็บคลิกและรหัสแหล่งที่มาบนเส้นทางที่วัดได้ ลูกค้าต้องส่งข้อความเองจึงเข้าสู่ขั้น 03 | touch ID หรือ campaign token, UTM, source, variant, clicked_at, วิธี/หลักฐาน attribution | คลิก, แชตที่ผูกที่มาได้, attribution coverage |
| 03 ทักครั้งแรก | LINE / ระบบ Lead | รับข้อความขาเข้า แล้วสร้างหรือจับคู่ Lead เดิมใน Business และ OA เดียวกัน | lead_id, internal LINE identity, first_message_at, source, webhookEventId | คนทักใหม่ไม่ซ้ำ, คนกลับมาทัก, cost per new chat |
| 04 AI ตอบ | AI / ทีมดูแลข้อมูลสินค้า | ตอบจากข้อมูลสินค้าที่รับรอง ถามสินค้า/ความต้องการ ขอเบอร์และขออนุญาตโทร ถ้าไม่มั่นใจหรือขอคน ให้คนรับช่วง | product_interest, first_ai_response_at, phone, phone_confirmed_at, contact_permission, preferred_contact_at, สรุปแชต | AI response time, phone capture, ready-for-call rate, escalation rate |
| 05 แอดมินรับและโทร | Admin / Sales | รับเคสพร้อมเบอร์ สรุปและ source กำหนด owner หยุด bot sales reply ซ้อน บันทึกทุกครั้งที่โทรและงานถัดไป | assigned_at, accepted_at, owner_id, call_attempt_at, call_outcome, first_connected_at, next_action_at | เวลารับเคส/โทร, contact rate, งานค้าง, lost reasons |
| 06 สั่งซื้อ ชำระ ส่งมอบ | Sales / Operations | ลูกค้าตกลง → เปิดคำสั่งซื้อ → ตรวจรับเงินจริง → ส่งมอบ แยกยกเลิก/คืนเงินจากการไม่ซื้อ | order_id, lead_id, product/quantity, paid_at, paid amount, refunds, fulfilled_at, payment evidence | ผู้ซื้อ, paid orders, net paid revenue, CPO, attributed ROAS, การส่งมอบ |
| 07 ทบทวนรายสัปดาห์ | Marketing + Sales + Owner | ตรวจความครบและความสดก่อนเปรียบเทียบ A/B ตรวจ cohort ที่สุกงอม และบันทึกว่าจะคง/ปรับ/หยุด/เพิ่มงบ | week_start, data_as_of, rule version, decision, reason, action_owner, due_at, next_review | ผลเทียบสัปดาห์ก่อนและเป้าหมายที่อนุมัติ, คอขวด, งานแก้ไขและผลหลังทำ |

## สถานะต้องแยกตามสิ่งที่กำลังติดตาม

ไม่ใช้ field เดียวปนสถานะ Ads, Lead, การติดต่อ และ Order ตัวอย่าง `NO_ANSWER` เป็นผลการโทร ไม่ใช่หลักฐานว่า Lead หายไปจากขั้นที่เคยผ่านแล้ว

| ชุดสถานะ | ค่าเสนอ | ความหมาย / ทางไปต่อ |
|---|---|---|
| Experiment | `DRAFT`, `RUNNING`, `INCONCLUSIVE`, `REVIEW_READY`, `CLOSED` | เริ่มตามแผน → รอข้อมูลเพียงพอ → คนตัดสินและบันทึกผล ไม่ตั้งผู้ชนะอัตโนมัติ |
| Lead stage | `NEW_CHAT`, `ENGAGED`, `PHONE_CAPTURED`, `ASSIGNED`, `CONTACTED`, `WON`, `LOST` | เก็บวันเข้าทุก stage; `WON` เมื่อมี order ที่ยืนยันรับเงินแล้ว; `LOST` ต้องมีเหตุผล |
| Contact workflow | `NURTURE`, `HUMAN_REVIEW`, `NO_ANSWER`, `CALLBACK_SCHEDULED`, `DO_NOT_CONTACT` | ไม่มีเบอร์ให้คุยต่อเมื่อเหมาะสม; ขอคนให้ส่งต่อทางแชตได้แม้ไม่มีเบอร์; ไม่รับสายต้องมีนัด; ขอหยุดให้หยุดติดต่อตามคำขอ |
| Order/payment | `ORDER_PENDING`, `PAYMENT_PENDING`, `PAID`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED` | รับเงินจากหลักฐานที่ตรวจสอบแล้ว ไม่ถือว่าการส่งรูปสลิปเพียงอย่างเดียวคือรับเงินสำเร็จ; เก็บทุกการคืนเงิน |
| Fulfillment | `PENDING`, `FULFILLED`, `RETURNED` | สถานะส่งมอบแยกจากการรับเงิน เช่น จ่ายแล้วแต่ยังไม่ส่ง |

`PHONE_CAPTURED` นับเมื่อเบอร์มีรูปแบบใช้ได้และลูกค้ายืนยันแล้ว ส่วน **Lead พร้อมโทร** ต้องเพิ่มสินค้าที่สนใจและการอนุญาตให้โทร อย่าใช้สองตัวนี้แทนกัน หากขอคุยคนแต่ไม่มีเบอร์ให้แอดมินรับทางแชต ไม่สร้างงานโทรโดยไม่มีช่องทางติดต่อ

`NURTURE`, `NO_ANSWER` และรอชำระเป็นงานค้าง ไม่ใช่ `LOST` อัตโนมัติ การกลับมาเปิดเคสเดิมต้องเก็บประวัติไม่สร้างลูกค้าใหม่ ถ้าซื้อซ้ำ ให้เพิ่ม Order ใต้ Lead เดิม

## การเก็บข้อมูลที่ทำให้วัดทุกขั้นย้อนหลังได้

- เก็บ event log แบบเพิ่มประวัติ: `event_id`, `business_id`, `lead_id` เมื่อทราบ, `entity_type`, `entity_id`, `event_type`, `from_status`, `to_status`, `occurred_at`, `recorded_at`, `actor_type`, `actor_id`, `owner_id`, `reason`, `next_action_at`
- เก็บ first source และ touch history: `source`, `campaign_id`, `ad_id`, `creative_id`, `experiment_id`, `variant`, `touch_id`, `attribution_method`, `attribution_evidence`; ห้ามใช้ UTM ที่ติดกับ URL เป็นหลักฐานว่าผูกกับผู้ใช้ LINE สำเร็จแล้ว
- รายงานคลิกและ impressions เป็น event/ยอดรวมตามนิยามแพลตฟอร์ม ไม่ต้องมี `lead_id` ในทุกคลิก เก็บการเพิ่มเพื่อนแยกจากข้อความแรก
- เก็บ Ads snapshot รายวันแยก platform/account/ad/date/currency/timezone พร้อม `retrieved_at` และ source record; ดึงจาก API หรือไฟล์ export ตามช่องทางที่จะเลือกภายหลัง
- ใช้ `webhookEventId` กัน webhook ซ้ำ และเวลาที่ event เกิดจริงเรียงลำดับ; การ retry ไม่ทำให้คนทักหรือ stage-entry เพิ่มซ้ำ [LINE webhooks](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)
- ใช้ `lead_id ↔ order_id` เชื่อมยอดซื้อข้ามสัปดาห์และซื้อซ้ำ; การ merge Lead ต้องมีหลักฐาน ไม่รวมคนด้วยเบอร์ร่วมกันอย่างเดียว
- แอดมินบันทึกผลโทรเมื่อจบแต่ละครั้ง ฝั่งรับเงิน/ส่งมอบบันทึกตามหลักฐานจริง รายงานไม่เดาผลจากข้อความที่ AI ตอบ
- เก็บเบอร์และบทสนทนาในพื้นที่ Lead ที่จำกัดสิทธิ์ รายงานภาพรวมใช้จำนวนและ ID ภายใน ไม่ใส่ข้อมูลลูกค้าลง campaign records ที่ Guest อ่านได้ตาม [PRD-001](../../product/PRD-001-zuri-go.md)

## Ads → LINE attribution ที่ทำได้และข้อจำกัด

แบบเสนอที่เริ่มง่าย: แต่ละ variant มีรหัสแคมเปญในข้อความเริ่มต้น เช่น `สนใจสินค้า [รหัสทดลอง-A]` ผ่าน OA message link เมื่อผู้ใช้ส่งข้อความ ระบบจึงอ่าน token แล้วจับคู่ Lead กับ variant ได้ ข้อความล่วงหน้าแก้ไขได้และลบได้ จึงไม่รับประกัน coverage 100% รหัสร่วมต่อ variant ก็ไม่ได้ระบุคลิกแต่ละครั้งอย่างแม่นยำ [LINE URL scheme](https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/)

หากต้องการติดตามรายคลิก ต้องออกแบบเส้นทาง tracking/identity link แยกและตรวจด้วยข้อความทดสอบจริง ข้อมูลที่ผูกไม่ได้ใช้ `UNKNOWN`; Organic ใช้ได้เมื่อมีหลักฐาน อย่าจับทุกคนที่ไม่มีรหัสเป็น Organic หรือโยนให้ Ads ล่าสุด

LINE Messaging API profile ปกติไม่ได้คืนเบอร์โทร จึงต้องขอจากลูกค้าหรือแบบฟอร์มที่ลูกค้ากรอก ไม่ควรวาด Flow ว่าระบบได้เบอร์จากการเพิ่มเพื่อนโดยอัตโนมัติ [Get profile](https://developers.line.biz/en/reference/messaging-api/nojs/#get-profile)

ตัวอย่างวิธี attribution ที่เสนอ: เก็บ first verified acquisition source สำหรับ cohort และใช้ source เดียวกันกับ order ที่ผูกได้เพื่อเทียบ variant นี่คือ **first-touch ตามกติกาภายใน** ไม่ใช่ platform-reported attribution หรือข้อพิสูจน์เชิงสาเหตุ ต้องระบุ lookback/conversion window ก่อนใช้งานจริง

## Metrics รายสัปดาห์: นิยามและตัวหาร

ทุกแถวต้องแสดง numerator, denominator, ช่วงเวลา, timezone, source freshness และ coverage; ตัวหารเป็นศูนย์หรือข้อมูลไม่พอให้ `N/A` ไม่เติมเป็น 0% สูตร cost ใช้ Spend ที่ตรงกับ cohort/variant และขอบเขตลูกค้าที่นับ

| Metric | สูตร / วิธีนับ | แหล่งข้อมูล / รอบบันทึก | การใช้ |
|---|---|---|---|
| CTR | Link clicks ÷ Impressions × 100 | Ads report รายวัน แพลตฟอร์มและ scope เดียวกัน | ความน่าสนใจของ Ads; ไม่ใช้ all clicks แทน link clicks เงียบ ๆ |
| CPC | Spend ÷ Link clicks | Ads report รายวัน | ต้นทุนคลิก |
| New chats | distinct Lead ที่มีข้อความแรกในสัปดาห์ | LINE inbound event เมื่อเกิด | จำนวนลูกค้าใหม่ ไม่ใช่จำนวนข้อความ |
| Cost per new chat | Matched Spend ÷ distinct attributed new chats | Ads + lead acquisition cohort | ต้นทุนคนทัก พร้อม coverage |
| Attribution coverage | New chats ที่มี source ตามหลักฐาน ÷ New chats ทั้งหมด × 100 | Lead source history เมื่อเกิด / สรุปรายสัปดาห์ | แสดง known / unknown และวิธีตรวจสอบ |
| AI first-response time | first_ai_response_at − first_message_at; median / P90 ของรายที่ตอบ และจำนวนยังไม่ตอบแยก | Message timestamps เมื่อเกิด | ไม่ใช้แทนเวลาที่คนตอบ |
| Phone capture rate | คนใน chat cohort ที่ได้เบอร์ยืนยัน ÷ คนใน chat cohort × 100 | Lead stage history เมื่อเปลี่ยน | ประสิทธิภาพการสนทนา |
| Ready-for-call rate | คนใน chat cohort ที่มีเบอร์ยืนยัน + สินค้าที่สนใจ + อนุญาตโทร ÷ คนใน chat cohort × 100 | Lead + contact permission | คุณภาพ Lead ไม่ใช่เบอร์ทุกเบอร์ |
| Cost per ready-for-call Lead | Matched Spend ÷ distinct attributed Leads ที่ผ่านเกณฑ์พร้อมโทรใน cohort | Ads + Lead history | metric หลักเสนอสำหรับ A/B รอบหาลูกค้า |
| Assignment / call SLA | เคสที่ทำ action ทัน SLA ÷ เคสที่ครบกำหนด SLA ในรอบ × 100; เคสยังไม่ครบกำหนดแยก pending | assigned/accepted/first_attempt timestamps + service calendar | แยกเวลารับงานจากเวลาโทรจริง; ต้องกำหนดเวลาทำการ/target ก่อน |
| Contact rate | distinct Leads ที่โทรติด ÷ distinct Leads ที่พยายามโทร ใน assignment cohort เดียวกัน × 100 | Call logs ทุกครั้งที่โทร | ไม่เอาจำนวนครั้งโทรมาเป็นตัวหารคน |
| Lead-to-paid conversion | distinct eligible Leads ใน acquisition cohort ที่มี qualifying paid order ภายใน conversion window ÷ eligible Leads ใน cohort นั้น × 100 | Lead-order link + payment ledger | คนซื้อซ้ำยังนับ converted Lead เพียงหนึ่งครั้ง; แยก mature/pending |
| Paid orders / CPO | distinct paid order_id; Matched Spend ÷ attributed qualifying paid orders ใน cohort | Order/payment ledger ทุก transaction | CPO คือต้นทุนต่อคำสั่งซื้อ ไม่ใช่ CAC |
| Net paid revenue | ยอดรับชำระที่เข้าเกณฑ์ − ยอดคืนเงินที่เข้าเกณฑ์; ระบุการรวมภาษี/ค่าส่งก่อนใช้ | Payment/refund ledger เมื่อยืนยัน | เป็นยอดรับสุทธิสำหรับงานขาย ไม่อ้างเป็นรายได้บัญชีรับรู้ |
| Attributed ROAS | Net paid revenue ที่ผูก source ได้ตามกติกา ÷ Matched Spend | Ads + order ledger ภายใต้ window เดียวกัน | แสดง coverage; ไม่เรียก ROAS ว่ากำไรหรือ ROI |
| Lost / backlog / fulfillment | LOST แยกเหตุผล; งานเปิดที่เลย next_action_at ณ วันตัดรอบ; orders ที่ FULFILLED ÷ orders ที่ครบกำหนดส่ง | Status history + due dates | แสดงยอดคงค้างแยกจากจำนวนที่ไหลผ่านแต่ละขั้น |

การใช้ cost/ROAS เมื่อ attribution ไม่ครบต้องติดป้าย **partial attribution** และไม่ตัดสิน A/B ว่าชนะโดยไม่มี data-quality gate เปรียบเทียบไม่ได้ให้ `DATA_HOLD` ไม่กระจายยอดที่ไม่รู้ที่มาเข้า A/B เอง

## A/B Test และจังหวะทบทวน

ก่อนยิงต้องระบุสมมติฐาน, metric หลัก, ตัวแปรที่เปลี่ยนหนึ่งตัว, audience/placement, การแบ่งกลุ่มแบบไม่ทับซ้อนเมื่อระบบรองรับ, budget cap, ระยะทดลอง, sample requirement, conversion lag/window, เกณฑ์หยุดและเกณฑ์ตัดสิน เก็บเป็น experiment version เดียวที่ตรวจย้อนกลับได้ หากสุ่มกลุ่มไม่ได้ให้ระบุว่าเป็นการเปรียบเทียบเชิงสังเกต ไม่อ้าง causal lift

ข้อเสนอสำหรับรอบนี้: ทดลองข้อความหรือภาพ A/B ภายใต้สินค้า กลุ่มเป้าหมาย ช่วงเวลา และกระบวนการขายที่เทียบกันได้ ใช้ cost per ready-for-call Lead เป็นตัวหลัก แล้วตรวจ mature lead-to-paid conversion, net sales, refunds, margin และกำลังทีมขายประกอบ ไม่เลือกรุ่นชนะเพราะ CTR สูงกว่าอย่างเดียว

ยังไม่มีข้อมูลกำหนด sample size, งบ หรือเกณฑ์นัยสำคัญ จึงไม่ใส่ threshold สำเร็จรูปและไม่ประกาศผู้ชนะเพียงเพราะครบหนึ่งสัปดาห์ ตรวจ sample และ conversion maturity ตามแผนที่กำหนดล่วงหน้า; รายงานได้ทุกสัปดาห์ แต่คำตัดสินอาจเป็น `INCONCLUSIVE` ต่อเนื่องได้

ทุกจันทร์:

1. ตรวจ data-as-of, missing source, duplicate events, reconciliation ของเงินและ refund ก่อนอ่านผล
2. ดู **activity view**: Spend / ข้อความใหม่ / การโทร / การรับเงินที่เกิดในสัปดาห์ และ backlog ณ วันตัดรอบ
3. ดู **cohort view**: คนเริ่มทักสัปดาห์เดียวกัน แยก A/B/UNKNOWN พร้อมผลที่เกิดภายใน window และสถานะ mature/pending
4. ระบุคอขวด: คลิกน้อย → creative; คนทักน้อย → เส้นทางเข้า LINE; เบอร์น้อย → บทสนทนา; โทรไม่ทัน → ทีมขาย; โทรติดแต่ไม่ซื้อ → สินค้า/ข้อเสนอ/เหตุผลจริง
5. บันทึกคำตัดสิน เหตุผล action owner วันครบกำหนด และเวลาทบทวนรอบต่อไป การเปลี่ยนงบหรือ Ads เป็นการตัดสินของผู้มีอำนาจ ไม่ใช่ action อัตโนมัติจากภาพนี้

ตัวอย่างข้ามสัปดาห์: Lead เริ่มทัก W1 จ่าย W2 → เป็น New chat ของ W1, เป็น payment activity ของ W2 และ conversion ของ W1 cohort ไม่ใช่ลูกค้าใหม่ของ W2

แม่แบบหนึ่งแถวของ weekly review:

`week_start | as_of | experiment | variant | Spend | Impressions | Link clicks | New chats | Ready-for-call | Assigned | Attempted | Connected | Converted leads | Paid orders | Net paid revenue | UNKNOWN share | Pending | Decision | Owner | Due`

ช่องนับคนใน cohort view ต้องเป็นชุดคนเดียวกันและอ้างช่วงติดตามเดียวกัน; counts ใน activity view จะต่างกันได้ อย่านำสองแบบหารกันหรือบวกรวมเป็น unique funnel

## ความสัมพันธ์กับเอกสารเดิม

- Parent: [PRD-001](../../product/PRD-001-zuri-go.md) — ภาษาไทย, ไม่แต่ง actuals, เคารพข้อมูลที่ Guest อ่านได้
- Peer: [FEAT-002 §6 และ §7](../../features/FEAT-002-campaign-mission-control/spec.md) — numerator/denominator, cohort maturity, cross-week lead/order linking, source coverage, weekly decision with owner
- Peer: [FEAT-003 brief](../../features/FEAT-003-metrics-map/brief.md) — แยก revenue/attributed revenue, CPO/CAC, ROAS/profit
- Visual source: [brand-profile](../../../brand/brand-profile.md); [FEAT-009](../../features/FEAT-009-logo-placement/spec.md) ใช้ตรวจขอบเขตโลโก้เดิม ไม่เปลี่ยน logo placements ของ Zuri-Go
- SoT อยู่ใน ARCH-005 และบทที่ลิงก์ด้านบน; history เก็บเฉพาะหลักฐานและ move receipt.


## Verification and version diff

Current structural checks and original screenshot provenance are in [the move receipt](../../history/zuri-ai-line-sales-flow-2026-10-03/sot-restructure-verification.md) and [original verification](../../history/zuri-ai-line-sales-flow-2026-10-03/verification.md).

| Before | ARCH-005 v0.2.0 |
|---|---|
| Working definitions under a dated history/domain tree | One canonical architecture document with three chapters and four linked views in one folder |
| Zuri-AI/Zuri-Go relationship unresolved | Owner-stated Marketing/Commercial edition intent, observed service facts and draft context map recorded |
| No declared integration boundary | Draft entity-authority, scope/mapping, receipt/retry and evidence checklist; receiver details remain TBD |
| Workflow drafts looked like three local domains | Chapters retain flow IDs and clearly separate parent context from Zuri-Go implementation |
| History used as editing location | History retains screenshot and verification only |

2026-10-04 v0.2.0 → v0.2.1: linked the Domain 01 gap analysis and proposed FEAT-015 exchange contract. Shared process rules and diagram drawing content are unchanged; runtime delivery remains unverified.
