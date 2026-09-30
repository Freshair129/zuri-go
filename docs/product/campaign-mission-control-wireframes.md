---
version: "0.1.0"
created_at: "2026-09-29"
status: design-wireframe
author: RWANG
parent: campaign-mission-control-spec.md
---

# Campaign Mission Control — screen blueprint

แบบสำหรับ review โครงหน้าและลำดับการใช้งาน ไม่ใช่หน้าจอ live ตัวเลขแผนจาก MUJEEN แสดงเป็น Plan/Scenario; Actual ทุกช่องยังไม่มีข้อมูล

[Requirements and metric contracts](campaign-mission-control-spec.md) · [Existing Metrics Map](../../apps/metrics/index.html)

## Screen 1 — Overview / สิ่งที่ต้องตัดสินใจวันนี้

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ ZURI     MISSION CONTROL                  Campaign [ MUJEEN M1 ▾ ]       │
│ Objective: Inventory clearance           Period [ Start–End: TBD ]       │
│ Overview · Performance · Plan & Gates · Workboard · Review & Decisions   │
├───────────────────────────────────────────────────────────────────────────┤
│ DATA: ยังไม่เชื่อมข้อมูล    TZ: Asia/Bangkok (proposed)  [ดูแหล่งข้อมูล] │
│ Normal / D1–D7 → G1 review → DESTINY (conditional) → G2 → Next offer     │
├──────────────────────────────────────────────┬────────────────────────────┤
│ OUTCOME                 OUTCOME              │ NEXT DECISION              │
│ Net units — / 108       Contribution —       │ G1 / หลังขายปกติ 7 วัน   │
│ Plan goal               Floor: TBD           │ สถานะ: ยังไม่เริ่ม        │
│                                              │                            │
│ GUARDRAIL                                    │ □ ข้อมูล/จำนวนตัวอย่างพอ  │
│ Spend — / approved cap: TBD                  │ □ ผลเทียบ Low/Mid/High     │
│                                              │ □ margin / stock / budget  │
│ ACTUAL vs PLAN                               │ □ งานเตรียม offer ครบ      │
│ [actual appears only after source data]      │                            │
│ Unit target path · actual · forecast         │ [ เปิด review checkpoint ] │
│ Gap · days remaining · required units/day    │                            │
├──────────────────────────────────────────────┼────────────────────────────┤
│ TASKS DUE BEFORE REVIEW                      │ REVIEW COMPANIONS          │
│ งาน / Owner / Due / Blocker / Evidence       │ zuri: อธิบายผลและทางเลือก │
│ [แสดงงานที่มอบหมายจริง]                      │ น้องวางใจ: ชี้เงื่อนไขค้าง │
├──────────────────────────────────────────────┴────────────────────────────┤
│ OFFER SNAPSHOT: active dates · units · orders · CVR n/N · contribution    │
│ Normal | DESTINY: ยังไม่เปิด | PAIR: ยังไม่เปิด | COMPLETE: ยังไม่เปิด   │
└───────────────────────────────────────────────────────────────────────────┘
```

หน้าแรกเน้นคำตัดสินใจที่ใกล้ถึงและผลลัพธ์หลัก คลิก metric หรือ offer เปิด detail ทางขวา; graph คำศัพท์อยู่ในคู่มือที่เชื่อมออกไป ตัวเลขทั้งหมดมีช่วงเวลาและฐานการนับ

## Screen 2 — Performance / หาเหตุที่ตัวเลขเปลี่ยน

| Area | What the user sees | Drill-down |
|---|---|---|
| Scope controls | Phase, active date range, channel, offer, cohort | Reset returns to the campaign scope |
| Marketing drivers | Spend, reach within source scope, impressions, clicks, CTR and CPL | Creative / audience comparison with denominators |
| Sales funnel | Leads → MQL → SQL → sale for the same eligible cohort; pending maturity separate | Stage definitions, lost reasons, response SLA |
| Offer comparison | Normal / DESTINY / PAIR / COMPLETE side by side, with active days, leads n, orders, units, AOV, CPO and contribution | Acquisition offer versus purchased offer; no false 0 for unreleased offers |
| Inventory detail | Available by SKU, reserved units, package capacity and explicit overstock target | BOM and stock movement evidence |
| Companion roles | zuri explains the selected metric; น้องวางใจ highlights maturity/coverage | Reuse reference poses in a different contextual placement |

Every comparison table keeps unlike periods visible as a caveat rather than silently ranking them as equivalent.

## Screen 3 — Plan & Gates / ทำอะไรต่อได้บ้าง

```text
CAMPAIGN PLAN                TARGETS                       SCENARIOS
Monthly goal: 108 units      Low: TBD                     CVR: 2 / 5 / 10%
Current phase: Normal       Mid: approved goal           Original mix: 8/20/15
Next gate: G1               High: TBD                    Phased reforecast: due

