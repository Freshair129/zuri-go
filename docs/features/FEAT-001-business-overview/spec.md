---
document_id: ZGO-OVERVIEW-001
version: 0.2.0
date: 2026-09-30
status: implemented-local-verified
author: RWANG
complexity: C-3
risk: HIGH
---

# Zuri-Go — Business Overview

**Let’s Go to Market. Together**

แนวคิด: Marketing for everyone · Marketing made simple. เจ้าของธุรกิจเปิดหน้าเดียวแล้วรู้ว่า **กำลังทำอะไรอยู่ · ถึงเป้าแค่ไหน · วันนี้ควรทำอะไรต่อ**

เอกสารนี้ได้รับอนุมัติและพัฒนาเป็นระบบในเครื่องแล้ว; การนำเข้าข้อมูล browser ต้องตรวจรายการและยืนยันในหน้าแอป ส่วน Vercel production ยังไม่เปลี่ยน เอกสารชุดเดียวกันประกอบด้วย [Data model / PK / FK](../../architecture/ARCH-002-postgresql-data-model.md) และ [Architecture / migration / verification](../../architecture/ARCH-001-baseline-architecture.md)

## 1. สิ่งที่ผู้ใช้ยืนยัน

- ชื่อผลิตภัณฑ์ **Zuri-Go**; tagline **Let’s Go to Market. Together** ตามคำสั่งโดยตรงในแชต
- Overview เป็นภาพรวมธุรกิจ ครอบคลุมหลายแคมเปญ
- ต้องเห็นจำนวนแคมเปญที่กำลังรัน/อยู่ในคิว คอนเทนต์ที่รอลงตามตาราง และคอนเทนต์ทั้งหมดของเดือน
- แสดงเป้ารายสัปดาห์/รายเดือนเป็น actual / target พร้อมสรุปสั้นจาก AI
- ตัวอย่าง Weekly goal 500 followers หมายถึง **เพิ่มสุทธิ 500 คนภายในสัปดาห์** ตามคำตอบผู้ใช้ ไม่ใช่ยอดสะสมถึง 500
- ออกแบบข้อมูลและตารางด้วย PostgreSQL รวม ID, PK, FK
- คง Meeting & Task Manager, RACI, MoSCoW, Members แบบเรียบง่าย, หน้าความรู้ และ Graph View ใน site เดียว
- มี Zuri และน้องวางใจในทุก logical page ใช้คนละบทบาท และเปลี่ยนท่า/ตำแหน่งให้เหมาะกับเนื้อหา

## 2. หลักฐานและการเปลี่ยนขอบเขต

