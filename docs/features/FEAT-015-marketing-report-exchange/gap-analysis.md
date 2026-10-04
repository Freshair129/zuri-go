---
title: Domain 01 implementation gaps and semantic mapping
status: draft
superseded_by: null
version: 0.1.0
date: 2026-10-04
source_document: FEAT-015
---

# Domain 01 — source-backed gap analysis

Authority: [ARCH-005](../../architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md), [Marketing chapter](../../architecture/commercial-pipeline/marketing-campaign.md), [FEAT-002](../FEAT-002-campaign-mission-control/feature.md). This inventory describes inspected code, not live deployments. Zuri-Go checkout is merged main `28d084e2944fd74f968f56263979fdde3a211afa`; parent code was inspected at clean main `d72bee571578d8d7ebe2096fed7565fd0391b23c`, matching remote main then. A concurrent documentation-only merge advanced parent main to `a6e295a5e30b61aa0e6a178454e371d59e053818`: all inspected Marketing/Identity code and the charter are unchanged; the new executive KPI proposal was also reviewed. Parent remains read-only in this task.

## Evidence register

All Zuri-Go source links below use the merged source revision. Parent links use the newly inspected revision; this does not rewrite the earlier ARCH-005 inspection checkpoint.

| Ref | Source | What was inspected |
|---|---|---|
| G1 | [Campaign model](https://github.com/Freshair129/zuri-go/blob/28d084e2944fd74f968f56263979fdde3a211afa/apps/web/src/content/shared/model.mjs) | createCampaign, validateRecord, measure, evaluate, evidenceSnapshot; manual arrays, source watermarks, cohort and gate rules |
| G2 | [Workspace persistence](https://github.com/Freshair129/zuri-go/blob/28d084e2944fd74f968f56263979fdde3a211afa/apps/api/workspace.mjs) | readLegacy, writeCampaigns, saveLegacy; campaign state JSON and workspace revision checks |
| G3 | [Core schema](https://github.com/Freshair129/zuri-go/blob/28d084e2944fd74f968f56263979fdde3a211afa/apps/api/migrations/001_core.sql) | campaigns, campaign_states, metric_series, metric_observations, goals; normalized metrics differ from campaign-state arrays |
| G4 | [API router](https://github.com/Freshair129/zuri-go/blob/28d084e2944fd74f968f56263979fdde3a211afa/apps/api/api.mjs), [services](https://github.com/Freshair129/zuri-go/blob/28d084e2944fd74f968f56263979fdde3a211afa/apps/api/service.mjs) | workspace/state/observations/briefs, exact Business and viewer transaction checks; no marketing report sender/outbox route in this inspected router |
| G5 | [Existing regression suite](https://github.com/Freshair129/zuri-go/blob/28d084e2944fd74f968f56263979fdde3a211afa/tests/campaign/model.test.mjs) | 35 tests executed locally: unknown/zero, maturity, refunds, source lag, snapshot isolation and gates |
| A1 | [Marketing charter](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/docs/domains/marketing/CHARTER.md) | Marketing owner versus Identity, Integration, Commerce, CRM, LINE and PM |
| A2 | [Plan/campaign schemas](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/marketing/domain/marketing-plan-contract.js), [campaign result contract](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/marketing/domain/marketing-campaign-contract.js) | strict Strategy inputs, independent identity/lifecycle, UNAVAILABLE campaign results |
| A3 | [Campaign collection route](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/app/api/growth/campaigns/route.js), [plan mutation route](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/app/api/growth/plans/%5Bid%5D/route.js), [plan service](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/marketing/application/marketing-plan-service.js) | session viewer; native create/revise/review/decide; revision author cannot act as independent reviewer |
| A4 | [Paid-media service](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/marketing/application/marketing-insights-service.js), [paid-media route](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/app/api/growth/paid-media/route.js) | GET read projection; spend/impressions/clicks/platformRevenue/frequency/roas unavailable; Commerce verified revenue kept separate |
| A5 | [Marketing authority](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/marketing/application/marketing-authority.js), [session viewer](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/identity/request-viewer.js), [Enterprise API credentials](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/identity/api-access-auth.js) | Marketing writes need active Business OWNER plus growth access; Enterprise bearer resolves a Tenant service account, not a Person/Business OWNER |
| A6 | [Insights runtime](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/marketing/insights/application/insights-runtime.js), [Insights ports](https://github.com/Freshair129/zuri.ai/blob/d72bee571578d8d7ebe2096fed7565fd0391b23c/apps/server/src/modules/marketing/insights/ports/insights-ports.js) | query service returns null until persistence; binding/read contracts do not establish a Zuri-Go receiver |
| A7 | [Executive KPI proposal](https://github.com/Freshair129/zuri.ai/blob/a6e295a5e30b61aa0e6a178454e371d59e053818/docs/change-requests/marketing/line-oa-sales-flow/EXECUTIVE-KPI-DASHBOARD-PROPOSAL.md) | newer draft, no runtime/schema/registry change; reinforces Business-scoped aggregates, provider/attribution uncertainty and missing specific permission-to-call evidence |

## All seven flow gaps

`PARTIAL_SOURCE` means relevant behavior exists in inspected code but the complete proposed business flow is not implemented or accepted. No row is a live-provider PASS.

| Flow | Zuri-Go observed source | Zuri-AI observed source | Gap and first-slice disposition |
|---|---|---|---|
| MKT-F01 brief/objective/KPI | PARTIAL_SOURCE: campaigns/goals plus versioned settings, owner, targets, cap; G1–G3. Not a full approved brief or isolated budget permission record | PARTIAL_SOURCE: MarketingInitiative + immutable Plan versions; required audience/situation/channels/actions and campaignBrief; A1–A3 | Export campaign context as a source reference only. Do not fabricate missing parent Strategy fields or associate by title |
| MKT-F02 A/B design | PARTIAL_SOURCE: minSample/windowDays and offer/channel filters; no complete experiment/control/variant registry or randomized test/effect calculation; G1 | Planning contracts and unavailable results, not an observed A/B execution contract; A2/A4 | Dedicated experiment schema and inference deferred. No winner/significance; experiment and variant remain UNAVAILABLE |
| MKT-F03 launch readiness | PARTIAL_SOURCE: lifecycle, offers/releases/decisions and local gate checks; publication records do not post ads; G1/G3/G4 | Native approvals and receipt-bound PM execution; not a provider launch writer; A1–A3 | Export current context; never map local active/release to parent APPROVED/EXECUTING or auto-launch |
| MKT-F04 statistics | PARTIAL_SOURCE: manual ads records (spend/impressions/clicks), per-source date watermarks; normalized observation lineage exists separately; G1–G4 | Paid-media metrics deliberately UNAVAILABLE; Insights query service null; A4/A6 | First report uses campaign-state source only; no merge with normalized metric_series. Export evidence limitations and nulls; provider ingestion deferred |
| MKT-F05 Ads→chat attribution | PARTIAL_SOURCE: offer/channel filtering and leadId↔order links; no verified click→LINE identity join or complete touch/variant evidence; G1 | Parent assigns CRM/LINE/integration their own custody; no receiver binding found in inspected Marketing paths; A1–A4 | No phones, chat, customer rows or attributed ROAS. Ready-for-call cannot be inferred from MQL/SQL |
| MKT-F06 monitoring/triage | PARTIAL_SOURCE: evaluate/alertList, watermark age, cap/margin/sample holds and task follow-up; G1/G2/G5 | Read composition preserves UNAVAILABLE/UNKNOWN; not an active provider watch/sync path; A4/A6 | Carry structured gate codes as reported findings. No new timer, spend action or remote task writer |
| MKT-F07 weekly review | PARTIAL_SOURCE: reviews/decisions and saved snapshots persisted inside state JSON; campaign-state replacement is not an append-only externally trusted review ledger; G1/G2 | MarketingReview is an independent review of one PlanVersion/hash; native decision follows that review, not a sales-cohort weekly review; A2/A3 | Add an immutable sanitized report/outbox proposal. Receive a reported weekly-review assertion separately; never create MarketingReview/MarketingDecision from it |

## Field mapping and measurement lineage

| Field | Source | Transport today | Rate today | Formula / mapping | Missing / output rule |
|---|---|---|---|---|---|
| Campaign UUID/code/objective/currency | campaigns; G3/G4 | local/hosted same-origin API | on request; no sync | opaque source identity; objective enum retained as source vocabulary | no alias to initiativeId/planId; explicit binding required |
| State revision | campaign_states.row_version + payload_hash; Business domain_revision; G2/G3 | workspace/state persistence | explicit saves | all references must be captured in one consistent transaction | do not use settings.version alone to identify a report; it is not a full data revision |
| Settings/targets/cap | campaign_states.state_json; G1/G2 | workspace API | explicit saves | whitelist typed values only, not settingsSnapshot wholesale | missing stays null; target/budget remains planning context |
| spend/impressions/clicks | state.ads; G1 | manual/backup/workspace input | user entry; no provider schedule | measure on a declared compatible date scope, sum only additive records at this grain | no platform/account/variant or fetched_at invented; source labelled MANUAL_REPORTED, not provider verified |
| leadCount/mql/sql | state.leads; G1 | manual state input | user entry | acquisition and stage-entry windows differ in measure | opaque aggregates only; MQL/SQL do not imply phone consent or ready-for-call |
| net revenue | state.orders with date/refundAt; G1 | manual state input | user entry | paid amount in activity window minus refund events in same window | label reported_net_revenue; not Commerce verifiedNet or attributed platform revenue |
| mature/converted/CVR | leads and linked orders; G1 | pure model calculation | as-of request | mature cohort; converted within windowDays; CVR = converted / mature | absent window/denominator or incomplete evidence => null and reason; never combine activity revenue with cohort numerator |
| CTR/CPL/CPO | G1 measure inputs | pure calculation | as-of request | CTR clicks/impressions; CPL spend/acquired leads; CPO spend/eligible paid orders at compatible scope | export n/N and formula version; not cost-per-ready-for-call, CAC or ROAS |
| Watermarks/evidence | state.sources (dates), stored snapshot IDs/hashes; G1/G2 | manual assertions | user entry | preserve source-reported dates and collection-known timestamps independently | date watermark is not proof of provider retrieval/completeness; missing source timezone is explicit |
| Weekly review/decision | state.reviews/decisions; G1/G2 | whole workspace save | explicit user save | whitelist structured identity, date, snapshot/settings revision and reported status | free text, records and actor grants excluded; provenance LEGACY_REPORTED, not a verified parent approval |

## Recommended first contract and tradeoffs

Choose **external reported evidence**, sent one way, with an immutable receipt. This retains the useful current data without forcing it into incompatible native Strategy/review schemas. Cost: a reviewed parent evidence inbox/projection and narrower Identity authorization are still required.

Alternatives: native Plan mutation would require missing Strategy fields and independent parent approval, so it cannot represent the first report automatically. Reusing paid-media/Insights GET routes would require an approved persistence and writer contract that is absent today. Bulk workspace import would move unnecessary CRM/meeting data and ownership; it is outside this feature.

## Decisions before implementation

| Decision | Proposed choice | Approval / evidence still needed |
|---|---|---|
| Source and execution scope | local SRV-002, one campaign/window, operator-triggered; no hosted sender | detailed package review; source timezone/period metadata capture |
| Writer | Go report ledger; parent Marketing external evidence store; no native Plan/Review changes | parent reviewed storage ownership and record migration |
| Authentication | server-side parent Identity credential with an explicit one-Business, report-ingest binding | Enterprise Tenant credential alone is insufficient; no reinterpretation as OWNER |
| Receiver association | explicitly select existing MarketingInitiative; target plan resolved by parent | parent namespace/ID validation and permission contract; no title matching |
| Evidence claims | manual/legacy reported evidence, metric completeness per item | no default source timezone, provider verification or approval trust |
| Public/report read policy | private authorized Marketing readers; no Guest projection | parent and local retention/visibility reviewed before migration |

These decisions block cross-system code and acceptance, not further documentation preparation. No real credentials or Business IDs are required to review this package.
