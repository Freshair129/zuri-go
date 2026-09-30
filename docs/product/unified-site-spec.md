---
version: "0.1.0"
date: "2026-09-30"
status: implemented-production-verified
complexity: C-2
risk: MEDIUM
scope: single-site-navigation-and-deployment
---

# รวม Mission Control และ Marketing Metrics Map เป็นเว็บไซต์เดียว

## ผลลัพธ์ที่ขออนุมัติ

เว็บไซต์เดียว มีเมนูไปกลับระหว่าง Marketing, Meeting & Task Manager, หน้าความรู้ และ Graph View ใช้ origin เดียวและเผยแพร่เป็น deployment เดียวบน Vercel โดยใช้หน้าจอและข้อมูลอ้างอิงที่มีอยู่

ผู้ใช้อนุมัติเอกสารนี้ด้วย “approve” วันที่ 30 กันยายน 2026; ดำเนินการและเผยแพร่แล้ว ดู [ผลตรวจและ version diff](unified-site-verification.md)

[ASSUMPTIONS]

1. “site เดียว” หมายถึงหนึ่งเว็บไซต์ หนึ่ง origin และหนึ่งชุด deploy; ยังใช้การเก็บข้อมูลใน browser ตามข้อกำหนดที่ผู้ใช้ยืนยันไว้
2. ใช้ Mission Control เป็นหน้าแรก และคงหน้าความรู้/Graph View ไว้ในหมวด Metrics ของเว็บไซต์เดียวกัน
3. ใช้ Vercel ตามปลายทางที่ผู้ใช้ขอไว้ก่อนหน้า โดยต้องระบุ project/account ที่เข้าถึงได้ก่อนเผยแพร่จริง

## แหล่งอ้างอิงและผลกระทบ

| ระดับ | เอกสาร/แหล่งปัจจุบัน | สิ่งที่ต้องรักษา |
|---|---|---|
| Parent | [Brand profile](../../brand/brand-profile.md) | สี amber/ink, wordmark และตัวละคร Zuri กับน้องวางใจ |
| Parent | [Mission Control brief](campaign-mission-control-brief.md) | แคมเปญหลายรูปแบบ, Overview ต่อแคมเปญ, Performance, Plan & Gates, Workboard และ Review |
| Peer | [Metrics Map brief REV 04](campaign-01-brief.md) และ [Graph spec](campaign-01_metrics-graph-spec.md) | คู่มือ 18 หน้า, 40 terms, 2D/3D, การหมุน/ซูม, พื้นหลัง, hover labels และแผงคำอธิบาย |
| Peer | [Meeting & Task Manager spec](meeting-task-manager-spec.md) และ [architecture](meeting-task-manager-architecture.md) | งาน manual, Members, รายละเอียด, RACI, MoSCoW, local storage และ FUNG connector |
| Runtime | [Data App Authoring Guide](../../apps/web/AGENTS.md) | app ID เดิม, public API, protected shell, theme, source inspection และ build integrity |

การรวมนี้เปลี่ยน navigation และขอบเขตของ deployment; ไม่เปลี่ยนนิยาม KPI, metric formulas หรือเจ้าของข้อมูลงาน

## หน้าเว็บและเมนู

เมนูระดับเว็บไซต์เรียงเหมือนกันทุกส่วน: **Marketing · Meeting & Task Manager · ความรู้ Metrics · Graph View** พร้อมบอกหน้าที่เลือกอยู่ และใช้งานได้ทั้งจอเล็ก/คีย์บอร์ด

| เมนู | เส้นทางในเว็บไซต์เดียวกัน | หน้าที่ |
|---|---|---|
| Marketing | `/?view=1&tab=overview` | Mission Control; ใช้แท็บแคมเปญเดิมภายใน |
| Meeting & Task Manager | `/?view=1&tab=meeting-task-manager` | Weekly To-do, Meetings, Tasks/RACI และ Members |
| ความรู้ Metrics | `/metrics/#overview` | คู่มือทีละหน้า พร้อมสารบัญและปุ่มก่อนหน้า/ถัดไป |
| Graph View | `/metrics/#metrics-graph` | กราฟคำศัพท์พร้อมรายละเอียด metric |

- `/` เปิด Mission Control และคง query links ของแท็บเดิม
- หมวดในคู่มือ เช่น `/metrics/#consideration` และ `/metrics/#conversion` เปิดถึงหน้าที่เกี่ยวข้องได้โดยตรง
- ลิงก์ระหว่างส่วนเป็น relative same-origin paths; ชุด deploy ไม่มีลิงก์ภายในที่ชี้กลับพอร์ต 4319/4321
- ใช้แถบเลือกโดเมนใน authored content ของ Mission Control ที่มีอยู่ เพิ่มลิงก์สองหมวด Metrics โดยไม่ทับหรือซ่อน protected shell
- คู่มือ/กราฟเพิ่มแถบเมนูเว็บไซต์ และคงเมนูหมวด/กราฟเดิม ส่วนเมนูเว็บไซต์ไม่ปรากฏในงานพิมพ์
- คง dotted texture, accent color, CTA และ mascot pair ในทุก logical view; ไม่เปลี่ยน layout ของ node หรือคำอธิบายเดิม