| ระดับ | แหล่งอ้างอิง | ผลต่อข้อเสนอ |
|---|---|---|
| Human | คำสั่งวันที่ 30 กันยายน 2026 และคำยืนยัน net followers | ใช้ชื่อใหม่และ Business Overview; 500 เป็นตัวอย่าง target ที่ผู้ใช้กำหนด ไม่ใช่ benchmark |
| Visual reference | [ภาพ Zuri-Go ที่ผู้ใช้แนบ](C:/Users/pc/Downloads/ChatGPT%20Image%20Sep%2030,%202026,%2011_03_22%20AM-4.png) | อบอุ่น มีพลัง ink/amber, mascot pair, ใช้ง่าย; เป็น brand direction ไม่ใช่ dashboard screenshot |
| Parent | [Brand profile](../../../brand/brand-profile.md), [Do / don't](../../../brand/do-dont.md), [Text rules](../../../brand/text-rules.md) | ใช้สีจาก token ไม่ดูดสีจากภาพ; Thai UI; ชื่อ Zuri-Go เป็นข้อยกเว้นตามคำสั่งผู้ใช้สำหรับผลิตภัณฑ์นี้ |
| Parent | [Campaign brief](../FEAT-002-campaign-mission-control/brief.md) | คง objective ต่อแคมเปญ, Low/Mid/High, D7/DESTINY gates และข้อมูล MUJEEN เดิม |
| Peer | [Meeting spec](../FEAT-004-meeting-task-manager/spec.md), [Meeting architecture](../FEAT-004-meeting-task-manager/design.md) | สมาชิกไม่ใช่ login; งาน manual/FUNG ยังอยู่ในระบบนี้; priority อยู่ที่ task ในรอบสัปดาห์ |
| Peer | [Unified site](../FEAT-008-unified-site/spec.md) | ใช้ site/project/app ID เดิม ไม่แยก Graph ออกเป็นอีก deployment |
| Runtime | [Authoring guide](../../../apps/web/AGENTS.md) | ปรับ authored content และ metadata ตาม public API; รักษา protected shell |
| Source | [DashboardContent](../../../apps/web/src/content/dashboard/DashboardContent.jsx), [model](../../../apps/web/src/content/shared/model.mjs) | `CampaignContent` เลือก `ws.selected` แล้วคำนวณ Overview ต่อแคมเปญ; ไม่มี lifecycle status หรือ content calendar ใน campaign model |
| Source | [Meeting repository](../../../apps/web/src/content/meeting/repository.mjs), [meeting model](../../../apps/web/src/content/meeting/model.mjs) | Campaign อยู่ localStorage, Meeting อยู่ IndexedDB; ยังไม่มี PostgreSQL source of truth |

นี่เป็นการเพิ่มความสามารถ ไม่ใช่ข้อสรุปว่าของเดิมทำงานผิดตามสเปกเดิม

## 3. [ASSUMPTIONS] ที่เสนอให้อนุมัติ

1. หนึ่ง Business มีหลาย Campaign และหลาย Channel account; รุ่นแรกเปิดดูทีละ Business ไม่เพิ่ม portfolio/tenant administration
2. รอบสัปดาห์จันทร์–อาทิตย์ และเดือนตามปฏิทินใน `Asia/Bangkok` เป็นค่าเริ่มต้น เก็บ timezone ของ Business ไว้ชัดเจน
3. คอนเทนต์ทั้งหมดของเดือน หมายถึง **ชิ้นคอนเทนต์ในแผนเดือนนั้น** ไม่ใช่จำนวนโพสต์ซ้ำข้ามช่องทาง หรือจำนวนไฟล์ media
4. รุ่นแรกกรอก/นำเข้าข้อมูลจริงเองได้; ปุ่มจัดตารางบันทึกแผน ไม่อ้างว่าระบบโพสต์ลง social ให้แล้ว
5. เลือก account(s) ที่ใช้วัด 500 followers เมื่อสร้าง goal ไม่ตั้งเป้า 500 ให้ทุกธุรกิจ/ทุกสัปดาห์อัตโนมัติ
6. การออกแบบ PostgreSQL ครอบคลุม server persistence; ยังไม่มี provider/connection/access policy ใหม่ที่อนุมัติ ข้อมูลที่อยู่ใน browser จะย้ายเมื่อเลือกขอบเขตและตรวจ import preview แล้ว

## 4. Information architecture

```text
Zuri-Go                               Business: [MUJEEN ▾]
Let’s Go to Market. Together

[ภาพรวมธุรกิจ] [แคมเปญ] [คอนเทนต์] [เป้าหมาย] [งานและประชุม] [เรียนรู้ / Graph]
```

- `/?view=1&tab=overview` → Business Overview เป็นหน้าเริ่มต้น
- `tab=campaign-overview&campaign=<id>` → Overview ของแคมเปญที่เลือก ซึ่งย้ายมาจาก Overview เดิม
- Performance, Plan & Gates, Workboard, Review & Decisions → คงไว้ในบริบทแคมเปญ และรักษา deep links เดิมด้วย selected campaign fallback
- `tab=content` → รายการ/ปฏิทินคอนเทนต์ พร้อมสถานะอนุมัติและเวลาลง
- `tab=goals` → ตั้งเป้ารายสัปดาห์/เดือนและกรอก actual
- `tab=meeting-task-manager` และ `/metrics/` → คงส่วนเดิม

Overview ไม่ถูกกรองตาม campaign ล่าสุดโดยเงียบ ๆ; header ต้องแสดงชื่อธุรกิจและขอบเขตเวลาเสมอ ลิงก์เจาะจาก card เปิดรายการที่ใช้ตัวกรองเดียวกับตัวเลขบน card

## 5. Screen proposal

ตัวเลขด้านล่างเป็น **ตัวอย่างสำหรับอธิบายหน้าจอเท่านั้น** ไม่มีการเติมเป็น actual ของผู้ใช้

```text
┌ Zuri-Go · Let’s Go to Market. Together ────────────── [Business ▾] ┐
│ ภาพรวมธุรกิจ       [สัปดาห์นี้] [เดือนนี้]       [+ วางแผน]        │
│ ข้อมูลล่าสุด: 30 ก.ย. 10:00 · 2/2 ช่องทางครบ                        │
├────────────────┬────────────────┬────────────────┬───────────────┤
│ กำลังรัน       │ อยู่ในคิว      │ รอลงตามตาราง   │ คอนเทนต์เดือนนี้│
│ 3 แคมเปญ       │ 2 แคมเปญ       │ 8 รายการ       │ 24 ชิ้นงาน      │
│ ดูแคมเปญ →     │ ดูคิว →        │ จาก 6 ชิ้นงาน →│ ลงแล้ว 10 →     │
├─────────────────────────────────────────┬─────────────────────────┤
│ เป้าสัปดาห์นี้                          │ เป้าเดือนนี้             │
│ ผู้ติดตามเพิ่มสุทธิ  +320 / +500         │ ผู้ติดตามเพิ่มสุทธิ       │
│ ███████████░░░░░░ 64%                   │ ยังไม่ตั้งเป้า            │
│ เหลือ 180 คน · ข้อมูลถึงวันนี้          │ [ตั้งเป้าเดือนนี้]         │
│ ยอดติดตามสะสม 4,820 · account scope     │ ไม่คูณเป้าสัปดาห์ให้เอง    │
├─────────────────────────────────────────┴─────────────────────────┤
│ Zuri สรุปให้ · AI · อ้างอิงข้อมูลถึง 30 ก.ย. 10:00                 │
│ • ผู้ติดตามเพิ่ม 320 คน เหลืออีก 180 คนถึงเป้าสัปดาห์                │
│ • มี 2 รายการเลยเวลาลง และ 1 ชิ้นรอตรวจ                            │
│ • แนะนำตรวจรายการที่เลยเวลาก่อนเพิ่มคิวใหม่ [ดูรายการ →]            │
├──────────────────────────────────┬────────────────────────────────┤
│ วันนี้ควรทำ                      │ กำลังจะลง                     │
│ เลยกำหนดลง 2 · รออนุมัติ 1        │ วันนี้ 14:00 · Facebook · Chef │
│ งาน Must ติดขัด 1 [เปิดงาน →]     │ พรุ่งนี้ 09:00 · LINE · Boss   │
├──────────────────────────────────┴────────────────────────────────┤
│ แคมเปญของธุรกิจ: ชื่อ / สถานะ / เป้า / ความคืบหน้า / คนดูแล / เปิด  │
│ น้องวางใจ: แจ้งข้อมูลขาด/ล้าสมัยใกล้รายการที่เกี่ยวข้อง              │
└──────────────────────────────────────────────────────────────────┘
```

Desktop: 4 summary cards, goals สองคอลัมน์, AI summary เต็มแถว, action queue/calendar preview คู่กัน Mobile: cards 2×2 และเรียง goals → สรุป → action → calendar; ไม่บังคับเลื่อนทั้งหน้าในแนวนอน

ปุ่มหลักตามบริบท: **เพิ่มแคมเปญ · วางคอนเทนต์ · ตั้งเป้า · อัปเดตผลจริง**; progressive disclosure ซ่อนสูตร/ID/แหล่งข้อมูลไว้ในรายละเอียดที่เปิดดูได้

## 6. นิยามตัวเลขที่ใช้ร่วมกันทั้ง UI / API / DB

| Card / metric | นิยาม | เวลาและขอบเขต | สิ่งที่ไม่นับ |
|---|---|---|---|
| กำลังรัน | COUNT campaigns ที่ lifecycle=`active` และไม่ archived | ตอนนี้ ทั้ง Business | paused, draft, queued, unconfirmed; ไม่เดาจากวันที่ |
| อยู่ในคิว | lifecycle=`queued` และไม่ archived | ตอนนี้ ทั้ง Business | draft ที่ยังไม่ยืนยัน; queued เลย planned start ยังอยู่ในคิวแต่ขึ้นเตือน |
| รอลงตามตาราง | publications ที่ `scheduled`, scheduled_at ≥ now และ < สิ้นช่วงที่เลือก | สัปดาห์นี้/เดือนนี้ตามตัวกรอง | published, failed, cancelled, draft; overdue แสดงแยก |
| คอนเทนต์เดือนนี้ | COUNT DISTINCT content_items.id ที่ planning_month=เดือนที่เลือก และไม่ archived | เดือนปฏิทิน; card ระบุชื่อเดือนแม้เลือกโหมดสัปดาห์ | cancelled/archived; ไม่ใช้ created_at และไม่คูณตามช่องทาง |
| ลงแล้วในแผนเดือนนี้ | content ในแผนเดือนนั้นที่มีอย่างน้อยหนึ่ง publication published | เป็น subset ของชิ้นงานในแผน | ไม่บอกว่าลงครบทุกช่องทาง; มี badge partial/ครบในรายละเอียด |
| เลยกำหนดลง | scheduled_at < now และ publication.status=`scheduled` | ตอนนี้ | ไม่ถือว่าโพสต์แล้วจากการถึงเวลา |
| ผู้ติดตามเพิ่มสุทธิ | Σ(latest follower stock − baseline stock) ของ account set ที่ goal ระบุ | baseline ที่ต้นรอบ, latest ถึง as_of; account set เดิมตลอดรอบ | ไม่ใช้ยอดสะสมเป็น gain; ข้อมูลขาดไม่แทน 0 |
| ผู้ติดตามสะสม | ผลรวม stock ล่าสุดของ account ที่เลือก พร้อมเวลาแต่ละ account | snapshot; account sum ไม่ใช่ unique people ข้ามแพลตฟอร์ม | ไม่ SUM daily snapshots |
| งานต้องทำ | งานเลยกำหนด/ติดขัด และ Must ในสัปดาห์ | task หนึ่ง ID นับครั้งเดียว | done; MoSCoW Won’t ไม่เพิ่มยอดงานที่เลือกทำ |

สถานะ lifecycle/approval/publication กับ freshness เป็นคนละมิติ การกรอกข้อมูลช้าไม่ทำให้ campaign เปลี่ยน active เป็น paused เอง

## 7. Goal contract

- เลือก **metric → scope/account(s) → สัปดาห์หรือเดือน → เป้า → owner**; goal ใหม่มี target เดียวเป็นค่าเริ่มต้นของ UX
- ตัวอย่างที่ยืนยัน: `followers_net / weekly / target 500 / direction higher_is_better` โดยรอ account scope และรอบวันที่จริง
- Card แสดง `actual / target`, %, เหลือเท่าไร, ข้อมูลถึงเมื่อไร, และ link ไปแหล่งข้อมูล; target=0/ไม่มี target ไม่หารและไม่แสดง completion %
- actual ติดลบได้สำหรับ net followers; แถบ progress จำกัด 0–100% เพื่อ layout แต่ตัวเลขจริงไม่ถูกตัด เช่น −20/500 หรือ 620/500 (124%)
- target ของเดือนตั้งแยก ไม่คูณ 4; สัปดาห์ที่คาบเดือนยังใช้รอบสัปดาห์เดิม ส่วน monthly actual ใช้ boundary ของเดือนจริง
- goal followers หลาย account เป็นผลรวมจำนวนบัญชีติดตาม; ไม่เรียกว่า “คนใหม่ที่ไม่ซ้ำ” และไม่บวกรวม goal หลายตัวที่ทับ account กันเป็น business total
- เทียบ pace เฉพาะข้อมูลครบ scope และรู้ baseline: expected=target×elapsed fraction ในรอบนั้น ใช้ cutoff ของข้อมูลจริง; UI ระบุว่าเส้นแผนเป็นสมมติฐานกระจายเท่ากัน ไม่ใช่ forecast
- ไม่มี baseline → “ยังคำนวณจำนวนเพิ่มไม่ได้” พร้อม CTA กรอกยอดต้นรอบ; partial → “ข้อมูลครบ 1/2 ช่องทาง” ไม่ตัดสินว่าถึงเป้าหรือหลุดเป้า
- Low/Mid/High และ cutoff เดิมอยู่ใน Campaign Plan & Gates; Business Overview ไม่เพิ่ม threshold สีแดงจาก benchmark ที่แต่งขึ้น
- เมื่อแก้ target/account scope กลางรอบต้องเก็บ version+เหตุผล+ผู้แก้ และคำนวณใหม่จาก scope revision เดียว ไม่เขียนทับหลักฐาน AI เก่า

## 8. AI summary ที่สั้นและเชื่อถือได้

ไม่เกิน 3 bullet: **ผลตอนนี้ · เรื่องที่ต้องระวัง · ขั้นตอนถัดไป** ประมาณ 40–80 คำ ใช้ภาษาคนทั่วไป และอ้าง evidence token ที่คลิกได้ เช่น Goal G-01 หรือ publication ที่เลยกำหนด

ก่อนเรียกโมเดล Server คำนวณตัวเลขและสร้าง immutable evidence bundle; AI เรียบเรียงและจัดลำดับ ไม่คำนวณ actual ใหม่ ไม่เปลี่ยนเป้า ไม่ปล่อย offer ไม่สร้าง/มอบหมาย task และไม่โพสต์เอง

- มีข้อความ “AI สรุปจากข้อมูลถึง …” และปุ่มดูหลักฐาน
- ไม่มีข้อมูล → empty state แนะนำข้อมูลขั้นต่ำที่ต้องเติม ไม่ส่ง zeroes สมมติให้ AI
- ข้อมูลเปลี่ยนหลังสรุป → ติดป้าย “สรุปนี้ใช้ข้อมูลก่อนอัปเดตล่าสุด” พร้อมสร้างใหม่
- AI ใช้งานไม่ได้ → แสดง **สรุปจากกติกา** ที่คำนวณไว้ แยก label ชัด ไม่อ้างว่า AI ตอบแล้ว
- แหล่ง AI/provider ยังไม่เลือก; ห้ามนำ token/client secret เข้า bundle และไม่ส่ง transcript, member phone/email เข้า summary prompt
- ตัวเลข/claim ที่ไม่ตรง evidence ต้องถูกปฏิเสธและใช้ fallback; ข้อเสนอแนะไม่อ้าง causality เช่น “CTR สูงจึงทำให้ยอดขายเพิ่ม” หากไม่มีหลักฐาน

## 9. สิ่งที่เติมเพื่อให้ใช้ทำงานได้จริง

1. **Content calendar และคิวรออนุมัติ** เป็นแหล่งข้อมูลให้ card จำนวนคอนเทนต์ ไม่ใช่ตัวเลขกรอกบน dashboard ลอย ๆ
2. **Today / Next 7 days** พร้อมเวลา ช่องทาง คนดูแล และ CTA เปิดงาน
3. **Data freshness / missing baseline** ใกล้ goal ที่ได้รับผล ไม่ซ่อนในหน้า settings
4. **Attention queue** รวมคอนเทนต์เลยเวลา แคมเปญถึงวันเริ่มแต่ยังอยู่ในคิว และงานสำคัญติดขัด; กดไปแก้ได้
5. **Goal owner และ metric explanation** อธิบาย “เพิ่มสุทธิ = ยอดตอนนี้ − ยอดต้นรอบ” พร้อมเปิดคู่มือเดิม

ไม่เพิ่ม automatic social publishing, paid provider signup, CRM ใหม่ หรือ AI ที่ตัดสินใจแทนคนในขอบเขตนี้

## 10. Brand application

- Product display name/header/title ใช้ Zuri-Go ตามคำสั่งใหม่; รักษา app ID และ published destination เดิม
- ปรับชื่อผลิตภัณฑ์ใน guide/graph ให้สอดคล้อง แต่ไม่เปลี่ยนชื่อ mascot Zuri และน้องวางใจ
- สีใช้ `#E8820C`, `#1F2937`, `#FFF8F0`, `#F7F8FA` จาก brand; จุด texture บาง มี contrast; amber ใช้กับ CTA/สถานะสำคัญ
- ใช้ Manrope กับ headings, IBM Plex Sans Thai กับเนื้อหา, tabular figures กับตัวเลข
- ภาพแนบเป็น direction สำหรับ Zuri-Go; ไม่แยก crop โลโก้ความละเอียดต่ำหรือเปลี่ยน canonical zuri corporate wordmark ใน asset เดิม การทำ product lockup ใหม่เป็น asset แยกหลังอนุมัติแบบ
- Zuri อยู่บริเวณสรุป/คำแนะนำ; วางใจอยู่บริเวณ data quality/action ที่ต้องจับตา ทั้งคู่ยังปรากฏในทุกหน้า แต่ไม่ใช้ pose เดียววางมุมเดียวทุกครั้ง

## 11. Acceptance / exit criteria

| ID | เกณฑ์ตรวจ |
|---|---|
| ZGO-01 | Overview เปิดระดับ Business; เลือกแคมเปญครั้งก่อนแล้วไม่ลด scope ของยอดรวมโดยไม่แจ้ง |
| ZGO-02 | 3 active + 2 queued + 1 paused + 1 unconfirmed → cards 3/2; unconfirmed มีรายการให้ยืนยัน |
| ZGO-03 | content 1 ชิ้น scheduled 3 channels → ชิ้นงาน=1, รายการรอลง=3 |
| ZGO-04 | ถึงเวลาแล้วไม่ mark published เอง; เลยเวลาขึ้น queue ให้ตรวจ |
| ZGO-05 | baseline 4,500 และล่าสุด 4,820 → net +320/500, 64%, เหลือ 180, สะสม 4,820; ตัวเลขนี้เป็น fixture เท่านั้น |
| ZGO-06 | missing baseline/partial/stale/negative/over-target และ week-cross-month แสดงถูก; ไม่รวม account ซ้ำ |
| ZGO-07 | AI ทุก factual statement ตรวจกลับ evidence ได้; stale/error/fallback มี label; ไม่ execute action |
| ZGO-08 | PK/FK ป้องกัน orphan และ cross-business links, retries/import ไม่สร้างซ้ำ, concurrent edits ไม่ทับกันเงียบ ๆ |
| ZGO-09 | ข้อมูลเก่า/RACI/MoSCoW/FUNG evidence ยังอ่านได้และตรวจจำนวน/ผลรวมก่อนสลับ storage |
| ZGO-10 | มือถือ/คีย์บอร์ด/contrast/mascot pair ผ่าน visual check; Campaign gates, knowledge และ graph regression ผ่าน |
| ZGO-11 | Backend ที่เก็บข้อมูลจริงไม่เปิด anonymous read/write; PostgreSQL credentials อยู่ฝั่ง server เท่านั้น |

Design exit: เอกสารสามฉบับสอดคล้องและผู้ใช้อนุมัติ ก่อนสร้าง DDL/migrations และแก้ app. Implementation exit: tests + DB constraint/migration checks + browser verification ผ่าน แล้วรายงาน local/hosted/runtime แยกกัน

## 12. Version diff และการอนุมัติ

| Unified site v0.1.0 | Zuri-Go proposal v0.1.0 |
|---|---|
| Overview ต่อแคมเปญ | Business Overview + drill-down เข้า Campaign Overview |
| ชื่อ Campaign Mission Control | Zuri-Go · Let’s Go to Market. Together |
| ยังไม่มี content entity/calendar | Content items + publications + approvals + schedule |
| มี campaign Low/Mid/High | เพิ่ม business weekly/monthly goals; คง campaign targets เดิม |
| LocalStorage / IndexedDB | ออกแบบ PostgreSQL + API + migration โดยเก็บ backup และ namespace เดิม |
| สรุป/decision ตามกติกาแคมเปญ | เพิ่ม AI brief ที่อ้าง evidence พร้อม fallback แบบกติกา |

ขออนุมัติ **layout, นิยาม metric, data model, architecture และขอบเขต migration** ในชุดนี้ก่อนสร้างโค้ด ตาม R5 “Never write or modify code without approved documentation.” และ SOP ที่ผู้ใช้กำหนดในแชต การอนุมัติแบบไม่ถือว่าได้เลือก/ซื้อบริการ PostgreSQL หรือ AI และไม่ให้ส่งข้อมูลไป provider ที่ยังไม่ระบุ

Implementation approval: ผู้ใช้ยืนยัน “spprove” (approve) วันที่ 30 กันยายน 2026; เริ่ม implementation ตามแบบนี้ ยังไม่ย้าย private data หรือเลือก cloud provider อัตโนมัติ
