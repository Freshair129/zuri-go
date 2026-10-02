# RCA — FEAT-013 local launcher blocks site build

## Symptom

`npm run build` fails while assembling the unified site after the Metrics guide generator and Data App build both complete.

## Evidence

- `scripts/run.mjs` runs `scripts/metrics/build_metrics_map.py`, then builds the Data App, then invokes `scripts/site/build_unified_site.py`.
- `scripts/site/build_unified_site.py` → `metrics_files()` rejects a guide containing `127.0.0.1:4319` or `127.0.0.1:4321` with `ValueError: Local preview link in deployable guide`.
- The FEAT-013 Metrics origin-gate script contains the exact local origin `http://127.0.0.1:4319`; the new local launcher itself is a fixed `http://localhost:8788/` link.
- The recorded build stopped at this guard with exit code 1. Metrics generation and Data App authored-content verification had succeeded.

## Root Cause

The same generated Metrics HTML is used for local Zuri-Go and for the deployable site. FEAT-013 adds a valid local-only origin gate to that source, but the deployable-site assembly has no step to remove local-only service UI before its existing local-origin safety check. The guard therefore rejects the source HTML even though the launcher is meant to be absent from hosted output.

## Why the issue escaped detection

The source-level acceptance review checked the exact-origin gate and link attributes, but no verification exercised the complete build path that packages the generated Metrics HTML for deployment.

## Proposed prevention

Mark the local-only Services navigation and its origin-gate script explicitly in the generated Metrics HTML. During deployable-site assembly, remove those marked blocks from the package copy before running the existing local-origin guard. Keep the generator output intact for local use. Add a focused packaging regression check that confirms the packaged guide contains none of the local launcher or origin-gate markers and retains the existing four site-navigation destinations.

## Follow-up RCA — local/hosted package mismatch (2026-10-02)

### Symptom

The local served Metrics/Graph guide has no launcher, while the hosted Data App still contains the launcher and origin gate in its JavaScript bundle.

### Evidence

- `npm run build` completes and the existing 2 launcher tests / 6 packaging tests pass.
- `apps/api/server.mjs` serves `build/site`; `metrics_files()` removes the service blocks before writing that local site. After the build, `build/site/metrics/index.html` has zero launcher URLs or gate markers.
- `scripts/deploy/build_cloud.py` copies `build/site/index.html` unchanged. Decoding its `data:text/javascript;charset=utf-8;base64` scripts finds one `localhost:8788`, one `Emar (local)` and one canonical local origin in both local and Vercel app HTML.

### Root Cause

Local and hosted assembly share one package despite different content requirements. Metrics stripping happens before local output, while the React launcher is compiled into the shared Data App bundle and never excluded from hosted authored inputs.

### Why the issue escaped detection

Tests cover source literals and a stripped Metrics fixture, but do not inspect both served packages or decode embedded scripts. A build pass and raw HTML search therefore miss the boundary violation.

### Proposed prevention

Keep the verified local Data App and local Metrics launcher in `build/site`. Build a hosted Data App from an isolated copy of authored inputs with only a marked FEAT-013 launcher block omitted, using the same installed verifier/compiler and unchanged snapshot/app identity. Assemble `build/hosted-site` with that verified hosted build and stripped Metrics, then let Vercel copy it. Never edit compiled bundles or integrity manifests. Add regressions for local retention, hosted exclusion (including base64 scripts), unchanged internal navigation and passive launcher behavior.
