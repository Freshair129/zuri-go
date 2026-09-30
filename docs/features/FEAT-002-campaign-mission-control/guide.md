# Campaign Mission Control 0.2.0

Local preview: http://127.0.0.1:4319

Artifact: `D:/zuri-brand-kit/output/draft/campaign-mission-control/dist/`

## เริ่มใช้งาน

1. เลือก MUJEEN M1 หรือเพิ่ม campaign พร้อม objective ของตัวเอง
2. เปิด **ตั้งค่า** กรอกวันเริ่ม/สิ้นสุด, owner, Low/Mid/High, released budget cap, committed spend, margin floor, conversion window, minimum sample, source freshness และ response SLA ตามที่ตกลงจริง
3. กรอกนิยาม qualified / MQL / SQL และขอบเขตรายได้/ต้นทุน เป้าตั้งต้น 108 units ใช้เฉพาะ MUJEEN; แคมเปญใหม่ไม่มีเป้าที่แต่งขึ้น
4. ใช้ **บันทึกข้อมูล** เพิ่ม ad observations, lead IDs, order IDs พร้อมต้นทุน และ inventory snapshots ใช้รหัสเดียวกับต้นทางเพื่อป้องกันการนับซ้ำ แก้ record เดิมจากตารางใน Performance
5. ยืนยัน source coverage หลังตรวจว่าข้อมูลครบตั้งแต่ต้น campaign ถึงวันที่ระบุ รวมวันที่ไม่มีเหตุการณ์เป็นศูนย์
6. เปิด Overview เพื่อตรวจ pace/guardrails; Performance เพื่อกรองวันที่/offer/channel; Workboard เพื่อมอบหมายและปิดงานพร้อมหลักฐาน
7. เมื่อถึงรอบ review ให้บันทึก summary และคำตัดสิน แม้ข้อมูลยังไม่พอที่จะสรุปผล
8. ถ้าจะเปิด DESTINY ให้บันทึก decision `release` พร้อม owner, เหตุผล, scope, หลักฐาน และวันตรวจซ้ำก่อน จากนั้น **ยืนยันเปิดจริง** เมื่อ gate พร้อม รอบถัดไปนับ 7 วันจากวันเปิดจริง

## ความหมายของวันที่และตัวเลข

- Review date ใช้ตัดยอดเหตุการณ์ในเขตเวลา Bangkok; dashboard เป็นข้อมูลที่ปรับปรุงล่าสุดตาม target/rule version ที่แสดง สำหรับผลตัดสินเดิมให้เปิด Review snapshot ของวันนั้น
- Actual ที่ไม่ทราบแสดง `—`; 0 ใช้เมื่อมี record หรือยืนยัน coverage ว่าไม่มีเหตุการณ์ ช่องต้นทุนว่างไม่ใช่ 0
- Net fulfilled units ใช้วันส่งมอบ/คืน; revenue ใช้วันชำระ/คืนเงิน การแก้ต้นทุนสุทธิผูกกับ order purchase date และอาจ restate ยอดช่วงเก่า
- Order input เป็นสรุปหนึ่งรายการต่อออเดอร์ รองรับวันรวมของ fulfillment/return/refund อย่างละหนึ่งวัน การกระทบยอดหลายเหตุการณ์/หลาย line ต้องรวมจาก ledger ต้นทางก่อน ไม่ใช่ระบบบัญชีหรือคลังสินค้า
- Cancelled หมายถึง paid order ที่คืนเงินครบและมีวันยกเลิก; void ไม่รับรู้ยอด เงินที่คืนและหน่วยที่คืนบันทึกคนละเหตุการณ์
- AOV และ units/order ใช้ purchase cohort เดียวกัน; จึงอาจต่างจาก transaction/fulfillment flow ในช่วงเดียวกัน
- CVR นับ distinct acquired leads ที่ครบ conversion window และมี order ที่เชื่อมกันใน window นั้น Lead W1 ซื้อ offer W2 ยังอยู่ใน cohort W1; order อยู่ในวันซื้อ W2
- MQL/SQL เป็น stage-entry flow ของแต่ละวันที่ ไม่ใช่ current-stage stock และไม่นำ MQL+SQL มารวมเป็นคนไม่ซ้ำ
- Media CAC ใช้เฉพาะ media spend และ new Customer IDs ที่ยืนยัน ไม่ใช่ full acquisition CAC หรือ platform-attributed ROAS
- SLA ใช้เวลาจริงต่อเนื่องเป็นนาที; ยังไม่ทำ service-hours calendar หรือ bot-response exclusions อัตโนมัติ ต้องกรอก first human response ให้ตรงนิยาม
- Target path เฉลี่ยเท่ากันทุกวันปฏิทิน เป็นสมมติฐาน planning ที่แสดงไว้ ไม่ใช่น้ำหนักวันที่เจ้าของให้มา
- Reforecast เป็นจำนวน future orders × ราคา/units จาก M01 และรวมกับ actual ที่ทราบ; ยังไม่คาด refund/discount/ต้นทุน/สื่อในอนาคต

