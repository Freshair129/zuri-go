---
title: Original commercial pipeline diagram verification
status: draft
superseded_by: null
date: 2026-10-04
evidence_scope: original-2026-10-03-and-2026-10-04-checkpoints
---

# Original verification — historical observations

Copied from the former draft README during the SoT restructure. Reported browser results belong to the original overview only; they are not a new browser run after the move. Narrative paths and counts below describe their original checkpoint. Current sources: [ARCH-005](../../architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md).

## Skill installation receipt


- Requested source: <https://github.com/cathrynlavery/diagram-design>
- Installed skill: `C:/Users/freshair/.codex/skills/diagram-design`
- Source subdirectory: `skills/diagram-design`
- Pinned commit at installation: `f903933a534ba92cde1c85a28186267b3a317bb2`
- Skill metadata version: `2.6`
- Installed with the bundled `skill-installer` helper; this is a standalone skill installation, not a marketplace auto-update registration
- Used the skill's static SVG/HTML, Swimlane, semantic-pattern selection, print sizing, connector and accessibility guidance
- Branding uses the existing project instructions as the approved source for this document; no global skin/profile/marker was changed
- All content is embedded in one HTML except its allowed Google Fonts stylesheet; no JavaScript, API calls or real customer records

## Acceptance and verification

Acceptance: มีภาพหลัก 1 หน้า; แยกเจ้าของ Marketing / AI / Sales / Weekly review; มี Ads A/B, stats, first chat, AI, phone permission, handoff, โทร, จ่าย, ส่งมอบ; มีสถานะเคสค้าง/จบ; อธิบาย metric ทุกขั้นและ attribution/cohort; ไม่มีตัวเลขยอดจริงที่แต่งขึ้น

ตรวจใน checkout `O:/zuri-go` วันที่ 2026-10-03 ไม่ใช้ผลตรวจเอกสารแทนหลักฐานระบบหรือ production

| Check | Status | Evidence |
|---|---|---|
| Skill files installed | PASS | Installer returned installed path; SKILL.md and packaged self_check.py read locally |
| HTML/SVG self-check | PASS | Packaged `scripts/self_check.py` returned OK; accessible title/desc and single-file checks passed |
| Browser rendering / Thai font / geometry | PASS | Codex in-app browser; Manrope, IBM Plex Sans Thai and IBM Plex Mono loaded; computed families match; 7 nodes / 7 connectors; no text extends beyond a node box; full-page screenshot inspected |
| Narrow screen | PASS | Viewport 390px: document/local scroller 375px, diagram scroll width 1120px, min-width 1120px, overflow-x auto; temporary viewport reset |
| Print CSS | PASS | Emulated print: SVG 1122.516 × 793.688 CSS px = 297 × 210mm; min-width released; overflow visible; screen note hidden; emulation reset |
| Actual print / PDF page count | NOT_RUN | Physical print and PDF export not performed |
| Documentation links and diff | PASS | 9 relative Markdown links resolve; new files reviewed with `git diff --no-index --check`; tracked `git diff --check` clean |
| Live Ads / LINE / AI / calls / payments | NOT_RUN | Design task only; no connected-account execution |
| Application build / tests / deploy | NOT_RUN | No application code changed |

## Version diff

| Before | v0.1.1 draft |
|---|---|
| ไม่มีสกิลนี้ใน Codex skill directory | ติดตั้ง diagram-design 2.6 จาก commit ที่ระบุ |
| คำอธิบาย Flow ในแชต | เพิ่ม HTML คู่มือภาพ 1 หน้า พร้อม README และ preview.jpg จากเบราว์เซอร์ |
| ขั้นตอนหลักยังไม่มีนิยามการนับ | เพิ่มสถานะ, event fields, metrics, A/B rules, weekly/cohort views เป็นข้อเสนอ |
| รายละเอียดอยู่รวมใน overview | เพิ่ม 3 คู่มือโดเมนและ 21 flow diagrams พร้อมสารบัญ, contract, exception, KPI และ TBD owner |
| Application / schema / deployment | ไม่เปลี่ยน |

ก่อนนำไปเชื่อมระบบจริงยังต้องยืนยันสินค้า ช่องทาง Ads/OA ที่ใช้ CRM/พื้นที่เก็บ Lead, ช่องทางชำระเงิน ผู้รับเคส SLA งบทดลอง และเกณฑ์ qualification/attribution/window; งานนี้ส่งมอบร่างเอกสารสำหรับการตัดสินใจเหล่านั้น
