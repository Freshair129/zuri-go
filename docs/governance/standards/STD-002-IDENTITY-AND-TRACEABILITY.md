---
id: STD-002
title: Identity, Traceability & Annotation Standard
status: approved
version: 0.1.0
owner: governance
relations:
  depends_on: [STD-001]
---

# STD-002 — Identity, Traceability & Annotation

Three layers, each with one job:

```
1. Stable ID       — says WHAT a node is (type is read from the prefix)
2. Relation         — says HOW nodes connect (explicit where it cannot be inferred)
3. Graph / index    — derived from 1 + 2; never hand-edited, always rebuildable
```

## R1 — ID grammar

**An ID encodes only facts that can never change: the artifact type, a
sequence number and — for contained artifacts — the ID of its container.** It
never encodes a domain, owner, scope (single/cross-domain), status or title,
because all of those can change. They are metadata (R5).

```
<TYPE>-<nnn>                     standalone artifact          FEAT-042 · ADR-017 · BR-008 · API-031
<PARENT>-P<nn>                   feature part                 FEAT-042-P01
FR-<f>-<nnn>                     functional requirement       FR-042-003      (f = feature number)
NFR-<f>-<nnn> | NFR-<nnn>        non-functional requirement   NFR-042-001 (feature) · NFR-007 (system)
AC-<f>-<fr>-<nn>                 acceptance criterion         AC-042-003-01
TC-<f>-<nnn>                     test case                    TC-042-012
SDD-<f>                          design of feature f          SDD-042
DOM-<CODE>                       domain                       DOM-CRM   (the code IS the domain's identity)
```

Standalone types: `FEAT`, `CAP`, `ADR`, `BR`, `SEC`, `NFR` (system level),
`API`, `EVT`, `CMP`, `SRV`, `RB`, `ARCH`, `BRD`, `PRD`, `STD`, `PROC`, `PLAN`.
Numbers are at least three digits and grow as needed (`FEAT-1042`).

The type never changes, so it is safe in the ID: a feature stays a feature. A
requirement stays in the feature it was declared in — moving it is a new FR
with `supersedes` (STD-003 R7) — so the feature number is safe in its ID too.

**ID vs name.** Every artifact also has a `title` (frontmatter or heading
text) and a filename slug (`FEAT-042-conversation-inbox/`). Both are names:
they may be edited at any time and stay bound to the same ID. Links and
relations always use the ID; tools resolve ID → current path and title.

**Allocation.** Numbers are global per type and taken as `max + 1` from the
main branch (`tools/next-id <TYPE>`). Two branches that take the same number
collide in CI (R8 duplicate declaration); the later branch renumbers before
merge, because main is the published trunk.

## R2 — Declaration site

An ID is **declared exactly once**, either as

- a file: the filename starts with the ID (`FEAT-042-conversation-inbox/`), or
  frontmatter `id:` says it; or
- a heading whose text starts with the ID (`### ADR-018 — …`).

FEAT, Part, FR and NFR are always file-declared; ADR, TC, BR, SEC, API and EVT
are heading-declared inside their register file; an AC is declared by a list
item that starts with its ID inside its FR file (STD-003).

Everywhere else the ID is a **reference**. The locator of an artifact is
`path#anchor`; the locator may change, the ID may not.

## R3 — Stability

- IDs never change when a file moves, a title changes, ownership changes or a
  feature becomes cross-domain — none of those facts are in the ID.
- A domain code (`DOM-CRM`) is the one ID that carries a name, so it is frozen:
  a domain's display name and folder slug may change, its code may not. A
  domain that splits or merges is declared as a new domain with `supersedes`.
- Documents always write the full prefixed ID; databases store it once and
  join on integer keys (STD-004 R1).
- A retired ID is never reused. Retiring = `delivery: retired` + a reason line.
- Changing the **meaning** of a requirement means retiring it and declaring a
  new ID with `supersedes`.
- Migrated artifacts keep their previous IDs in `legacy:` (a list), which is how
  the crosswalk (`registry/crosswalk/`) is built.

## R4 — Relation vocabulary (edges)

Only these relation names are valid. Direction is `source → target`; inverses
are derived by the indexer, never written.

