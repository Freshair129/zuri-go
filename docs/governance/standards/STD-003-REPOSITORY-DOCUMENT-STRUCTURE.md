---
id: STD-003
title: Repository & Document Structure Standard
status: approved
version: 0.3.0
owner: governance
relations:
  depends_on: [STD-001, STD-002]
---

# STD-003 — Repository & Document Structure

**Principle: an artifact has one canonical location; its relationships may
appear in any number of views.** The folder tree is one projection of the
artifact graph, not the data model. Ownership, participation and
implementation are declared in metadata — never derived from which folder a
file sits in — so ownership can move without moving files.

Three layers:

```
Canonical document   written once        features/FEAT-042-…/feature.md
Relationship metadata frontmatter         owner, participants, parts, relations
Views / indexes      generated, never hand-edited   domains/crm/README.md "Participates in"
```

## R1 — Repository layout

```
repo/
├── apps/ services/ packages/     code
├── tools/                        validator, indexer, view generators
├── registry/                     domains.yaml, services.yaml, relations.yaml, crosswalk/
└── docs/
    ├── README.md                 map + reading order
    ├── product/                  BRD, PRD (product level), glossary
    ├── domains/<slug>/           domain definition + generated views (R2)
    ├── features/<FEAT-ID>-<slug>/ every feature, domain-owned or cross-domain (R3)
    ├── architecture/             ARCH-*, decisions.md (system ADRs), requirements/ (system BR/NFR/SEC)
    ├── services/SRV-<slug>/      one folder per deployable
    ├── operations/               runbooks (RB-*)
    ├── governance/               standards/ STD · procedures/ PROC · decisions.md (governance ADRs) · plans/
    └── templates/
```

## R2 — Domain folder (definition + views)

```
docs/domains/<slug>/
├── README.md          DOM-<CODE>: purpose, language, owned data, business rules, public contracts.
│                      Ends with a GENERATED block: Owned features · Participating
│                      cross-domain features (role + part) · Services that host it.
├── decisions.md       ADR-nnn headings for decisions owned by this domain (`owner: DOM-<CODE>`)
└── contracts.md       API-nnn / EVT-nnn headings for contracts owned by this domain
```

A domain folder never contains features. The generated block sits between
`<!-- BEGIN GENERATED: feature-index -->` and `<!-- END GENERATED -->` and is
rewritten by `tools/generate-views`; hand edits inside it are lost.

## R3 — Feature folder (canonical)

```
docs/features/<FEAT-ID>-<slug>/
├── feature.md                    FEAT: summary, scope, ownership metadata, requirement index
├── requirements/
│   ├── FR-<f>-001-<slug>.md      one functional requirement per file, ACs inside
│   └── NFR-<f>-001-<slug>.md     one non-functional requirement per file
├── parts/                        cross-domain features only
│   └── P01-<domain-slug>.md      FEAT-<f>-P01: role, owner, runtime, FRs, boundary contracts
├── design.md                     SDD-<f>
└── verification.md               TC-<f>-nnn headings → test files
```

`feature.md` frontmatter is the source of truth for ownership:

```yaml
---
id: FEAT-042
title: Conversation inbox
type: cross-domain-feature        # domain-feature | cross-domain-feature
owner: DOM-CRM
runtime: SRV-web
participants:                     # cross-domain only; one entry per part
  - domain: DOM-CRM
    part: FEAT-042-P01
    role: Conversation record and inbox reads
  - domain: DOM-LOA
    part: FEAT-042-P02
    role: Delivery receipts from the LINE transport
delivery: live
status: proposed
legacy: [FEAT-009]
relations:
  decided_by: [ADR-017]
---
```

FR file:

```yaml
---
id: FR-042-003
title: Delivery receipt shows both sides of the conversation
part: FEAT-042-P02              # cross-domain only
owner: DOM-LOA                    # cross-domain only (= the part's owner)
delivery: live
legacy: [FR-093]
relations:
  specified_by: [SDD-042]
  decided_by: [ADR-017]
---
# FR-042-003 — Delivery receipt shows both sides of the conversation

The system SHALL …

## Acceptance criteria
- AC-042-003-01 — Given …, when …, then …

## Implementation
- apps/server/src/modules/…        (current code location)

## Notes
```

The feature an FR belongs to is inferred from its ID (STD-002 R4 `part_of`);
the folder only mirrors it.

## R4 — Services

`docs/services/SRV-<slug>/SERVICE.md` declares `hosts:` (domains) and
`implements:` (features or parts). Services are never nested under a domain.

## R5 — Registry

```
registry/
├── domains.yaml          domain code ⇄ slug ⇄ legacy module names · subdomain (core | supporting | generic)
│                         and role (foundation | business | platform) per ADR-107
├── services.yaml         SRV id ⇄ deploy unit ⇄ code root
├── relations.yaml        relations no file can hold: external systems (by name only) and the
│                         context map between domains (upstream → downstream, DDD pattern, evidence)
├── sitemap.yaml          the authored half of the navigation map: surfaces, domain-bar slots, modules,
│                         each with evidence ids; page paths are derived from the documents by tools/sitemap.mjs
├── pipeline.yaml         the knowledge-pipeline data-flow map (GenesisRAG17): nodes by lane, kind and tier,
│                         typed edges, each with evidence ids; validated by tools/pipeline-map.mjs
└── crosswalk/<D>.csv     legacy id → new id, disposition, note
```

The registry is the only place a domain's classification and the context map are
written (ADR-107 D4). Domain READMEs show them inside the generated block;
`validate-docs` checks the values and resolves every evidence id.

## R6 — Placement rules

- Every feature lives in `docs/features/` — domain-owned and cross-domain alike.
- System-wide artifacts (no domain owner, `ARCH-*`) live under `architecture/`.
- Views (domain feature index, trace matrix, feature map) are generated.
- Content is written once; everything else links to its ID.

## R7 — Structure operations

Every change to the structure is one of these operations. Each keeps IDs stable
(STD-002 R3) and ends by regenerating views and running the validator.

| Operation | Steps | Never |
|---|---|---|
| Add a domain | Register the code in `registry/domains.yaml` → create `domains/<slug>/README.md` → add ADR if it splits an existing domain | Create a domain folder before its code is registered |
| Add a feature | Allocate the next `FEAT-nnn` (`tools/next-id FEAT`) → create `features/<ID>-<slug>/feature.md` from the template → add one file per FR/NFR | Put the feature under a domain folder |
| Add a requirement | Next free number within the feature → new file in `requirements/` → ≥1 AC | Reuse a retired number; put two requirements in one file |
| Transfer ownership | Edit `owner` (feature) or the `participants` entry (part) → ADR if the boundary changes | Rename the ID or move the folder |
| Feature becomes cross-domain | Keep the ID; set `type: cross-domain-feature`, add `participants` and `parts/` | Change the ID |
| Part becomes its own feature | Only when STD-001 R3 is met: declare a new FEAT, move the FRs by creating new FR IDs with `supersedes`, retire the part | Keep the old FR IDs under the new feature |
| Retire | Set `delivery: retired` + reason line; file stays in place | Delete the file or reuse the ID |
| Change meaning of a requirement | Retire the FR, declare a new FR with `supersedes` | Edit the statement into a different behavior |
| Rename / move a file | Free — the ID and inbound links are unaffected | Change the ID prefix in the filename |
