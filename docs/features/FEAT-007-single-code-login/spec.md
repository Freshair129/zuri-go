---
document_id: ZGO-AUTH-003
version: 0.4.2
date: 2026-09-30
status: implemented-production-api-verified
complexity: C-2
risk: HIGH
---

# เข้าสู่ระบบด้วยรหัสระบุตัวตนช่องเดียว

User request: ไม่ต้องกรอก PID ใช้ช่องรหัสอย่างเดียว และใช้คำว่า **รหัสระบุตัวตน**

Parent: [Member identity](../FEAT-006-member-identity/spec.md). Peers: [Guest access](../FEAT-005-guest-access/spec.md), [Cloud deployment](../../architecture/ARCH-003-hosted-deployment.md), [Data model](../../architecture/ARCH-002-postgresql-data-model.md). Working source คือ D:/workspace/zuri-go หลังแยกโปรเจกต์ 0.4.1

## พฤติกรรมที่เปลี่ยน

- Modal เข้าสู่ระบบเหลือช่องเดียว label **รหัสระบุตัวตน** เป็น password input ที่ปิดบังค่าขณะพิมพ์
- ใช้รหัสส่วนตัว 24 ตัวเดิมของสมาชิกแต่ละคน ไม่ต้องเปลี่ยนหรือออกไฟล์รหัสใหม่
- API หาสมาชิกจากรหัสที่ตรวจตรงกับ credential ใน Business ที่กำหนด เมื่อพบเจ้าของที่มีสิทธิ์หนึ่งคน ให้สร้าง Member session เดิม
- ข้อความผิดพลาดใช้ “รหัสระบุตัวตนไม่ถูกต้อง” ข้อความขอสิทธิ์แก้ไขใช้คำเดียวกัน
- PID ยังคงเป็นตัวระบุสมาชิกในฐานข้อมูล, Member cards, session และ audit แต่ไม่ใช่ช่องที่ผู้ใช้ต้องกรอกเพื่อ login
- Guest อ่านได้เหมือนเดิม เมื่อ login สำเร็จทำต่อจาก write intent ที่เลือกไว้ แถบด้านบนแสดงชื่อสมาชิก/PID ของเจ้าของรหัสจริง

## Evidence และวิธีทำ

ปัจจุบัน `apps/api/member-auth.mjs:loginMember` ค้นด้วย Business + PID แล้วตรวจ salted password hash; `apps/api/cloud.mjs` รับ `{pid,password}`; `apps/web/src/content/business/TeamAccess.jsx` แสดง input สองช่อง จึงต้องเปลี่ยนทั้ง server และ UI การซ่อนช่อง PID ฝั่ง UI อย่างเดียวจะยัง login ไม่สำเร็จ

ระบบปัจจุบันมี 4 credential และใช้ salted scrypt hashes จึงไม่สามารถ query ตรงด้วย plaintext หรือเปรียบเทียบ hash ธรรมดาได้ แนวทางขั้นต่ำคืออ่าน credential candidates เฉพาะ Business ฝั่ง server แล้วตรวจด้วย verifyPassword เดิมให้ครบ โดยไม่ส่ง hashes ไป browser และไม่หยุดเมื่อเจอคนแรก

- รับ API `{password}` เดิมเป็นค่าที่ transport; ชื่อ field ทางเทคนิคไม่ใช่ชื่อแสดงใน UI
- ไม่ใช้ PID/memberId ที่ caller แนบมาเป็นตัวเลือก actor หาก browser รุ่นเก่ายังส่ง PID มาด้วย ต้องไม่มีผลต่อการเลือกตัวตน
- นับ credential ที่รหัสตรงจากทุกบัญชีใน Business รวมบัญชีที่ปิดอยู่ แล้วอนุญาตเฉพาะเมื่อพบตรงหนึ่งบัญชีและบัญชีนั้น active/enabled เท่านั้น ป้องกันรหัสซ้ำเปลี่ยนเจ้าของเมื่อเปิด/ปิดบัญชี
- ถ้าไม่ตรง, ตรงหลายบัญชี, บัญชี inactive หรือ credential disabled ให้ปฏิเสธด้วยข้อผิดพลาดเดียวกัน ไม่เลือกบัญชีแรกและไม่เปิดเผยรายชื่อที่ตรง
- คง input length/type validation, same-origin checks, persistent login rate limits, signed HttpOnly/Secure/SameSite cookie, expiry และ credential-version recheck ก่อนเขียน
- ไม่เพิ่ม schema หรือเปลี่ยนข้อมูลบัญชีในรอบนี้ วิธีนี้เหมาะกับทีมขนาดปัจจุบัน; บันทึกจำนวน scrypt checks ต่อ login ในการตรวจ ไม่เพิ่ม lookup index หรือ framework ใหม่โดยไม่จำเป็น
- Operator provisioning/reset ต้องตรวจว่ารหัสสุ่มใหม่ไม่ซ้ำกับ credential อื่นใน Business ก่อนบันทึก ข้อมูลเดิมไม่ถูก reset อัตโนมัติ กรณี ambiguous ต้องแก้ผ่าน explicit operator reset

