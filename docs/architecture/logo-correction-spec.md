# Zuri-Go logo correction — 0.2.1

Status: implemented and verified locally and in production as part of 0.3.0. See [verification](../history/zuri-go-cloud-review/verification.md).
Complexity: C-2. Risk: LOW.
Parent: [Business Overview](overview-spec.md). Peers: existing campaign, meeting and Metrics Map views.

## Approved source and scope
The user's direct request selects `D:/zuri-brand-kit/assets/logos/zuri-go/download.png` over the previously typeset identity. This is a brand sheet, not a standalone transparent logo. Render its Main Logo region from unchanged image bytes; do not redraw, recolor, stretch or regenerate the artwork.

- Full lockup: source rectangle x=45, y=438, width=334, height=120, including its original tagline.
- Small navigation placements: source rectangle x=48, y=447, width=326, height=80, containing the same complete wordmark without a tiny tagline.
- Use in business header/fallback, campaign selector toolbar, common site navigation, all 18 guide masts and graph header.
- Use a CSS viewport for display only; retain the source and byte-identical copies. Do not create a new logo master or promote draft assets.
- Keep an accessible Zuri-Go label. Full lockups include the tagline in the accessible name.
- Preserve all business data, KPIs, interactions, protected app shell and app identity.

## Acceptance and verification
1. No typeset substitute or corporate ZURI SVG in these product-logo placements.
2. The original logo and tagline retain proportions and fit desktop/mobile layouts.
3. Main Logo artwork is visible; surrounding brand-sheet labels and illustrations are clipped outside its viewport.
4. Build, existing guide audit and unified-package checks pass; verify browser views and save screenshots.
5. Record source hash, affected paths and before/after diff. This change updates the local site only.
