---
version: "1.3.0b"
created_at: "2026-09-25T10:12:43.8622520+07:00"
last_update: "2026-09-25T13:20:03+07:00"
status: active
superseded_by: null
attributes:
  doc_type: content-update-spec
  campaign: campaign-01
  author: "RWANG (อาหวัง)"
  commit_hash: null
  target_path: "D:/zuri-brand-kit/output/draft/campaign-01_metrics-map.html"
  source_path: "D:/zuri-brand-kit/output/draft/gvm"
  mascot_path: "D:/zuri-brand-kit/output/draft/assets/mascot"
  complexity: C-2
  risk: LOW
  language: th
  implementation_status: REV-02.3-generated-browser-print-recheck-pending
  approval: "REV 02 approved by the user; MQL/SQL, M1-derived metrics, and REV 02.3 visual changes explicitly requested on 2026-09-25."
---

# ข้อเสนออัปเดต campaign-01 Metrics Map — REV 02

ผู้ใช้อนุมัติข้อเสนอนี้แล้วเมื่อ 25 กันยายน 2026 และอัปเดต `output/draft/campaign-01_metrics-map.html` เป็น REV 02 ครบ 14 หน้าแล้ว ผลตรวจอยู่ใน `campaign-01_metrics-map-qc.md` งานยังอยู่ใน draft ไม่ได้อนุมัติเผยแพร่ ส่วนข้อเสนอด้านล่างเก็บขอบเขตที่อนุมัติไว้เพื่อ traceability

### บันทึก REV 02.1

ผู้ใช้ขอเพิ่ม Marketing-qualified lead (MQL) และ Sales-qualified lead (SQL) ในหน้า Conversion จึงเพิ่มคำอธิบายแต่ละสถานะ วิธีนับ lead ไม่ซ้ำ และตัวอย่างอัตราส่งต่อ MQL → SQL โดยกำชับให้ทีมตกลงเกณฑ์ร่วมกัน ไม่มีการตั้งคะแนนหรือ benchmark สากล หน้า/ภาพ/มาสคอตเดิมคงเดิม ไฟล์ HTML สร้างใหม่แล้ว; browser และ print QC ของ REV 02.1 ยังไม่ได้รัน และ PDF/evidence เดิมยังเป็น REV 02.

### บันทึก REV 02.2

ผู้ใช้ให้เพิ่ม metrics จาก `C:/Users/pc/Downloads/MUJEEN_GTM_M1_Offer_AOV_Lead_Budget_Revision_2026-09-25.md` ลงในคู่มือ ขอบเขตนี้คือ metric definitions และสูตรทั่วไป ไม่ใช่การนำแผน Mujeen มาใช้กับ zuri เพิ่มหมวด Commerce & Operations 4 หน้า รวมเป็น 18 หน้า/6 หมวด; สร้าง HTML แล้ว แต่ browser/print QC ยังไม่ได้รัน และ PDF/evidence ที่มีอยู่ยังเป็น REV 02.

### บันทึก REV 02.3 — ปรับภาพและเพิ่มสถานการณ์สั้น

ผู้ใช้แจ้งว่าลายจุดพื้นหลังมองไม่เห็น สีขาวกลืน ไม่มีสีเน้นหรือ CTA และภาพ zuri/น้องวางใจผิดแบบและซ้ำตำแหน่ง/ท่าทาง พร้อมขอสถานการณ์ง่าย ๆ เช่นใช้ CTR เช็กความน่าสนใจของคอนเทนต์ สาเหตุที่พบใน builder คือ dot pattern จำกัดอยู่หน้าปกและถูกพื้นสีขาวขององค์ประกอบทับ ส่วนภาพ mascot คู่เดิมถูก hard-code ซ้ำทุกหน้า

ปรับเป็นลายจุดที่เห็นได้ในทุกหน้า ใช้สี amber เป็นสัญญาณที่หัวหมวด สูตร เลขหน้า และ CTA สร้างภาพคู่ reference-based 3 ท่าไว้ใน `output/draft/assets/mascot/` (ชี้กราฟ, อธิบายคลิปบอร์ด, นั่งวิเคราะห์) สลับท่า/ด้านภาพ และวาง guide ก่อนหรือหลังเนื้อหาตามหน้า เพิ่มสถานการณ์สั้นและปุ่มลิงก์ที่พาไปหัวข้อถัดไปครบทุกหน้า โดยหน้า Consideration ระบุว่าใช้ CTR ดูความสนใจและต้องเทียบ audience, placement, objective และช่วงเวลาเดียวกัน

Prompt และ generation IDs บันทึกใน `projects/campaign-01/image-prompt.md`; ภาพยังเป็นงาน draft ต้องตรวจรูปลักษณ์ สี และการจัดหน้าด้วยตาก่อนปล่อย Browser/print QC และ PDF ของ REV 02.3 ยังไม่ได้สร้าง/ตรวจ.

## 1. เป้าหมายและขอบเขต

ปรับคู่มือเดิมให้ครอบคลุมสาระจากภาพทั้ง 8 ภาพใน `gvm` แบ่งหมวดที่อ่านและค้นหาได้ง่าย เติมคำอธิบาย สูตร ตัวอย่าง วิธีอ่านผล และความรับผิดชอบที่ต้นทางยังไม่ได้ลงรายละเอียด โดยทุกหน้าแสดงภาพ **Zuri และน้องวางใจ** จากโฟลเดอร์ที่ผู้ใช้กำหนด

ระดับ C-2: เปลี่ยนโครงสร้างเนื้อหาและการจัดหน้าใน HTML เดียว มีเอกสารกำกับและตรวจผลจริง ความเสี่ยง LOW: เป็น draft อ้างอิง ไม่มีฐานข้อมูล API หรือการเปลี่ยนระบบธุรกิจ

[ASSUMPTIONS]

1. คำว่า “ทุกหน้า” หมายถึงทุกหน้าของคู่มือที่แบ่งเป็นหน่วยอ่านชัดเจน รวมปก หน้าสารบัญ และหน้าสรุป ไม่ใช่แสดงมาสคอตเฉพาะท้ายเว็บ
2. ใช้ HTML เดิมเป็นทางเข้าหลัก จัดเป็น 14 หน้าที่มีเลขหน้าและสารบัญลิงก์ไปแต่ละหน้า ดูต่อเนื่องบนเว็บได้ ไม่เพิ่มระบบจัดการเนื้อหาหรือแอปใหม่
3. รายละเอียด Budget, KPI, RACI และ Roadmap ที่เติมเป็นแม่แบบเพื่อการเรียนรู้ ไม่ใช่แผนงบประมาณหรือโครงสร้างทีมจริงของ zuri
4. การอนุมัติเอกสารนี้อนุมัติให้ลงมือแก้ draft ตามขอบเขตนี้ การนำออกเผยแพร่ยังต้องผ่าน QC และการอนุมัติชิ้นงานโดยมนุษย์

แผนหลังอนุมัติ:

1. อัปเดต HTML ตามแผนหน้าและข้อความในเอกสารนี้ → ตรวจครบทุกหัวข้อและ source mapping
2. จัดหน้าและมาสคอตสองตัวทุกหน้า → ตรวจ desktop, mobile และการแบ่งหน้าพิมพ์
3. ตรวจสูตร ลิงก์ รูปภาพ ภาษาไทย และ checklist แบรนด์ → บันทึก QC พร้อม diff REV 01 → REV 02

## 2. ข้อกำหนดต้นทางและช่องว่างที่พบ

อ่านเอกสารระดับ parent: `brand/brand-profile.md`, `brand/do-dont.md`, `brand/text-rules.md`, `copy/approved-copy.md`, `copy/prohibited-claims.md` และ `AGENTS.md`

