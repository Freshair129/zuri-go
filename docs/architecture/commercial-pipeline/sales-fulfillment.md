---
title: Zuri-AI domain 03 - sales administration and fulfillment
status: draft
superseded_by: null
version: 0.1.1
date: 2026-10-04
owner: user-review-pending
source_document: ARCH-005
source_role: process-chapter
---

# บท 03 — Admin, Sales & Order Fulfillment

> Canonical chapter of [ARCH-005](ARCH-005-commercial-pipeline.md#flow-index). บทนี้เป็น source ของ flow รายละเอียด; HTML เป็น visual view. เลขบทและ SALES-Fxx ไม่ใช่ registered Domain/Feature ID. ความสัมพันธ์ข้ามระบบและสิทธิ์ผู้เขียนข้อมูลอ้าง [registry/relations.yaml](../../../registry/relations.yaml) และ ARCH-005; implementation decisions remain draft.

[เปิดชุด Flow ภาพทั้ง 7 หน้า](sales-fulfillment-flows.html) · พิมพ์ได้หน้า A4 แนวนอนต่อ Flow

รับ call task จาก [LINE OA & Conversation](line-oa-conversation.md) แล้วตามงานจากแอดมินรับเคส โทร บันทึกผล เสนอสินค้า เปิด order ตรวจรับเงินจริง ส่งมอบ/คืนเงิน และส่งตัวเลขให้ [Marketing weekly review](marketing-campaign.md) โดยยึด [ภาพรวมเส้นทางขาย](ARCH-005-commercial-pipeline.md)

**Complexity:** C-2 · **Risk:** MEDIUM สำหรับข้อเสนอกระบวนการ เพราะมีเบอร์โทร คำสั่งซื้อ การรับเงิน และสถานะส่งมอบ · **สถานะ:** ร่าง; ไม่ยืนยันว่ามี CRM, call system, payment provider, inventory หรือ fulfillment integration

## สมมติฐานและขอบเขต

1. สินค้า/ราคา/ส่วนลด/ภาษี/จัดส่ง/stock/payment route/refund policy/business hours/SLA ยังไม่ระบุ; ใช้ `TBD` ไม่มีข้อผูกพันทางการเงินจริง
2. รับงานโทรได้เมื่อ Lead เป็น `READY_FOR_CALL`: phone confirmed + product interest + call permission ยังมีผล. ขอคุยคนแต่ไม่มีเบอร์ = chat handoff ไม่ใช่ call task
3. ตรวจ permission ก่อนโทรทุก attempt. เบอร์ที่ format ถูกหรือทวนแล้วไม่ยืนยันว่าเป็นเจ้าของหรือรับสายได้
4. `NO_ANSWER`, `CALLBACK_SCHEDULED`, `PAYMENT_PENDING`, และ fulfillment pending เป็นงานค้าง ไม่ใช่ `LOST`/ยกเลิกอัตโนมัติ. `WON` เมื่อมี paid order ที่ reconcile แล้วเท่านั้น
5. รูปสลิปเป็นหลักฐานประกอบค้นหา ไม่ใช่การยืนยันรับเงิน. ใช้ transaction source ที่ Finance อนุมัติก่อน `PAID` หรือสั่งส่งมอบ
6. หนึ่ง Lead มีหลาย attempt/Order ได้; conversion นับ Lead ไม่ซ้ำ ส่วน payment/refund/sales นับตาม `order_id`
7. ใช้ Asia/Bangkok รายงานรายสัปดาห์; business calendar, snapshot hour, due date, conversion lag และเป้าหมาย SLA ต้องอนุมัติก่อนใช้

## Guardrails จากภาพรวม

แยก Lead stage, contact workflow, Order/payment, refund และ fulfillment states ตาม [ภาพรวม flow](ARCH-005-commercial-pipeline.md). เก็บประวัติแบบ append-only; cross-week order/refund ผูกกลับ acquisition cohort; phone/address/order note อยู่ในพื้นที่จำกัดสิทธิ์ ไม่ใส่ campaign record/dashboard ที่ไม่จำเป็น

## ทะเบียน Flow

| ID | Flow | เจ้าของ | หลักฐานหลัก | KPI |
|---|---|---|---|---|
| SALES-F01 | รับ Ready-for-call queue และ assign | Coordinator / Admin lead | eligibility, permission-as-of, owner, queued/assigned/accepted/due | assignment latency, accept SLA, unassigned/overdue |
| SALES-F02 | โทร บันทึก attempt และ callback | Admin / Sales | actor/time, permission check, result, reason, next action | first-attempt latency, contact rate, callback due, attempts/Lead |
| SALES-F03 | Qualify, เสนอสินค้า, บันทึก decision | Sales owner | need/SKU, approved offer version, customer answer, lost reason | connected→qualified/order, objection/lost reason, follow-up age |
| SALES-F04 | เปิด order และตามชำระ | Sales/Admin / Order owner | order/version, SKU/qty/total/currency/terms, payment ref/due/status | order count, pending value/age, duplicate order |
| SALES-F05 | Reconcile รับเงิน/คืนเงิน/ยกเลิก | Finance/Payment owner | transaction/refund refs, amount/currency, reconcile evidence/actor | paid orders, payment lag, reconciliation coverage, refund rate |
| SALES-F06 | ส่งมอบและจัดการ return | Operations / Customer service | fulfillment/order IDs, stock/ship/delivery evidence, due, exception | on-time fulfillment, backlog age, return/exception |
| SALES-F07 | ทบทวน Sales/Ops รายสัปดาห์ | Sales + Finance + Ops + Owner | period/as-of, cohort/maturity, backlog, decision/action | Ready-for-call→paid, CPO, net sales/refunds, SLA/fulfillment |

## Flow detail: transition, exception, metric

### SALES-F01 — รับ queue และมอบหมายเจ้าของ

**เริ่ม:** LINE domain ส่ง call task หลัง gate พร้อมโทรผ่าน. **ทางหลัก:** `CALL_TASK_CREATED → QUEUED → ASSIGNED → ACCEPTED`; reassign เก็บ actor/time/reason เดิม. Coordinator ตรวจ Lead, current permission, phone ref, product interest, source state, prior calls และ due; Admin รับหรือ reject พร้อมเหตุผล.

สิทธิ์/เบอร์/ความสนใจขาด → `ELIGIBILITY_HOLD`; owner ว่าง → `UNASSIGNED`; เกินกำหนด → `ESCALATED`; chat-only อยู่ chat queue. เก็บ `task_id, lead_id, queue, eligibility_check, permission_as_of, assigned_at, accepted_at, owner_id, due_at, next_action_at`. **KPI:** assignment latency = assigned − queued; accept SLA = tasks รับทันเวลา ÷ tasks due; แสดง pending/not-yet-due และ backlog age. ชั่วโมงทำการ/SLA เป็น TBD.

### SALES-F02 — โทรและบันทึกผลทุกครั้ง

**เริ่ม:** Admin รับ call task และตรวจ permission ก่อนกดโทร. **ทางหลัก:** `CALL_READY → ATTEMPTED → CONNECTED` หรือ `NO_ANSWER → CALLBACK_SCHEDULED/NURTURE`; จบแต่ละครั้งให้บันทึก attempt ก่อนรับงานถัดไป. ผลที่เสนอ: `CONNECTED_INTERESTED`, `CONNECTED_NOT_NOW`, `NO_ANSWER`, `BUSY`, `INVALID_NUMBER`, `CALLBACK_REQUESTED`, `DO_NOT_CONTACT`, `ATTEMPT_FAILED`.

Permission ถอน/เบอร์โต้แย้ง → `CONTACT_BLOCKED`; ระบบโทรขัดข้อง → `ATTEMPT_FAILED` พร้อม owner/retry; no answer ไม่ใช่ lost. เก็บ `attempt_id, actor, start/end, permission_checked_at, result, reason, callback_at, next_action/due`. Recording ใช้ได้ต่อเมื่อ policy/permission/retention อนุมัติ. **KPI:** first-attempt latency, contact rate = distinct connected Leads ÷ distinct attempted Leads, callback completed ÷ callbacks due; แยกจำนวน attempts จาก unique Leads.

### SALES-F03 — Qualify และบันทึกข้อเสนอ/ผล

**ทางหลัก:** `CONNECTED → NEED_QUALIFIED → OFFER_PRESENTED → CUSTOMER_DECISION → ORDER_DRAFT/FOLLOWUP_DUE/NURTURE/LOST_RECORDED`. Sales ใช้ catalog/ราคา/offer version ที่อนุมัติ; ส่วนลด/override เข้า `WAITING_APPROVAL`. บันทึก need, interested SKU, offer version/effective date, customer response, actor, evidence, reason และ next action.

ห้ามเดาราคา/stock/เงื่อนไข. `LOST` ต้องมีเหตุยืนยันและ reason; no-answer, waiting, pending pay ไม่ auto-lost. **KPI:** connected→qualified, qualified→order draft, objection/lost reason n/N, follow-up age. Customer accepted offer ≠ paid order.

### SALES-F04 — เปิด order และตามชำระ

**ทางหลัก:** `ORDER_DRAFT → ORDER_PENDING → PAYMENT_PENDING` หลังยืนยันรายการ/เงื่อนไขกับลูกค้า. สร้าง order ID/version เชื่อม Lead; เก็บ SKU/qty, ราคา/ส่วนลดอนุมัติ, currency, total, terms ref, created_by/at, payment instructions/ref, due และ status history. Idempotency กัน double submit; การเปลี่ยนยอด/รายการเป็น revision มี actor/reason.

ราคา/stock เปลี่ยน → `ORDER_REVIEW`; order ซ้ำ → `DUPLICATE_REVIEW`; ลูกค้ายกเลิกก่อนรับเงิน → `CANCELLED`; amount ไม่ครบ/ยังไม่ match อยู่ pending. Payment method/route เป็น TBD. **KPI:** order count, duplicate review, pending-payment value/age ณ as-of, expired-pending ตาม policy; แยก order จากผู้ซื้อไม่ซ้ำ.

### SALES-F05 — กระทบยอดเงินและ refund

**ทางหลัก:** `PAYMENT_PENDING → RECONCILIATION_PENDING → PAID` เมื่อ trusted ledger/provider transaction, order, amount, currency และ settled state ตรง. `payment_event_id` กันซ้ำ; mismatch → `PAYMENT_REVIEW`; fail → `PAYMENT_FAILED`; refund ที่อนุมัติสร้าง linked event `PARTIALLY_REFUNDED/REFUNDED`; ไม่เขียนทับประวัติ paid.

สลิปเป็น customer evidence ไม่ใช่ยอดรับเงินจริง. เก็บ transaction/refund ref, order, amount/currency, settled/refunded_at, source, reconcile actor/time, approval/discrepancy. เปลี่ยน Lead เป็น `WON` เมื่อ qualifying paid order ผ่าน reconcile. **KPI:** paid distinct orders, payment lag, reconciled eligible transactions ÷ eligible transactions, refund value/rate, net paid revenue = eligible settled amount − eligible refunds ตามกติกาภาษี/ขนส่งที่อนุมัติ. unmatched แสดงแยก.

### SALES-F06 — ส่งมอบ ติดตาม และรับคืน

**ทางหลัก:** `FULFILLMENT_PENDING → RESERVED → PREPARING → DISPATCHED → DELIVERED → FULFILLED` ตาม event/evidence จริง หลังผ่านเงื่อนไขชำระที่อนุมัติ. stock ขาด → `FULFILLMENT_HOLD`; delivery issue → owner + due; return → `RETURN_REQUESTED → RETURNED` พร้อม refund link ตาม policy.

เก็บ fulfillment/order/qty, reserve/dispatch/delivery timestamps, carrier/tracking evidence (ถ้ามี), due date source, owner, issue/return reason/resolution. กด “ส่ง” ไม่เท่ากับส่งถึง; `PAID` แยกจาก `FULFILLED`. **KPI:** on-time delivered ÷ qualifying orders due; backlog count/value/age; stock/delivery exception; return rate by paid-order cohort. Due/proof/window เป็น TBD.

### SALES-F07 — Weekly Sales/Ops review

ผ่าน `DATA_AS_OF + PAYMENT_RECONCILIATION + DISTINCT_ID + COHORT_MATURITY` จึง `REVIEW_READY`; ถ้าไม่ครบเป็น `DATA_HOLD/PENDING`. แยก (1) activity week: attempts, orders, payment/refund, dispatch/return และ backlog ณ cutoff; (2) acquisition cohort: Lead first-message week → ready/assigned/attempted/connected/paid ภายใน conversion window, mature/pending/unknown แยก.

Lead W1 จ่าย W2 ยังเป็น conversion ของ W1 cohort; refund ผูก order/cohort เดิม. บันทึก period/timezone/as-of, ledger watermark, population, metric version, n/N, issues/decision/reason/owner/due/next review. ไม่มี auto-change budget/price/order/state จาก report. **KPI:** assignment/call SLA, contact rate, Ready-for-call→paid Lead conversion, CPO = matched spend ÷ paid orders, net paid sales/refunds, on-time fulfillment, backlog age, unknown attribution share. ROAS แสดงเมื่อ source/window/currency match; ไม่ใช่ profit/ROI.

## Status / data contract

| Entity | Fields ขั้นต่ำ | ข้อกำหนด |
|---|---|---|
| Admin task | `task_id, lead_id, queue, permission_as_of, owner, queued/assigned/accepted/due/next_action` | call only when Ready-for-call; chat task separate |
| Call attempt | `attempt_id, actor, started/ended_at, permission_check, result, reason, evidence_ref, callback` | every attempt; no-answer not lost |
| Sales decision | `need/SKU, offer_version, customer_decision, reason, actor/time, approval_ref` | actual answer separate from AI suggestion |
| Order | `order_id/version, lead_id, items, amount/currency, terms_ref, status, idempotency_key` | revisions append; multiple orders per Lead allowed |
| Payment/refund | `event_id, order_id, transaction/refund_ref, amount/currency, settled/refunded_at, source, reconcile_actor` | PAID only after trusted reconciliation; refund is new event |
| Fulfillment | `fulfillment_id, order_id, due/dispatch/delivery, evidence, issue/return/refund_ref` | payment and delivery states separate |
| Review | `period/as_of, population, cohort_maturity, metric_version, decision, reason, owner/due` | activity separate from cohort outcome |

ทุก transition เก็บ `from/to, occurred_at, recorded_at, actor, reason, evidence_ref, idempotency_key`; phone/address/call notes/order detail จำกัดสิทธิ์; report ใช้ aggregate เท่าที่จำเป็น.

## Acceptance checklist — โดเมน 03

- [x] ครบ SALES-F01–F07 จาก assignment ถึง weekly review และแยก Lead, attempt, order, payment, refund, fulfillment
- [x] ตรวจ permission ก่อนโทรทุกครั้ง; no-answer/pending ไม่กลายเป็น LOST/PAID/FULFILLED เอง
- [x] `WON` มาจาก verified paid order; slip ไม่ใช่ reconciliation; refund append และผูก order เดิม
- [x] มี duplicate/mismatch, callback, DNC, stock/delivery issue และ overdue branches
- [x] แยก activity, acquisition cohort, pending maturity, distinct Lead กับ order/attempt count
- [x] ทุก KPI ระบุ source/base หรือ age/as-of; unknown ไม่ถูกเดา
- [x] HTML/SVG source กำหนด A4 landscape, responsive scroller, accessible title/desc (browser print preview NOT RUN)

## Verification

- **PASS:** `diagram-design/scripts/self_check.py`, relative links, page/navigation IDs, marker scope และ card-overlap source check
- **NOT RUN:** browser screenshot/print preview; loopback server ไม่ได้ทำงาน และ browser policy ไม่อนุญาต `file:` URL
- **NOT RUN:** โทรจริง, CRM/order/payment/stock/carrier, customer data, API/application tests หรือ production change

## Decisions ที่ยังเป็น TBD

| Decision | Owner ที่ควรกำหนด |
|---|---|
| roster, queue, calendar, callback/call SLA | Sales lead |
| permission wording, retries, quiet hours, DNC | Business + compliance |
| catalog/SKU/price/discount/tax/shipping/stock | Product + Finance + Operations |
| order ID/duplicate, payment provider/ledger/reconciliation controls | Finance + Platform |
| refund/cancel/return authority, fulfillment evidence/due dates | Finance + Operations |
| timezone, cohort lag, CPO/ROAS attribution, data access/retention | Business + Analyst + privacy owner |

จนกว่าจะกำหนดและอนุมัติ ไม่สร้าง order/payment/fulfillment จริงจากเอกสารนี้และไม่กล่าวอ้างว่า deploy แล้ว

## Version diff

| ก่อน (overview) | หลัง (Domain 03 v0.1.0 draft) |
|---|---|
| แอดมินโทร ซื้อ ชำระ ส่งมอบเป็นช่วงรวม | แยก queue/call/qualification/order/payment/fulfillment/weekly review 7 Flow |
| หลาย outcome เสี่ยงปนกัน | แยก Lead, attempt, order, payment/refund และ fulfillment state |
| SLA/offer/payment rules ยังไม่ระบุ | เพิ่ม guardrails, formulas, evidence และ TBD owner; ไม่สร้าง integration |


## SoT placement update — 2026-10-04

ย้ายจาก dated history/domain tree มาเป็นบทเดียวของ ARCH-005; rebased links และ source backlinks. Flow IDs, business steps, metric rules และ existing verification boundaries retained. Chapter version: 0.1.1.
