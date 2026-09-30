# Current architecture index

Current source version: 0.4.2 (layout introduced in 0.4.1). Deployment evidence: ../releases/0.4.2/verification.md. Working source: D:/workspace/zuri-go.

อ่านตามลำดับ authority: user approval → [Single-code login](identity-code-login-spec.md) → [Member identity](member-identity-spec.md) → [Guest access](guest-access-spec.md) → amendments ใน [Cloud deployment](cloud-deployment-spec.md) / [data model](data-model.md) → [architecture baseline](architecture.md)

เอกสาร baseline เก็บประวัติการออกแบบตั้งแต่ local-only และ shared password ข้อกำหนดเหล่านั้นถูกแทนด้วย approved Guest/Member amendments แล้ว ห้ามใช้ baseline เก่าปิด Guest หรือเปิด shared password กลับมา

- UI และ API ใช้ origin เดียว; local serve build/site, production deploy build/vercel
- Database: PostgreSQL schema 5; local Docker กับ production Neon เป็นคนละ state ไม่ sync อัตโนมัติ
- Hosted reads: public Guest ตาม Business เดิม; writes: same-origin + signed Member session + active/version checks ใน transaction
- Local: trusted operator ผูก loopback; ไม่อ้างว่าผู้ทำรายการเป็น Member โดยไม่มี session
- PID เป็น public stable identifier; UUID เป็น PK/FK; credentials และ handovers แยกจาก profiles และ static package
- Data App shell อยู่ apps/web ทั้งหน่วย มี stable app ID เดิม; API import domain models จาก authored content ใน apps/web ไม่มี shared package เพิ่ม
- Metrics อยู่ apps/metrics และใช้ generator ใน scripts/metrics; /metrics/ เป็นส่วนของ site เดียว

[แผนจัดโครงสร้างที่อนุมัติ](../migrations/001-project-extraction.md) · [ผลตรวจจริง](../migrations/verification.md) · [root README](../../README.md)
