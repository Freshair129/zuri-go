---
id: FR-001-016
title: The AI summary reads evidence only and takes no action
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-011, ARCH-001]
---

# FR-001-016 — The AI summary reads evidence only and takes no action

The system SHALL keep the summary free of any action — it SHALL NOT change a goal, release an offer, create or assign a task or post anything — and SHALL NOT put a token, a client secret, a transcript or a Member’s phone number or email into a bundle or a prompt.

## Acceptance criteria
- AC-001-016-01 — Given a summary, then it changes no goal, releases no offer, creates or assigns no task and posts nothing.
- AC-001-016-02 — Given a bundle or a prompt, then it holds no token or client secret, no transcript and no Member phone number or email.
- AC-001-016-03 — Given no AI provider has been chosen, then no data is sent to an unspecified provider; the only model call possible is to an explicitly configured loopback endpoint.

## Implementation
- `brief` in `apps/api/service.mjs`: facts are built from counts and goals (`summaryFacts`); the model call sends fact IDs and texts only, to a loopback URL with `redirect:"error"`.
- No test asserts the absence of a secret in the prompt; the claim rests on the code of `summaryFacts` and `brief` and on the 0.2.0 check that private URLs were absent from the static package ([zuri-go-review](../../../history/zuri-go-review/verification.md)).

## Notes
- Spec trace ([spec.md](../spec.md)): §8, third paragraph (“ไม่เปลี่ยนเป้า ไม่ปล่อย offer ไม่สร้าง/มอบหมาย task และไม่โพสต์เอง”) (AC-01) and fifth bullet (AC-02); §12 last paragraph, “ไม่ให้ส่งข้อมูลไป provider ที่ยังไม่ระบุ” (AC-03); ZGO-07, “ไม่ execute action”. Legacy label: ZGO-07 (part).
- A summary reads tasks only in the viewer’s audience ([FR-011-008](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-008-content-follows-item.md)); the cache key includes that audience (`audienceKey`).
