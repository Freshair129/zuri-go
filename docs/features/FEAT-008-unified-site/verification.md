# Unified site v0.1.0 — ผลตรวจและเผยแพร่

วันที่ 30 กันยายน 2026 · C-2 · Risk MEDIUM · ตาม [spec ที่อนุมัติ](spec.md)

รวมเว็บไซต์และเผยแพร่ production สำเร็จที่ **https://zuri-metrics-map.vercel.app/** โดยคง app ID, ข้อมูลอ้างอิง, storage namespace และรูปแบบกราฟเดิม

## Version diff

| ก่อน | v0.1.0 |
|---|---|
| Dashboard และคู่มือเปิดคนละพอร์ต/ชุด deploy | หนึ่ง origin และหนึ่ง deployment |
| Dashboard มีเมนู Marketing และ Meeting | เพิ่ม ความรู้ Metrics และ Graph View |
| คู่มือไม่มีทางกลับ Dashboard | เพิ่มเมนูร่วมทั้งสี่ส่วน พร้อมหน้าปัจจุบันและ keyboard focus |
| Menu อาจหลุดจากจอเมื่อเปลี่ยน hash | เมนูคู่มือ sticky และวัดความสูงตามการขึ้นบรรทัดบนมือถือ |
| ต้องประกอบไฟล์เผยแพร่เอง | Packager ตรวจ manifest/hash และปฏิเสธไฟล์ที่ไม่อยู่ในรายการ |

ดู [source diff](../../history/unified-site-review/version-diff.patch); ไฟล์ใหม่คือ `projects/campaign-mission-control/build_unified_site.py`, `test_unified_site.py`, spec/verification นี้ และ [RCA ของ navigation](../../../.brain/rca/unified-site-navigation.md)

Graph JavaScript, Graph CSS, Graph HTML และ CSS ของคู่มือเดิมตรงกับสำเนาก่อนแก้ทุก byte ใน string constant ตาม [ผลเปรียบเทียบ](../../history/unified-site-review/preserved-graph.json) ไม่มีการเปลี่ยน KPI หรือ formulas

## ผลตรวจ

| การตรวจ | ผล |
|---|---|
| Mission Control build + protected runtime integrity | PASS; buildStatus complete, 18 authored modules, 10 assets |
| Campaign/Meeting domain regression | 63 tests PASS |
| Packaging guardrails | 5 tests PASS: verified bytes, tampering, path escape, private file preservation, generated-file replacement |
| Metrics static check หลังแก้ navigation | PASS: 18 หน้า, 40 graph terms, mascot pair ทุก 18 หน้า, ไม่มีไฟล์/anchor ขาด |
| Local browser navigation | Marketing ทั้งห้าแท็บ, Meeting, guide, graph เปิดได้; ไปคู่มือแล้วกลับมายังเห็น 5 งานและ 4 Members เดิม |
| Local graph/guide interaction | 2D/3D, Warm background, ค้นหา CTR, เปิด node detail, ลิงก์กลับ guide, Previous page ผ่าน |
| Mobile 390 × 844 | เมนูขึ้นบรรทัด ไม่หลุดจอหลัง hash navigation; แตะลิงก์กลับ Meeting ได้ ดู [ภาพ](../../history/unified-site-review/mobile-guide.png) |
| Hosted package | 27/27 payload files ตอบ HTTP 200 และ SHA256 ตรงทุกไฟล์ รวม path ที่มีช่องว่าง ดู [หลักฐาน](../../history/unified-site-review/production-http-checks.json) |
| Production browser | Dashboard → ความรู้ → Graph → Meeting อยู่ origin เดียว; 2D/3D และ CTR detail ผ่าน; Meeting reload พร้อม Kanban 5 งาน; ไม่พบ console errors ที่ตรวจ |
| Print | ตรวจ print CSS ว่าซ่อนเมนูใหม่ และยังมีทุก guide page; ไม่ได้ render PDF ใหม่ในรอบนี้ |