อ่านระดับ peer/campaign: `projects/campaign-01/brief.md`, `projects/campaign-01/image-prompt.md`, `qc/image-checklist.md` และ HTML เดิม

| ประเด็น | หลักฐานปัจจุบัน | การเปลี่ยนที่เสนอ |
|---|---|---|
| โครงสร้าง | HTML มี Awareness, Consideration, Conversion และข้อควรระวัง | แยก metrics, customer growth, ทีมและวิธีทำงาน, แผนปฏิบัติการ, การอ่านผล |
| Metrics เดิม | ครบ 11 ตัวจากภาพ funnel แต่คำอธิบายสั้น | เก็บครบทั้ง 11 ตัว พร้อมเติมหน่วย ฐานคำนวณ ตัวอย่าง และวิธีอ่าน |
| AARRR และแผน | อยู่ใน `IMG_4136.jpeg` แต่ไม่มีใน HTML | เพิ่ม AARRR, KPI, Budget, RACI, 90 วัน และ 12 เดือน |
| โครงสร้างทีม | อยู่ใน screenshot แต่ไม่มีใน HTML | เพิ่ม Data & Strategy, หน่วย execution, workflow และระดับทักษะ |
| มาสคอต | HTML บรรทัด 378–380 มีรูปฝังเพียงรูปเดียวและชื่อ “น้องกระจ่าง” | ใช้ Zuri + น้องวางใจทุกหน้า; เอาชื่อที่ไม่ใช่ชื่อปัจจุบันออก |
| โลโก้ | masthead วาด Z ด้วย path และพิมพ์ ZURI เป็นข้อความ | ใช้ SVG wordmark ที่ outline แล้วจาก `assets/logos/zuri-wordmark.svg` |
| CTR | บรรทัด 238 ฟันธงสาเหตุเมื่อ CTR ต่ำ | เปลี่ยนเป็นรายการสิ่งที่ต้องตรวจ ไม่สรุปสาเหตุจากตัวเลขเดียว |
| กำไร | บรรทัด 282 กล่าวว่า Conversion เป็นตัวเดียวที่บอกกำไร | แยก conversion, รายได้ และกำไรอย่างชัดเจน |
| LTV/CAC | บรรทัด 360–362 ใช้เกณฑ์ 3 เท่ากับ revenue LTV แบบเด็ดขาด | ระบุว่าเป็น heuristic ต้องระบุฐาน LTV, margin, cohort และระยะคืนทุน |
| CPO | บรรทัด 370–372 สรุปขาดทุนจากกำไรขั้นต้นต่อ order | อธิบาย contribution ก่อนค่าแอดและขอบเขต order แรก; ไม่ฟันธง lifetime profitability |

Brief เดิมลงวันที่ 2 กันยายนและยังบอกว่าชื่อ/ตัวละครไม่ล็อก แต่ brand profile ปัจจุบันมีชื่อและข้อกำหนดแล้ว ให้ยึด brand profile เมื่อขัดกัน ไม่ยกสถานะเก่ามาเป็นข้อเท็จจริงปัจจุบัน

## 3. Source mapping — ตรวจภาพครบ 8/8

ไฟล์ทุกแถวอยู่ใต้ `output/draft/gvm/` ชื่อย่อ G01–G08 ใช้สำหรับตรวจย้อนกลับ ไม่เปลี่ยนชื่อไฟล์ต้นทาง

| ID | ไฟล์ | สาระที่อ่านได้ | หน้าใหม่ |
|---|---|---|---|
| G01 | `615885615_122133354686992725_8991070302867251796_n.jpg` | ปกสรุป Marketing Metrics | 01 |
| G02 | `617563287_122133354782992725_7931094083234134915_n.jpg` | Awareness: Impressions, CPM | 02 |
| G03 | `620112234_122133354788992725_3797505832379488852_n.jpg` | Consideration: Clicks, CTR, CPC | 03 |
| G04 | `617912566_122133354776992725_2860196314728364820_n.jpg` | Conversion: CVR, ROAS, ROI | 04–05 |
| G05 | `617606245_122133354794992725_4887824788410035437_n.jpg` | CPO, CAC, LTV | 04, 06 |
| G06 | `619250988_122133354710992725_6766144328900826988_n.jpg` | ภาพรวม funnel 3 ช่วง และ metrics 11 ตัว | 01–06 |
| G07 | `IMG_4136.jpeg` | AARRR, Budget, KPI, RACI; W1–2 Unblock, W3–4 Foundation, W5–8 Velocity, W9–12 Compound; Q1 Build, Q2 Test, Q3 Scale, Q4 Compound | 07, 10–13 |
| G08 | `Screenshot 2026-09-02 113422.png` | Data & Strategy, Execution, Content team, workflow, Head/Function Leader/Specialist และ I/T/Y/X skill shapes | 08–11 |

ต้นทางมีชื่อองค์กร ภาพบุคคล และ CTA ของผู้จัดทำต้นฉบับ ใช้สาระเพื่อเรียบเรียงใหม่พร้อมอ้างที่มาในหน้าอ้างอิง ไม่ยกโลโก้ บุคคล หรือ CTA เหล่านั้นมาเป็นองค์ประกอบแบรนด์ zuri

## 4. โครงสร้าง 14 หน้า แบ่ง 5 หมวด

| หน้า | หมวด | ชื่อและเนื้อหาที่ต้องมี |
|---|---|---|
| 01 | ภาพรวม | **Marketing metrics, mapped.** สารบัญ 5 หมวด; funnel Awareness → Consideration → Conversion และสะพานไปสู่ลูกค้าระยะยาว ทีม และแผน |
| 02 | A · Metrics | **Awareness — คนเห็นมากแค่ไหน**: Impressions, Reach, Frequency, CPM; แยกจำนวนครั้งกับจำนวนคน |
| 03 | A · Metrics | **Consideration — ความสนใจไปต่อหรือไม่**: Clicks, CTR, CPC; แยก all clicks กับ link clicks; ตรวจคุณภาพปลายทางด้วย |
| 04 | A · Metrics | **Conversion — เกิดผลลัพธ์อะไร**: Conversions, MQL, SQL, CVR, CPA, CPO; กำหนด event, เกณฑ์ lead และ denominator ก่อนอ่านผล |
| 05 | A · Metrics | **Revenue & Profit — ขายได้กับกำไรต่างกัน**: ROAS, ROI, AOV และตัวอย่าง contribution ก่อนค่าแอด |
| 06 | A · Metrics | **Customer Value — ลูกค้าใหม่คุ้มแค่ไหน**: CAC, revenue LTV, gross-profit LTV; เทียบแบบ cohort และระวังเกณฑ์ LTV/CAC |
| 07 | B · Growth | **AARRR — มองต่อจากการซื้อครั้งแรก**: Acquisition, Activation, Retention, Referral, Revenue; คำถาม, event, metric และงานที่เกี่ยวข้อง |
| 08 | C · Team & Workflow | **ทีมการตลาด — ใครรับช่วงไหน**: Data & Strategy เชื่อม Live, Affiliate, Influencer, Platform, Website, MDT, Content, Ads |
| 09 | C · Team & Workflow | **วิธีทำงาน — จากข้อมูลไปสู่งานที่วัดผลได้**: Data & Insight → Strategy → Execution → Optimize; การส่งต่องานและทักษะ 3 ระดับ |
| 10 | D · Planning | **KPI & Budget — เป้าหมายมีฐานและงบมีเจ้าของ**: KPI card, baseline/target, แหล่งข้อมูล, การทบทวน, รายการต้นทุนและเพดานอนุมัติ |
| 11 | D · Planning | **RACI — ใครทำ ใครตัดสินใจ ใครต้องรู้**: ความหมาย 4 บทบาท พร้อมตารางตัวอย่างที่แต่ละงานมี A คนเดียว |
| 12 | D · Planning | **90-day Roadmap — เริ่มจากสิ่งที่ขวางผลลัพธ์**: 4 ช่วงจาก G07 พร้อม owner, deliverable, KPI และเงื่อนไขผ่านแต่ละช่วง |
| 13 | D · Planning | **12-month Outlook — วางทิศทางพร้อมทบทวน**: Build / Test / Scale / Compound; เชื่อมแผน 90 วันกับ Q1 และปรับแผนทุกไตรมาส |
| 14 | E · Reading & Sources | **อ่านผลก่อนตัดสินใจ**: ข้อควรตรวจเรื่อง tracking, attribution, margin, sample size, cohort; source index ของภาพทั้ง 8 และเอกสารเสริม |

