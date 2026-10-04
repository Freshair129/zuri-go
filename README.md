# Zuri-Go · 0.5.1

Let’s Go to Market. Together.

โปรเจกต์หลักอยู่ที่ **O:/zuri-go** ตั้งแต่การแยก source รุ่น 0.4.1 ใช้ PostgreSQL และบัญชีสมาชิกเดิม รุ่น 0.4.2 ใช้รหัสระบุตัวตนช่องเดียวเพื่อเข้าสู่ระบบ รุ่น 0.5.0 เพิ่มระดับการมองเห็นและประชุมลับ (FEAT-011), Task Manager สำหรับทุกฝ่าย (FEAT-010) และการสร้างงานจากประชุมฝั่ง server; รุ่น 0.5.1 ซ่อนข้อมูลติดต่อของสมาชิกจาก Guest และจำกัดการแก้ทะเบียนสมาชิกให้ Business admin; ดูหลักฐานการเผยแพร่ใน docs/releases/0.5.0/ และ docs/releases/0.5.1/

Zuri-Go เป็น Marketing/Commercial edition ของ Zuri-AI ที่ deploy แยกได้พร้อม supporting functions และมีทิศทางส่งข้อมูลกลับ Marketing domain ของแพลตฟอร์ม. เริ่มอ่าน SoT ที่ [ARCH-005 — Commercial pipeline](docs/architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md); integration mapping/contract ยังเป็น draft.

## เริ่มใช้งาน

ต้องมี Node 24, Python 3 และ installed Codex Data plugin สำหรับ build Dashboard เครื่องนี้ใช้ PostgreSQL native; Docker Desktop จำเป็นเฉพาะ wrapper เดิม

```powershell
cd O:\zuri-go
npm run setup
npm run build
& '.\.local\marketing-native\runtime\pgsql\bin\pg_ctl.exe' start -D '.\.local\postgres-local\data' -l '.\.local\postgres-local\server.log' -w
node apps/api/server.mjs
```

เปิด http://127.0.0.1:4319/?view=1&tab=overview ใช้ 127.0.0.1 เพราะ local API ตรวจ Host/Origin คู่มืออยู่ที่ http://127.0.0.1:4319/metrics/#overview และ Graph View อยู่ที่ /metrics/#metrics-graph

