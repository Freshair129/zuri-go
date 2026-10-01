---
version: "0.3.0"
date: "2026-09-30"
status: implemented-local-runtime-validation-pending
parent: projects/meeting-task-manager/brief.md
baseline: campaign-mission-control@0.2.0; weekly-kanban@0.1
complexity: C-3
risk: HIGH
---

# Meeting & Task Manager — ข้อเสนอสำหรับอนุมัติ

## 1. ผลลัพธ์และคำยืนยัน

นำเสียงประชุมจาก FUNG มาเป็น transcript ที่ตรวจแก้ได้ จากนั้นสร้างร่างงาน ตรวจ RACI/ผู้รับผิดชอบ และนำงานที่ยืนยันแล้วเข้า Weekly To-do ของ Mission Control

อีกทางเข้าที่ใช้งานได้อิสระคือสร้างงานเอง เลือกสมาชิกจากทะเบียน Member และมอบหมายเข้า Weekly To-do โดยไม่ต้องมีเสียงหรือ transcript

**ผู้ใช้ยืนยันแล้ว:** งานอยู่ใน Meeting & Task Manager นี้; ใช้ในเครื่องนี้ก่อนโดยบันทึกชื่อผู้รับผิดชอบ ไม่ต้องมี login ของ Chef/Boss/Tong/K’jeab ในรอบแรก

**คำสั่งเพิ่มเติม:** ต้องเพิ่ม task และมอบหมายแบบ manual ได้ มีทะเบียน Member แบบง่าย ช่องรายละเอียดที่เติมภายหลังได้ และ priority แบบ MoSCoW

[ASSUMPTIONS]

1. “โดเมน” หมายถึงโมดูลการทำงานในแอป Mission Control เดิม ไม่ใช่ชื่อ DNS ใหม่
2. การแก้ transcript ในโมดูลนี้เป็นฉบับตรวจแก้สำหรับสร้างงาน เก็บต้นฉบับ FUNG และประวัติแก้ไว้ ไม่เขียนทับต้นฉบับใน FUNG โดยอัตโนมัติ
3. ใช้ FUNG Desktop ที่ผู้ใช้เปิดอยู่บนเครื่องเดียวกันเป็นที่เก็บเสียงและรันโมเดล local; การเปิดใช้ connector ต้องมาจากการตั้งค่าจริง ไม่ใส่สถานะ Connected จำลอง
4. Weekly seed เป็นรายการที่วางแผนไว้ ไม่ใช่สถานะว่าทุกงานยังไม่เริ่ม; due date และ A ยังว่าง C/I และเกณฑ์ปิดงานยังเป็นข้อเสนอ
5. “รายละเอียดที่กรอกภายหลังได้” ครอบคลุมรายละเอียดงานและข้อมูลเสริมของ Member; ชื่องาน/ชื่อที่ใช้แสดงยังจำเป็นตอนสร้าง
6. MoSCoW ใช้กับสัปดาห์ที่เลือกเพื่อให้ “Won’t have this time” มีรอบเวลาชัดเจน งานที่ยังไม่เลือกสัปดาห์/priority บันทึกก่อนได้โดยแสดงรอยืนยัน

ข้อ 2–3 เป็นส่วนของแบบที่ขออนุมัติ ไม่อ้างว่าเป็นความสามารถที่เชื่อมแล้ว

## 2. การจัดหน้าจอ

เพิ่มตัวเลือกโดเมนใน authored content ของแอป โดยคง protected shell, app ID, theme controls และหน้า campaign เดิม ใช้ public component/tab API ของแอป ไม่สร้าง top bar ทับของเดิม

```text
Mission Control
  Marketing                    [หน้าปัจจุบัน]
    Overview / Performance / Plan & Gates / Workboard / Review
  Meeting & Task Manager        [โดเมนใหม่]
    Weekly To-do                [หน้าแรกของโดเมน]
    Meetings
      Transcript Review        [รายละเอียดของประชุมที่เลือก]
      Action Review            [ร่างงานจากประชุมนั้น]
    Tasks                       [รายการงานในโดเมน + RACI]
    Members                     [ลงทะเบียน / แก้ไข / ปิดใช้งานสมาชิก]
    FUNG connection             [แผงตั้งค่าการเชื่อมต่อ]
```

Business Overview แบบรวมหลายแคมเปญเป็นคำขอก่อนหน้าที่แยกจากสเปกนี้ ไม่ใช้การเพิ่มโดเมนนี้เป็นหลักฐานว่าหน้านั้นสร้างแล้ว

### Weekly To-do

