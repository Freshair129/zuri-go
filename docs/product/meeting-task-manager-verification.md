# Meeting & Task Manager v0.3.0 — implementation verification

Date: 2026-09-30 · RWANG · C-3 / HIGH

Approval: user approved v0.3 documentation before implementation. Local manual/member/weekly features are implemented. FUNG source and isolated fixture integration are verified; installed desktop/audio/model acceptance remains pending. No production deployment, user-source replacement or team messages occurred.

## Version diff

| ก่อน | หลัง v0.3.0 |
|---|---|
| Mission Control 5 campaign views | เพิ่ม Meeting & Task Manager ใน app ID เดิม พร้อม Weekly / Meetings / Tasks / Members |
| Weekly seed เป็นเอกสาร | 5 งาน/4 สมาชิกใน IndexedDB; PIC ตามผู้ใช้, A/due/priority ว่าง, C/I เป็นข้อเสนอ |
| ยังไม่มีทะเบียนทีม/งาน standalone | เพิ่ม/แก้ Member, Inactive, manual task และ RACI ด้วย stable member IDs |
| รายละเอียดที่เติมภายหลังเป็นข้อเสนอ | สร้างด้วยชื่ออย่างเดียวได้ กลับมาเติม Thai multiline details/notes โดยคง task/member identity |
| ไม่มี MoSCoW ในโดเมน | Priority ต่อ task+week, badge/filter/sort, Won’t shelf, history และ summary M/S/C |
| Backup เฉพาะ campaign v1 | Combined v2, v1 compatibility, validation และ recoverable cross-store restore journal |
| FUNG ไม่มี normalized integration routes | Adapter capabilities/snapshot/action-drafts พร้อม hash/evidence validation ใน isolated worktree |

## Evidence

- App source: `campaign-mission-control/src/content/meeting/`; root composition in `src/content/dashboard/DashboardContent.jsx`. Authored boundary/integrity build passed using installed prebuilt runtime. Protected shell/runtime not changed. Stable app ID: `dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1`.
- Node suite: **63 passed**, including 35 existing campaign regression tests and 28 domain/connector tests. Covers nullable details, per-week priorities, member identity/lifecycle, Done requirements, stale edits/sources/reviews, exact finite evidence, deterministic receipts, loopback credentials and safe upload headers.
- Real browser IndexedDB harness: **9 passed**, covering seed replay, rollback, failed validation, concurrent version conflict, reload/new connection, journal write exclusion, recovery and cross-store rollback/restore.
- Browser QA isolated on port 4320: name-only Member/task, later details and leading-zero phone, assignment, Won’t shelf, Should/Must, Done rejection then valid Done with due date blank, List/RACI filters, native drag from planned to doing, reload persistence, campaign projection/backlink, Backup v2 download/restore and v1 restore preserving 7 test tasks/5 test members. Download JSON was parsed and verified not to contain the fixture bearer token.
- Browser FUNG fixture: authenticated connection → legacy snapshot → edit Thai text and speaker → reviewed revision → production adapter/action transport → human R/Must → one task/quote/backlink → same-request replay still one task → reload/reimport stable → authenticated mic audio blob loaded/played. Local transport used `qa-fixture:not-real`; this does not prove actual model inference. Native revision handling is covered by Rust fixtures.
- Responsive check: desktop at 1265px; mobile iframe at 390px (375px content after scrollbar), body/main content width 375px, board scrolls internally. Member dialog 335px and content 318px. Both approved mascot assets reused; amber/dotted surface and existing theme retained. Phone hardware/touch gesture acceptance not run.
- FUNG focused Rust filters: adapter **15 passed**, Local API **25 passed**, local model **5 passed** (two tests overlap filters). Independent review fixes verified; production-handler QA listener stopped. [Detailed FUNG report](C:/Users/pc/workspace/fung-meeting-task-manager/docs/verification/implementation-reports/2026-09-30-meeting-task-manager-local-adapter.md).

## Requirement trace

| Requirement | Result / boundary |
|---|---|
| MT-01–04 navigation, seed, Kanban, RACI | PASS local browser + model tests |
| MT-05 connection | PASS fixture auth/errors; installed FUNG not replaced |
| MT-06 audio intake | Client/receipt/contract implemented; real upload/Whisper NOT_RUN |
| MT-07–08 provenance/review | PASS unit/Rust/browser fixture; raw and reviewed revisions separated |
| MT-09 extraction | PASS production adapter with local transport fixture; configured real model inference NOT_RUN |
| MT-10–13 evidence/assignment/idempotency/persistence | PASS model/IndexedDB/browser fixture |
| MT-14 backup | PASS v2 round trip and v1 compatibility; synthetic test origin only |
| MT-15 source handling | PASS bounded local model request; no contact registry, tools or external dispatch sent |
| MT-16 campaign link | PASS browser same task opens from Workboard; 35 campaign regressions pass |
| MT-17 UI/brand | PASS desktop, 390px layout and accessible native select alternative; physical touch not run |
| MT-18 complete real audio-to-task chain | PARTIAL: browser chain after supplied transcript passed; actual desktop/ASR/model pending |
| MT-19–29 manual/member/details/MoSCoW | PASS local model/browser/IndexedDB and backup checks |

## Architecture review

Campaign schema/localStorage remain owned by the existing model. New task/member/meeting data live in one versioned IndexedDB record, so tasks, weekly entries, events and commit receipt change atomically. Compare exact serialized commit payload as well as retaining its SHA-256 fingerprint; a changed retry is rejected. Source/review snapshots remain immutable. FUNG bearer is memory-only, header-only and loopback-only. Reviewed source hashes are rechecked before task commit. Combined restore stages a journal and reconciles campaign storage before replacing the domain. No new shared auth, provider selection or cloud owner is introduced.

## Reproduce

From `D:/zuri-brand-kit/output/draft/campaign-mission-control`, run Node tests:

```powershell
& 'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' --test src/content/meeting/model.test.mjs D:/zuri-brand-kit/projects/campaign-mission-control/model.test.mjs
```

Build through installed Data app CLI `data-app.mjs build --project-dir <app> --separate-data`. To run IndexedDB checks, serve the app root on an isolated test origin and open `src/content/meeting/tests/repository.html`; it uses a unique synthetic database and does not access the application namespace. `tests/responsive.html` checks the same app through a 390px iframe. QA files are not imported by the bundle.

## Remaining acceptance

FUNG changes are uncommitted in `C:/Users/pc/workspace/fung-meeting-task-manager`, branch `feature/meeting-task-manager-local`. Desktop frontend/resources, including `.venv-whisper`, are not staged in that isolated checkout. The desktop executable was not built or launched. Running another desktop against the user's active ledger was not attempted. The current installed FUNG may support legacy transcript import but cannot serve the new adapter until built. Actual audio/Whisper and configured model tests remain open; do not describe fixture results as production or real inference.

RCA records: [finite evidence validation](../../.brain/rca/meeting-task-manager-evidence-validation.md), [connector/form contract corrections](../../.brain/rca/meeting-task-manager-connector-ui.md). Build status `complete` describes completed authored UI output, not completion of the remaining installed-runtime acceptance.
