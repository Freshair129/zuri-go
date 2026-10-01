---
id: FR-005-013
title: Only signature-checked raster images preview; every other file downloads inert
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005]
---

# FR-005-013 — Only signature-checked raster images preview; every other file downloads inert

The system SHALL preview inline only PNG, JPEG, GIF and WebP files whose signature matches, SHALL serve every other file as `application/octet-stream` with an attachment disposition, `X-Content-Type-Options: nosniff` and a sandbox content security policy, and SHALL NOT render a user’s HTML or SVG.

## Acceptance criteria
- AC-005-013-01 — Given a file whose first bytes are a PNG, JPEG, GIF or WebP signature, when its preview is requested, then it is served inline with that image type under a sandbox policy.
- AC-005-013-02 — Given any other file, or a request that is not a preview, then it is served as `application/octet-stream` with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox; default-src 'none'` and `Cache-Control: no-store`.
- AC-005-013-03 — Given an SVG or HTML file, when its preview is requested, then it is served as `application/octet-stream` and is not rendered.

## Implementation
- `apps/api/attachments.mjs` — `decodeAttachment` (signature check, default `application/octet-stream`) and `sendAttachment` (the headers).
- Test: `apps/api/test/cloud-handler.test.mjs` (“attachments persist bytes…”): a PNG preview is `image/png` under a sandbox policy, a download is an attachment, an SVG preview is `application/octet-stream`. Run on 2026-10-01 by the author of this file: passed. The test does not assert `nosniff` or `no-store`; those were read from `sendAttachment`. The 0.3.1 record states the same header set was verified ([guest review](../../../history/zuri-go-guest-review/verification.md), “Architecture and documentation review”).

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullet 3 (the second sentence).
