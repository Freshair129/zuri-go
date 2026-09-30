---
id: FEAT-<nnn>
title: <title>
type: domain-feature            # domain-feature | cross-domain-feature
owner: DOM-<CODE>
runtime: SRV-<nnn>
delivery: declared              # declared | building | implemented | live | retired
status: draft                   # draft | proposed | approved | superseded | retired
legacy: []
relations:
  depends_on: []
  decided_by: []
# cross-domain features only, one entry per part:
# participants:
#   - domain: DOM-<CODE>
#     part: FEAT-<nnn>-P01
#     role: <what this domain contributes>
---

<!-- Template (STD-003 R3). Copy to docs/features/FEAT-<nnn>-<slug>/feature.md.
     Allocate the number as max+1 on main (STD-002 R1). Delete this comment. -->

# FEAT-<nnn> — <title>

<One paragraph: the value delivered and to whom.>

## Scope
-

## Ownership
- Feature owner: DOM-<CODE>. Runtime owner: SRV-<nnn>.

## Requirement index
| ID | Requirement | Delivery |
|---|---|---|
| FR-<nnn>-001 — file `requirements/FR-<nnn>-001-<slug>.md` | <title> | declared |

## Documents
- `design.md` — SDD-<nnn>
- `verification.md` — TC-<nnn>-…