- เลือกสัปดาห์ตาม Asia/Bangkok จันทร์–อาทิตย์; seed อยู่ใน 28 ก.ย.–4 ต.ค. 2026
- มี Kanban / List / RACI สำหรับชุดงานเดียวกัน; RACI ไม่สร้างสำเนางาน
- คง 4 คอลัมน์ของร่าง: งานสัปดาห์นี้ → กำลังทำ → รอตรวจรับ → เสร็จแล้ว
- เพิ่มช่อง “ติดขัด” เมื่อมีงาน Blocked เพื่อให้เห็นปัญหา; ไม่ซ่อนงาน Blocked ใน Done หรือใช้การเปลี่ยนสัปดาห์แทนสถานะ
- งานเริ่มต้นทั้ง 5 อยู่ใน “งานสัปดาห์นี้” พร้อม “สถานะรอยืนยัน”; ไม่แสดงเป็น 0% progress จริง
- การ์ดแสดงชื่อ, R, A หรือรอยืนยัน, ป้าย MoSCoW ของสัปดาห์ที่เลือกหรือ “ยังไม่จัดลำดับ”, วันส่งถ้ามี, แหล่งงาน Manual/Weekly plan/Meeting และ blocker ถ้ามี
- กดการ์ดเปิดรายละเอียด: ช่องรายละเอียดงานที่เติม/แก้ภายหลังได้, RACI, MoSCoW, เกณฑ์ปิดงาน, dependency, source quote/timecode, หลักฐานและประวัติสถานะ
- Kanban / List / RACI ใช้ตัวกรอง MoSCoW ชุดเดียวกัน; แสดงป้ายข้อความเต็มร่วมกับสีตาม brand tokens เพื่อไม่ให้ต้องอ่านจากสีเพียงอย่างเดียว
- ย้ายด้วย drag-and-drop และเมนูสถานะสำหรับคีย์บอร์ด/จอสัมผัส; แสดง “บันทึกแล้ว” หลัง durable write สำเร็จ
- การยกงานไปสัปดาห์ถัดไปเพิ่ม weekly membership ที่อ้าง task ID เดิม ไม่ clone งานหรือ reset ความคืบหน้า; เก็บ priority ของรอบเก่าและให้เลือกรอบใหม่ตามกติกา MoSCoW ด้านล่าง
- CTA หลัก: “เพิ่มงาน”; CTA รอง: “นำเข้างานจากประชุม”

### Meetings

- แสดงชื่อประชุม, วันเวลา, FUNG recording reference, ความยาวเมื่อทราบ, สถานะ transcript, จำนวนร่าง/งานที่สร้างจริง
- รับการประชุมจาก FUNG recording picker; เพิ่มชื่อประชุมและวันที่จริงโดยไม่ใช้เวลา import แทนเวลาประชุม
- “อัปโหลดเสียงไป FUNG” ใช้ import/job API เดิม ส่งเฉพาะเมื่อผู้ใช้เลือกไฟล์และสั่งนำเข้า
- แยก Uploading / Transcribing / Ready / Failed ตาม response จริง; ไม่มีเปอร์เซ็นต์จำลอง
- ประชุมที่ไม่มีเสียงพูดหรือ transcript ไม่ครบต้องแสดงข้อจำกัดก่อนการสร้างร่างงาน
- ทำงานกับประชุมที่ import ไว้แล้วได้เมื่อ FUNG ปิด; เล่นเสียงหรือขอโมเดล local ไม่ได้จน reconnect

### Transcript Review

ข้อความใน wireframe ต่อไปนี้เป็นตัวอย่างสมมติสำหรับอธิบายหน้า ไม่ใช่ transcript ที่ถอดเสียงจริงในรอบนี้

```text
ชื่อประชุม / วันที่ / ฉบับต้นทาง / สถานะการตรวจ          [สร้างร่างงาน]
-----------------------------------------------------------------
ช่วงเวลา + ผู้พูด + ข้อความที่แก้ได้             | รายละเอียดข้อความ
00:12  Speaker 1   “Chef ช่วยเลือกแบบเว็บ...”    | ต้นฉบับ / ฉบับแก้
00:46  Speaker 2   “Boss ดู metrics...”          | ประวัติแก้ / ผูกชื่อ
-----------------------------------------------------------------
เล่นเสียงช่วงที่เลือกเมื่อ FUNG เชื่อมต่อ           [บันทึกฉบับตรวจแล้ว]
```

- ต้นฉบับเป็น read-only; แก้ข้อความและชื่อผู้พูดใน working revision มี diff และประวัติ
- ช่วงเวลา/segment ID ยึดต้นทาง ไม่แก้ timecode เพื่อให้ข้อความที่แก้ดูเหมือนมาจากช่วงอื่น
- บันทึกฉบับตรวจแล้วก่อนสร้างร่าง; autosave draft ไม่เท่ากับ reviewed
- การผูก Speaker 1 กับ Chef เป็นการระบุผู้พูด ไม่ได้หมายความว่า Chef เป็นผู้รับผิดชอบทุกประโยคที่พูด
- หากต้นทาง FUNG เปลี่ยนหลัง import แสดง “มีฉบับใหม่” พร้อม diff ให้เลือก ไม่ทับการแก้หรือเปลี่ยนงานเดิมอัตโนมัติ
- ใช้ query ตาม recording ที่เลือกเท่านั้น; ไม่อ่านทุกประชุมในเครื่องเข้าโมเดล

### Action Review

