# DOM-BRN — business rules

The invariants of [DOM-BRN](README.md) ([STD-001 R1](../../governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md): BR). Each is declared by its heading ([STD-002 R2](../../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)) and promoted, without changing the source, from a sentence of the “Business rules” of the domain README or of [AGENTS.md](../../../AGENTS.md) ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10); each quotes that sentence. All are `proposed`. The location of this file extends [STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md), which names no file for a domain's rules (see the notes of this change).

### BR-020 — Only approved brand assets are used, and brand promotion is human-only
Relations: relates_to: FEAT-009
Owner: DOM-BRN

**Status:** proposed. **Statement.** The product SHALL use the existing approved Zuri-Go assets and the documented Zuri and น้องวางใจ designs; it SHALL NOT redraw a logo or invent brand tokens, names or taglines, and only a human SHALL promote a brand asset to approved.

**Source.** [AGENTS.md](../../../AGENTS.md): “Do not redraw logos or invent brand tokens, names or taglines. Brand promotion remains human-only.” and [DOM-BRN README](README.md): “Use existing approved assets; never redraw a logo or invent brand tokens, names or taglines; brand promotion is human-only”. **Enforced by.** review against `brand/brand-profile.md`; no automated check.

### BR-021 — The Zuri-Go logo is rendered from the unchanged bytes of the approved brand sheet
Relations: relates_to: FEAT-009, BR-020
Owner: DOM-BRN

**Status:** proposed. **Statement.** The Zuri-Go logo SHALL be rendered from the unchanged image bytes of the approved brand-sheet region, and SHALL NOT be redrawn, recolored, stretched or regenerated.

**Source.** [DOM-BRN README](README.md): “The Zuri-Go logo is rendered from the unchanged bytes of the approved brand-sheet region, never recoloured, stretched or regenerated” ([FEAT-009 spec](../../features/FEAT-009-logo-placement/spec.md): “Render its Main Logo region from unchanged image bytes; do not redraw, recolor, stretch or regenerate the artwork”). **Enforced by.** the logo contract and its checks ([FEAT-009](../../features/FEAT-009-logo-placement/feature.md)); the generated site is verified by `npm run build`.
