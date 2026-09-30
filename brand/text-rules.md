# Text rules

## Language split

Follows the product's own convention (`zuri-ai/CLAUDE.md`):

- **Thai** — everything a customer reads: LINE replies, marketing copy, UI labels,
  error messages, help text
- **English** — product/technical vocabulary that stays English inside Thai
  sentences: *dashboard, workflow, funnel, metrics, LINE OA, Impressions, ROAS*
- **English only** — ids, code, technical docs, requirement ids (`FR-020`)

Do not translate a metric name into Thai and then use the English one two lines
later. Pick the English term, explain it in Thai once, then stay consistent.

## The name

- The product is **zuri** — lowercase in running text, **ZURI** only as the wordmark
- Never *Zuri AI*, *ZuriAI*, *zuri.ai* in prose. The domain form `zuri.ai` appears
  only in the lockup and in URLs
- In Thai copy: **ซูริ** is acceptable for LINE conversational voice
  (the LINE OA already speaks this way). Written brand references stay `zuri`
- The mascot is `น้อง<name>`; the product is never `น้องzuri`

## Casing

| Context | Rule |
|---|---|
| Headline | UPPERCASE, tight tracking |
| Eyebrow / label | UPPERCASE, wide tracking, short |
| Thai body | Sentence case, no forced caps |
| Buttons | Say the action: `เข้าสู่ Zuri`, `ดูรายงาน` — never `คลิกที่นี่` |

## Numbers

- Thousands separator, always: `1,000` not `1000`
- Currency: `490 บาท/ชุด` — unit after the number
- Percentages: `3.2%` no space
- A ratio is written `LTV ÷ CAC ≥ 3`, not "3 เท่า" alone
- Tabular figures wherever numbers stack in a column

## Tone in LINE

The LINE OA is the product's main voice. It should:

- Answer the question first, then add context
- Say plainly when data is unverified — `ข้อมูลรอตรวจสอบ` beats a confident guess
- Never invent a price, a stock number, or a date
- Use ค่ะ/นะคะ naturally; do not stack politeness particles

## Words we don't use

See `copy/prohibited-claims.md` for claims. On style, avoid:

*ปฏิวัติวงการ · เปลี่ยนโลก · ที่สุดในไทย · AI อัจฉริยะ · โซลูชันครบวงจร*

They are unfalsifiable and they date fast. Describe the mechanism instead:
"ตอบคำถามราคาและสต็อกใน LINE จากข้อมูลจริงของร้าน" beats "AI อัจฉริยะเพื่อธุรกิจ".