- แสดงแต่ละร่างเป็นชื่อสิ่งที่ต้องทำ, รายละเอียด/สิ่งส่งมอบที่แก้ได้, quote/timecode, R ที่เสนอ, A, C/I, วันส่ง, MoSCoW ที่ผู้ใช้เลือก และข้อมูลที่ยังไม่ชัด
- แยก “งาน”, “การตัดสินใจ” และ “คำถาม/ประเด็นค้าง”; เฉพาะรายการที่ผู้ใช้เลือกเป็นงานจึงส่งเข้า task manager
- AI เสนอชื่อได้ แต่ชื่อไม่ตรง/กำกวมคง unresolved; วันที่อย่าง “วันศุกร์” ต้องแสดงวันที่ที่ตีความจากวันประชุมและให้แก้ก่อนใช้
- เลือก สร้างงานใหม่ / ผูกกับงานที่มี / ไม่สร้าง พร้อมแก้ชื่อ ผู้รับผิดชอบ และ week ก่อนยืนยัน
- CTA “สร้างและมอบหมาย N งาน” แสดงรายการและผู้รับผิดชอบที่จะบันทึก; ในโหมด local หมายถึงบันทึกชื่อ ไม่ใช่ส่งข้อความหาทีม
- เมื่อโมเดลไม่พร้อม แสดงเหตุผลจริงและอนุญาตสร้างงานจากข้อความที่เลือกด้วยตนเอง โดยติดป้าย Manual
- draft เก่าที่อ้าง reviewed revision ก่อนหน้าเป็น Stale และใช้สร้างงานไม่ได้จนตรวจ/สร้างร่างใหม่
- หลัง commit แสดง task ID ที่สร้างสำเร็จและลิงก์ไป Weekly To-do; retry ต้องไม่สร้างซ้ำ
- ช่องรายละเอียดและ MoSCoW เติมภายหลังได้โดยไม่เปลี่ยน source quote/timecode; AI ไม่กำหนด priority ให้เอง งานจาก FUNG เริ่ม “ยังไม่จัดลำดับ” จนผู้ใช้เลือก

### Tasks / RACI

- เป็นรายการงานในโดเมนนี้ทั้งหมด เลือกสัปดาห์, R, สถานะ และ MoSCoW ได้; งานที่ยังไม่ลงสัปดาห์แสดง “ยังไม่กำหนดรอบ”
- เลือกผู้รับผิดชอบจากทะเบียน Member ตั้งต้น Chef, Boss, Tong, K’jeab; ชื่อซ้ำไม่ถูก merge อัตโนมัติ ข้อมูลติดต่อที่ยังไม่ทราบคงว่าง
- R คือ PIC หลัก 1 คนต่อหนึ่งงานในรอบนี้; A เป็นคนรับผิดชอบสุดท้าย/ผู้ตรวจรับ 0 หรือ 1 คนระหว่างร่าง และต้องยืนยัน 1 คนก่อน Done; C/I เป็นรายชื่อได้หลายคน
- การเปลี่ยน R/A และสถานะมีบันทึกเวลาและผู้แก้แบบ local ซึ่งไม่ใช่ audit ที่ยืนยันตัวบุคคลด้วย login
- สามารถสร้าง Backlog ได้เมื่อ A/due ยังไม่ทราบ โดยแสดงช่องที่ยังไม่ครบ
- Done ต้องมี R, A ที่ยืนยัน, เกณฑ์รับงานและหลักฐาน; due date ที่ไม่เคยตกลงยังว่างได้
- KPI recheck ใช้กับงานที่ผูก KPI/แคมเปญเท่านั้น; งานจัดประชุมหรือเลือกแบบเว็บไม่ถูกบังคับให้สร้าง KPI ปลอม
- Task progress ไม่เท่ากับผล KPI; ไม่รวม meeting action counts เป็นยอดขายหรือผลแคมเปญ

### Manual task — เพิ่มและมอบหมายเอง

```text
[เพิ่มงาน]
ชื่องาน*                   รายละเอียดงาน (กรอกภายหลังได้)
สิ่งส่งมอบ (ถ้าทราบ)        [เปิดรายละเอียดเพิ่มเติม]
R: เลือก Member            A: เลือก Member หรือรอยืนยัน
C / I: เลือกได้หลายคน       [เพิ่มสมาชิกใหม่]
สัปดาห์                    วันส่ง (ถ้ามี)
MoSCoW (ยังไม่จัดลำดับ)      สถานะ / เหตุที่ติดขัด
เกณฑ์รับงาน                Project / Campaign (ถ้าเกี่ยวข้อง)
                                      [บันทึกงาน]
```