## ขอบเขตไฟล์

- `apps/api/member-auth.mjs`, `cloud.mjs`: single-code identity resolution และข้อความตอบกลับ
- `apps/api/provision-members.mjs`: uniqueness guard สำหรับการออก/เปลี่ยนรหัสที่เกิดขึ้นหลังเปลี่ยนระบบ
- `apps/web/src/content/business/TeamAccess.jsx`: input เดียว, label/copy ใหม่, ไม่มี PID requirement
- `apps/api/test/`: single-code login, identity attribution, duplicate-code/disabled/inactive/legacy-input cases
- parent/peer docs และ operations README อัปเดตหลัง implementation; ใช้ build/deploy pipeline ที่เพิ่งแยกแล้ว

## Acceptance / success / exit criteria

1. รหัสเดิมของ Chef, Boss, Tong และ K’jeab แต่ละชุดระบุตัวตนถูกคนโดยไม่ส่ง PID
2. ผิด/ว่าง/ชนิดผิด/ยาวเกินขอบเขต และรหัส ambiguous login ไม่ได้ ไม่มีข้อมูล credential ใน response หรือ log
3. การส่ง PID/memberId ของผู้อื่นร่วมกับรหัสไม่เปลี่ยนตัวตนเจ้าของรหัส
4. inactive/disabled, reset/revoked, expired/tampered session, Guest write denial และ origin/rate limits ยังผ่าน
5. Session และ actor audit ยังคง canonical Member UUID/PID จริงจาก server; งาน, RACI, MoSCoW, attachments และ credential values เดิมคงอยู่
6. Modal มี input เดียวชื่อ “รหัสระบุตัวตน”; รหัสถูกล้างเมื่อปิดหรือ login สำเร็จ; resumed write flow ยังทำงาน
7. backend tests, protected build และ packaging checks ผ่าน; รายงาน browser verification ตามที่ทำได้จริง หากเครื่องมือ browser ถูก policy block ต้องไม่เลี่ยงด้วยช่องทางอื่น

## Version diff ที่เสนอ: 0.4.1 → 0.4.2

| เดิม | ใหม่ |
|---|---|
| กรอก PID + รหัสผ่านส่วนตัว | กรอก “รหัสระบุตัวตน” ช่องเดียว |
| server เลือก credential ด้วย PID | server ตรวจรหัสและรับเฉพาะเจ้าของหนึ่งคนที่ active/enabled |
| PID ใช้ทั้ง login input และ identity | PID คงใช้ภายใน/session/audit/Member display |
| รหัสแยกรายคน / Guest / PostgreSQL | คงเดิม |

Approval: ผู้ใช้อนุมัติเอกสารตาม R5/SOP ด้วยข้อความ approve วันที่ 2026-09-30. การย้าย source 0.4.1 ที่อนุมัติแล้วไม่ได้เปลี่ยน contract login โดยตัวมันเอง การอนุมัติฉบับนี้ครอบคลุม implementation/tests/build ในโปรเจกต์ใหม่และการอัปเดต deployment เดิมตาม workflow ที่ใช้อยู่ โดยตรวจ staging ก่อน production; ไม่มีการออกหรือส่งรหัสใหม่ให้สมาชิก

Evidence: [0.4.2 verification](../../releases/0.4.2/verification.md). Browser visual verification was not run; compiled artifact and live HTTP/API verification passed.