68 automated tests ผ่านในรอบนี้ ไม่ได้ทดสอบ export/import backup ผ่าน UI ซ้ำ; logic เดิมไม่เปลี่ยนและ regression ครอบคลุม serialization/restore เดิม การหมุน 360°/zoom คง graph script เดิมและผ่าน static checks; รอบนี้ไม่ได้วัดมุมหมุนจาก gesture ครบ 360°

## Production

- Project: `zuri-metrics-map` / `prj_8f3zf1qaZnRcAvWabOv1PWAPIABG`
- Team: `pornpons-projects`
- Deployment: `dpl_9ePeQBZbiFhfdQ1Hw5NrUby5sXcX` · READY · production
- Immutable URL: https://zuri-metrics-pivnl6k41-pornpons-projects.vercel.app
- Public URL: https://zuri-metrics-map.vercel.app/
- ตรวจ candidate HTML, guide, snapshot และ manifest ให้ hash ตรงก่อน `promote`; จากนั้นตรวจ production โดยไม่ใช้ credentials และเปิดผ่าน browser จริง
- Candidate URL มี Vercel Authentication จึงใช้ Vercel CLI authenticated fetch; ไม่เปลี่ยนการตั้งค่า deployment protection
- ก่อนเปลี่ยน: `dpl_3DihkwHcpdyFKGgqYq7X8aLWz9VN` / `https://zuri-metrics-2vsz1toqh-pornpons-projects.vercel.app` เก็บเป็นจุดอ้างอิงหากต้อง rollback; รอบนี้ไม่ได้ rollback

| หน้า | URL |
|---|---|
| Marketing | https://zuri-metrics-map.vercel.app/?view=1&tab=overview |
| Meeting & Task Manager | https://zuri-metrics-map.vercel.app/?view=1&tab=meeting-task-manager |
| ความรู้ Metrics | https://zuri-metrics-map.vercel.app/metrics/#overview |
| Graph View | https://zuri-metrics-map.vercel.app/metrics/#metrics-graph |

HTML hash: `80419d584df4f0ba99aa78ff3b458454dc22ebfe0cf04c80e80398f2b2dbc04d`  
Snapshot hash: `547f3c07ea7f61f878053a0d0060c0ae7c1646d45825f1fae68be88a9f917ae1`  
App ID: `dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1`

## Rebuild / deploy

รันจาก workspace หลังแก้ source ที่เกี่ยวข้อง:

```text
python projects/campaign-01/build_metrics_map.py
node <data-analytics plugin>/scripts/data-app.mjs build --project-dir output/draft/campaign-mission-control --separate-data
python projects/campaign-mission-control/build_unified_site.py
python projects/campaign-mission-control/test_unified_site.py
python projects/campaign-01/verify_metrics_map_static.py
```

จาก `output/draft/unified-site/` เท่านั้น:

```text
npx --yes vercel@61.1.0 deploy --dry --json --yes --project prj_8f3zf1qaZnRcAvWabOv1PWAPIABG --scope pornpons-projects
npx --yes vercel@61.1.0 deploy --prod --skip-domain --yes --project prj_8f3zf1qaZnRcAvWabOv1PWAPIABG --scope pornpons-projects
```

ตรวจ deployment ที่ได้ ก่อน `vercel promote <verified-deployment-url> --scope pornpons-projects` ไม่ deploy workspace root และไม่เพิ่ม browser backups/token/เสียงประชุมใน generated directory

## ขอบเขตข้อมูลและ FUNG

- ข้อมูลที่กรอกยังอยู่ใน browser ของแต่ละ origin ไม่มี shared database/login เพิ่มขึ้น
- ย้ายข้อมูลจาก `http://127.0.0.1:4319` ไป production ด้วย **Backup JSON → Restore backup**; การ deploy ไม่ได้ย้ายข้อมูลส่วนตัวอัตโนมัติ
- Preview เดิมที่ port 4319 เปลี่ยนมาเสิร์ฟชุดรวมแล้ว จึงยังอ่านข้อมูลใน origin เดิมได้
- FUNG ยังคงเป็น local connector; ยังไม่ได้ยืนยันการเชื่อมต่อจาก HTTPS production กับ FUNG ที่ติดตั้งจริง/Whisper runtime ในรอบนี้
- ไม่มีการย้าย artifact ไป `output/approved/`
