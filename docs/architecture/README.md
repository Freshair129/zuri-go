# Current architecture index

Current application version: 0.5.1. Deployment and production schema evidence: [release 0.5.1](../releases/0.5.1/verification.md) (2026-10-04). PostgreSQL schema is 11 in production after the authorized 2026-10-05 migration ([evidence](../features/FEAT-015-marketing-report-exchange/verification.md#production-migration-011--2026-10-05)). The new native Local is schema 11 after the separately authorized Production-backup restore ([Local evidence](../features/FEAT-015-marketing-report-exchange/verification.md#local-production-backup-restore--2026-10-05)); the former Docker Local remains unavailable here. These are separate states and do not synchronize automatically.
ADR-008 was approved on 2026-10-05; its implementation is present locally as migration 012 targeting schema 12. The earlier isolated schema-10-to-11 QA run predates FEAT-015 migration 011 and is not evidence for this current schema-11-to-12 candidate. Fresh schema-11-to-12 replay and focused database regressions passed in isolated QA on 2026-10-05 ([current QA record](decisions.md#current-schema-11-to-12-qa-record-2026-10-05)). Production remains application 0.5.1 / schema 11; migration 012 and deployment each require separate authorization.

อ่านตามลำดับ authority: user approval → approved cross-feature decisions (including [ADR-008](decisions.md)) → [Single-code login](../features/FEAT-007-single-code-login/spec.md) → [Member identity](../features/FEAT-006-member-identity/spec.md) → [Guest access](../features/FEAT-005-guest-access/spec.md) → amendments ใน [Cloud deployment](ARCH-003-hosted-deployment.md) / [data model](ARCH-002-postgresql-data-model.md) → [architecture baseline](ARCH-001-baseline-architecture.md). Feature and schema 6/7 audience rules record the former access model; ADR-008 supersedes them as the approved target.

เอกสาร baseline เก็บประวัติการออกแบบตั้งแต่ local-only และ shared password ข้อกำหนดเหล่านั้นถูกแทนด้วย approved Guest/Member amendments แล้ว ห้ามใช้ baseline เก่าปิด Guest หรือเปิด shared password กลับมา

- UI และ API ใช้ origin เดียว; local serve build/site, production deploy build/vercel
- Database: PostgreSQL schema 11 in both Production and the restored native Local. Neon and local databases are separate states and do not synchronize automatically.
- Hosted reads: public Guest ตาม Business เดิม; writes: same-origin + signed Member session + active/version checks ใน transaction
- Approved target under ADR-008: Guests read every non-secret record in the selected Business, including formerly restricted records, and cannot create, update, delete or internally approve. Every active logged-in Member has identical full CRUD and internal approval rights for mutable non-secret records, including Member and Team records; former audience, owner, team, assignee and RACI values do not grant or limit access. API and RLS enforce Business scope; the actor comes from the verified session.
- Audit events are readable to Guests and Members but append-only. Credential/session/provider/operator secrets remain hidden. Provider egress, spend, publication and deployment retain separate gates.
- Source implementation is present locally as schema-12 migration 012. Earlier schema-10-to-11 candidate QA predates migration 011 and is not current QA evidence; fresh schema-11-to-12 replay and focused database regressions passed in isolated QA on 2026-10-05. The deployed 0.5.1 application has its prior access behavior on production schema 11 pending separately authorized migration 012 and deployment.
- Local: trusted operator ผูก loopback; ไม่อ้างว่าผู้ทำรายการเป็น Member โดยไม่มี session
- PID เป็น public stable identifier; UUID เป็น PK/FK; credentials และ handovers แยกจาก profiles และ static package
- Data App shell อยู่ apps/web ทั้งหน่วย มี stable app ID เดิม; API import domain models จาก authored content ใน apps/web ไม่มี shared package เพิ่ม
- Metrics อยู่ apps/metrics และใช้ generator ใน scripts/metrics; /metrics/ เป็นส่วนของ site เดียว

[แผนจัดโครงสร้างที่อนุมัติ](../migrations/001-project-extraction.md) · [ผลตรวจจริง](../migrations/verification.md) · [root README](../../README.md)

## Commercial pipeline and platform relationship

[ARCH-005](commercial-pipeline/ARCH-005-commercial-pipeline.md) is the canonical draft source for the Marketing/Commercial edition context, 21 detail flows and 2 overview diagrams. [ADR-007](decisions.md#adr-007--zuri-go-as-a-marketingcommercial-edition-and-a-canonical-commercial-pipeline) records the owner-stated direction and placement. The external context map is authored once in [registry/relations.yaml](../../registry/relations.yaml); exact integration contracts remain draft.

## Artifacts in this folder

| ID | Document | Role |
|---|---|---|
| ARCH-001 | [Baseline architecture](ARCH-001-baseline-architecture.md) | Original local-only design; its local-only statements are superseded by ARCH-003 and the amendments above |
| ARCH-002 | [PostgreSQL data model](ARCH-002-postgresql-data-model.md) | Physical schema, with the 0.3.1 and 0.4.0 amendments |
| ARCH-003 | [Hosted deployment](ARCH-003-hosted-deployment.md) | PostgreSQL on Vercel (0.3.0) and its amendments; its shared-team-password statements are superseded by [FEAT-006](../features/FEAT-006-member-identity/spec.md) and [FEAT-007](../features/FEAT-007-single-code-login/spec.md) |
| ARCH-005 | [Commercial pipeline](commercial-pipeline/ARCH-005-commercial-pipeline.md) | Draft canonical cross-system source, chapters and linked visual views; service/domain boundaries and proposed sending contract |
| ADR-002 – ADR-004 | [System decisions](decisions.md) | Task and meeting domains for every department and one task record with contexts (ADR-002, ADR-003: approved 2026-10-01); visibility with confidential meetings (ADR-004: approved 2026-10-01) |
| ADR-008 | [System decisions](decisions.md) | Approved 2026-10-05: Guest read-only access to all non-secret Business records and identical full record CRUD/internal approval for every active Member; source implementation is present locally as migration 012 targeting schema 12, focused schema-11-to-12 QA passed, and production remains schema 11 pending separate migration/deployment authorization |

The Business Overview, Guest access, Member identity, single-code login and logo specifications that used to live here are feature documents now — see the [documentation map](../README.md) and [features/](../features/). The links above already point to their new locations.

## Visual Marketing architecture

[ARCH-004](ARCH-004-visual-marketing.md), [ADR-006](decisions.md#adr-006--visual-marketing-is-a-node-domain-with-explicit-provider-and-executor-boundaries), SDD-014 and the [data amendment](visual-marketing/data-model.md) are approved for FEAT-014. PR #1 merged the C/manual workflow and minimum-D registry/dispatcher after the bounded R3 review passed. The production migration, deployment and 2026-10-05 acceptance evidence are recorded in [release 0.5.1](../releases/0.5.1/verification.md). A generic Brief save and UI readback after reload passed. Execution remains local/manual; downstream manual stages, hosted execution, real-provider qualification, non-admin Member behavior, cross-member access, narrow-screen production acceptance, Variants and performance learning remain unverified or deferred for the schema 11 release. ADR-008 defines the shared Member record permissions for the schema 12 target; external provider and publication gates remain separate.
