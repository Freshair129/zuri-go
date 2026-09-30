---
id: STD-004
title: Engineering Graph Schema (SQL)
status: proposed
version: 0.2.0
owner: governance
relations:
  depends_on: [STD-001, STD-002, STD-003]
---

# STD-004 — Engineering Graph Schema (SQL)

How documents, code and their relations are stored in SQL so the links can be
queried. The database is an **index** built from a git revision (STD-002 R7):
drop it and rebuild it from the repository at any time. Executable DDL:
[`tools/graph-schema.sql`](../../../tools/graph-schema.sql); vocabulary seed:
[`tools/graph-seed.sql`](../../../tools/graph-seed.sql). Both run unchanged on SQLite
3.38+ and PostgreSQL 14+ (use identity columns for the surrogate keys there).

## R1 — Decisions

| Question | Decision | Why |
|---|---|---|
| What do documents write? | The full document ID with its prefix: `FEAT-042`, `FR-042-003`, `DOM-CRM` | A bare number is not an identifier: `042` could be a feature, an ADR or an API, and grepping it matches dates, versions and amounts. The prefix makes every ID self-describing and exactly searchable |
| What does SQL join on? | `INTEGER` surrogate keys (`node_id`, `edge_id`, `revision_id`) | Integer joins and indexes are the cheapest; the text ID is stored once, as a unique lookup column |
| Where does the number live? | `node.type` + `node.num` + `node.parent_node_id` | The ID is parsed into typed columns, so "all FRs of FEAT-042" or "ADRs above 100" are plain integer predicates |
| How are domains identified? | `DOM-<CODE>` (`DOM-CRM`) in documents; an integer `node_id` in SQL | A domain's code *is* its identity. Renaming a code is not allowed; a domain that splits or merges is a new domain with `supersedes`. Readable owners (`owner: DOM-CRM`) across hundreds of files outweigh a purely numeric code |
| Padding | Documents pad to 3 digits (`FEAT-009` sorts before `FEAT-010`) and grow as needed; SQL stores plain integers | Filenames sort correctly; the database never cares |

## R2 — Type, family, key

| Term | Meaning | Example | Where it lives |
|---|---|---|---|
| **Type** | The ID prefix. Says what a node *is*. Never changes. | `FR`, `FEAT`, `ADR`, `PART` | `node.type` → FK `node_type.type` |
| **Family** | A group of types that answer the same kind of question. Used to filter ("all requirements"). | `requirement` = FR, NFR, AC, BR, SEC | `node_type.family` → FK `family.family` |
| **Surrogate key** | Integer row key used by every join | `node_id = 1187` | `node.node_id` |
| **Document ID** | The stable ID written in documents; unique lookup key | `FR-042-003` | `node.id` (UNIQUE) |
| **Number** | The sequence inside the ID | `3` | `node.num` |
| **Parent key** | Containment, parsed from the ID | `FR-042-003` → node of `FEAT-042` | `node.parent_node_id` → FK `node.node_id` |
| **Relation** | Every other link | `FEAT-042 owned_by DOM-CRM` | `edge(source_id, relation, target_id)` → FKs `node.node_id` |

Families: `product` (BRD, PRD) · `structure` (DOM, CAP, FEAT, PART) ·
`requirement` (FR, NFR, AC, BR, SEC) · `design` (SDD, ARCH) · `decision` (ADR) ·
`contract` (API, EVT) · `runtime` (SRV, CMP) · `verification` (TC) ·
`operation` (RB) · `governance` (STD, PROC, PLAN) · `code` (FILE, SYMBOL).

## R3 — Parsing an ID into columns

The indexer fills `type`, `num` and `parent_node_id` from the ID alone — never
from the folder:

| ID | type | num | parent |
|---|---|---|---|
| `FEAT-042` | FEAT | 42 | — |
| `FEAT-042-P02` | PART | 2 | `FEAT-042` |
| `FR-042-003` | FR | 3 | `FEAT-042` |
| `NFR-042-001` | NFR | 1 | `FEAT-042` |
| `NFR-007` | NFR | 7 | — |
| `AC-042-003-01` | AC | 1 | `FR-042-003` |
| `TC-042-012` | TC | 12 | `FEAT-042` |
| `SDD-042` | SDD | 42 | `FEAT-042` |
| `ADR-017`, `API-031`, `SRV-002` … | ADR, API, SRV … | n | — |
| `DOM-CRM` | DOM | — | — |
| `FILE:apps/server/src/x.js` | FILE | — | — |
| `SYMBOL:apps/server/src/x.js#resolveTenant` | SYMBOL | — | the FILE node |

Code nodes (FILE, SYMBOL) use their path as the document ID. They are derived,
not declared; a renamed file is a new node.

## R4 — Tables