หน้าละหนึ่งคำถามหลัก มีชื่อหมวด เลขหน้า โลโก้ และคู่มาสคอต ไม่บีบทุกหัวข้อกลับเข้า conversion เหมือนเดิม จำนวนหน้า 14 เป็นขอบเขตที่เสนอ ไม่ได้หมายถึงมีไฟล์ HTML 14 ไฟล์

## 5. เนื้อหา Metrics ที่พร้อมนำไปจัดหน้า

ทุก metric ใช้โครงเดียวกัน: ชื่ออังกฤษ → ความหมายไทย → สูตร/วิธีนับ → หน่วย → ตัวอย่างสมมติ → สิ่งที่ต้องตรวจประกอบ ไม่เพิ่ม benchmark ที่ไม่มีหลักฐาน

### หน้า 02 — Awareness

| Metric | ข้อความอธิบายและวิธีคำนวณ | หน่วย/วิธีอ่าน |
|---|---|---|
| Impressions | จำนวนครั้งที่โฆษณาแสดงผล คนเดิมเห็นหลายครั้งได้; อ่านค่าจากแพลตฟอร์ม | ครั้ง; ไม่ใช่จำนวนคนและไม่ได้พิสูจน์ว่าจำแบรนด์ได้ |
| Reach — เพิ่มเติม | จำนวนคนหรือบัญชีไม่ซ้ำที่แพลตฟอร์มประมาณว่าเข้าถึงภายในขอบเขตที่เลือก | คน/บัญชีตามนิยามแพลตฟอร์ม; ห้ามบวก Reach ต่างช่องทางแล้วถือว่าเป็นคนไม่ซ้ำ |
| Frequency — เพิ่มเติม | Impressions ÷ Reach ของช่วงเวลาและกลุ่มเดียวกัน | ครั้งต่อคนโดยเฉลี่ย; ใช้ดูการเห็นซ้ำร่วมกับ CTR และผลลัพธ์ ไม่ตั้งเพดานตายตัว |
| CPM | ค่าโฆษณา ÷ Impressions × 1,000 | บาทต่อ 1,000 ครั้ง; CPM ต่ำไม่ยืนยันว่ากลุ่มคนมีคุณภาพ |

ข้อความ Zuri: “เริ่มจากแยกจำนวนครั้งที่แสดงผลออกจากจำนวนคนที่เข้าถึงค่ะ”

ข้อความน้องวางใจ: “Reach ต่างช่องทางอาจมีคนซ้ำกัน ตรวจขอบเขตก่อนรวม”

### หน้า 03 — Consideration

| Metric | ข้อความอธิบายและวิธีคำนวณ | หน่วย/วิธีอ่าน |
|---|---|---|
| Clicks | จำนวนครั้งที่เกิดคลิกตามประเภทที่เลือก เช่น link clicks; คนเดิมคลิกซ้ำได้ | ครั้ง; ระบุชนิดคลิกให้ตรงกับ CTR/CPC และอย่าเท่ากับจำนวน sessions โดยอัตโนมัติ |
| CTR | Clicks ÷ Impressions × 100 | %; เทียบโฆษณาที่วัตถุประสงค์ รูปแบบ ตำแหน่ง และชนิดคลิกใกล้เคียงกัน [S01] |
| CPC | ค่าโฆษณา ÷ Clicks | บาทต่อคลิก; ราคาต่ำต้องดู CVR และคุณภาพ lead/order ต่อ |

ข้อความอ่านผล: “CTR ลดลงเป็นสัญญาณให้ตรวจ creative, audience, placement และ frequency พร้อมกัน ข้อมูลนี้ยังไม่ยืนยันสาเหตุใดสาเหตุหนึ่ง”

### หน้า 04 — Conversion

| Metric | ข้อความอธิบายและวิธีคำนวณ | หน่วย/วิธีอ่าน |
|---|---|---|
| Conversions — อธิบายเพิ่ม | จำนวน event ที่กำหนดว่าเป็นผลลัพธ์ เช่น lead ที่ผ่านเกณฑ์ หรือคำสั่งซื้อที่ชำระแล้ว | ครั้ง/รายการตาม event; ไม่ใช่ทุก conversion เป็นยอดขาย |
| CVR | Conversions ÷ ฐานที่กำหนด × 100; ตัวอย่างคู่มือนี้ใช้ paid orders ÷ tracked link clicks | %; ติดป้ายว่า click-based ส่วน website session conversion rate ต้องใช้ sessions; Google Ads ใช้ eligible ad interactions ตามรายงาน [S02] |
| CPA — เพิ่มเติม | ค่าโฆษณา ÷ Conversions ของ event ที่เลือก | บาทต่อ action; ระบุชื่อ event เสมอเพื่อไม่ปนการลงทะเบียนกับการซื้อ [S03] |
| CPO | ค่าโฆษณา ÷ คำสั่งซื้อที่ attributed ให้โฆษณาในขอบเขตเดียวกัน | บาทต่อ order; ระบุ paid orders, วิธีตัดยกเลิก/คืนสินค้า และ attribution window |
| Marketing-qualified lead (MQL) — เพิ่มเติม | Lead ไม่ซ้ำที่ marketing จัดว่าเข้าเกณฑ์ fit และ engagement ที่ตกลงร่วมกัน; ยังอาจต้อง nurture | นับ `lead_id` ไม่ซ้ำที่เข้า MQL ใน cohort/ช่วงที่ระบุ; ระบุ event และกติกา re-entry |
| Sales-qualified lead (SQL) — เพิ่มเติม | Lead ที่ sales ตรวจแล้วว่าเข้าเกณฑ์ธุรกิจและรับเข้าสู่ direct sales follow-up | นับ `lead_id` ไม่ซ้ำเมื่อ sales accept เป็น SQL; การส่งต่ออย่างเดียวไม่นับเป็นการยอมรับ |

ตัวอย่างเชื่อมสถานะ: MQL → SQL rate = SQL จาก MQL cohort ÷ MQL ใน cohort เดียวกัน × 100; ตัวอย่างสมมติ 24 ÷ 60 = 40%. เทียบเมื่อ cohort ครบช่วงติดตามที่กำหนด และให้ marketing/sales ตกลงนิยาม fit, intent, stage entry และการรับช่วงก่อนใช้ตัวเลข

ข้อความอ่านผล: “CVR บอกการเปลี่ยนไปสู่ผลลัพธ์ที่กำหนด ต้องดูรายได้ ต้นทุน และกำไรต่อจึงจะประเมินความคุ้มค่าได้”

เมื่อ event คือ paid order และ cost/order scope เหมือนกัน CPA จึงเท่ากับ CPO; ถ้า event เป็น lead ห้ามใช้แทนกัน

### หน้า 05 — Revenue & Profit

