---
title: Commercial pipeline SoT restructure verification
status: draft
superseded_by: null
version: 0.1.0
date: 2026-10-04
---

# SoT restructure — 2026-10-04

Canonical entry: [ARCH-005](../../architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md). Relationship metadata: [registry/relations.yaml](../../../registry/relations.yaml). [Historical verification](verification.md) and [preview.jpg](preview.jpg) retain earlier observations.

## Scope and provenance

- Complexity C-3; LOW risk for document placement and cross-references. Product/edition intent comes from the owner's statement and instruction to proceed on 2026-10-04. Detailed integration remains draft; ADR-007 is proposed.
- Parent repository inspected read-only: `O:/zuri.ai`. The relevant documents match remote main `d4b6d613c221d0fc5e1645293144bb9b6c8332cf`, verified with `git ls-remote`; the local working tree is at `d3ae5625` and those files are unchanged across the seven intervening commits. Exact parent-source links live in ARCH-005.
- Before-change documentation baseline: `validate-docs` 0 errors / 166 existing warnings; generated views 10 / 0 drift.
- Seven source/view files moved; the former root process source and domain navigation were consolidated into ARCH-005. The dated domain directory was removed only after all source files had been moved and every directory was empty.
- Existing SRV/DOM/FEAT IDs and all 21 process Flow IDs were retained. The initial local allocation with `scripts/docs/next_id.py` selected provisional ARCH-004 / ADR-006. Before publishing, a fetch found that newer main commits had already used those IDs for Visual Marketing; this unpublished draft was reassigned to the unused ARCH-005 / ADR-007 after checking declarations on `origin/main` at `bc17d2b`. Published identifiers were not changed; no integration FEAT/API/EVT was allocated.
- An ignored local recovery copy and original SVG hashes are retained under `.local/docs-sot-20261004/`. They are recovery/evidence, not another maintained source.
- The flat folder README is navigation only, resolving the existing SVG source captions. Exact HTML source backlinks point to ARCH-005 or the relevant chapter; there are no process definitions duplicated in that README.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Canonical placement, source links, history separation | PASS | One ARCH-005 declaration, three source chapters, four views and navigation-only README in one flat folder; old nested domain tree absent; HTML source/version metadata and fragment targets resolve; 21 Flow IDs retained |
| Registry context-map references | PASS | Scoped parse/check resolves both local SRV IDs, both DOM IDs and ARCH/ADR evidence IDs; external namespace, parent reference, intended direction and draft/unverified statuses checked. The general docs validator does not inspect this file |
| SVG drawing preservation and page inventory | PASS | SHA-256 of all 23 SVG strings, after universal newline decoding, matches before-move recovery copy exactly; inventory 1 + 8 + 7 + 7 views |
| Diagram-design self-check, four HTML files | PASS | Packaged `diagram-design/scripts/self_check.py` exited 0 for each view; outputs retained privately under `.local/docs-sot-20261004/` |
| Repository docs validator and generated views | PASS with existing warnings | `npm run docs:validate`: 0 errors / 166 warnings (same baseline categories/counts); `npm run docs:views`: initially 10 views / 0 drift, then 11 views / 0 drift after rebasing onto newer main at `bc17d2b`. Commands used the documented `ZURI_GO_PYTHON` machine override |
| Diff / whitespace | PASS | Initial tracked-only diff was 54 added lines across 10 files; after staging, `git diff --cached --check` and the rebased PR diff check pass for the full 24-file scope. Markdown hard breaks use explicit backslashes to preserve rendering without trailing spaces |
| Browser rendering / print preview after move | NOT_RUN | Historical screenshot and previous browser observations were not rerun; HTML source backlinks are the only presentation additions |
| Application build/test; parent API; Ads/LINE; migration/deploy | NOT_RUN | Document-only restructure; no operational integration executed |

Command environment: the first npm attempts failed before validation because `python` was absent from PATH (`ENOENT`). Re-running with the installed Python executable through `ZURI_GO_PYTHON` passed; no command runner code was changed. Local/private logs: `structure-check.json`, `validate-final.txt`, `views-final.txt` and four `*.self-check.txt` files. Parent checkout remained clean on the final read-only status check.

## Publication preparation — 2026-10-04

The owner authorized commit, push and PR. GitHub reported `Freshair129/zuri-go` as public, contrary to older repository notes; visibility was left unchanged. All 24 candidate files passed a bounded credential-pattern scan, and the historical screenshot was visually inspected. Ignored `.local/` recovery material and logs were not staged. The documentation commit was rebased onto `bc17d2b`; the shared decisions-file conflict was resolved by retaining both existing Visual Marketing ADR-006 and the new commercial-pipeline ADR-007. Repeated structure, SVG-hash and four diagram checks passed on that base. No application change is authored by this PR.

## Version diff

| Before | After |
|---|---|
| `docs/history/<dated-pack>/domains/<chapter>/README.md` | Flat `docs/architecture/commercial-pipeline/` with ARCH-005 and three source chapters |
| Multiple navigation READMEs inside the mutable history tree | One canonical entry plus links from product, architecture, domain and service indexes |
| Unresolved platform/service relationship | Owner-stated edition context and one authored external context map; mapping/contract details remain draft |
| Diagrams without source backlinks | Four visual views point to their canonical source; SVG drawing content preserved |
| Root guide v0.1.1; Marketing v0.1.2; LINE/Sales v0.1.0 | ARCH-005 v0.2.0; Marketing v0.1.3; LINE/Sales v0.1.1 |
| Local provisional ARCH-004 / ADR-006 | Final unpublished-draft allocation ARCH-005 / ADR-007; newer main's published Visual Marketing IDs retained |