## โครงสร้าง build ที่เสนอ

```text
output/draft/unified-site/          ← เผยแพร่ทั้งโฟลเดอร์เป็นหนึ่ง deployment
  index.html                       ← build ที่ตรวจแล้วของ Mission Control
  snapshot.<hash>.json              ← reviewed reference data ของ build เดียวกัน
  data-app-build.json               ← หลักฐาน identity ของ Data app เดิม
  metrics/
    index.html                     ← คู่มือและ Graph View จาก builder เดิม
    assets/                        ← fonts, logo และ mascot ที่อ้างจริง
    gvm/                           ← source images ที่คู่มือเชื่อมถึง
```

ใช้สองหน้าที่มีอยู่ใน static site เดียว ไม่ต้องย้ายคู่มือเข้า framework ใหม่ ไม่โหลดอีก localhost ผ่าน iframe และไม่แก้ HTML ของ Mission Control หลัง build ซึ่งจะทำให้ manifest ไม่ตรง

ขั้นตอน build หลังอนุมัติ:

1. แก้ navigation ที่ต้นฉบับของแต่ละส่วน และ regenerate Metrics Map จาก `projects/campaign-01/build_metrics_map.py`
2. build Mission Control ด้วย `data-app.mjs build --separate-data` ตาม authoring guide และตรวจ integrity
3. ใช้ packaging script ขนาดเล็กภายใต้ `projects/campaign-mission-control/` ประกอบ output ที่ตรวจแล้วเข้าหนึ่งโฟลเดอร์ พร้อมปรับ asset paths ของคู่มือสำหรับ `/metrics/`
4. คัดลอกเฉพาะไฟล์เผยแพร่ที่ระบุ; ไม่รวม source worktrees, backup JSON จาก browser, สมาชิก/งานที่ผู้ใช้กรอก, เสียงประชุม, token หรือ QA fixtures
5. ตรวจลิงก์, assets และ hash binding แล้วเปิดเว็บรวมผ่าน HTTP เพื่อทดสอบก่อน deploy

`output/draft/unified-site/` เป็น generated deployment artifact; source of truth ของ UI ยังเป็น authored content และ Metrics Map builder เดิม ไม่แก้ generated output แทน source

## ข้อมูลและการย้ายไป URL จริง

- คง app ID `dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1` และ localStorage/IndexedDB namespace เดิม
- ระหว่าง preview ใช้ origin `http://127.0.0.1:4319` เดิมเมื่อเปลี่ยนไปเสิร์ฟชุดรวม เพื่อให้ข้อมูลที่ผู้ใช้กรอกไว้ยังอ่านได้
- browser แยกข้อมูลตาม origin; เมื่อเปิดโดเมน Vercel ต้องใช้ **Backup JSON → Restore backup** หากต้องการย้ายแคมเปญ งาน และ Members จาก localhost ไม่อ้างว่าการ deploy ย้ายข้อมูลไปเอง
- การ deploy รวมไม่ได้เพิ่มฐานข้อมูลส่วนกลางหรือระบบล็อกอิน สมาชิกยังเป็นทะเบียนชื่อใน browser ตามแบบที่อนุมัติ
- FUNG ยังคงทำงานผ่าน local connector ของเครื่องผู้ใช้ ไม่มีการย้ายเสียงหรือโมเดลไป Vercel ต้องตรวจ origin gate และการเชื่อมต่อจาก HTTPS กับแอป FUNG จริงก่อนอ้างว่าการเชื่อมต่อพร้อมใช้บนโดเมนใหม่

## ทางเผยแพร่และข้อเท็จจริงที่ตรวจแล้ว