| Metric | ข้อความอธิบายและวิธีคำนวณ | หน่วย/วิธีอ่าน |
|---|---|---|
| ROAS | รายได้ที่ attributed ให้โฆษณา ÷ ค่าโฆษณา | เท่า; 5× เท่ากับ 500%; เป็นอัตรารายได้ต่อค่าแอด ไม่ใช่กำไร |
| ROI | (รายได้ − ต้นทุนทั้งหมดในขอบเขตการคำนวณ) ÷ ต้นทุนทั้งหมด × 100 | %; ระบุรายการต้นทุน ช่วงเวลา และฐานรายได้ให้ตรงกัน [S04] |
| AOV — เพิ่มเติม | รายได้จากคำสั่งซื้อในขอบเขต ÷ จำนวนคำสั่งซื้อในขอบเขต | บาทต่อ order; นิยามยอดหลังส่วนลด/คืนสินค้าให้สม่ำเสมอ |

ข้อความเปรียบเทียบ: “ROAS สูงยังมีโอกาสเหลือกำไรน้อย เพราะค่าสินค้า ค่าขนส่ง ค่าธรรมเนียม ทีม และต้นทุนอื่นยังไม่อยู่ในตัวหารของ ROAS”

กล่องประกอบ: contribution ก่อนค่าแอดต่อ order = รายได้สุทธิต่อ order − ต้นทุนผันแปรอื่นต่อ order แล้วจึงเทียบกับ CPO; ส่วนที่เหลือยังต้องรองรับต้นทุนคงที่ ไม่เรียกทั้งหมดว่ากำไรสุทธิ [S07]

### หน้า 06 — Customer Value

| Metric | ข้อความอธิบายและวิธีคำนวณ | หน่วย/วิธีอ่าน |
|---|---|---|
| CAC | ต้นทุนการตลาดและการขายเพื่อหาลูกค้าใหม่ ÷ จำนวนลูกค้าใหม่ โดยระบุวิธีจับคู่ cost กับ cohort | บาทต่อลูกค้าใหม่; รวมค่าใช้จ่ายที่เกี่ยวข้องตามนิยามที่ประกาศ ไม่ใช่เฉพาะค่าแอด [S05] |
| Revenue LTV | AOV × ความถี่การซื้อ/ปี × อายุลูกค้าเฉลี่ยเป็นปี | บาทต่อลูกค้า; เป็นแบบจำลองรายได้ ไม่ใช่กำไรที่ยืนยันแล้ว [S06] |
| Gross-profit LTV — อธิบายฐานเพิ่ม | Revenue LTV × gross margin rate | บาทต่อลูกค้า; แบบประมาณภายใต้ margin คงที่ ยังไม่หักบริการและต้นทุนดำเนินงานทั้งหมด [S05] |

ข้อความอ่านผล: “LTV ÷ CAC ≥ 3 เป็นแนวคิดอ้างอิงที่ใช้กันในบางบริบท ไม่ใช่เกณฑ์ผ่านอัตโนมัติ ต้องระบุว่า LTV คิดจากรายได้หรือกำไร และดูระยะคืนทุนกับเงินสดด้วย”

เปรียบเทียบ cohort ที่มีอายุสังเกตเท่ากัน; แยกค่าที่เกิดขึ้นจริงออกจากการคาดการณ์; ถ้ายังไม่มีประวัติพอ ให้ระบุ “ข้อมูลยังไม่พอประมาณ LTV”

### ชุดตัวอย่างคำนวณร่วม — ข้อมูลสมมติ ไม่ใช่ผลจริงของ zuri

ตัวอย่าง A ใช้สมมติฐานว่า tracking สมบูรณ์และรายได้/คำสั่งซื้อทั้งหมดในตัวอย่าง attributed ให้โฆษณาชุดเดียวกันในช่วงเดียวกัน ไม่มีภาษี ค่าส่งที่เรียกเก็บ หรือคืนสินค้าในตัวอย่างนี้:

| Input | ค่า |
|---|---:|
| ค่าโฆษณา | 10,000 บาท |
| Impressions / Reach | 100,000 ครั้ง / 40,000 คน |
| Tracked link clicks | 2,000 ครั้ง |
| Paid orders | 100 รายการ |
| รายได้หลังส่วนลด | 50,000 บาท |
| COGS | 25,000 บาท |
| ต้นทุนผันแปรอื่นนอกค่าแอด | 5,000 บาท |
| ต้นทุนคงที่ที่จัดสรรให้ขอบเขตนี้ | 5,000 บาท |

ผลที่ต้องได้: Frequency 2.5, CPM 100 บาท, CTR 2%, CPC 5 บาท, CVR 5%, CPO/CPA(paid order) 100 บาท, AOV 500 บาท, ROAS 5×; ต้นทุนรวม 45,000 บาท กำไรในขอบเขต 5,000 บาท และ ROI 11.11%; contribution ก่อนค่าแอด 200 บาท/order หลังค่าแอด 100 บาท/order แต่ยังไม่หักต้นทุนคงที่

ตัวอย่าง B แยกจาก A: ต้นทุน acquisition 18,000 บาท / ลูกค้าใหม่ 60 คน → CAC 300 บาท; AOV 500 บาท × 4 ครั้ง/ปี × 2 ปี → Revenue LTV 4,000 บาท; gross margin สมมติ 40% → Gross-profit LTV 1,600 บาท ตัวเลขทั้งสองฐานห้ามเรียกรวมว่าเป็นกำไรสุทธิ

ถ้าตัวหารเป็น 0 หรือไม่มีข้อมูล ให้แสดง “คำนวณไม่ได้ / ข้อมูลยังไม่พอ” ไม่ใช้ 0%, 0 บาท หรืออนันต์แทนผล

## 6. หน้า 07 — AARRR

เพิ่มวงจรลูกค้าจาก G07 โดยอธิบายว่าเป็นอีกกรอบมองธุรกิจ ไม่ได้จับคู่กับ funnel 3 ขั้นแบบหนึ่งต่อหนึ่ง [S08]

| Stage | คำถาม | สิ่งที่วัด/นิยามตัวอย่างของคู่มือ | งานที่เกี่ยวข้อง |
|---|---|---|---|
| Acquisition | ลูกค้าที่เหมาะสมมาจากไหน | New visitors / qualified leads; ดู CAC เมื่อเปลี่ยนเป็นลูกค้าใหม่แล้ว | Ads, Content, Affiliate, Influencer, Live |
| Activation | ลูกค้าได้รับคุณค่าครั้งแรกหรือยัง | Activation rate = ผู้เข้าร่วมใหม่ที่ทำ activation event ภายในเวลาที่กำหนด ÷ ผู้เข้าร่วมใหม่ที่มีโอกาสทำครบช่วงเวลา × 100 | Website/Platform, CRM; เจ้าของธุรกิจกำหนด event ที่สื่อถึงคุณค่าจริง |
| Retention | ลูกค้ากลับมาหรือไม่ | Cohort retention = ลูกค้าใน cohort เริ่มต้นที่กลับมาทำ return event ในช่วงติดตาม ÷ ลูกค้า cohort เดิมที่ติดตามครบช่วง × 100 | CRM, MDT, Customer Service; ระบุ event และช่วงเวลา |
| Referral | การบอกต่อพาคนที่เหมาะสมมาไหม | Referral conversion = ผู้รับคำเชิญที่เปลี่ยนเป็นผลลัพธ์ที่เลือก ÷ ผู้รับคำเชิญไม่ซ้ำที่ติดตามได้ × 100 | Referral/CRM; ติดตามด้วยรหัสหรือลิงก์และหักรายการซ้ำ |
| Revenue | รายได้เกิดอย่างคุ้มค่าหรือไม่ | AOV, ROAS, ROI, CAC และ LTV ตามขอบเขตที่นิยาม | Data & Strategy ร่วมกับทีมขาย/การเงิน |

