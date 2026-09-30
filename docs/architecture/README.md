# Current architecture index

Current source version: 0.4.2 (layout introduced in 0.4.1). Deployment evidence: ../releases/0.4.2/verification.md. Working source: D:/workspace/zuri-go.

อ่านตามลำดับ authority: user approval → [Single-code login](../features/FEAT-007-single-code-login/spec.md) → [Member identity](../features/FEAT-006-member-identity/spec.md) → [Guest access](../features/FEAT-005-guest-access/spec.md) → amendments ใน [Cloud deployment](ARCH-003-hosted-deployment.md) / [data model](ARCH-002-postgresql-data-model.md) → [architecture baseline](ARCH-001-baseline-architecture.md)

เอกสาร baseline เก็บประวัติการออกแบบตั้งแต่ local-only และ shared password ข้อกำหนดเหล่านั้นถูกแทนด้วย approved Guest/Member amendments แล้ว ห้ามใช้ baseline เก่าปิด Guest หรือเปิด shared password กลับมา

- UI และ API ใช้ origin เดียว; local serve build/site, production deploy build/vercel
- Database: PostgreSQL schema 5; local Docker กับ production Neon เป็นคนละ state ไม่ sync อัตโนมัติ
- Hosted reads: public Guest ตาม Business เดิม; writes: same-origin + signed Member session + active/version checks ใน transaction
- Local: trusted operator ผูก loopback; ไม่อ้างว่าผู้ทำรายการเป็น Member โดยไม่มี session
- PID เป็น public stable identifier; UUID เป็น PK/FK; credentials และ handovers แยกจาก profiles และ static package
- Data App shell อยู่ apps/web ทั้งหน่วย มี stable app ID เดิม; API import domain models จาก authored content ใน apps/web ไม่มี shared package เพิ่ม
- Metrics อยู่ apps/metrics และใช้ generator ใน scripts/metrics; /metrics/ เป็นส่วนของ site เดียว

[แผนจัดโครงสร้างที่อนุมัติ](../migrations/001-project-extraction.md) · [ผลตรวจจริง](../migrations/verification.md) · [root README](../../README.md)

## Artifacts in this folder

| ID | Document | Role |
|---|---|---|
| ARCH-001 | [Baseline architecture](ARCH-001-baseline-architecture.md) | Original local-only design; its local-only statements are superseded by ARCH-003 and the amendments above |
| ARCH-002 | [PostgreSQL data model](ARCH-002-postgresql-data-model.md) | Physical schema, with the 0.3.1 and 0.4.0 amendments |
| ARCH-003 | [Hosted deployment](ARCH-003-hosted-deployment.md) | PostgreSQL on Vercel (0.3.0) and its amendments; its shared-team-password statements are superseded by [FEAT-006](../features/FEAT-006-member-identity/spec.md) and [FEAT-007](../features/FEAT-007-single-code-login/spec.md) |
| ADR-002 – ADR-004 | [System decisions](decisions.md) | Proposed, not approved: task and meeting domains for every department, one task record with contexts, and visibility with confidential meetings |

The Business Overview, Guest access, Member identity, single-code login and logo specifications that used to live here are feature documents now — see the [documentation map](../README.md) and [features/](../features/). The links above already point to their new locations.