เครื่อง O:/zuri-go นี้ใช้ PostgreSQL native ที่สร้างจาก backup Production เมื่อ 2026-10-05 ให้เปิดตาม [วิธี native ใน runbook](docs/operations/RB-001-runbook.md#native-local-on-this-machine--2026-10-05) ส่วน `npm start` เป็น wrapper สำหรับ Docker เดิมและ local server แบบซ่อนหน้าต่าง ถ้าพอร์ตมีโปรแกรมอื่นใช้จะไม่หยุดให้อัตโนมัติ Log อยู่ที่ `.local/logs/` Local เป็น trusted operator; production ยังคง Guest อ่านอย่างเดียวและใช้ รหัสระบุตัวตนของสมาชิกเพื่อแก้ไข

## คำสั่ง

| คำสั่งจาก root | ผลลัพธ์ |
|---|---|
| `npm run setup` | ติดตั้ง API dependencies ตาม lockfile |
| `npm run build` | ตรวจและสร้าง Metrics, Dashboard, build/site และ build/vercel |
| `npm start` | เปิด Docker/server เดิม; เครื่องนี้ใช้วิธี native ใน runbook |
| `npm test` | backend, campaign, meeting, packaging, metrics และ extraction checks; ต้องเปิด local server ก่อน |
| `npm run backup` | Docker-only dump; เครื่องนี้ใช้ native backup ใน runbook |
| `npm run db:migrate` | operator ใช้เมื่ออนุมัติ migration; ไม่ต้องรันซ้ำเพื่อย้าย source; ปฏิเสธ target ที่ไม่ใช่ local และใช้ `-- --cloud` สำหรับ production |
| `npm run members -- --cloud` | provision สมาชิกที่ยังไม่มี credential; ไม่หมุนรหัสเดิม |
| `npm run members -- --cloud --reset ZGO-P0001` | operator เปลี่ยนรหัสของ PID ที่ระบุและ revoke sessions เดิม |
| `npm run deploy` | deploy build/vercel ของ project เดิมแบบ staged (`--skip-domain`) และพิมพ์ URL ของ deployment; โดเมนสาธารณะยังไม่ย้าย; build/test ให้ผ่านก่อน |
| `npm run promote -- <deployment-url>` | ย้ายโดเมนสาธารณะไปยัง deployment ที่ตรวจแล้ว; ปฏิเสธ URL ที่ไม่ตรง `https://zuri-metrics-*-pornpons-projects.vercel.app` |

คำสั่ง build ใช้ Data plugin 1.0.11 และ Codex Node ใน user profile ปัจจุบัน ถ้าย้ายเครื่องให้กำหนด `ZURI_GO_DATA_PLUGIN`, `ZURI_GO_BUILD_NODE` และหากจำเป็น `ZURI_GO_PYTHON` เป็นตำแหน่งติดตั้งของเครื่องนั้น ไม่ต้องคัดลอก plugin runtime เข้า source หรือปรับ protected integrity manifests

## โครงสร้าง

- `apps/web/`: Data App ทั้งหน่วย; UI ที่แก้ได้อยู่ใน src/content และต้องทำตาม nested AGENTS.md
- `apps/api/`: API, auth, services, local server, PostgreSQL migrations 001–005 และ backend tests
- `apps/metrics/`: คู่มือ/Graph ที่สร้างจาก scripts/metrics พร้อม assets/fonts/licenses และ gvm
- `assets/`, `brand/`: source logo และกติกาแบรนด์; assets ใน UI/guide เป็นสำเนาที่ใช้งานจริง
- `scripts/`: local startup, metrics generator, site/deploy packagers และ root command runner
- `tests/campaign/`: campaign model regression suite; meeting suite อยู่กับ authored model
- `docs/`: เอกสารตามมาตรฐาน docs/governance/standards — features/, domains/, architecture/, services/, operations/ พร้อมหลักฐานใน history/, migrations/, releases/; เริ่มที่ docs/README.md
- `registry/`: ทะเบียน domain/service และ crosswalk จากรหัสเอกสารเดิม (STD-003)
- `build/site/`: static files สำหรับ local พร้อม Emar launcher (FEAT-013); `build/hosted-site/`: verified hosted files ที่ไม่มี launcher/origin gate; `build/vercel/`: deploy package ที่สร้างจาก allowlist ของ hosted site
- `.local/`: config, private member handovers, backups, import staging และ logs — ไม่เข้า Git หรือ deploy

## ฐานข้อมูลและรหัสสมาชิก

Local เครื่องนี้ใช้ PostgreSQL 18.6 native ที่ 127.0.0.1:55412 ฐาน `zuri_go` schema 11 และข้อมูล persistent ใน `.local/postgres-local/data` ซึ่ง restore จาก backup Production ที่ตรวจแล้วตามอนุมัติของเจ้าของ; Docker Local เดิมที่พอร์ต 54329 ไม่พร้อมใช้บนเครื่องนี้ Production ใช้ Neon และเว็บไซต์ https://zuri-metrics-map.vercel.app/ เหมือนเดิม Local/cloud ไม่ sync กันอัตโนมัติ

Connection ของเครื่องนี้อยู่ `.local/config.json`; cloud operator config อยู่ `.local/cloud-config.json` ส่วน Vercel runtime ใช้ encrypted environment variables เดิม ไม่มี connection string ใน frontend

ไฟล์รหัสรายคนอยู่ `.local/member-access/production/`: Chef `ZGO-P0001`, Boss `ZGO-P0002`, Tong `ZGO-P0003`, K’jeab `ZGO-P0004` ส่งเฉพาะไฟล์ของเจ้าของรหัส สมาชิกใหม่ได้ PID เมื่อบันทึก profile แต่ operator ต้อง provision credential เพื่อให้ login ได้

UI JSON backup ยังเป็น export แคมเปญ/งาน ไม่รวม attachment bytes และ business-domain ทุกตาราง ใช้ full SQL backup สำหรับสำรองครบ ห้าม reset/reimport ฐานเพื่อแก้ปัญหา path

ดู [แผนที่เอกสาร](docs/README.md), [สถาปัตยกรรมปัจจุบัน](docs/architecture/README.md), [การดูแลระบบ](docs/operations/RB-001-runbook.md), [ผลตรวจการย้ายและ version diff](docs/migrations/verification.md)