สูตร activation/retention/referral ในตารางเป็นนิยามสำหรับคู่มือนี้ ต้องกำหนด event, cohort และเวลาให้ครบ ไม่อ้างว่าแพลตฟอร์มทุกแห่งคำนวณเหมือนกัน

## 7. หน้า 08 — โครงสร้างทีม

แนวคิดจาก G08: แยกหน้าที่ให้ชัด คนเดียวรับหลายหน้าที่ได้ตามขนาดธุรกิจ ทุกหน่วยต้องเชื่อมกลับเป้าหมายเดียวกัน

**Data & Strategy:** สรุปภาพรวม วิเคราะห์ข้อมูล กำหนดสมมติฐาน เป้าหมาย งบ และลำดับงาน ติดตามผลเพื่อปรับแผนร่วมกับผู้ตัดสินใจ

| หน่วยงานตามต้นทาง | ขอบเขตงานที่เรียบเรียงใหม่ | หลักฐานส่งมอบตัวอย่าง |
|---|---|---|
| Live | เตรียมรายการ สคริปต์ ข้อเสนอ ผู้ดำเนินรายการ และติดตามผลหลังจบ | แผน Live, สรุปยอดคำสั่งซื้อที่ตรวจสอบแล้ว |
| Affiliate | ประสานพาร์ตเนอร์ ข้อตกลง ลิงก์ และการวัดผลที่มาของยอด | Partner brief, รายงานยอด/ค่าตอบแทนตามขอบเขต |
| Influencer | เลือกผู้ร่วมงาน จัด brief ตรวจผลงาน และติดตามผล | Brief, ชิ้นงาน, tracking และผลตามเป้าหมาย |
| Platform | ดูแลหน้าร้าน แคมเปญ และกิจกรรมบนแพลตฟอร์มขาย | แผนกิจกรรมและรายงาน conversion ของแพลตฟอร์ม |
| Website | ดูแล content/SEO และประสบการณ์บนเว็บไซต์ | หน้าที่เผยแพร่, event tracking, CVR ตามฐานที่กำหนด |
| MDT | คงชื่อย่อตามภาพ; งาน Order/Stock, Customer Service, CRM/Automation | สถานะคำสั่งซื้อ/สต็อกและปัญหาบริการที่ตรวจสอบได้ |
| Content | Creative, Footage, Editor, Art Director, Graphic Designer | แนวคิด/สคริปต์, ภาพต้นฉบับ, งานตัดต่อ, art direction, artwork |
| Ads | วางแผน ตั้งค่า ทดสอบ และอ่านประสิทธิภาพโฆษณา | Campaign setup, แผนทดสอบ, รายงาน CPA/ROAS ตามนิยาม |

ภาพไม่ให้คำขยาย MDT ที่ยืนยันได้ จึงไม่แต่งคำเต็มขึ้นเอง ตารางนี้เป็นบทบาทตัวอย่าง ไม่ใช่รายชื่อหน่วยงานจริงหรือความสามารถที่ zuri รับประกัน

## 8. หน้า 09 — Workflow และทักษะ

จัดลำดับใหม่ให้ต่อเนื่องเป็น 4 ขั้นตามชื่อที่เห็นใน G08; เลขต้นทางข้ามจาก 3 ไป 5 ไม่เพิ่มขั้นที่มองไม่เห็น

| ขั้น | Input → งาน → Output | สิ่งที่ต้องส่งต่อ |
|---|---|---|
| 01 Data & Insight | รายงาน/ข้อมูลลูกค้า → ตรวจคุณภาพและหาโอกาส → insight ที่มีหลักฐาน | แหล่งข้อมูล ช่วงเวลา ปัญหา และสิ่งที่ยังไม่รู้ |
| 02 Strategy | Insight → เลือกกลุ่ม ข้อเสนอ ช่องทาง และ KPI → brief/แผน | Owner, budget cap, target และเงื่อนไขประเมินผล |
| 03 Execution | Brief → ผลิตชิ้นงาน ตั้ง tracking และเปิดกิจกรรม → งานพร้อมวัดผล | งานที่อนุมัติ tracking ที่ตรวจแล้ว และ log การเปลี่ยน |
| 04 Optimize | ผลจริง → วิเคราะห์สมมติฐานและข้อจำกัด → หยุด/ปรับ/ขยาย | Decision log, เหตุผล, เจ้าของงาน และวันตรวจรอบถัดไป |

ระดับทักษะจาก G08: Head/Manager เชื่อม Data, Strategy, คนและต้นทุน; Function Leader แปลงเป้าหมายเป็นงาน คุมคุณภาพและประสานทีม; Specialist ลงมือเชิงลึกและสร้างหลักฐานของงาน

ต้นทางกล่าวถึง I/T/Y/X skill shapes ให้เก็บเป็นแนวคิดเรื่องความลึก ความกว้าง และการเชื่อมงาน ไม่กำหนดนิยามรายตัวหรือบังคับผูกกับตำแหน่งโดยไม่มีหลักฐานเพิ่มเติม จุดปฏิบัติที่ต้องมีคือระบุทักษะหลัก ทักษะข้างเคียง และทักษะที่ต้องเรียนเพิ่มของแต่ละบทบาท

## 9. หน้า 10 — KPI & Budget

**KPI card หนึ่งใบต่อเป้าหมาย:** เป้าหมายธุรกิจ / stage / metric / สูตรและหน่วย / baseline พร้อมช่วงเวลา / target ที่ผู้รับผิดชอบตกลง / owner / source / รอบทบทวน / เงื่อนไขหยุดหรือปรับ

แม่แบบตัวอย่าง: “เพิ่มสัดส่วนการเปลี่ยนเป็น paid order” → CVR(click-based) → baseline รอข้อมูล → target รอกำหนด → owner ผู้รับผิดชอบ Ads ร่วม Website → แหล่งข้อมูล ads + paid-order log → รอบทบทวนรายสัปดาห์ โดยตรวจว่ายอดและ attribution ครบก่อนสรุป

ไม่ใส่ค่า target สมมติให้ดูเหมือนเกณฑ์จริง ทุกช่องที่ไม่มีข้อมูลระบุ “รอกำหนด”

| หมวดงบ | สิ่งที่ควรนับ | ช่องข้อมูลในแม่แบบ |
|---|---|---|
| Media | ค่าโฆษณาตามช่องทาง | Planned / Actual / Remaining / Owner |
| Production | Creative, ถ่ายทำ, ตัดต่อ, artwork | Planned / Actual / Remaining / Owner |
| Partners | Affiliate, Influencer และค่าตอบแทนตามข้อตกลง | Planned / Actual / Remaining / Owner |
| People & Tools | ต้นทุนคนและเครื่องมือที่จัดสรรให้แผน | Planned / Actual / Remaining / Owner |
| Reserve | งบสำรองที่ได้รับอนุมัติ | วงเงิน / ผู้อนุมัติ / เงื่อนไขใช้ |

Planned budget = ผลรวมงบที่อนุมัติทุกหมวด; Remaining = Planned − Actual และห้ามนับต้นทุนซ้ำข้ามหมวด; cost basis ของ ROAS, CPO และ CAC ใช้คนละขอบเขต ต้องมีคำอธิบายกำกับ

## 10. หน้า 11 — RACI

R = ผู้ลงมือทำ, A = ผู้รับผิดชอบสุดท้ายและตัดสินใจ, C = ผู้ให้คำปรึกษาก่อนตัดสินใจ, I = ผู้ที่ต้องรับทราบ แต่ละแถวมี A หนึ่งคน [S09]