- เข้าจาก Weekly To-do หรือ Tasks ได้ทั้งคู่; form และ record type เดียวกัน
- ชื่องานจำเป็น; ผู้รับผิดชอบ/วันส่ง/A ที่ยังไม่ทราบคงว่างและบันทึก Backlog ที่มีป้าย “ยังไม่มอบหมาย” ได้
- รายละเอียดงานเป็นช่องข้อความหลายบรรทัดแบบ optional; เว้นว่างแล้วบันทึกได้ มีข้อความช่วย “กรอกภายหลังได้” และเปิดมาเติม/แก้ได้จาก task detail โดยใช้ task ID เดิม
- การบันทึกหรือแก้รายละเอียดไม่บังคับให้กรอก A/due/เกณฑ์รับงานทุกช่องพร้อมกัน; validation ของ Done ยังทำเฉพาะเมื่อจะปิดงาน การปล่อยรายละเอียดว่างไม่ถูกแทนด้วยข้อความสมมติ
- เมื่อเลือก R และกดบันทึก ระบบอ้าง `memberId` ของคนที่เลือก ไม่เก็บแต่ชื่อและไม่สุ่มเลือกคนแทน
- ให้เพิ่ม Member แบบย่อจาก dropdown แล้วกลับมาสร้างงานต่อ โดยยังไม่สร้าง task จนกดบันทึกงาน
- ใช้ MoSCoW แทน priority เดิม Low / Normal / High; ค่าเริ่มต้น “ยังไม่จัดลำดับ” ไม่เลือก Must หรือ Should ให้อัตโนมัติ เลือกสัปดาห์ก่อนบันทึก priority ของรอบนั้น
- แก้รายละเอียด เปลี่ยนผู้รับผิดชอบและสถานะได้ พร้อมบันทึกการเปลี่ยนแปลง local
- งาน manual ใช้ task store/validation/Weekly/RACI เดียวกับงานจากประชุม มี `sourceKind=manual` และไม่มี meeting/evidence reference ปลอม
- เลือกข้อความประชุมมาสร้างงานเองได้เป็น `sourceKind=manual-from-meeting` พร้อม quote/timecode จริง
- การมอบหมายรอบนี้คือการบันทึกชื่อสมาชิกในเครื่อง ไม่ส่ง email/LINE หรือสร้าง invite

### MoSCoW — ลำดับความสำคัญของงานในรอบนี้

