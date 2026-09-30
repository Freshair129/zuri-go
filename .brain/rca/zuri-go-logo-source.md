# Zuri-Go logo source correction — 2026-09-30

Complexity: C-2. Risk: LOW (display/assets only).
Authority: direct user instruction to use `assets/logos/zuri-go`.

## Symptom
The site displays a typeset substitute for Zuri-Go and the older corporate ZURI logo.

## Evidence
- `BusinessWorkspace.jsx` renders `zg-wordmark` as nested text spans and an orange square.
- `DashboardContent.jsx` imports `zuri-wordmark.svg`.
- `build_metrics_map.py` uses the old SVG for guide masts and graph branding.
- The user-specified directory contains `download.png`: a 1448 × 1086 RGB identity sheet with a Main Logo panel.

## Root cause
The previous product-name update changed text without binding the site identity to the user-supplied logo artwork.

## Why the issue escaped detection
Previous checks validated the product name and functionality, but did not compare every logo placement against the new source asset.

## Proposed prevention
Reuse one logo display component and shared display CSS. Show the original Main Logo region using a CSS viewport, preserving the source file unchanged. Verify source/copy hashes and visually inspect dashboard, guide and graph at desktop/mobile widths.
