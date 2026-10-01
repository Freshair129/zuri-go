---
id: FR-005-014
title: An upload is a bounded JSON and base64 payload that is validated
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-005-010]
---

# FR-005-014 — An upload is a bounded JSON and base64 payload that is validated

The system SHALL accept an upload only as a bounded JSON body with a file name and base64 text that stays under the hosting platform’s request limit, and SHALL refuse a payload that is not valid.

## Acceptance criteria
- AC-005-014-01 — Given a file name that is blank or holds a path separator or a control character, when it is uploaded, then the answer is 422 and nothing is stored.
- AC-005-014-02 — Given base64 text that is not valid or is empty, then the answer is 422 and nothing is stored.
- AC-005-014-03 — Given base64 text longer than the encoding of 2 MiB, then the answer is 413 (FR-005-010).

## Implementation
- `apps/api/attachments.mjs:decodeAttachment` — checks the file name (1 to 180 characters, no `\`, `/` or control character), the base64 alphabet and length, and re-encodes the decoded bytes to compare; `apps/api/http.mjs:body` — caps any JSON body.
- Test: `apps/api/test/cloud-handler.test.mjs` (“attachments persist bytes…”): `../bad.txt`, `???=` and an empty text each answer 422, and an oversized file answers 413. Run on 2026-10-01 by the author of this file: passed.

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullet 4 (the first sentence), bullet 6 (“invalid payload rules”).
- The spec does not name the file-name rules; they are those of the code and are recorded here, not decided here. The spec’s “Vercel request limit” is not a number in the repository: the encoded bound of 2 MiB is about 2.8 MB.