ตารางต่อไปนี้เป็นตัวอย่างหน้าที่ ไม่ใช่การมอบหมายบุคคลจริง ทีมเล็กให้คนเดียวสวมหลายบทบาทได้ แต่ต้องระบุว่าใช้อำนาจบทบาทใด

| งาน | Head/Owner | Data Lead | Creative Lead | Media Lead | Commerce Lead | CRM Lead |
|---|---|---|---|---|---|---|
| กำหนดเป้าหมายและวงเงิน | A | R | C | C | C | I |
| นิยาม KPI และตรวจ tracking | A | R | I | C | C | C |
| ผลิตและตรวจชิ้นงาน | I | C | A/R | C | C | I |
| เปิดและดูแลโฆษณาตามวงเงิน | A | C | C | R | I | I |
| ตรวจ order/stock/customer service | I | C | I | I | A/R | C |
| งานติดตามลูกค้าและ referral | I | C | C | I | C | A/R |
| สรุปผลและตัดสินใจปรับแผน | A | R | C | C | C | C |

RACI กำหนดความรับผิดชอบ ส่วน KPI วัดผลลัพธ์ ต้องใช้ร่วมกัน ไม่มีการเปลี่ยนงบจริงจากตารางตัวอย่างนี้

## 11. หน้า 12 — Roadmap 90 วัน

G07 แสดง W1–12 ซึ่งเท่ากับ 84 วันในทางปฏิทิน จึงเติมวัน 85–90 เป็นช่วง review/ส่งต่อแผนโดยระบุว่าเป็นส่วนเพิ่มเติมของคู่มือ

| ช่วง | งานและผลส่งมอบที่เสนอ | เจ้าของบทบาท | หลักฐานก่อนผ่านช่วง |
|---|---|---|---|
| W1–2 · Unblock | ตรวจเป้าหมาย ข้อมูล tracking, order flow และ blocker; ทำ baseline/gap list | Head + Data + Commerce | ระบุ blocker สำคัญ เจ้าของ และแหล่งข้อมูลที่จะใช้ได้ |
| W3–4 · Foundation | กำหนด KPI dictionary, RACI, budget cap, brief และขั้นตอนตรวจคุณภาพ | Data + Function Leads | ผู้เกี่ยวข้องตกลงนิยาม KPI ขอบเขตงบ และผู้ตัดสินใจ |
| W5–8 · Velocity | ทดลอง creative/audience/offer ที่มีสมมติฐานและบันทึกผล | Creative + Media + Commerce | แยกผลจริง/สิ่งที่ยังไม่แน่ชัด และยืนยันคุณภาพ tracking |
| W9–12 · Compound | ขยายเฉพาะวิธีที่มีหลักฐาน พร้อมจัดระบบ retention/referral | Head + Media + CRM | ตรวจ margin, capacity และ cohort ก่อนเพิ่มทรัพยากร |
| วันที่ 85–90 · Review — เพิ่มเติม | สรุปสิ่งที่เรียนรู้ ต้นทุนจริง decision log และแผนรอบหน้า | Head + Data | มีรายงานและรายการงานที่จัดลำดับพร้อม owner |

นี่คือแม่แบบลำดับงาน ไม่ใช่กำหนดเปิดใช้งานจริงหรือคำรับประกันผลใน 90 วัน

## 12. หน้า 13 — Outlook 12 เดือน

| ช่วงจาก G07 | คำอธิบายที่เติม | หลักฐานที่ใช้ทบทวน |
|---|---|---|
| Q1 · Build | ใช้แผน 90 วันสร้างระบบข้อมูล ทีม และวิธีทำงาน | KPI definitions, baseline, RACI และรายงานรอบแรก |
| Q2 · Test | ทดสอบช่องทาง ข้อเสนอ creative และเส้นทางลูกค้า | ผลทดลองที่ระบุข้อจำกัดได้; ต้นทุนและคุณภาพลูกค้า |
| Q3 · Scale | ขยายแนวทางที่ผ่านการประเมินต้นทุนและกำลังรองรับ | Unit economics, workload, service quality และเงินสด |
| Q4 · Compound | ใช้การซื้อซ้ำ referral และความรู้จากการทดลองต่อยอด | Cohort/retention, referral outcomes และแผนปีถัดไป |

ตำแหน่ง Q1–Q4 เป็นกรอบวางแผน เรียนรู้และทดสอบเกิดได้ทุกไตรมาส ทบทวนแผนเมื่อหลักฐานเปลี่ยน ไม่บังคับเพิ่มงบเพียงเพราะถึง Q3

## 13. หน้า 14 — อ่านผลก่อนตัดสินใจ

ข้อความ checklist:

1. Metric นี้ตอบเป้าหมายใด ใช้ event, denominator และหน่วยอะไร
2. เทียบช่วงเวลา ช่องทาง กลุ่มคน และ attribution ที่สอดคล้องกันแล้วหรือยัง
3. ตรวจ tracking, รายการซ้ำ, ยกเลิก/คืนสินค้า และ conversion delay แล้วหรือยัง
4. แยกตัวเลขคน/ครั้ง/คำสั่งซื้อ และลูกค้าใหม่/ลูกค้าเดิมแล้วหรือยัง
5. ROAS แสดงรายได้ต่อค่าแอด; ROI และ contribution ต้องใช้รายการต้นทุนที่ครบตามขอบเขต
6. LTV ระบุฐานและสมมติฐาน พร้อม cohort ที่ติดตามครบช่วง; เกณฑ์ 3 เท่าไม่ใช่คำรับประกัน
7. ผลจากกลุ่มตัวอย่างเล็กหรือการวัดที่ไม่ครบยังไม่พอสรุปสาเหตุ
8. ทุกการตัดสินใจมี owner, หลักฐาน และวันกลับมาตรวจผล

ท้ายหน้าแสดง source index G01–G08 และลิงก์ S01–S10 เพื่อแยกว่าอะไรอยู่ในภาพและอะไรเป็นข้อมูลเสริม

## 14. Mascot และกฎการจัดหน้า

เลือกจากโฟลเดอร์ที่ผู้ใช้ระบุและตรวจภาพจริงแล้ว:

| บทบาท | ไฟล์ | แนวทางใช้ |
|---|---|---|
| Zuri อธิบาย | `output/draft/assets/mascot/zuri-teaching_seed7101.png` | ภาพมีแว่น ผมบ๊อบ และกิ๊บสีส้ม ใช้เป็น guide ซ้ายของกล่องคำแนะนำทุกหน้า |
| น้องวางใจชี้จุดตรวจ | `output/draft/assets/mascot/wangjai.png` | ใช้ภาพ capsule หน้า panel เดิม วางเป็นคู่ด้านขวา ขนาดภาพเล็กกว่า Zuri เพื่อไม่แย่งเนื้อหา |

`zuri-anime-full.png` ที่ตรวจแล้วไม่มีแว่น จึงไม่เลือกเป็นภาพหลัก ส่วนไฟล์ที่ระบุ 3D ไม่ใช้ในงานนี้ตาม brand lock แบบ 2D ภาพ `zuri-teaching` เป็น portrait จึงไม่ใช่การแสดงสัดส่วน full-body คู่กัน; ไม่ยืด ไม่กลับด้าน และไม่สร้างมาสคอตใหม่

ภาพ existing render อาจมีเฉดส้มต่างจาก token: ใช้ asset ตามคำขอใน **draft** และบันทึกข้อจำกัดในการ QC ไม่อ้างว่าได้ redraw หรือผ่าน final colour approval แล้ว UI/logo ต้องใช้ token จริงจาก brand profile

ข้อกำหนดหน้าที่ตรวจได้:

- ทุกหน้า 01–14 มีภาพสองตัวอยู่ในเนื้อหาของหน้านั้นจริง มี alt ที่ระบุ Zuri/น้องวางใจ และมีป้ายชื่อ ไม่ใช้โลโก้ ZURI แทนภาพ Zuri
- แสดงคู่มาสคอตทั้ง desktop/mobile และทุกหน้าพิมพ์; ห้ามซ่อนด้วย breakpoint หรือซ้อนเป็น fixed overlay จนบังข้อความ
- ใช้ wordmark SVG ที่ outline แล้ว กว้างอย่างน้อย 110 px พร้อม clear space ตาม checklist วางบนพื้นขาวที่มี contrast แม้อยู่ใน dark theme
- สีหลักและ typography ยึดแบรนด์: Manrope, IBM Plex Sans Thai, IBM Plex Mono; UI amber `#E8820C` ไม่ใช้สีจากภาพเป็นตัวอ้างอิง
- พื้นขาว/canvas, เส้นตารางและ dot field เบา ๆ ใช้ amber เป็นสัญญาณ; ไม่คัดลอกสี pastel/gradient/องค์ประกอบตกแต่งของภาพอ้างอิง
- ข้อความผู้ใช้อ่านเป็นไทย ศัพท์ metric/framework เป็นอังกฤษตาม text rules; ใช้ `zuri` ใน prose และ `ZURI` สำหรับ wordmark
- แต่ละหน้ามีเลขหน้า ชื่อหมวด สารบัญลิงก์ และกล่อง Zuri อธิบาย / น้องวางใจเตือนที่สัมพันธ์กับหัวข้อ
- Responsive: ไม่มี horizontal overflow ของทั้งหน้า สูตรตัดบรรทัดได้ ตารางอ่านได้บนมือถือ
- Print: แยกหน้าตามหัวข้อ ห้ามตัดคู่มาสคอตออกจากหน้า ถ้าหัวข้อหนึ่งยาวเกินต้องแบ่งหน้าต่อพร้อมคู่มาสคอต ไม่ย่อจนตัวหนังสืออ่านไม่ได้
- ไม่เพิ่ม tagline หรือคำกล่าวอ้างความสามารถใหม่; คำอธิบายการตลาดที่เขียนใหม่มีสถานะ proposed copy ใน draft

## 15. Acceptance และ exit criteria

| ID | เงื่อนไขผ่าน | วิธีตรวจหลังลงมือ |
|---|---|---|
| AC-01 | Metrics เดิม 11 ตัวอยู่ครบ และ G01–G08 มี mapping ชัดเจน | ตรวจเนื้อหาเทียบ source matrix |
| AC-02 | มีครบ 5 หมวด/14 หน้าตามแผน และสารบัญไปยังหน้าถูกต้อง | เปิดลิงก์และตรวจเลขหน้า |
| AC-03 | ทั้ง Zuri และน้องวางใจปรากฏทุกหน้า | ตรวจ DOM/img loaded และภาพแสดงผลทุกหน้า |
| AC-04 | ภาพมาสคอตอ้าง asset จากโฟลเดอร์ที่ระบุ | ตรวจ src/ไฟล์จริง ไม่มีชื่อเก่าหรือภาพฝังเก่า |
| AC-05 | สูตร/หน่วย/ตัวอย่างคำนวณตรง section 5; แยกตัวอย่างสมมติชัดเจน | คำนวณค่าตัวอย่างอิสระและอ่าน copy |
| AC-06 | ไม่อ้าง conversion/ROAS/revenue LTV ว่าเท่ากับกำไร | ตรวจคำอธิบายและข้อควรระวังทุกจุด |
| AC-07 | Budget/KPI/RACI/Roadmap มีข้อความกำกับว่าเป็นแม่แบบ | ตรวจ labels และค่า “รอกำหนด” |
| AC-08 | ตาราง RACI มี A หนึ่งคนต่อแถวและ R อย่างน้อยหนึ่งคน | ตรวจทุกแถว |
| AC-09 | มือถือและ desktop อ่านได้ ไม่มีภาพหายหรือข้อความทับ | ตรวจขนาด 390 px และ 1440 px; light/dark |
| AC-10 | หน้าพิมพ์ไม่มีเนื้อหาถูกตัดและมีคู่มาสคอตครบ | ตรวจ print preview/render ทุกหน้า |
| AC-11 | ตรวจทุกบรรทัดของ `qc/image-checklist.md` | บันทึก PASS/FAIL/N/A พร้อมข้อจำกัด ไม่เปลี่ยน NOT_RUN เป็น PASS |
| AC-12 | เก็บงานทั้งหมดใน draft พร้อม source/QC และ version diff | ตรวจไฟล์ที่เปลี่ยนและสถานะ ไม่ promote เป็น approved |

Exit ของรอบเอกสารนี้: เสนอเนื้อหา/source mapping/asset selection/acceptance ให้ตรวจครบ โดย HTML ยังไม่เปลี่ยน แล้วรออนุมัติเอกสารตาม R5

Exit ของรอบ implementation หลังอนุมัติ: AC-01–AC-12 ผ่านหรือรายงานข้อจำกัดจริง พร้อมอัปเดต campaign brief ให้ตรงสถานะ draft ที่ตรวจแล้ว; ไม่ประกาศ shipping approval แทนมนุษย์

## 16. แหล่งอ้างอิงเสริม

ตรวจวันที่ 25 กันยายน 2026 ใช้ยืนยันนิยามที่ต้องขยายจากภาพ ข้อความตัวอย่าง/การจัดบทบาท/แผนงานเป็นการเรียบเรียงสำหรับคู่มือนี้