| Table | Key | Foreign keys | Holds |
|---|---|---|---|
| `family` | `family` | — | the 11 families |
| `node_type` | `type` | `family`, `parent_type → node_type` | one row per ID prefix, its regex and its container type |
| `relation_type` | `relation` | — | the STD-002 R4 vocabulary plus the inverse name |
| `relation_rule` | (`source_type`, `relation`, `target_type`) | all three → vocab | which links are legal, and `max_per_source` (e.g. one owner) |
| `revision` | `revision_id` | — | git sha of each build; `is_current` marks the live one |
| `node` | `node_id`; `id` unique; (`type`, `parent_node_id`, `num`) unique | `type`, `parent_node_id → node`, `revision_id` | every artifact and code entity: title, status, delivery, JSON attrs |
| `locator` | (`node_id`, `revision_id`) | both | where the node is declared: path, anchor, lines, content hash |
| `edge` | `edge_id`; (`source_id`, `relation`, `target_id`, `revision_id`) unique | `source_id`, `target_id → node`; `relation`; `revision_id` | every link, with JSON attrs (e.g. a part's `role`), provenance and `declared_in` |
| `domain` | `node_id` | `node_id → node` | code (identity), slug and name (both may change) |
| `legacy_id` | — (indexed on `legacy_id`) | `node_id → node` | crosswalk from the previous repository |
| `chunk` | (`node_id`, `chunk_no`) | `node_id → node` | optional text chunks + embeddings for discovery |

Design choices:

- **One `node` table, one `edge` table.** A feature, a requirement and a code
  symbol are all nodes, so any path through the graph is a join on two tables,
  and a recursive query can walk any relation.
- **Ownership is an edge (`owned_by`), not a column.** Owners exist on many
  types, can move, and parts of one feature have different owners. `v_owner`
  reads it like a column.
- **Participation is derived, not stored.** A domain participates in a
  cross-domain feature when it owns one of its parts. `v_domain_features`
  returns it.
- **Views speak document IDs, tables speak integers.** `v_edge`, `v_owner`,
  `v_domain_features` and `v_requirement_trace` join on `node_id` and expose
  `FEAT-042`-style IDs, so ad-hoc queries never touch surrogate keys.
- **Legality is data.** `relation_rule` rejects a `FEAT verifies DOM`-style
  mistake with a query (Q6) instead of hard-coded parser logic.

## R5 — Queries the schema must answer

All seven are tested against the seed plus a sample cross-domain feature.

**Q1 — Domain view** (STD-003 R2).

```sql
SELECT feature, title, role, part FROM v_domain_features WHERE domain = 'DOM-LOA';
-- FEAT-007  Broadcast           owns
-- FEAT-010  Campaign report     owns
-- FEAT-042  Conversation inbox  participates  FEAT-042-P02
```

**Q2 — Trace** a feature's requirements to code and tests.

```sql
SELECT requirement, delivery, implemented_by, verified_by
FROM v_requirement_trace WHERE feature = 'FEAT-042';
```

**Q3 — Impact**: everything that transitively depends on a feature (walks integers).

```sql
WITH RECURSIVE impacted(node_id, depth) AS (
  SELECT node_id, 0 FROM node WHERE id = 'FEAT-042'
  UNION
  SELECT e.source_id, i.depth + 1
  FROM edge e JOIN impacted i ON e.target_id = i.node_id
  WHERE e.relation = 'depends_on' AND i.depth < 10)
SELECT n.id, i.depth, n.title, o.domain AS owner
FROM impacted i JOIN node n ON n.node_id = i.node_id
LEFT JOIN v_owner o ON o.node = n.id
WHERE i.depth > 0 ORDER BY i.depth;
-- FEAT-007 1 Broadcast DOM-LOA · FEAT-010 2 Campaign report DOM-LOA
```

**Q4 — Coverage gap**: live or implemented requirements with no test.

```sql
SELECT n.id FROM node n
WHERE n.type IN ('FR','NFR') AND n.delivery IN ('implemented','live')
  AND NOT EXISTS (SELECT 1 FROM edge e WHERE e.target_id = n.node_id AND e.relation = 'verifies');
```

**Q5 — Legacy lookup**: where did `FR-093` go?

```sql
SELECT l.disposition, n.id, n.title, loc.path
FROM legacy_id l JOIN node n ON n.node_id = l.node_id
LEFT JOIN locator loc ON loc.node_id = n.node_id
WHERE l.legacy_id = 'FR-093';
```

**Q6 — Illegal edges**.

```sql
SELECT source, relation, target FROM v_edge e
WHERE e.relation <> 'relates_to'          -- navigation-only, legal between any types
  AND NOT EXISTS (SELECT 1 FROM relation_rule r
  WHERE r.source_type = e.source_type AND r.relation = e.relation AND r.target_type = e.target_type);
```

**Q7 — By family**: what a domain owns, grouped.

```sql
SELECT nt.family, n.type, COUNT(*) FROM v_owner o
JOIN node n ON n.id = o.node JOIN node_type nt ON nt.type = n.type
WHERE o.domain = 'DOM-LOA' GROUP BY nt.family, n.type;
```

## R6 — Build rules

1. The indexer reads one git revision, writes all rows with that
   `revision_id`, then flips `revision.is_current`. A build never edits rows of
   another revision.
2. `parent_node_id` and `part_of` edges come from ID parsing (provenance
   `id-inferred`). A cross-domain FR also gets `part_of → PART` from its
   frontmatter `part:`.
3. `participates_in` is never stored; it is the view in R4.
4. The build fails (and does not flip `is_current`) when Q6 returns rows, when
   a `max_per_source` is exceeded, or when any STD-002 R8 check fails.
5. Code nodes come from `@trace` annotations (STD-002 R6); unannotated files
   are indexed only if a later phase adds full code indexing.
