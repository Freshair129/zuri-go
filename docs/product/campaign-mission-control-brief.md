---
version: "0.2.0"
created_at: "2026-09-29"
last_update: "2026-09-29"
status: implemented-local
author: RWANG
complexity: C-2
risk: MEDIUM
---

# Campaign Mission Control — design brief

## Intent

ออกแบบพื้นที่ทำงานสำหรับเจ้าของแคมเปญ การตลาด ฝ่ายขาย และผู้ดูแลสินค้า ให้ตอบได้ว่าแคมเปญอยู่ตรงไหนเทียบกับเป้า ควรทำอะไรต่อ ใครรับผิดชอบ และมีหลักฐานเพียงพอให้เปลี่ยน offer หรือเพิ่มงบแล้วหรือยัง

รองรับหลายแคมเปญ โดยเลือก objective และ KPI แยกต่อ campaign ตามคำยืนยันของผู้ใช้วันที่ 29 September 2026 ใช้ MUJEEN M1 เป็นกรณีออกแบบแรกภายใต้หน้าตา zuri; ตัวเลข MUJEEN ไม่ใช่ผลประกอบการหรือเป้าของ zuri

## Confirmed user direction

1. ระยะเวลาแคมเปญหนึ่งเดือน; ยังไม่มีวันเริ่ม/สิ้นสุดจริง
2. D1–D7 ขายปกติ แล้วทบทวนผล
3. ถ้าไม่เวิร์กตามเกณฑ์ที่กำหนดและมีข้อมูลพอ จึงพิจารณาเปิดแพ็กเกจ 1
4. แพ็กเกจ 1 คือ DESTINY — สุ่มรับ 1 องค์ / 5,555 บาท
5. วัดผล DESTINY ในรอบหนึ่งสัปดาห์นับจากเปิดจริง ก่อนพิจารณาเปิดแพ็กเกจเพิ่มเติม
6. ถ้าขายปกติได้ผล ไม่ต้องเปิดแพ็กเกจเพราะเปลี่ยนสัปดาห์
7. LUCKY PAIR / COMPLETE 4 เป็น offers ที่มีในแผน; ลำดับเปิดถัดจาก DESTINY และการคง/ปิด offer เดิมยังเป็นรายการตัดสินใจ

คำสั่งในแชตข้างต้นเป็นลำดับการดำเนินงานล่าสุด เหนือกว่า Phase 1 ที่เสนอให้ validate Pair และ Complete พร้อมกันในเอกสารแนบ

## Scope and deliverables

- Design specification: `output/draft/campaign-mission-control-spec.md`
- Screen wireframes and review flow: `output/draft/campaign-mission-control-wireframes.md`
- Objective templates, KPI definitions, targets, cutoff/gate rules, task tracking, review summary, data requirements และ acceptance scenarios
- เป้าตัวเลขที่มีหลักฐานมาจากแผน MUJEEN; ค่าอื่นใช้ TBD ไม่สร้าง actuals หรือ benchmark ขึ้นเอง
- ผู้ใช้อนุมัติแบบแล้วในแชตวันที่ 2026-09-29; รอบนี้สร้าง dashboard แบบ local พร้อมบันทึกข้อมูลและงานด้วยตนเองตามสเปก แหล่งข้อมูล live และ deployment ยังไม่มีการตั้งค่า

## Source and peer alignment

| Layer | Source | How it controls this design |
|---|---|---|
| Human | คำสั่งและคำตอบผู้ใช้ในแชต 2026-09-29 | Multi-objective campaigns; normal-first; conditional DESTINY launch; weekly review |
| Parent brand | `brand/brand-profile.md`, `brand/text-rules.md`, `brand/do-dont.md` | Thai UI, exact brand tokens, outlined logo, dot field, distinct mascot roles |
| Supplied business plan | `C:/Users/pc/Downloads/MUJEEN_GTM_M1_Offer_AOV_Lead_Budget_Revision_2026-09-25(1).md` | Offers, original 108-unit scenario, economics assumptions, conversion scenarios and diagnostic metrics |
| Peer | `projects/campaign-01/brief.md`, `output/draft/campaign-01_metrics-graph-spec.md`, Metrics Map REV 04 | Existing metric definitions and links; same terminology and mascot identities |

The supplied `(1).md` and earlier file have the same SHA-256: `782B9DD9D571B0D6DD05CCFDECF2402E69B9F804B7BCFAEF46E64746AEE056A4`.

## Design principles

- หน้าแรกให้เห็นผลลัพธ์และการตัดสินใจที่ต้องทำ ไม่แสดงทั้ง 40 metrics เป็น KPI หลัก
- แยก actual, original plan, approved target, forecast และ modeled scenario
- แยกการเปิด offer ออกจากการเพิ่มงบ; ผ่านข้อหนึ่งไม่ถือว่าผ่านอีกข้อ
- แสดง data freshness, จำนวนตัวอย่าง และ cohort maturity ใกล้ผลที่ใช้ตัดสินใจ
- คำว่า cutoff ต้องระบุว่าหยุดอะไร: หยุดเพิ่มงบ, พัก offer, รอข้อมูล หรือปิดการทดสอบ
- ทุก action มี owner role, due date, linked KPI/rule และหลักฐานปิดงาน
- Graph view ใช้ค้นความหมายของ metrics จากคู่มือ; หน้าหลักใช้ trend, comparison และ action queue
- ใช้ทั้ง zuri และน้องวางใจในทุก logical view โดยทำหน้าที่อธิบายและชี้สัญญาณตามลำดับ ใช้ภาพอ้างอิงเดิมและสลับ pose/ตำแหน่งตามเนื้อหา

## Definition of design done

- หน้าจอแต่ละหน้าตอบคำถามต่างกันและเชื่อมกลับ KPI/decision ได้
- มี decision path สำหรับ continue, fix, release DESTINY, release next offer, hold และ close
- มี Low/Mid/High ทั้งแบบ scenario และ target bands พร้อมนิยามที่ไม่สับสน
- สมการของแผนเดิมถูกตรวจ และความเปลี่ยนแปลงจาก weekly rollout ถูกระบุ
- Requirement ที่ยังต้องกำหนดก่อนใช้งานจริงมีรายการและผู้รับผิดชอบตามบทบาท
- ไม่มีการแสดงข้อมูลสมมติเป็น actual และไม่มีการอ้างว่าทดสอบระบบที่ยังไม่ได้สร้างแล้ว

## Version diff

| From | To | Change |
|---|---|---|
| No Mission Control design | 0.1.0 | New design brief, specification and wireframes using confirmed multi-campaign and conditional weekly rollout requirements |
| 0.1.0 | 0.2.0 | Working local dashboard; five views, manual records, cutoff review, task/decision snapshots and backup/restore verified |

Design approval: approved by the user's “approve” on 2026-09-29. Implementation uses a local browser workspace with explicit manual-data provenance and exportable backups; unknown targets and actuals remain unset. Local build, 35 model checks and 26 browser checks passed. Evidence: `output/draft/campaign-mission-control-verification.md`; usage: `projects/campaign-mission-control/user-guide.md`.