## Gate และการตัดสินใจ

- Hard budget / margin / stock breach มาก่อน data hold; ข้อมูลเก่าไม่ซ่อนการใช้งบเกินที่ยืนยันแล้ว
- Released cap เป็นวงเงินรวม campaign และ committed spend คือภาระที่ยังไม่อยู่ใน spend จริง ไม่เพิ่มวงเงินทดสอบใหม่อัตโนมัติทุกสัปดาห์
- ต่ำกว่า 7 วันจากเปิด หรือ mature sample ไม่ถึงขั้นต่ำ → Learning; 0/0 conversion → ไม่ทราบ
- Commerce/inventory ใช้ package CVR ≤2% / >2–<5% / ≥5–<10% / ≥10% พร้อม economics และ pace; Normal ใช้ cutoff แยกที่ owner กรอก
- Lead objective ใช้ SQL pace; awareness ใช้ qualified sessions pace และ impression sample ไม่บังคับ sales CVR กับทุก objective
- หาก margin ไม่มีตัวหารที่เป็นบวก ต้นทุนไม่ครบ หรือ order ยังไม่เชื่อม lead ระบบยังไม่อนุญาต sales-conversion gate ต้อง reconcile ข้อมูล/ขอบเขตก่อน
- First package ต้องเป็น DESTINY และ Normal ต่ำกว่า Low pace พร้อมหลักฐานปัญหา offer; PAIR/COMPLETE เป็นทางเลือกหลัง review เท่านั้น
- New test ต้องมีอย่างน้อย 7 วันเหลือ, stock/BOM พร้อม, SLA ผ่าน และมี decision ก่อนวันเปิด
- Acknowledged ไม่ใช่ resolved; ข้อค้างหนึ่งรายการต่อ gate หายจาก active queue เมื่อเงื่อนไขผ่าน
- Done ต้องมี owner, due date, acceptance, evidence และวัน recheck ผล KPI; งานเสร็จไม่ได้ยืนยันว่า KPI ดีขึ้นแล้ว
- Decision/override เป็นบันทึก owner เท่านั้น ไม่แก้งบ ราคา หรือ platform ใด และไม่ bypass hard gate ของ launch confirmation

## Backup และขอบเขตการใช้งาน

- ข้อมูลอยู่ใน localStorage ของ browser และ origin นี้ ไม่มี CRM/Ads/Order connector และไม่มี cloud sync
- ใช้ **Backup JSON** เก็บทุก campaign/settings/records/tasks/decisions/reviews ก่อนย้าย browser/เครื่อง/URL หรือปิด preview เป็นเวลานาน
- Restore ตรวจ schema และแสดงชื่อ campaign ก่อนยืนยันแทนที่ชุดปัจจุบัน
- Export view ใน Performance ใช้ date/offer/channel ที่กำลังแสดง และแยก cohort-linked order evidence ออกจาก transaction rows
- Review snapshots และ correction history เก็บสำเนาก่อนแก้ในแอป แต่ไม่ใช่ฐานข้อมูลที่มี access control, cryptographic immutability หรือ audit service
- ยังไม่ได้ publish/deploy dashboard นี้; local preview ต้องมี server ทำงานอยู่

## เปิดใหม่หลังปิดเครื่อง

รันจาก PowerShell แล้วเปิด URL ข้างต้น:

```powershell
& 'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' -m http.server 4319 --bind 127.0.0.1 --directory 'D:/zuri-brand-kit/output/draft/campaign-mission-control/dist'
```

ใช้ origin เดิม `http://127.0.0.1:4319` เพื่อเข้าถึงข้อมูลเดิม อย่าเปิด `dist/index.html` โดยตรง เพราะ build นี้โหลด snapshot JSON คู่กันผ่าน HTTP

## Version diff

| 0.1.0 | 0.2.0 |
|---|---|
| Design / wireframes | Dashboard ทำงานครบ 5 views |
| Requirements สำหรับ KPI / gates | การคำนวณจาก records, source coverage, sample/maturity, cutoff, margin/stock/SLA guards |
| ลำดับ Normal → conditional DESTINY | Decision record แยกจาก actual launch และ clock 7 วัน |
| Work / review design | งานพร้อมหลักฐาน, acknowledgment, immutable-in-app snapshots, JSON backup/restore |
| No actual monitoring source | Manual local workspace; actual เริ่มว่าง และ M01 เป็น planning reference |
