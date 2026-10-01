---
id: STD-001
title: Document & Engineering Artifact Standard
status: approved
version: 0.1.0
owner: governance
---

# STD-001 — Document & Engineering Artifact Standard

Defines **which artifacts exist**, **how they nest**, **who owns them**, and
**when each one is mandatory**. Identity and relations are in
[STD-002](STD-002-IDENTITY-AND-TRACEABILITY.md); physical placement is in
[STD-003](STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md).

## R1 — Artifact types

| Type | ID prefix | Answers | Level | Mandatory |
|---|---|---|---|---|
| BRD — Business Requirements | `BRD-` | Why the business needs the product; outcomes, stakeholders, constraints | Product | Once per product |
| PRD — Product Requirements | `PRD-` | What the product does; surfaces, scope chain, product-wide rules | Product / Domain | Product-level once; domain-level optional |
| Domain | `DOM-` | What a bounded area of the business owns (data, rules, language); carries a subdomain type (core / supporting / generic) and a role (foundation / business / platform) in `registry/domains.yaml` (ADR-107) | Domain | Yes, one per domain |
| Capability | `CAP-` | A grouping of features under one business capability (epic) | Domain | Optional |
| Feature | `FEAT-` | A product capability with its own value and release lifecycle | Domain / Cross | Yes, for any user-visible behavior |
| Feature Part | `FEAT-…-Pnn` | A slice of one feature, owned by one domain, with no value of its own | Feature | Required when a feature spans >1 domain |
| FR — Functional Requirement | `FR-` | One precise, testable system behavior | Feature | Yes, ≥1 per feature |
| NFR — Non-functional Requirement | `NFR-` | A measurable quality constraint (latency, retention, availability…) | Feature / System | When a quality bar exists |
| AC — Acceptance Criterion | `AC-` | A Given/When/Then check that proves an FR | FR | Yes, ≥1 per FR |
| BR — Business Rule | `BR-` | An invariant of the business, independent of any screen | Domain / System | When one exists |
| SEC — Security Requirement | `SEC-` | A security/privacy control | System / Domain | When one exists |
| ADR — Architecture Decision Record | `ADR-` | Why a design choice was made, alternatives, consequences | System / Domain / Governance | For every decision that constrains more than one feature |
| Architecture | `ARCH-` | System shape: context, containers, services, data flow | System | Once per system |
| SDD — Software Design Description | `SDD-` | How a feature is built: components, data, sequence, failure modes | Feature | Required for features with persisted data, external calls or >1 component |
| Service | `SRV-` | A deployable runtime unit and what it runs | System | One per deployable |
| Component | `CMP-` | A module/package inside a service that implements domain logic | Service | For domain use-case boundaries |
| API Contract | `API-` | A request/response interface (HTTP, RPC, CLI) | Domain / Service | For every externally callable interface |
| Event Contract | `EVT-` | An asynchronous message/event schema | Domain / Service | For every published event/job |
| TC — Test Case | `TC-` | A named verification of FR/AC/NFR, bound to a test file | Feature | Yes, ≥1 per FR |
| Runbook | `RB-` | How to operate, deploy, recover a service | Service / System | One per production service |
| STD — Standard | `STD-` | A governance rule set | Governance | — |
| PROC — Procedure | `PROC-` | How a governance activity is performed | Governance | — |
| PLAN | `PLAN-` | Adoption / delivery plan with work items | Governance | — |

Types not listed are not artifacts. Notes, research, meeting minutes may exist
under `notes/` but are never traced to and never cited as evidence.

## R2 — Logical hierarchy

```
Product (BRD, PRD)
└─ Domain (DOM)                       ← owns data, rules, language
   └─ Capability (CAP)                ← optional grouping
      └─ Feature (FEAT)               ← product value, lifecycle
         └─ Feature Part (Pnn)        ← optional; mandatory when cross-domain
            └─ FR / NFR
               └─ AC
         ├─ SDD                        ← design of the feature
         └─ TC                         ← verification
Architecture (ARCH) / ADR               ← constrain any level
Service (SRV) → Component (CMP) → Code  ← realise FR through SDD
API / EVT                               ← contracts a component exposes
Runbook (RB)                            ← operates a service
```

Invariants:

- **Domain ≠ Service.** A domain is a business boundary; a service is a
  deployable. One service can host many domains (a modular monolith) and one
  domain can span services (a web app plus a worker).
- **Feature ≠ Service.** A feature is value delivered; services only realise it.
- **PRD ≠ Service spec.** Product documents never describe deployables;
  service documents never define product behavior.
- An FR belongs to exactly **one** feature (and at most one part of it).
- A part belongs to exactly one feature and is owned by exactly one domain.

## R3 — Part vs Feature

Split a piece of work into its own **Feature** when *any* of these hold;
otherwise it is a **Part** of the feature it serves:

1. it delivers value a user could receive while the rest is not shipped;
2. it has its own release/lifecycle (can be enabled, retired, versioned alone);
3. another feature depends on it independently.

## R4 — Ownership (three levels)

| Level | Field | Meaning |
|---|---|---|
| Feature owner | `owner` on FEAT | Domain accountable for the outcome and acceptance of the whole feature |
| Part / domain owner | `owner` on each Part (and on FR when no parts) | Domain that owns the data and rules the part changes |
| Runtime owner | `runtime` on FEAT or Part | Service (`SRV-…`) that executes/orchestrates it in production |

Rules:

- Every FEAT has exactly one feature owner.
- A feature whose FRs touch more than one domain's data is **cross-domain**:
  it keeps the same kind of ID as any feature (`FEAT-nnn`), declares `type:
  cross-domain-feature` and `participants` (domain, part, role) in its
  metadata, and every part names its owner. Domains that only *read* through
  another domain's public contract do not make a feature cross-domain.
- No feature — domain-owned or cross-domain — is stored under a domain folder.
  All features live in `docs/features/`; a domain's list of owned and
  participating features is a generated view (STD-003 R2).
- A domain may write only data it owns. Writing into another domain happens
  through that domain's API/EVT contract and is recorded as `depends_on`.
- Owner changes are relation edits; they **never** change an ID (STD-002 R3).

## R5 — Mandatory set per feature class

| Class | FEAT | Parts | FR+AC | NFR | SDD | API/EVT | TC | ADR |
|---|---|---|---|---|---|---|---|---|
| Domain feature, UI/read only | ✔ | – | ✔ | if any | optional | if exposed | ✔ | if a cross-feature decision |
| Domain feature, persists data or calls externally | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔ | if a cross-feature decision |
| Cross-domain feature | ✔ | ✔ | ✔ | ✔ | ✔ (per part or shared) | ✔ at every domain boundary | ✔ | ✔ for the ownership split |
| Governance/tooling change | – | – | – | – | – | – | – | STD/PROC/ADR |

## R6 — Status vocabulary

Artifact status (the document): `draft → proposed → approved → superseded | retired`.
Delivery status (the behavior): `declared → building → implemented → live → retired`.
The two are separate fields (`status`, `delivery`) and never combined.

## R7 — Acceptance of a feature

A feature is `live` only when: every FR has ≥1 AC and ≥1 TC bound to a test
file; every NFR has a measurement; the SDD exists if R5 requires it; every
cross-domain write goes through a declared API/EVT; the runtime owner has a
runbook.
