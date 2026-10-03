# Visual Studio browser acceptance — manual, 2026-10-03

Target: isolated QA server on 127.0.0.1:4329, synthetic Project `QA ONLY · Tea launch`. Approved CUA browser tool; no production account or provider used.

- [x] Open existing authored navigation and Visual Studio; loading, empty Projects and no-model explanation visible.
- [x] Choose existing Project; enter Thai Brand/Brief; confirm brand context; save and see Research persisted.
- [x] Enter Research, Strategy, Concept, Copy and Visual prompt through the form; each save advances one stage and shows the prior output.
- [x] Observe image generation unavailable and text/plain asset; no invented image preview or pixel-quality claim.
- [x] Check all eight QA categories and save; Human approval becomes available.
- [x] Approve using local operator; workflow shows พร้อมส่งต่อ. This is an operator decision, not an authenticated Member.
- [x] Reload final build, select Project and verify persisted approval/history.
- [x] Inspect final desktop and narrow viewport; save screenshot evidence.
- [x] Download text asset through the UI: saved 407 bytes, SHA-256 `394A76B79BDC41AFC7C55A970300C18CAFEF0963CF3818B7E962EEAE2F7CFB65`. This browser evidence used app source `b569cf0d3296dbec4285f71e751ea0cca2506310`; Visual Studio UI paths are unchanged through the sealed source candidate `771bbf70e437bf26cbfaa3a4ab643540155d8c59`. The download was not repeated on R2.

Automated API/SQL tests cover denied Guest writes, forged/stale approval, cancelled jobs and RLS. A signed Member browser session and real local-model polling were not exercised. These manual checks are not represented as an automated browser suite.

Final desktop dark-theme contrast inspected after using existing theme tokens. Narrow viewport 390×844: page scrollWidth 375, Studio width 343; no horizontal overflow. Viewport reset. Screenshots retained privately under `.local/visual-studio-desktop.jpg` and `.local/visual-studio-mobile.jpg`.