G1 REVIEW                                         DECISION RECORD
1. Hard constraints                               ○ Continue normal
2. Data eligibility + mature sample                ○ Fix diagnosed issue
3. Actual versus approved phase targets            ○ Release DESTINY
4. Offer diagnosis + launch readiness              ○ Hold / close test
5. Remaining budget, stock and test time
                                                  Owner / reason / effective time
zuri: สรุปทางเลือกและข้อแลกเปลี่ยน                  Next check / linked tasks
น้องวางใจ: แสดง gate ที่ยังไม่ผ่าน                  [ บันทึกคำตัดสิน ]
```

การบันทึกคำตัดสินไม่เท่ากับการเปลี่ยนราคา/งบในระบบภายนอก ต้องมีผู้รับผิดชอบและหลักฐานว่าเปิด offer จริงแล้วจึงเริ่มนับหนึ่งสัปดาห์สำหรับรอบถัดไป

## Screen 4 — Workboard / จากสัญญาณไปสู่งานที่ปิดได้

| Queue | Required information | Example action type |
|---|---|---|
| Due before next gate | Owner, due, linked gate, dependencies | Prepare DESTINY launch assets after release decision |
| Blocked | Blocker, unblock owner, elapsed time | Missing actual packaging cost or unverified checkout |
| Doing / Review | Acceptance criterion and evidence | Price check, attribution trace, follow-up process |
| Done / outcome pending | Deliverable complete, recheck date | New creative live; evaluate eligible cohort later |

Task drawer: trigger evidence → hypothesis → assigned action → definition of done → evidence → outcome recheck. zuri explains the action; น้องวางใจ marks missing proof or the next check. Counts refer to real tasks; task completion is not a KPI-success score.

## Screen 5 — Review & Decisions / สรุปที่อธิบายได้

Weekly review is one editable summary linked to its evidence snapshot:

1. Phase and observed period; data-ready versus provisional metrics.
2. Outcome versus target, gap, budget and margin.
3. Offer/cohort results and inventory constraints.
4. Work delivered, remaining blockers and observed outcome changes.
5. Decision: continue / fix / release / scale / pause / close, with owner and reason.
6. Next seven-day work, released budget and next checkpoint.

Show the original 43-order scenario beside the current reforecast only when it helps explain a change in offer mix. Keep the original baseline visible in history; do not rewrite earlier weeks to match new targets.

Both mascots remain in the review footer: zuri summarizes the evidence; น้องวางใจ flags unresolved assumptions. Summary prose distinguishes observed facts from proposed explanations.

## Responsive behavior and visual direction

- Desktop: a wide main evidence area and a narrower decision/detail area; no floating graph obstructing tables.
- Mobile: next decision first, then outcome measures, trend, tasks and offer detail; a detail view replaces the narrow sidebar.
- Canvas #F7F8FA with a visible quiet dot field; white data surfaces; ink #1F2937; amber #E8820C on the primary CTA and selected state.
- Status uses text/icon plus the brand's semantic colors. Data-held and unconfigured states use neutral treatment.
- Reuse the outlined wordmark and locked mascot identity. Use chart, analysis and clipboard pair poses contextually rather than repeating one image in one corner.

## Design review checklist

- [x] Current campaign, objective, phase, period and source status are visible.
- [x] Headline outcomes are limited and have roles; detailed diagnostics have a separate view.
- [x] Normal-first and conditional DESTINY-first sequence matches user confirmation.
- [x] A review may conclude continue, fix, release, hold or close.
- [x] Low/Mid/High scenarios are separate from approved targets and spending caps.
- [x] Work and decisions link back to metric evidence.
- [x] Both mascots have distinct roles on all five logical views.
- [ ] Rendered screen and interaction checks: to perform after implementation approval.

Version diff: no prior Mission Control wireframe → five-view design v0.1.0. This document does not claim visual or runtime verification of an application.