| Relation | Source → Target | Meaning |
|---|---|---|
| `part_of` | Part → FEAT, FR/NFR/TC/SDD → FEAT, AC → FR | Structural containment — **inferred from the ID**, never written |
| `owned_by` | FEAT/Part/FR/API/EVT/CMP/ADR/BR → DOM | Accountable domain — metadata (`owner:`), never in the ID |
| `runtime` | FEAT/Part/CMP → SRV | Service that executes it |
| `participates_in` | DOM → FEAT (cross-domain) | Domain contributes a part (derived from Part owners) |
| `derived_from` | FR/NFR → BRD/PRD/BR/FR | Requirement lineage |
| `depends_on` | FEAT/Part → FEAT/Part/API/EVT | Needs the target to work |
| `decided_by` | any → ADR | Constrained by a decision |
| `specified_by` | FR/Part → SDD/API/EVT | Detailed by a design or contract |
| `implements` | CMP/code symbol/file → FR/NFR/API/EVT | Code realises the requirement |
| `verifies` | TC/test file → FR/AC/NFR | Test proves the requirement |
| `exposes` | CMP/SRV → API/EVT | Offers the contract |
| `consumes` | CMP/SRV → API/EVT | Calls the contract |
| `supersedes` | any → same type | Replaces a retired artifact |
| `relates_to` | any → any | Navigation only ("see also"). Never counts as ownership, dependency, implementation or verification evidence |

## R5 — Where relations are written

| Relation is… | Written as |
|---|---|
| Inferable from the ID or path (`part_of`, type) | Nothing — the indexer infers it |
| About a document | Frontmatter `relations:` map in that document |
| About a heading-declared artifact | A `Relations:` line directly under the heading, `relation: ID, ID` |
| About code | A `@trace` tag in the boundary's doc comment (R6) |
| About something that has no file (external system) | `registry/relations.yaml` |
| Semantic similarity | Never written — embeddings are discovery, not evidence |

Frontmatter example:

```yaml
---
id: FEAT-042
owner: DOM-CRM
runtime: SRV-web
delivery: live
legacy: [FEAT-009, FR-091, FR-093]
relations:
  depends_on: [API-012]
  decided_by: [ADR-017]
---
```

FR and NFR are always file-declared (one requirement per file, STD-003 R3), so
their relations are frontmatter too. Heading-declared artifacts (ADR, TC, API,
EVT, BR, SEC) carry relations on the line under the heading:

```markdown
### ADR-017 — A LINE conversation is split into idle-bounded sessions
Relations: decided_by: ADR-004; supersedes: ADR-009
Legacy: ADR-094
```

## R6 — Code annotations

One tag, `@trace`, followed by a relation and one or more IDs. It avoids the
JSDoc meaning of `@implements`.

```js
/**
 * Resolve the tenant from an incoming LINE channel.
 * @trace implements FR-042-003
 * @trace decided_by ADR-021
 */
export async function resolveTenant(channel) { … }
```

```js
// @trace verifies FR-042-003, AC-042-003-01
describe('resolveTenant', …)
```

Annotate **boundaries only**: service entrypoints, API handlers, domain use
cases, core algorithms, migrations and critical tests. Do not annotate helpers,
mappers or formatters. A file-level tag is allowed when the whole file is one
boundary.

## R7 — Graph model (index)

Node = `(id, type, locator, owner, status, delivery, hash, source_revision)`.
Edge = `(source_id, relation, target_id, provenance, source_revision)` where
`provenance ∈ {id-inferred, frontmatter, heading, code-annotation, registry}`.

The graph is rebuilt from a git revision; it is an **index**, not a source of
truth. Any consumer (views, agents) reads the index; nothing writes to it except
the indexer.

## R8 — Validation (CI-enforced once tooling exists)

1. Every ID matches R1 and its domain code is registered.
2. Every ID is declared once (duplicate declaration fails).
3. Every relation target resolves (dangling target fails).
4. Every relation name is in R4.
5. Every FEAT has an owner; every Part of a cross-domain feature has an owner.
6. Every FR has ≥1 AC and — when `delivery ≥ implemented` — ≥1 `verifies` edge.
7. A retired ID is never re-declared.
8. Cross-domain status is metadata only: a feature is cross-domain iff
   `type: cross-domain-feature`, and then it has ≥2 `participants`, each naming
   a part.

## R9 — Agent retrieval order

Agents resolve questions in this order and stop at the first sufficient answer:
exact ID lookup → structured relation query → code symbol search → full-text →
embedding search → read the actual files. An embedding hit is a lead, never
evidence; the answer cites IDs and locators.