- S01 — [Google Ads: CTR](https://support.google.com/google-ads/answer/2615875?hl=en) — นิยามและการตีความตามบริบท
- S02 — [Google Ads: Conversion rate](https://support.google.com/google-ads/answer/2684489/conversion-rate-definition?hl=en-GB) — eligible interactions และ event counting
- S03 — [Google Ads: Conversion tracking data](https://support.google.com/google-ads/answer/6270625?hl=en) — cost per conversion และการแยกตัวชี้วัด
- S04 — [Google Ads: ROI](https://support.google.com/google-ads/answer/1722066?hl=en) — ความสัมพันธ์รายได้ ต้นทุน และผลตอบแทน
- S05 — [Shopify: Customer acquisition cost](https://www.shopify.com/blog/customer-acquisition-cost) — CAC และความต่างระหว่าง revenue LTV กับมูลค่าหลัง gross margin
- S06 — [Shopify: Customer lifetime value analysis](https://www.shopify.com/blog/customer-lifetime-value-analysis) — สูตร AOV × frequency × lifespan; ระบุเป็น revenue model ในคู่มือนี้เพื่อไม่ปนกับ net profit
- S07 — [Shopify: Ecommerce customer acquisition](https://www.shopify.com/blog/ecommerce-customer-acquisition) — contribution และต้นทุนผันแปร
- S08 — [Amplitude: AARRR](https://amplitude.com/blog/pirate-metrics-framework) — นิยาม 5 stages
- S09 — [Atlassian: RACI](https://www.atlassian.com/work-management/project-management/raci-chart) — R/A/C/I และหนึ่ง Accountable ต่อกิจกรรม
- S10 — [Google Ads: Average impression frequency](https://support.google.com/google-ads/answer/9507337?hl=en-GB) — impressions / unique users ภายในขอบเขตเวลาเดียวกัน
- S11 — [Salesforce: MQL vs. SQL](https://www.salesforce.com/blog/mql-vs-sql/) — ความต่างด้านความพร้อมระหว่างการคัดกรองโดย marketing และการรับช่วงโดย sales; เกณฑ์จริงขึ้นกับธุรกิจ
- S12 — `MUJEEN_GTM_M1_Offer_AOV_Lead_Budget_Revision_2026-09-25.md` — ไฟล์ที่ผู้ใช้แนบ; ใช้โครงสร้าง metric/funnel/economics เท่านั้น ไม่ย้ายชื่อสินค้า ข้อเสนอ ราคา targets สมมติฐาน CPL/Conversion งบประมาณ หรือ customer routing ของ Mujeen มาเป็นข้อมูลหรือ benchmark ของ zuri

## 17. Version diff ที่เสนอ

| REV 01 — ปัจจุบัน | REV 02 — เสนอ |
|---|---|
| หน้าเว็บยาว 3 funnel stages + ข้อควรระวัง | 14 หน้าที่แบ่ง 5 หมวด พร้อมสารบัญ |
| Metrics 11 ตัว นิยามและสูตรสั้น | เก็บ 11 ตัวเดิม พร้อมฐาน/หน่วย/ตัวอย่าง และ metrics เสริมที่จำเป็น |
| เนื้อหาเฉพาะ funnel | เพิ่ม AARRR, ทีม, workflow, KPI, Budget, RACI, 90 วัน, 12 เดือน |
| Guide ภาพเดียวท้ายหน้า ชื่อเก่า | Zuri + น้องวางใจจากโฟลเดอร์ที่ระบุทุกหน้า |
| Wordmark พิมพ์เป็นข้อความและ Z วาดเอง | Wordmark SVG ที่ outline แล้ว |
| เกณฑ์อ่านผลบางข้อฟันธง | ระบุขอบเขต สมมติฐาน และสิ่งที่ต้องตรวจประกอบ |
| ไม่แสดง source coverage | Mapping 8 ภาพและแหล่งอ้างอิงเสริม |

### REV 02 → REV 02.1

เพิ่มคำอธิบาย MQL และ SQL ในหน้า Conversion พร้อมวิธีนับ lead ไม่ซ้ำ ตัวอย่าง MQL → SQL rate และแหล่งอ้างอิง S11; ไม่เพิ่มหน้าและไม่เปลี่ยนภาพมาสคอต ทั้ง PDF และผล browser/print checks ที่จัดเก็บไว้ยังอ้างอิง REV 02 เท่านั้น

## 18. REV 02.2 addendum — metrics จากเอกสาร M1

โครงสร้างล่าสุดมี 17 หน้า แบ่ง 6 หมวด; หน้า 14–16 เพิ่มในหมวด E · Commerce & Operations และหน้าอ่านผลย้ายเป็น 17:

| หน้า | Metric additions | วิธีวัด/เงื่อนไขสำคัญ |
|---|---|---|
| 10 · KPI & Budget | Required leads; estimated media budget | ปัดขึ้น target paid orders ÷ lead-to-sale rate; คูณ CPL ที่ตรงกับ offer/cohort เพื่อประมาณ media spend; ใช้เป็นสูตรวางแผน ไม่ใช่เป้าอนุมัติงบ |
| 14 · Lead & Sales Efficiency | Leads, CPL, Qualified CPL, Lead-to-sale rate, Response SLA, Lost reason mix | นับ lead ไม่ซ้ำ; ระบุ MQL/SQL stage; ใช้ lead cohort ที่ครบช่วงติดตาม; แยก human response จาก auto-reply; จัดการ unknown lost reason แยก |
| 15 · Order & Offer Economics | Paid orders, Units per Order, Offer Mix, packaging cost/order | แยก % ของ order กับ % ของ units; order states และ actual cost ใช้ขอบเขตเดียวกัน |
| 16 · Contribution & Returns | Contribution before marketing, Contribution after CAC, Media % of revenue, cancellation/return rates | ต้นทุน/รายได้ต้องใช้ scope เดียวกัน; cancellation และ return ใช้ denominator คนละฐาน; contribution หลัง CAC ยังไม่ใช่ net profit |
| 17 · Inventory & Fulfillment | Sellable stock by SKU, units sold by SKU, inventory velocity, days of inventory, bundle capacity | ระบุ snapshot time, หัก reserved/unavailable stock, กำหนดช่วงคำนวณ velocity และ bundle BOM; ถ้า velocity เป็นศูนย์ days of inventory คำนวณไม่ได้ |

รายการที่มีอยู่แล้ว — AOV, CAC, ROAS, CTR, MQL และ SQL — ให้นำมาใช้ในบริบทใหม่หรือแยกตาม offer/cohort โดยไม่สร้างนิยามซ้ำ ตัวเลข offer, ราคา, 2%/5%/10% conversion scenarios, CPL assumptions, M1 revenue/order/media budgets, segment/routing rules และ SKU counts ในไฟล์อ้างอิงไม่ถูกคัดลอกลงคู่มือ

หน้าใหม่ใช้ page renderer เดิมที่แสดง Zuri และน้องวางใจทุก logical page; PDF และ browser evidence เก่าไม่เปลี่ยนและยังยืนยันเฉพาะ REV 02. Browser/print recheck และการตรวจความสูงจริงของ 18 หน้าเป็นงานที่ยังค้าง.

## 19. REV 02.3 — visual and scenario update

| Before | After |
|---|---|
| Dot pattern was restricted to the cover and obscured by opaque white blocks | Dot field carries across every page; white metric cards keep key reading surfaces clear |
| White cards and small amber labels made the hierarchy hard to see | Amber marks section labels, formula rails, folios and actionable buttons while the page remains mostly white |
| The same two mascot PNGs appeared in the same small boxes on every page | Three reference-based paired poses rotate across pages; art alternates sides, and selected guide blocks sit before the main content |
| No practical “what should I look at?” example or usable next action | Each page has one short scenario and an amber CTA linked to a relevant section; Consideration gives the CTR example and comparison conditions |

New draft illustrations in `output/draft/assets/mascot/`:

- `metrics-pair-chart_gen-04ac9b83.png` — zuri points to a chart; น้องวางใจ identifies a signal.
- `metrics-pair-clipboard_gen-80d72fb8.png` — zuri explains from a clipboard; น้องวางใจ raises a hand.
- `metrics-pair-analysis_gen-d190a201.png` — zuri and น้องวางใจ review a laptop together.

All page guide blocks show both names and the paired image. The examples are instructional, not customer or campaign results. The supplied M1 document remains reference data only; its product instructions and campaign decisions were not adopted. Browser, responsive and print review remain pending for REV 02.3.

## CHANGELOG

| Version | Date | Status | Summary | Commit Hash | Agent |
|---------|------|--------|---------|-------------|-------|
| 1.3.0b | 2026-09-25 | active | เพิ่ม visual hierarchy, mascot poses, สถานการณ์ และ CTA สำหรับ REV 02.3; QC pending | N/A | RWANG |
| 1.2.0b | 2026-09-25 | active | เพิ่ม metrics จากเอกสาร M1 เป็น 4 หน้า Commerce & Operations; browser/print recheck pending | N/A | RWANG |
| 1.1.0b | 2026-09-25 | active | เพิ่ม MQL/SQL และ MQL-to-SQL rate ในหน้า Conversion; browser/print recheck pending | N/A | RWANG |
| 1.0.1b | 2026-09-25 | active | บันทึกการอนุมัติและ implementation: HTML/PDF 14 หน้า พร้อม QC; ยังเป็น draft | N/A | RWANG |
| 1.0.0b | 2026-09-25 | candidate | เสนอ REV 02 พร้อมเนื้อหา 14 หน้า source mapping และคู่มาสคอตทุกหน้า; ยังไม่แก้ HTML | N/A — workspace ไม่มี Git repository | RWANG |
