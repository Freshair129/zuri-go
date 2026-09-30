---
version: "0.3.0"
created_at: "2026-09-30"
status: implemented-local-runtime-validation-pending
author: RWANG
complexity: C-3
risk: HIGH
parent: projects/campaign-mission-control/brief.md
---

# Meeting & Task Manager — domain brief

## ผลลัพธ์ที่ผู้ใช้ต้องการ

เพิ่มโดเมน Meeting & Task Manager ใน Mission Control เดิม เชื่อม FUNG ซึ่งใช้รับไฟล์เสียง/ถอดเสียงประชุม ให้ผู้ใช้ตรวจแก้ transcript แปลงเป็นงาน มอบหมายชื่อผู้รับผิดชอบ และติดตามใน Weekly To-do / Kanban ที่ออกแบบไว้

## คำยืนยันในบทสนทนา 30 กันยายน 2026

1. Meeting & Task Manager เป็นเจ้าของงานที่สร้างและเป็นที่ติดตามงานหลัก
2. รอบแรกใช้ในเครื่องนี้ โดยบันทึกชื่อผู้รับผิดชอบ ยังไม่ใช้บัญชีทีมร่วมกัน
3. นำรายการงานสัปดาห์ 28 กันยายน–4 ตุลาคม 2026 ทั้ง 5 งานเข้าแบบใหม่: Website MUJEEN / Chef, Campaign marketing metrics / Boss, Data pipeline & tracking / Tong, Requirements จาก Canva / K’jeab, Marketing plan / Chef
4. ใช้ RACI กำกับงาน: PIC เป็น R; A ยังรอยืนยัน; C/I ในร่างเดิมเป็นข้อเสนอ
5. ต้องสร้างและมอบหมายงานแบบ manual ได้ โดยใช้งานได้แม้ไม่มีประชุมหรือไม่ได้เชื่อม FUNG
6. มีทะเบียน Member แบบง่าย ลงทะเบียนชื่อและรายละเอียดเพิ่มเติม เก็บข้อมูล local ก่อน; ไม่ต้องรอ shared login
7. มีช่องรายละเอียดที่เว้นว่างตอนสร้างและกลับมาเติมภายหลังได้ ทั้งงานและข้อมูลเสริมของ Member
8. ใช้ MoSCoW สำหรับ priority: Must have / Should have / Could have / Won’t have this time โดยยังไม่จัดลำดับให้ 5 งานเดิมแทนผู้ใช้

## เอกสารที่ให้ตรวจ

- [สเปกโดเมน](meeting-task-manager-spec.md) — ขอบเขต หน้าจอ RACI งานรายสัปดาห์ เกณฑ์ยอมรับ และแผนลงมือ
- [สถาปัตยกรรมและ FUNG contract](meeting-task-manager-architecture.md) — การแบ่งเจ้าของข้อมูล การเชื่อมต่อ revision และการกันงานซ้ำ
- [Weekly seed](../../output/draft/meeting-task-manager-weekly-seed.json) — รายการ 5 งานสำหรับนำเข้าหลังอนุมัติ
- [Weekly Kanban เดิม](weekly-kanban-2026-09-28.md) — ต้นทางของชื่องาน PIC และเกณฑ์ปิดงาน

## ความเสี่ยงและขอบเขต

C-3 / HIGH: เพิ่มข้อมูลที่คงอยู่และ contract ข้าม Mission Control–FUNG รวมถึง revision, credential ของตัวเชื่อม และการสร้างงานแบบไม่ซ้ำ แม้การใช้งานเป็น local คนเดียว

หน้าจอใช้ brand profile เดิม ลายจุด accent amber และทั้ง Zuri กับน้องวางใจในทุก logical view โดยใช้ asset ที่มีอยู่

การตรวจรอบนี้เป็น source/document review เท่านั้น ยังไม่ใช่การเชื่อม FUNG จริงหรือการนำเข้าข้อมูลลงแอป สถานะอนุมัติเดิมของ Campaign Mission Control v0.2 และ proposal v0.3 ไม่เปลี่ยนเพราะเอกสารชุดนี้

## Version diff

| ก่อน | ข้อเสนอ v0.3 |
|---|---|
| Weekly board ในบทสนทนา | Weekly To-do อยู่ในโดเมนของ Mission Control |
| ใส่งานด้วยตนเองใน campaign | เพิ่ม meeting intake, transcript review และร่างงานจากประชุม |
| owner เป็นข้อความช่องเดียว | Person profile แบบ local และ RACI ที่แยกสถานะยืนยัน |
| ไม่มี contract เชื่อม FUNG ในแอปนี้ | ตัวเชื่อม local พร้อมความสามารถที่ตรวจได้และ receipt ของการสร้างงาน |
| ยังไม่มีทะเบียน Member ใน Mission Control | ลงทะเบียน/แก้ไข/ปิดใช้งานสมาชิก local พร้อมข้อมูลติดต่อแบบ optional |
| งานในร่างมาจาก weekly list | เพิ่ม Manual task และมอบหมายจากทะเบียน Member ได้โดยตรง |
| มีช่องรายละเอียด แต่ยังไม่กำหนดการเติมภายหลังชัดเจน | สร้างจากชื่อก่อน เปิดรายละเอียดกลับมาเติม/แก้ไขได้ และคงข้อมูลหลัง reload |
| ข้อเสนอ v0.2 ใช้ Low / Normal / High | เปลี่ยนเป็น MoSCoW ต่อสัปดาห์ มีค่ารอยืนยันและไม่ลบงานเมื่อเลือก Won’t |

v0.1 → v0.2: เพิ่มข้อกำหนด Manual task และ Member registry ตามคำสั่งเพิ่มเติมของผู้ใช้; สถานะเอกสารยังรออนุมัติ

v0.2 → v0.3: เพิ่มรายละเอียดที่กรอกภายหลังได้ และแทน priority เดิมด้วย MoSCoW; ปรับแบบข้อมูลรายสัปดาห์, seed และ acceptance MT-25–29 ให้ตรงกัน ขอบเขตยังเป็น C-3 / HIGH; การเปลี่ยนรอบนี้เป็นเอกสาร ไม่มี migration หรือ app code

## Approval

รอบเอกสารใช้ R5 และ SOP New feature ตาม AGENTS instructions; สเปก v0.3 ได้รับอนุมัติแล้วตามบันทึกด้านล่าง

Approval recorded: ผู้ใช้ตอบ approve ต่อสเปก v0.3 ในบทสนทนา 2026-09-30 อนุมัติ implementation ตาม MT-01–29; ไม่ได้อนุมัติ production deploy หรือการส่งข้อความถึงทีม

## Implementation v0.3.0

เพิ่มโดเมนใน Mission Control เดิมแล้ว: Weekly To-do/Kanban/List/RACI, Members, manual task, nullable details, MoSCoW รายสัปดาห์, IndexedDB และ Backup v2 พร้อมรับ v1 ตัวเชื่อม FUNG อยู่ใน isolated worktree และผ่าน source/fixture/browser tests; installed desktop, เสียงจริง/Whisper และโมเดลจริงยัง NOT_RUN

ผลตรวจและ version diff: [implementation report](meeting-task-manager-verification.md) · [คู่มือใช้งาน](meeting-task-manager-guide.md)