เลือกหนึ่ง Vercel project ให้เป็นปลายทางของชุดรวม และใช้ deployment เดียวสำหรับทุก path ตามตาราง การเผยแพร่ใช้ build output ที่ผ่านการตรวจ; แนวทาง CLI/API และ Preview/Production อ้างอิง [Vercel Deployments](https://vercel.com/docs/deployments)

Preflight วันที่ 30 กันยายน 2026:

- Vercel connector `list_teams` ตอบสำเร็จ แต่คืน `teams: []`; จึงยังระบุ team/project ที่ deploy ได้จาก connector นี้ไม่ได้
- ไม่พบคำสั่ง `vercel` ใน PATH ของ session ที่ตรวจ
- ใช้ Vercel CLI 61.1.0 แบบชั่วคราวผ่าน `npx` พบ session เดิมของ `freshair129` และ project `zuri-metrics-map` ใน `pornpons-projects`; ไม่ติดตั้ง CLI แบบ global หรือสร้าง project ใหม่
- Deploy เฉพาะ `output/draft/unified-site/` ด้วย `--project prj_8f3zf1qaZnRcAvWabOv1PWAPIABG`; ไม่ต้องสร้าง `.vercel` metadata ภายใน generated output
- Deployment `dpl_9ePeQBZbiFhfdQ1Hw5NrUby5sXcX` ขึ้น READY และ promote สำเร็จ; ยืนยันเว็บรวมที่ [zuri-metrics-map.vercel.app](https://zuri-metrics-map.vercel.app/)
- ตรวจไฟล์ production ทั้ง 27 payload files ผ่าน HTTP แบบไม่ใช้ credentials และ hash ตรงกับ local build ทุกไฟล์ รวมภาพ ฟอนต์ และ snapshot

หากหลังอนุมัติยังเข้าถึงปลายทาง Vercel ไม่ได้ ให้ทำโค้ด ชุดรวมและ local preview ให้เสร็จก่อน แล้วขอเชื่อมต่อบัญชี/ระบุ project ที่ขั้นเผยแพร่ ห้ามรายงาน local build เป็น production deployment และห้ามเปลี่ยนไปใช้บัญชีหรือ provider อื่นเอง

## Acceptance และ verification

| ID | เกณฑ์ผ่าน |
|---|---|
| US01 | เมนูทั้งสี่ส่วนใช้ origin เดียวกัน ไปกลับได้โดยไม่ต้องเปิด localhost อีกพอร์ต |
| US02 | เปิด deep link ของทุกส่วนโดยตรงและ reload ได้; assets และ snapshot โหลดครบ ไม่มี 404 |
| US03 | Marketing ทั้งห้าแท็บ และ Meeting & Task Manager ยังทำงานผ่าน app ID เดิม |
| US04 | งาน/Member ที่บันทึกแล้วคงอยู่หลังสลับไปคู่มือ กลับมา และ reload; Backup/Restore v2 ยังคงใช้ได้ |
| US05 | คู่มือยังมี 18 หน้า/40 graph terms; graph switch 2D/3D, หมุน, zoom, background, search และ detail panel ทำงาน |
| US06 | แถบเมนูไม่บังเนื้อหาบน desktop/mobile; ชื่อหน้าที่เลือกและ keyboard focus ชัดเจน; mascots ยังคงอยู่ทุก view |
| US07 | print guide ไม่ติดเมนูเว็บไซต์; ไม่มีการเปลี่ยน reviewed metrics หรือสมมติข้อมูล actual |
| US08 | protected runtime integrity ผ่าน; manifest ของ Mission Control ตรงกับไฟล์ที่บรรจุ; ชุด deploy ไม่มี browser backup/token/audio/QA fixtures |
| US09 | ทดสอบ regression ที่เกี่ยวข้องกับ app และ Metrics Map, ตรวจ document links และบันทึกผลจริงใน verification note |
| US10 | เมื่อ deploy ได้ ต้องยืนยันสถานะ READY และเปิดเส้นทางหลักบน URL ที่ได้รับจริง; ระบุ deployment ID/URL และข้อจำกัด FUNG ตามผลที่ตรวจได้ |

Definition of Done แยกเป็น **รวมเว็บไซต์และ local verification สำเร็จ** กับ **เผยแพร่และ hosted verification สำเร็จ**; หากปลายทางยังไม่พร้อม ระบุขั้นที่เสร็จและขั้นที่ค้างอย่างชัดเจน

## Version diff

| ปัจจุบัน | หลังดำเนินการตาม v0.1.0 |
|---|---|
| Mission Control และ Metrics Map ใช้คนละ preview/ชุดไฟล์ | โฟลเดอร์ build เดียว เสิร์ฟผ่าน origin เดียว |
| เมนูโดเมนมี Marketing กับ Meeting & Task Manager | เพิ่ม ความรู้ Metrics และ Graph View พร้อมลิงก์กลับจากคู่มือ |
| ต้องรู้ URL ของคู่มือแยกต่างหาก | เข้าถึงทุกส่วนจากเมนูเว็บไซต์ |
| สถานะ production ยังยืนยันไม่ได้ | deploy ชุดรวมครั้งเดียว และรายงานสถานะตามผล Vercel จริง |

## Approval

อนุมัติแล้วตาม R5 และ SOP ที่ผู้ใช้กำหนดในแชต การอนุมัติครอบคลุม navigation, packaging, การทดสอบ และเตรียม deploy ตามขอบเขตนี้
