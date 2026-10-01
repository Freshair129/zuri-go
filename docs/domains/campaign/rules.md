# DOM-CAM — business rules

The invariants of [DOM-CAM](README.md) ([STD-001 R1](../../governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md): BR). Each is declared by its heading ([STD-002 R2](../../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)) and promoted, without changing the source, from a sentence of the “Business rules” of the domain README ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10); each quotes that sentence. All are `proposed`. The location of this file extends [STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md), which names no file for a domain's rules (see the notes of this change). The README's last rule, that the Workboard shows the campaign's tasks from the task records, is stated by FR-010-013 and FR-010-014 and is not repeated here.

### BR-003 — Each campaign has its own objective and KPI set
Relations: relates_to: FEAT-002, API-010
Owner: DOM-CAM

**Status:** proposed. **Statement.** The system SHALL let each campaign choose its own objective and KPI set, and SHALL NOT force one north-star metric (for example ROAS or sales) on every campaign.

**Source.** [DOM-CAM README](README.md): “Each campaign has its own objective and KPI set; no single north-star metric is forced on every campaign” ([FEAT-002 spec §1.1](../../features/FEAT-002-campaign-mission-control/spec.md): “เลือก objective แยกต่อ campaign; ไม่บังคับทุก campaign ใช้ ROAS หรือยอดขายเป็น North Star”). **Enforced by.** the `objective` column of each campaign (`inventory`, `commerce`, `leads` or `awareness`), which API-010 refuses to change on its own because the KPIs and goals change with it.

### BR-004 — Normal-price sale comes first, and a conditional package needs enough data
Relations: relates_to: FEAT-002
Owner: DOM-CAM

**Status:** proposed. **Statement.** A campaign SHALL sell at the normal price first and be reviewed; a conditional package SHALL be considered for release only when that review shows enough data and the criteria are not met, and if normal sales work no package is released only because the week changed.

**Source.** [DOM-CAM README](README.md): “Normal-price sale comes first; a conditional package release needs enough data” ([FEAT-002 brief](../../features/FEAT-002-campaign-mission-control/brief.md), “Confirmed user direction” items 2, 3 and 6). **Enforced by.** the design of FEAT-002 (Plan & Gates and Review); the code was not checked for this rule and the API has no gate of its own.

### BR-005 — A week change is a review checkpoint, never an automatic approval
Relations: relates_to: FEAT-002
Owner: DOM-CAM

**Status:** proposed. **Statement.** A change of week SHALL create a review checkpoint and SHALL NOT approve the release of an offer automatically.

**Source.** [DOM-CAM README](README.md): “a week change is a review checkpoint, never an automatic approval” ([FEAT-002 spec §1.1](../../features/FEAT-002-campaign-mission-control/spec.md): “การเปลี่ยนสัปดาห์สร้าง review checkpoint; ไม่ได้อนุมัติเปิด offer อัตโนมัติ”). **Enforced by.** the design of FEAT-002; the code was not checked for this rule.

### BR-006 — Scheduling a publication records a plan; nothing is posted automatically
Relations: relates_to: FEAT-002, ARCH-002, API-012
Owner: DOM-CAM

**Status:** proposed. **Statement.** Scheduling a publication SHALL record a plan only; the system SHALL NOT post to a channel by itself, and a published publication SHALL be a confirmation (a link or a note) of something a person posted.

**Source.** [DOM-CAM README](README.md): “Scheduling a publication records a plan; nothing is posted automatically” ([ARCH-002 §3.8](../../architecture/ARCH-002-postgresql-data-model.md): “ไม่มี auto social publish ในเฟสนี้”). **Enforced by.** `apps/api/service.mjs:save` (`publications`) only writes rows; the API makes no outbound call to a channel (its one outbound call is the optional loopback AI model, SEC-018).

### BR-007 — Plan figures are labelled plan or scenario, and actuals and benchmarks are never invented
Relations: relates_to: FEAT-002, FEAT-001, API-015
Owner: DOM-CAM

**Status:** proposed. **Statement.** A figure that comes from a plan or a model SHALL be labelled as a plan or scenario, and the system SHALL NOT present an assumed value as an actual or invent a benchmark; a number that is not known is shown as unknown.

**Source.** [DOM-CAM README](README.md): “Plan figures are labelled plan/scenario; actuals and benchmarks are never invented” ([FEAT-002 brief](../../features/FEAT-002-campaign-mission-control/brief.md): actual, original plan, approved target, forecast and modeled scenario are kept apart, and no assumed data is shown as actual). **Enforced by.** the design of FEAT-002; for stored actuals, API-015 requires a `source_ref` for every observation (`ระบุที่มาของตัวเลข`).
