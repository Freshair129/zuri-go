---
title: Zuri-AI domain 02 - LINE OA and conversation
status: draft
superseded_by: null
version: 0.1.1
date: 2026-10-04
owner: user-review-pending
source_document: ARCH-005
source_role: process-chapter
---

# บท 02 — LINE OA & Conversation

> Canonical chapter of [ARCH-005](ARCH-005-commercial-pipeline.md#flow-index). บทนี้เป็น source ของ flow รายละเอียด; HTML เป็น visual view. เลขบทและ LINE-Fxx ไม่ใช่ registered Domain/Feature ID. ความสัมพันธ์ข้ามระบบและสิทธิ์ผู้เขียนข้อมูลอ้าง [registry/relations.yaml](../../../registry/relations.yaml) และ ARCH-005; implementation decisions remain draft.

[เปิดชุด Flow ภาพทั้ง 7 หน้า](line-oa-conversation-flows.html) · พิมพ์ได้หน้า A4 แนวนอนต่อ Flow

โดเมนนี้รับต่อจาก [Marketing & Campaign](marketing-campaign.md) และภาพรวม [Ads ถึงการขายผ่าน LINE OA](ARCH-005-commercial-pipeline.md) ตั้งแต่รับข้อความจริง จับคู่ Lead เดิม ให้ AI ตอบและเก็บความต้องการ/เบอร์ จนส่งงานให้คนอย่างตรวจสอบย้อนหลังได้

**Complexity:** C-2 · **Risk:** MEDIUM สำหรับข้อเสนอกระบวนการนี้ เพราะแตะข้อมูลผู้ใช้, consent และการส่งข้อความ · **สถานะ:** ร่าง; ไม่ยืนยันว่ามี LINE OA, webhook, AI, CRM หรือ data connector เชื่อมอยู่จริง

## สมมติฐานและขอบเขต

1. ช่องทาง Messaging API, OA, Business/CRM, AI model, knowledge source, สิทธิ์ผู้ดูแล, hosting, SLA, retention และผู้ประมวลผลข้อมูลของ Zuri-AI ยังไม่ระบุ จึงไม่มีการอ้างถึง deployment หรือปริมาณจริง
2. ขอบเขต identity คือ LINE user ID ภายใน OA/Business ที่ยืนยันต้นทางแล้ว ไม่ใช่เบอร์โทรหรือ identity ข้าม OA; ถ้าจับได้หลาย Lead ให้เข้า `IDENTITY_REVIEW` ห้าม merge ด้วยชื่อ/เบอร์ร่วมกันอย่างเดียว
3. การเพิ่มเพื่อนหรือ profile ไม่ถือว่าได้เบอร์. LINE user profile ที่อ้างในเอกสารนี้ไม่ถูกใช้เป็นแหล่ง phone; ลูกค้าต้องส่งเบอร์และยืนยันวิธีติดต่อด้วยตนเอง
4. `webhookEventId` ใช้กัน event ซ้ำ; event อาจ retry หรือมาถึงไม่เรียงตามเวลาที่เกิด จึงบันทึก `timestamp`, `received_at`, `isRedelivery` และใช้ idempotent processing. ตรวจลายเซ็นจาก raw body ก่อนแปลง/ประมวลผล payload ตามเอกสาร LINE ทางการ
5. reply token ให้ใช้ตอบเหตุการณ์โดยเร็ว และสถานะส่งข้อความอิงผล response ที่สังเกตได้; ไม่ตั้ง SLA ขึ้นเองจากอายุ reply token ซึ่ง LINE ระบุว่าช่วงเวลาใช้งานอาจเปลี่ยนได้
6. AI ตอบจาก product/offer/FAQ ที่มี owner, version และ effective date เท่านั้น; เมื่อข้อมูลไม่พอ/ไม่มั่นใจ/ขอคน ให้หยุดคาดเดาและเข้าสู่ fallback/handoff ตามสิทธิ์ที่กำหนด
7. `READY_FOR_CALL` ต้องครบสามข้อพร้อมกัน: เบอร์รูปแบบใช้ได้และลูกค้ายืนยัน, มีสินค้าที่สนใจ, มี contact permission สำหรับการโทร. `PHONE_CONFIRMED` เพียงอย่างเดียวไม่ใช่ความยินยอมโทรหรือ Lead พร้อมโทร
8. consent phrase, scope, expiry, opt-out behavior, customer-service policy และ retention ต้องผ่าน owner/compliance ก่อนใช้จริง; เอกสารนี้ออกแบบสถานะเก็บหลักฐาน ไม่ตีความกฎหมายแทนผู้เชี่ยวชาญ

## Guardrails และแหล่งอ้างอิง

LINE แนะนำให้ตรวจ signature ก่อนประมวลผล webhook และเตือนว่าการ redelivery ไม่รับประกันการส่งครบ; ใช้ `webhookEventId` ตรวจซ้ำ และดู timestamp เพราะลำดับ event ที่ redeliver อาจไม่เรียงตามที่เกิด. Reply token ใช้ได้ครั้งเดียวและควรใช้โดยเร็ว. ดู [Receive messages (webhook)](https://developers.line.biz/en/docs/messaging-api/receiving-messages/), [Verify webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/), [Messaging API reference: reply token](https://developers.line.biz/en/reference/messaging-api/nojs/) และ [Get profile](https://developers.line.biz/en/reference/messaging-api/nojs/#get-profile). กติกาเหล่านี้เป็น integration requirements ที่ต้อง verify อีกครั้งเมื่อเลือก SDK/channel; ไม่ใช่หลักฐานว่า Zuri-AI ติดตั้งแล้ว

สำหรับ product answer และ Lead guardrails ใช้เพียงบริบทการขายใน [ภาพรวม flow](ARCH-005-commercial-pipeline.md) และ [Marketing domain](marketing-campaign.md); เอกสาร Zuri-Go ที่เกี่ยวข้องเป็น peer/guardrail ไม่ได้ขยายฟีเจอร์หรือ identity ของแอป Zuri-Go

## ทะเบียน Flow

| ID | Flow | ผู้เริ่ม / เจ้าของ | ผลลัพธ์ที่ต้องบันทึก | มาตรวัดหลัก |
|---|---|---|---|---|
| LINE-F01 | รับ webhook, verify, dedupe, queue | LINE operator / Data | channel scope, signature state, event ID, received/occurred time, redelivery, durable queue result | verified delivery rate, duplicate suppression, queue lag, failure/retry age |
| LINE-F02 | จับคู่ Lead และเปิด/ต่อบทสนทนา | Lead service / operator เมื่อ identity ซ้ำ | lead_id, OA/user key ภายใน, first/returning, source evidence, identity decision | new-vs-returning accuracy, duplicate Lead review, unknown source coverage |
| LINE-F03 | AI triage, ตอบจาก knowledge ที่อนุมัติ | AI service / Product-data owner | intent, answer/abstain, knowledge version, response state, escalation reason | first response latency, answer groundedness review, fallback/handoff rate |
| LINE-F04 | เก็บความต้องการ เบอร์ และสิทธิ์โทร | AI / ลูกค้า | product_interest, phone state, confirmation, permission scope/evidence/revocation, preferred time | phone-confirmed rate, permission-complete rate, Ready-for-call rate |
| LINE-F05 | ส่งต่อคนและ queue แอดมิน | Bot / LINE owner / Sales queue | reason, channel (chat/call), recipient, accepted/assigned time, bot takeover boundary, next action | handoff time, unassigned age, accepted-within-SLA, bot overlap incidents |
| LINE-F06 | Nurture, กลับมาคุย, opt-out | Customer / service owner | conversation reopen, outbound permission, opt-out scope/time, suppression state, owner | return engagement, pending age, opt-out completion, unintended-contact count |
| LINE-F07 | Review สุขภาพ LINE/AI และคุณภาพ Lead รายสัปดาห์ | LINE + AI + Sales owner | as-of, event health, conversation cohort, gate evidence, issue/action owner/due | P50/P90 response, webhook lag/failures, Lead funnel quality, Ready-for-call coverage |

## Flow detail: trigger, status, exception, evidence

### LINE-F01 — รับ webhook อย่างปลอดภัยและไม่ทำ event ซ้ำ

**เริ่มเมื่อ:** LINE Messaging API ส่ง webhook event หรือ operator พบ event failure/lag\
**ผู้รับผิดชอบ:** LINE/Data operator ดู channel health; event worker ทำ processing แบบ idempotent\
**เส้นทางหลัก:** `RECEIVED → SIGNATURE_VERIFIED → DURABLY_QUEUED → PROCESSING → PROCESSED`\
**ข้อยกเว้น:** ลายเซ็นหาย/ไม่ตรง → `QUARANTINED`; event ID ซ้ำ → `DUPLICATE_SUPPRESSED`; queue/worker ล้มเหลว → `RETRY_PENDING` + alarm; event เก่ากว่า state ปัจจุบัน → `OUT_OF_ORDER_REVIEW` ไม่เขียนสถานะใหม่ทับโดยไม่เทียบ `timestamp`

เก็บเฉพาะ field ที่จำเป็นตาม retention ที่อนุมัติ: `oa_scope_id`, `webhookEventId`, `event_type`, `event_timestamp`, `received_at`, `isRedelivery`, `signature_verification_state`, `body_hash/reference`, `idempotency_state`, `queue_id`, `retry_count`, `processing_state`, `error_code`, `resolved_at`. ห้ามบันทึก channel secret/access token/reply token ลง log ปกติ. เก็บ raw body ชั่วคราวเท่าที่ signature validation และ retry ต้องใช้; retention policy ยัง TBD

ตอบรับ webhook เมื่อเข้า durable queue ตามระบบจริงแล้ว; อย่าตอบ success ก่อนเก็บ event ที่จะประมวลผล. Re-delivery ไม่รับประกันการส่งครบและลำดับเดิม; alert event gap และตรวจ source health. ค่า retry, queue age threshold, capacity และ runbook owner ต้องกำหนดก่อนเปิดจริง

**KPI:** verified/received events, dedupe ratio = suppressed duplicate event IDs ÷ verified deliveries, ingest lag = processed_at − event_timestamp (รายงาน P50/P90 พร้อม out-of-order count), queue failure/age. แยก platform delivery success จาก AI response success

### LINE-F02 — จับคู่ Lead เดิมหรือเปิด Lead ใหม่

**เริ่มเมื่อ:** `LINE-F01` ส่ง message event ผ่าน verification แล้ว\
**ผู้รับผิดชอบ:** Lead service จับคู่ OA-scoped user identity; human reviewer แก้ ambiguity\
**เส้นทางหลัก:** `MESSAGE_ACCEPTED → IDENTITY_MATCHED → CONVERSATION_OPEN` หรือ `NEW_LEAD_CREATED`\
**ข้อยกเว้น:** identity key หาย → `UNMATCHED_IDENTITY`; มากกว่าหนึ่ง candidate → `IDENTITY_REVIEW`; event ซ้ำ/ล้าหลัง → ไม่สร้าง first-message/Lead event ซ้ำ

ค้นเฉพาะ within Business + OA scope ด้วย stable platform user key ที่ได้จาก webhook ที่ verified. ใช้ `lead_id` ภายในเป็น business key; เก็บ `first_message_at` เพียงครั้งแรก และเก็บทุก inbound message เป็น conversation event. บันทึก `new_chat` เมื่อไม่มี Lead เดิมที่ยืนยันแล้ว; ลูกค้าเดิมกลับมาทักเป็น returning conversation. `add friend` event ไม่เท่ากับ first message และไม่นับเป็น Lead โดยไม่มีข้อความตามเงื่อนไขของธุรกิจ

เก็บ `lead_id`, `business_scope`, `oa_scope_id`, internalized external-user ref, `identity_match_method`, `match_confidence/state`, `created_at`, `first_message_at`, `last_inbound_at`, `conversation_id`, event ref, first-source map, `source_state` (`VERIFIED/UNKNOWN/ORGANIC_WITH_EVIDENCE`). ห้ามเปิดเผย LINE ID ในรายงานกว้างหรือ campaign record

**KPI:** distinct new chat Leads / returning chats แยกกัน, Lead duplicate review rate, identity-resolution rate, source-verified share; denominator เป็น webhook message ที่ผ่าน validation ในช่วงเดียวกัน ไม่รวมเพิ่มเพื่อนหรือ retry ซ้ำ

### LINE-F03 — AI ตอบคำถามและคัดกรอง

**เริ่มเมื่อ:** มี inbound message ที่ยังไม่มี human owner รับช่วง\
**ผู้รับผิดชอบ:** AI ตอบตาม knowledge source ที่ Product-data owner อนุมัติ; LINE owner ดู failure/timeout\
**เส้นทางหลัก:** `REPLY_PENDING → CONTEXT_CLASSIFIED → GROUNDED_DRAFT → SEND_REQUESTED → SENT_CONFIRMED`\
**ข้อยกเว้น:** confidence/source ไม่ผ่าน policy, price/stock/offer หมดอายุ, คำขอ complaint/refund, user asks human หรือ reply send failure → `ABSTAIN_AND_HANDOFF`/`SEND_FAILED`; retry ต้อง idempotent ต่อ event/response intent ไม่ส่งข้อความซ้ำโดยไม่ตรวจผลเดิม

ถามเฉพาะข้อมูลที่ช่วยรู้ `product_interest`, need/use case, budget/timing หากเจ้าของอนุมัติให้ถาม; ให้คำตอบจาก versioned content (`knowledge_id/version`, product validity, price effective date). ไม่เดาราคา ส่วนลด สต็อก ส่งมอบ/รับประกัน หรือ promise การโทร. เก็บ AI draft, knowledge refs, model/flow version, policy result, send attempt/response ID และ reviewer outcome ตาม retention ที่อนุมัติ; หลีกเลี่ยงเก็บ chain-of-thought หรือข้อมูลเกินจำเป็น

Reply token ตอบ event ใช้ได้ครั้งเดียวและเวลารับรองอาจเปลี่ยน; ใช้โดยเร็ว. ถ้าพ้นทางตอบเดิมให้เข้าทาง fallback ที่มี permission/สิทธิ์แทนการ retry token แบบเดา. ส่ง reply API ได้สำเร็จไม่ใช่หลักฐานว่าลูกค้าอ่านหรือเข้าใจข้อความ

**KPI:** first AI response = sent_confirmed_at − first_message_at; median/P90 เฉพาะ cohort ที่ตอบ พร้อมจำนวน unanswered/failed แยก; grounded answer review pass ÷ sampled AI answers; escalation rate แยกเหตุ; duplicate outbound responses = 0 target หลัง dedupe QA (เป้าจริง TBD)

### LINE-F04 — เก็บ product interest, phone และ contact permission

**เริ่มเมื่อ:** ลูกค้ายินดีคุยต่อและ flow ต้องการเสนอให้แอดมินโทร\
**ผู้รับผิดชอบ:** AI ถามตาม approved form; ลูกค้าเป็นผู้ส่ง/ยืนยัน; owner ตรวจความครบก่อนสร้างงานโทร\
**เส้นทางหลัก:** `INTEREST_PENDING → INTEREST_CAPTURED → PHONE_REQUESTED → PHONE_RECEIVED → PHONE_FORMAT_VALID → PHONE_CONFIRMED → CALL_PERMISSION_CAPTURED → READY_FOR_CALL`\
**ทางออก:** ไม่ให้เบอร์/ไม่ให้โทร → `CHAT_ONLY` หรือ `NURTURE_WITH_PERMISSION`; เบอร์ไม่ผ่าน → `PHONE_NEEDS_CORRECTION`; consent ถูกถอน → `CONTACT_SUPPRESSED`; ambiguity → `HUMAN_REVIEW`

เบอร์ valid format หมายถึงตรวจรูปแบบเท่านั้น ไม่ยืนยันเจ้าของหรือว่ารับสายได้. ให้ลูกค้ายืนยันเบอร์ด้วยการทวนกลับหรือ verified method ที่ owner เลือก (TBD). เก็บ permission แยก phone number: `permission_scope=call`, `captured_by`, `captured_at`, `source_message_ref`, `purpose`, `preferred_contact_window`, `expires_at` ถ้ากำหนด และ `revoked_at/revocation_reason`. ห้ามถือว่าเบอร์ที่ส่งมา = ยินยอมโทร; ห้ามสร้าง call task จนทั้งสาม condition ผ่าน

**KPI:** phone confirmation rate = confirmed phones ÷ distinct new-chat Leads; permission-complete rate = Leads with valid scoped permission ÷ Leads with phone confirmed; Ready-for-call rate = Leads with confirmed phone + interest + permission ÷ distinct new-chat Leads. รายงาน missing / refused / corrected / unknown แยก; ห้ามคำนวณ 0/0 เป็น 0%

### LINE-F05 — Handoff ไปให้มนุษย์โดยไม่ให้ Bot พูดทับ

**เริ่มเมื่อ:** READY_FOR_CALL, human requested, AI abstains/fails, complaint, unresolved issue หรือ SLA risk\
**ผู้รับผิดชอบ:** Router เลือก queue; Admin/LINE owner กดรับงานและรับ context\
**เส้นทางหลัก (โทร):** `READY_FOR_CALL → CALL_TASK_CREATED → QUEUED → ASSIGNED → ACCEPTED_BY_ADMIN`\
**เส้นทางหลัก (แชต):** `HUMAN_CHAT_REQUESTED → CHAT_QUEUE → ASSIGNED → HUMAN_ACCEPTED`\
**ข้อยกเว้น:** ไม่มีเบอร์/permission สำหรับโทร → ห้ามสร้าง call task แต่ยัง handoff chat ได้; ไม่มีคนรับใน SLA → escalate queue owner; assignment fail → `UNASSIGNED` พร้อมเหตุผล/next_action_at

Handoff payload ส่งเฉพาะ lead summary ที่จำเป็น, product interest, source state/evidence, last customer message reference, phone/permission ที่ scope ถูกต้อง, AI answer history summary, reason, priority, created_at, assignee, `accepted_at`, `due_at`, `next_action_at`. ระบุ `bot_sales_muted_at` เมื่อ human owner รับช่วง; system service answer ที่จำเป็นต้องไม่ถูกปิดถ้ามนุษย์ยังไม่เห็น. Human note/decision เก็บ actor/time แยก AI event

**KPI:** assignment latency = assigned_at − queued_at; acceptance SLA pass ÷ tasks due ใน period, แยก chat/call; unassigned/overdue backlog ณ as-of; bot-overlap count; handoff reason mix. SLA targets, hours, escalation path = TBD

### LINE-F06 — Nurture, conversation reopen และ opt-out

**เริ่มเมื่อ:** ค้างข้อมูล/รอลูกค้าตอบ, human follow-up ยังไม่ถึงกำหนด, ลูกค้ากลับมาทัก หรือถอน permission\
**ผู้รับผิดชอบ:** service owner กำหนด allowed follow-up; customer preference มีผลเหนือ sequence\
**สถานะงาน:** `WAITING_CUSTOMER`, `FOLLOWUP_SCHEDULED`, `RETURNED_INBOUND`, `DO_NOT_CONTACT`, `CLOSED`\
**ข้อยกเว้น:** deadline ผ่าน → คิวงานค้าง/owner; customer inbound หลัง closed → เปิด conversation ใหม่บน Lead เดิม; opt-out → ยกเลิก outbound/call tasks ตาม scope และบันทึก suppression ก่อนประมวลผล scheduled outbound

ไม่ส่ง reminder/marketing message เว้นแต่ channel/permission, allowed purpose, quiet hours, cadence และ approved copy ถูกยืนยัน. ถอน contact permission ต้อง effective ก่อนข้อความที่ยังไม่ส่ง; ลูกค้ากลับมาทักเองไม่ลบ `DO_NOT_CONTACT` สำหรับ outbound แต่ให้ตอบ inbound ตามนโยบาย service ที่อนุมัติ. ถ้ามีเหตุชำระเงิน/บริการที่ต้องแจ้ง ให้ owner แยก legal basis/policy ก่อน

เก็บ `permission_state`, scope, captured/revoked timestamps, user request ref, suppression completion, scheduled task cancel/ref, last inbound, next action/owner, close/reopen reason. วัด opt-out processing time, pending task age, eligible vs suppressed sends, return-inbound rate; ห้ามใช้ opt-out เป็น LOST โดยไม่มีเหตุขาย

### LINE-F07 — ทบทวนคุณภาพการสนทนารายสัปดาห์

**เริ่มเมื่อ:** ตัด snapshot รายสัปดาห์หลังตรวจ event watermark และ sample ที่ครบ\
**ผู้ร่วม:** LINE owner + AI/knowledge owner + Sales owner\
**Gate:** `EVENT_HEALTH_OK + POPULATION_DEFINED + KNOWLEDGE_VERSION_KNOWN + COHORT_MATURE` → `REVIEW_READY`; ถ้าไม่ครบ `DATA_HOLD/INCONCLUSIVE` พร้อมงานแก้

Activity view แสดง inbound events, first replies, answer attempts, queue assignments และ opt-outs ที่เกิดในสัปดาห์. Lead-cohort view แสดง first messages ของ Lead ที่เริ่มช่วงเดียวกัน, source verified/unknown, interest, phone-confirmed, permission, Ready-for-call, accepted-handoff และ conversion outcome ที่ครบ lag แยก mature/pending. ไม่เอาการตอบหลายครั้งนับเป็น Leads หลายคน

บันทึก `period/as_of`, event watermark, population, knowledge/model/policy versions, metric definitions, sample, quality review, issue severity, decision, reason, approved action, owner, due, next review. ผู้ทบทวนเลือกรักษา/แก้ knowledge, routing, SLA หรือทำ hold; ห้าม deploy model, change consent, change channel config หรือส่ง campaign จาก report อัตโนมัติ

**KPI:** webhook signature/dedupe/queue health; median/P90 first AI response; answer sampled quality; fallback/escalation rate; new chat → phone confirmed → ready-for-call → accepted handoff; permission incomplete/refused; missed response/overdue handoff; opt-out completion. ทุกค่าแสดง n/N, date window, source/as-of, unknown และ maturity. Target, sample size, response SLA และ cohort lag ยัง TBD

## Shared contract และ status history

| Entity | Fields ขั้นต่ำ | Invariant |
|---|---|---|
| Webhook event | `event_id/webhookEventId, oa_scope, type, event_timestamp, received_at, redelivery, signature_state, idempotency_state, queue_state` | verify raw body; no duplicate state transition; out-of-order review |
| Lead identity | `lead_id, business_id, oa_scope, internal_user_ref, identity_method/state, first_message_at, last_inbound_at` | OA-scoped identity; uncertain merge goes to review |
| Conversation/message | `conversation_id, inbound/outbound_ref, direction, occurred_at, recorded_at, actor, content_ref/retention, delivery_state` | status reflects send result, not read receipt; retention is scoped |
| AI response | `event_id, intent, knowledge_version, policy_result, response_id, sent_state, fallback_reason, reviewer_state` | approved source only; failed send/abstain remains visible |
| Consent/contact | `lead_id, interest_ref, phone_ref, phone_validation/confirmation, permission_scope, evidence_ref, granted_at, revoked_at` | phone, identity, and permission separate; outbound checks current permission |
| Handoff task | `task_id, lead_id, handoff_type, reason, queue, owner, queued/assigned/accepted timestamps, due/next_action` | call requires Ready-for-call; chat handoff may not need phone |
| Weekly review | `period, as_of, population, metric_version, n/N, maturity, decision, actor, reason, action_owner, due_at` | activity events separate from cohort outcomes |

ทุกสถานะ append transition: `entity_id, from_status, to_status, occurred_at, recorded_at, actor_type/id, reason, evidence_ref, idempotency_key`. แยก webhook transport state, message delivery state, Lead stage, permission, handoff/task state; ห้ามใส่ทั้งหมดใน `lead.status` เดียว

## Acceptance checklist — โดเมน 02

- [x] ครบ LINE-F01–F07 และเชื่อมกับ Marketing source-map/Lead cohort/ready-for-call
- [x] มีทางแยก signature fail, duplicate/out-of-order event, AI abstain/send fail, ambiguous identity, no-phone, no-permission, opt-out และ queue timeout
- [x] Phone confirmed ไม่เท่ากับ contact permission; call handoff ต้องครบ interest + confirmed phone + permission; chat human handoff ทำได้โดยไม่มีเบอร์
- [x] AI ใช้ approved/versioned product information; delivery success ไม่เท่ากับ read/understood
- [x] KPI ของทุก stage มี formula/denominator/unknown/maturity; weekly review แยก activity กับ Lead cohort
- [x] มี privacy/retention/owner/TBD boundaries; ไม่มี customer actual, credential, account write หรือ app code change
- [x] HTML/SVG source กำหนด A4 landscape ต่อ flow, responsive scroller, accessible title/desc (browser print preview NOT RUN)

## Verification

- **PASS:** `diagram-design/scripts/self_check.py`, local Markdown links, 7 page IDs/navigation targets, flow-local markers และ card-overlap source check
- **NOT RUN:** visual browser/print preview; loopback server ไม่ได้ทำงาน และ browser policy ไม่อนุญาต `file:` URL
- **NOT RUN:** LINE channel, webhook, AI, CRM, customer data, Ads, call, API/application tests หรือ production changes

## คำตัดสินที่ยังต้องกำหนด

| TBD | Owner ที่ควรกำหนด | เหตุผล |
|---|---|---|
| LINE OA/channel และ Business mapping | LINE owner | กำหนด scope, account IDs, access control |
| webhook host, signature secret custody, redelivery, queue durability | Platform/Security owner | ความปลอดภัย, retry, event loss/duplication |
| CRM Lead match/retention/data access | Data + Business owner | identity, privacy, duplicate handling |
| model, prompt, approved knowledge, refusal policy | AI + Product owner | answer quality, allowed offer/claims |
| phone validation/confirmation + permission wording/scope/expiry | Business + compliance | user intent and outbound permission |
| handoff queues, business hours, SLA, bot takeover rules | Sales + LINE owner | assignment/accept/overdue behavior |
| event/text retention and deletion policy | Data + privacy owner | จำกัด PII และ audit requirements |
| review cutoff, sample, knowledge QA, escalation thresholds | Business owner | ให้การวัดมีประชากร/เกณฑ์ชัดเจน |

จนกว่าจะอนุมัติ ยังห้ามระบุว่า AI/LINE เชื่อมทำงานจริงหรือสร้าง/ส่งข้อความกับบัญชี production จากเอกสารนี้

## Version diff

| ก่อน (Domain 01/overview) | หลัง (Domain 02 v0.1.0 draft) |
|---|---|
| มีเพียง first chat และ “AI ตอบ” เป็นขั้นกว้าง | แยก webhook, identity, AI, consent, handoff, opt-out และ weekly review 7 flow |
| ไม่เห็น webhook retry/signature และ consent boundary | เพิ่ม dedupe/out-of-order, phone-vs-permission, human fallback และ event contract |
| integration, owners และ SLA ยัง TBD | ระบุข้อที่ต้องตัดสินใจโดยไม่กล่าวอ้างว่ามีการเชื่อมจริง |


## SoT placement update — 2026-10-04

ย้ายจาก dated history/domain tree มาเป็นบทเดียวของ ARCH-005; rebased links และ source backlinks. Flow IDs, business steps, metric rules และ existing verification boundaries retained. Chapter version: 0.1.1.