นิยามอ้างอิง [Agile Business Consortium: MoSCoW](https://www.agilebusiness.org/resource/what-is-moscow-prioritization/) ส่วนการผูกสัปดาห์และพฤติกรรมหน้าจอด้านล่างเป็นแบบสำหรับ Mission Control นี้

| ค่า | ป้ายที่แสดง | ความหมายสำหรับสัปดาห์ที่เลือก |
|---|---|---|
| `must` | Must have — ต้องทำ | ขาดงานนี้แล้วเป้าหมายหลักของรอบนี้ไม่สำเร็จ |
| `should` | Should have — ควรทำ | สำคัญ แต่ยังมีทางแก้ชั่วคราวหากทำไม่ทัน |
| `could` | Could have — ทำได้ถ้ามีเวลา | เพิ่มคุณค่าเมื่อทรัพยากรเหลือหลังงานจำเป็น |
| `wont` | Won’t have this time — ไม่ทำในรอบนี้ | ตกลงไม่นำมาทำในรอบนี้ และเก็บไว้พิจารณารอบถัดไป |
| `null` | ยังไม่จัดลำดับ | ยังไม่ได้ตัดสินใจ; ไม่ใช่หมวด MoSCoW ที่ห้า |

- ใช้ชุดเดียวกันทั้ง Manual task, งานจาก FUNG, task detail, List/RACI และ Kanban; priority แยกจากสถานะงาน วันส่ง และ RACI
- ผู้ใช้เปลี่ยน priority พร้อมหมายเหตุเหตุผล optional ได้ภายหลัง และมีประวัติการเปลี่ยนแปลง local; ไม่มี scoring หรือสัดส่วนบังคับในรอบนี้
- เมื่อเปิดตัวเลือก “เรียงตาม MoSCoW” เรียง Must → Should → Could แล้วรายการรอจัดลำดับ; รักษาลำดับเดิมภายในกลุ่มเดียวกัน ไม่ใช้ priority เปลี่ยนสถานะหรือ due date
- Won’t แสดงในส่วน “ไม่ทำในรอบนี้” ที่เห็นได้พร้อมจำนวน ไม่ลบ ไม่ย้ายเป็น Done และไม่ถือว่าถูกยกเลิก; รายการทั้งหมดรวมถึง Won’t ยังเข้าถึงได้จาก List/ตัวกรอง
- ตัวสรุปความคืบหน้า “งานที่เลือกทำรอบนี้” นับเฉพาะ Must/Should/Could และแสดงจำนวนรอจัดลำดับ/Won’t แยก ถ้ายังไม่ได้จัดลำดับเลยให้แสดง “ยังไม่จัดแผน” ไม่แสดง 0% เป็นข้อสรุปผลงาน
- ค่าของแต่ละสัปดาห์อยู่บน weekly membership ของ task เดิม; ยกงานไปรอบใหม่แล้วเริ่ม “ยังไม่จัดลำดับ” ให้เลือกอีกครั้ง โดยดูค่ารอบเก่าได้และไม่แก้ประวัติรอบเก่า
- ไม่มีสัปดาห์ยังบันทึกงานเป็น Backlog ได้; ช่อง MoSCoW แสดง “เลือกสัปดาห์ก่อนจัดลำดับ” ไม่มี priority ถาวรอีกชุดให้ขัดกับค่ารายสัปดาห์
- งาน seed ทั้ง 5 และงานจาก FUNG ที่ยังไม่ได้ตัดสินใจคง `null`; ไม่แปลง Low/Normal/High ของ legacy campaign เป็น MoSCoW โดยอัตโนมัติ

### Members — ทะเบียนสมาชิกแบบง่าย

| ช่อง | การกรอก / การใช้ |
|---|---|
| Member ID | ระบบสร้างคงที่ ไม่ให้ผู้ใช้แก้ และไม่ใช่รหัส login |
| ชื่อที่ใช้แสดง | จำเป็น; ใช้เลือกผู้รับผิดชอบบน task |
| ชื่อ–นามสกุล | ไม่บังคับ; เว้นว่างได้เมื่อรู้เพียงชื่อเล่น |
| ชื่อเล่น | ไม่บังคับ |
| ตำแหน่ง / ทีม | ไม่บังคับ; ใช้แสดงรายละเอียด ไม่ใช่สิทธิ์เข้าถึง |
| Email / เบอร์ติดต่อ | ไม่บังคับ; ตรวจรูปแบบเมื่อกรอก เบอร์เก็บเป็นข้อความเพื่อรักษาเลข 0 นำหน้า |
| รายละเอียดเพิ่มเติม / หมายเหตุ | ข้อความหลายบรรทัด ไม่บังคับ; เว้นไว้แล้วเติม/แก้ภายหลังได้ |
| สถานะ | Active / Inactive; ค่าเริ่มต้น Active สำหรับรายการใหม่ |
| วันที่สร้าง / แก้ไข | ระบบบันทึกเวลา local |

- เพิ่ม ดูรายละเอียด แก้ไข และปิดใช้งาน/เปิดใช้งานสมาชิกได้
- ลงทะเบียนด้วยชื่อที่ใช้แสดงอย่างเดียวได้; ข้อมูลเสริมทุกช่องเติมภายหลังจาก Member detail โดยคง memberId และงานที่มอบหมายไว้เดิม
- ชื่อซ้ำแสดงรายละเอียดตำแหน่ง/ทีมและ ID ให้แยกคน; เตือนตรวจรายการเดิมก่อนบันทึก แต่ไม่ merge คนให้อัตโนมัติ
- Active members เลือกเป็น R/A/C/I ของงานใหม่ได้ สมาชิก Inactive ยังคงอยู่ในประวัติและงานเก่า; แสดงป้ายให้เปลี่ยนผู้รับผิดชอบเมื่อจำเป็น
- เปลี่ยนชื่อแล้ว task ยังอ้างคนเดิมด้วย memberId; ปิดใช้งานสมาชิกไม่ลบงานหรือทิ้งประวัติ RACI
- สมาชิกตั้งต้น 4 คนมีเฉพาะชื่อที่ผู้ใช้ให้ ช่องอื่นว่าง ไม่เดา email/เบอร์/ตำแหน่ง
- การมีชื่อในทะเบียนหรือการบันทึกผู้ตรวจรับเป็น local record ไม่ใช่หลักฐานว่าบุคคลนั้น login หรือกดอนุมัติด้วยตนเอง
- Member/contact data ไม่ส่งเข้า FUNG/model prompt; การจับคู่ชื่อจาก transcript ใช้ชื่อ/ชื่อเล่นที่ยืนยันในเครื่องเท่านั้น

## 3. Weekly seed ที่ต้องนำเข้า

รายการตรวจได้ใน [meeting-task-manager-weekly-seed.json](../../product/meeting-task-manager-weekly-seed.json) *(historical link: the file was not carried into this repository; PLAN-001 WI-16)*; ชื่องานและ PIC มาจากผู้ใช้ C/I/สิ่งส่งมอบใช้ร่างเดิม

| ID | งาน | R ยืนยัน | A | C/I |
|---|---|---|---|---|
| W40-01 | เลือกแบบเว็บไซต์ MUJEEN | Chef | รอยืนยัน | ข้อเสนอเดิม |
| W40-02 | Campaign marketing metrics | Boss | รอยืนยัน | ข้อเสนอเดิม |
| W40-03 | Data pipeline & tracking | Tong | รอยืนยัน | ข้อเสนอเดิม |
| W40-04 | สรุป / ตัด requirements จาก Canva | K’jeab | รอยืนยัน | ข้อเสนอเดิม |
| W40-05 | Marketing plan | Chef | รอยืนยัน | ข้อเสนอเดิม |

- ไม่กำหนด A เป็น Boss โดยอัตโนมัติ และไม่สร้าง due date ขึ้นเอง
- ไม่ผูกทั้ง 5 งานกับ campaign ที่กำลังเปิดโดยอัตโนมัติ; “เลือกแบบเว็บไซต์ MUJEEN” มี project label ที่ทราบ แต่ campaign relation ต้องเลือกจริง
- W40-04 คงลิงก์ Canva และข้อให้แยกวิหารเซียน/MUJEEN กับ Etoh Cols ตามที่ตรวจไว้ในร่างเดิม
- รัน seed ครั้งแรกตาม namespace `weekly-plan:2026-09-28:v1`; เปิดแอปใหม่/นำเข้า seed ซ้ำต้องไม่เพิ่มงานหรือทับรายการที่แก้แล้ว
- ไม่อ่านสถานะที่เคยทดสอบใน visualization มาถือเป็นสถานะงานจริง
- `description`, `priority` และ `priorityNote` ใน seed คง `null`; ข้อเสนอสิ่งส่งมอบ/เกณฑ์รับงานเดิมยังแสดงเป็น proposed ไม่ใช้แทนรายละเอียดที่ผู้ใช้กรอก โดย `priority`/`priorityNote` นำไปเก็บบน membership ของสัปดาห์นี้

## 4. เจ้าของข้อมูลและผลกระทบ

รายละเอียดใน [architecture](design.md)

| ข้อมูล | เจ้าของ | ผลกระทบ |
|---|---|---|
| เสียง / ASR / native transcript | FUNG | ใช้ API; ไม่อ่านไฟล์ DB หรือแก้ตารางจาก Mission Control |
| Imported source snapshot | Meeting & Task Manager | สำเนาที่อ้าง recording และ hash/revision ชัดเจน |
| ฉบับตรวจแก้เพื่อสร้างงาน | Meeting & Task Manager | เป็น revision ใหม่ ต้นฉบับไม่ถูกทับ |
| Task, RACI, weekly membership | Meeting & Task Manager | งานจากประชุมและ weekly ใช้ task ID เดียว |
| Campaign records และงานเดิมใน Workboard | แอป campaign เดิม | เก็บข้อมูลเดิม; รอบนี้ไม่ย้ายหรือคัดลอกงานเก่าทั้งชุด |

งานใหม่ในโดเมนนี้ที่ผูก campaign สามารถแสดงเป็น linked task ใน campaign Workboard โดยอ่านจากโดเมนต้นทาง ไม่บันทึก task สำเนาอีกชุด ประวัติ review snapshots เก่ายังคงเป็น snapshot เดิม

การเพิ่มโดเมนนี้ไม่แก้สูตร metric, target/cutoff, offer rollout หรืออนุมัติข้อเสนอ visual v0.3 ทั้งชุด

## 5. Requirement register และ acceptance

| ID | Requirement | Acceptance / หลักฐานที่จะต้องมี |
|---|---|---|
| MT-01 | Domain navigation | เข้า Weekly, Meetings, Tasks และกลับ campaign views ได้; app ID/ธีม/ข้อมูลเดิมคงอยู่ |
| MT-02 | Weekly seed | มี 5 งาน PIC ตรง; seed ซ้ำไม่เพิ่ม/ทับ; A/due ว่างและ C/I marked proposed |
| MT-03 | Kanban | เมนูและ drag เปลี่ยนสถานะเดียวกัน; refresh แล้วคงอยู่; save error ไม่แจ้งสำเร็จ |
| MT-04 | RACI | A ไม่เกินหนึ่ง; unknown names ไม่กลายเป็น verified person; Done ตรวจเกณฑ์จริง |
| MT-05 | Local FUNG connection | ใช้ connect URL ของเครื่องนี้; token หมดอายุ/offline แสดงแยกกัน; connect หลัง auth สำเร็จจริง |
| MT-06 | Audio intake | ไฟล์ที่เลือกเข้า import/job API; failed/empty transcript ไม่เป็น Ready; retry ไม่อ้างว่าสำเร็จโดยไม่มี receipt |
| MT-07 | Transcript provenance | มี source ID, recording ID, timecode, source mode, revision/hash; ไม่มีการอ้าง legacy payload เป็น native revision |
| MT-08 | Review | แก้แล้วมี diff/revision; raw ไม่เปลี่ยน; source refresh ไม่ทับ review; stale draft ถูกหยุด |
| MT-09 | Action extraction | ใช้ configured local model จริง; schema invalid/no model เป็น error; manual action labeled Manual |
| MT-10 | Evidence | ทุก AI task proposal มี quote/span ที่ตรวจตรงกับ reviewed revision; ไม่อ้างอีกประชุม |
| MT-11 | Assignment | ตรวจ R และรายการก่อน commit; ชื่อผู้พูดไม่ถูกยกเป็นผู้รับผิดชอบโดยอัตโนมัติ |
| MT-12 | Idempotency | replay/retry batch เดิมคืน task IDs เดิม; transcript เปลี่ยนเสนอ diff ไม่สร้าง task เพิ่มเงียบ ๆ |
| MT-13 | Persistence | tasks + import receipt commit เป็น transaction เดียว; restart หลังสำเร็จไม่สูญ; failure ไม่ทิ้งครึ่ง batch |
| MT-14 | Backup / restore | export/restore ทั้งโดเมนโดยไม่รวม secret/audio; รองรับ campaign backup v1 โดยไม่ล้าง domain data |
| MT-15 | Scope / source handling | เนื้อหา transcript เป็นข้อมูล ไม่ใช้เป็นคำสั่งเรียก tool, ส่งข้อความ หรือเปลี่ยน destination |
| MT-16 | Campaign link | linked task แสดง ID เดียวกัน; campaign metrics/release behavior และ legacy tasks ไม่เปลี่ยน |
| MT-17 | UI / brand | มือถือ/desktop ใช้ได้, keyboard ย้ายได้, amber/dots/outlined logo และ mascot ทั้งคู่ทุก logical view |
| MT-18 | End-to-end | เลือกเสียงทดสอบ → FUNG → แก้ transcript → extract → ยืนยันชื่อ → weekly task → reload → source link ใช้งานได้ |
| MT-19 | Manual task | ปิด FUNG แล้วยังสร้างงานเอง/เลือก R/กำหนดสัปดาห์/แก้ไข/reload ได้; ไม่มี fake meeting reference |
| MT-20 | Member registration | ชื่อว่างถูกปฏิเสธ; สร้างสมาชิกชื่ออย่างเดียวได้; optional fields เก็บตามที่กรอกและไม่มีข้อมูลแต่งเติม |
| MT-21 | Member assignment | task เก็บ memberId; R/A/C/I เลือกจากทะเบียน; draft unassigned ไม่กลายเป็น assigned เงียบ ๆ |
| MT-22 | Member lifecycle | rename คง task reference; Inactive ไม่อยู่ในตัวเลือกงานใหม่; งานเก่า/ประวัติยังอยู่; เปิดใช้คืนได้ |
| MT-23 | Member backup / seed | seed 4 members/5 tasks ซ้ำไม่เพิ่มหรือทับข้อมูลแก้แล้ว; export/restore คง references และไม่ merge ชื่อซ้ำผิดคน |
| MT-24 | Local member boundary | task/member CRUD ไม่ต้องมี provider; ไม่ส่ง contact/notification/invite อัตโนมัติ; storage error ไม่แจ้งบันทึกสำเร็จ |
| MT-25 | Fill details later | สร้าง task/member ด้วยชื่ออย่างเดียวได้; เปิดเติม/แก้รายละเอียดภาษาไทยหลายบรรทัดแล้ว reload คงค่าและ ID/RACI เดิม; ช่องว่างไม่ถูกเติมเอง และ Done ยังตรวจเกณฑ์เดิม |
| MT-26 | MoSCoW values | Manual/FUNG/detail ใช้ must/should/could/wont/null ชุดเดียว; งานใหม่/seed ไม่ถูกจัด priority อัตโนมัติ; ค่าอื่นถูกปฏิเสธ ไม่แปลง priority legacy |
| MT-27 | Priority views / Won’t | badge/filter/sort ใน Kanban/List/RACI ตรงกัน; Won’t ยังเปิดแก้ได้ สถานะไม่เปลี่ยนเป็น Done และตัวสรุปรอบนี้แยก Won’t/รอจัดลำดับ |
| MT-28 | Priority per week | task เดียวมี priority ต่างรอบได้; carryover คง ID/status/รายละเอียดและ priority รอบเก่า รอบใหม่ null; มีประวัติเมื่อผู้ใช้แก้ และ Backlog ไม่มีสัปดาห์ยังบันทึกได้ |
| MT-29 | Details / priority persistence | export/restore คงรายละเอียด Member/Task, weekly priority/note และ references; seed ซ้ำไม่ทับค่าที่เติมแล้ว; save failure ไม่อ้างสำเร็จ |

ไม่มีการอ้าง MT-01–29 ว่าผ่านในเอกสารรอบนี้ ต้องมีผลจาก implementation จริงก่อนปิดงาน

## 6. แผนทำหลังอนุมัติ

1. เพิ่ม domain model, local repository, Members, Manual task, รายละเอียดที่เติมภายหลังได้ และ Weekly To-do/RACI/MoSCoW พร้อม seed → ตรวจ MT-01–04, MT-13–14, MT-19–29 และข้อมูล campaign เดิม
2. เพิ่ม FUNG connector และ transcript review → ตรวจ MT-05–08 ด้วย fixture ก่อนทดสอบ FUNG เครื่องจริง
3. เพิ่ม contract/adapter ของ local action drafting ที่ FUNG ยังไม่มี และ Action Review → ตรวจ MT-09–12, MT-15
4. เชื่อม task detail/weekly/campaign link, ตรวจ responsive/brand และ end-to-end → ตรวจ MT-16–18 พร้อม documentation และ regression ที่เกี่ยวข้อง

งาน FUNG ต้องทำจาก checkout ที่แยกจากงานค้างและผ่านกติกาของ FUNG; ไม่แก้ source ใน working tree ที่ตรวจพบว่ามีงานค้าง คำสั่ง validation จริงกำหนดจาก repo ณ เวลา implementation

## 7. Version diff และสถานะ

| ก่อน | หลังอนุมัติ/implementation ตามข้อเสนอนี้ |
|---|---|
| Inline Kanban 5 งาน | Weekly To-do แบบเก็บสถานะในโดเมน |
| Campaign Workboard ใช้ owner string | โดเมนใหม่มี local people + RACI; legacy ไม่ถูก rewrite |
| ไม่มี meeting intake ใน Mission Control | FUNG recording/audio import และ snapshot มี provenance |
| ไม่มี transcript review ใน Mission Control | Working/reviewed revisions และ source diff |
| ไม่มี action review/commit | ร่างงานจาก local model, human review และ transaction receipt |
| ยังไม่มีทะเบียนสมาชิก | Member registration/edit/inactive และ local assignment ด้วย memberId |
| ยังไม่มี manual task ในโดเมนใหม่ | เพิ่มและมอบหมายเองได้โดยไม่ต้องเชื่อม FUNG |

v0.1 → v0.2: เพิ่ม Manual task, Member registry, รายละเอียดฟอร์ม, member lifecycle, member seed และ acceptance MT-19–24 ตามคำสั่งเพิ่มเติม

v0.2 → v0.3: ระบุการสร้างด้วยชื่อแล้วเติมรายละเอียดภายหลัง; เปลี่ยน Low/Normal/High เป็น MoSCoW รายสัปดาห์; เพิ่ม badge/filter/sort, Won’t ที่เก็บงานไว้, seed priority ว่าง และ acceptance MT-25–29

**สถานะส่งมอบรอบเอกสาร:** ตรวจ source และจัดสเปกแล้ว; ยังไม่ได้แก้ source แอป, เรียก FUNG ที่รันจริง, seed ข้อมูลลง browser หรือ deploy

**เกณฑ์ออกจากรอบเอกสาร:** เจ้าของงาน/โหมด local ยืนยันแล้ว, parent/peer/source references ตรวจได้, requirement trace ครบ 5 งาน, contract gaps ระบุชัด และผู้ใช้อนุมัติสเปกก่อนเริ่ม code

## 8. ผลตรวจเอกสาร v0.2 — 30 กันยายน 2026

- PASS: JSON อ่านได้, task IDs ไม่ซ้ำ 5 รายการ, member seed IDs ไม่ซ้ำ 4 รายการ
- PASS: PIC ทั้ง 5 ตรงผู้ใช้และอ้าง member seed ที่ถูกคน
- PASS: A, due date, campaign relation และรายละเอียดติดต่อที่ยังไม่ได้รับคงว่าง
- PASS: ลิงก์เอกสาร local 6 จุด resolve ได้; เอกสารหลักทั้ง 3 ไฟล์ใช้ v0.2.0-proposal / pending-document-approval ตรงกัน
- PASS: acceptance register ครบ MT-01–24 รวม manual/member lifecycle และกรณี FUNG ไม่พร้อม
- NOT_RUN: runtime, model extraction, audio, UI และ integration tests เพราะรอบนี้เป็นเอกสารก่อน implementation

## 9. ผลตรวจเอกสาร v0.3 — 30 กันยายน 2026

- PASS: brief/spec/architecture ใช้ v0.3.0-proposal / pending-document-approval ตรงกัน; C-3 / HIGH เดิมคงอยู่
- PASS: local document links 6 จุด resolve ได้ และ acceptance IDs ครบ MT-01–29 ไม่ซ้ำ
- PASS: weekly seed มี 5 task IDs และ 4 member IDs ไม่ซ้ำ; PIC/member references ตรงเดิมและข้อมูลเดิมทุกช่องคงอยู่
- PASS: เพิ่มเฉพาะ description/priority/priorityNote ที่เป็น null ใน seed; ไม่ตัดสินใจ priority หรือเติมรายละเอียดแทนผู้ใช้
- PASS: enum MoSCoW ระหว่าง spec/architecture ตรงกัน; weekly membership เป็นเจ้าของ priority ชุดเดียว และไม่มีข้อกำหนด active ที่ใช้ Low/Normal/High ต่อ
- NOT_RUN: app/FUNG runtime และ UI tests; รอบนี้แก้เอกสาร/seed proposal เท่านั้น ไม่ได้ติดตั้ง feature, import ข้อมูล หรือ deploy

## Implementation verification — 2026-09-30

ผู้ใช้อนุมัติ v0.3 ก่อน implementation แล้ว สถานะรอบเอกสารด้านบนเป็นประวัติ; สถานะปัจจุบันและ requirement matrix อยู่ที่ [verification report](verification.md) และวิธีใช้ใน [คู่มือ](guide.md)

Authored dashboard content build สำเร็จโดยคง app ID และ protected runtime เดิม; ฟังก์ชัน local ทดสอบแล้ว FUNG adapter ผ่าน source/production-handler fixture แต่ยังไม่เปลี่ยนแอป FUNG ที่ติดตั้งอยู่ จึงยังไม่ปิด acceptance การทดสอบเสียงและโมเดลจริงครบเส้นทาง
