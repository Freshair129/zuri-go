# zuri — brand profile

**zuri** is an AI-native business operating system. LINE is the primary surface;
the web console is where detail, complex edits and audit live.

Scope chain: **Portfolio → Tenant → Business → Workspace → Project.**

Audience: Thai SME owners and their teams. They are busy, they are not analysts,
and they judge the product on whether it answers correctly and fast.

---

## Voice

Precise, calm, and never cute about money. The product's own words:

> SEE THE WHOLE BUSINESS. MOVE WITH CLARITY.
> BUSINESS, IN CLEAR MOTION.
> LOCAL-FIRST. AI-READY. HUMAN-CONTROLLED.

Thai support line: **รวมธุรกิจ งาน ทีม และหลักฐานการตัดสินใจไว้ในพื้นที่เดียว**

The register is a control room, not a notebook. We show the number and what to do
about it. We do not decorate it.

---

## Colour

Source of truth: `zuri-ai/tailwind.config.js` + `src/app/globals.css`.

| Role | Token | Hex |
|---|---|---|
| Brand / signal | `brand.DEFAULT` | `#E8820C` |
| Brand hover | `brand.hover` | `#F09420` |
| Brand dark | `brand.dark` | `#B86A08` |
| Brand tint | `brand.tint` | `#FDE8D0` |
| Brand surface | `brand.surface` | `#FFF8F0` |
| Ink (primary text) | `ink` | `#1F2937` |
| Muted (secondary) | `muted` | `#6B7280` |
| Canvas | `surface.DEFAULT` | `#F7F8FA` |
| Card | `surface.card` | `#FFFFFF` |
| Rest blue | `restblue` | `#D6ECFA` / text `#3D7A9E` |
| Mustard | `mustard` | `#C6A052` / tint `#F5ECD7` |
| Success / Warning / Danger | — | `#238553` / `#B7791F` / `#C84B4B` |

**Amber is a signal, not a fill.** It marks the one thing that matters in a view.
A layout where amber covers large areas has misused it.

---

## Type

| Role | Face |
|---|---|
| Display / UI / wordmark | **Manrope** (700–800) |
| Thai + body | **IBM Plex Sans Thai** (400–600) |
| Data, formulas, ids, seeds | **IBM Plex Mono** |

Two settings carry the brand and must not drift:

- **Headlines**: uppercase, tight tracking (`-0.045em` … `-0.055em`), Manrope 800
- **Labels / eyebrows**: uppercase, wide tracking (`0.14em` … `0.28em`), small

---

## Logo

The logo is the **ZURI wordmark**: Manrope 800, letter-spacing `0.28em`, ink,
followed by the amber **signal square**. Two sanctioned variants:

| File | Signal position | Use |
|---|---|---|
| `assets/logos/zuri-wordmark.svg` | raised above cap line, after the I | **primary** — headers, decks, docs |
| `assets/logos/zuri-wordmark-inline.svg` | on the cap centre line, after a full letter-space | wide lockups, footers |

**Every shipping logo is outlined** (2026-09-03) — no font dependency, nothing
re-flows. The editable live-text versions live in `assets/logos/_source/` and must
not be shipped; after editing one, re-run `assets/logos/_source/outline_all.py`.

Geometry is unchanged: the outlined advance width lands within **0.01 px** of the
browser-measured live-text bbox, verified by a difference-blend overlay. Manrope is
licensed under the SIL OFL, which permits embedding outlines in a logo.

The **Z icon** (`zuri-mark.svg`, from the shipped `zuri-signal.svg`) is a separate
mark for square contexts only — app icon, LINE avatar, favicon. It is not a
substitute for the wordmark in running layouts.

| File | Use |
|---|---|
| `zuri-icon-amber.svg` | LINE avatar / app icon — amber field, white Z. The default at small sizes |
| `zuri-icon-ink.svg` | dark surfaces |
| `zuri-mark-mono.svg` | one-colour print, stamps, embroidery (`currentColor`) |
| `zuri-lockup-horizontal.svg` | mark + `zuri.ai` where the domain must appear |
| `zuri-signal-extended.svg` | expressive/motion only — never primary |

Clear space: one cap-height of the wordmark on all sides. Minimum wordmark width
110 px — below that the tracking closes up and it stops reading as a wordmark.

---

## Mascots

Two characters, two jobs. They are not interchangeable.

> **RENDER STYLE — LOCKED 2026-09-02: 2D Japanese anime, both characters.**
> Crisp clean lineart, soft cel shading, flat white ground. No 3D render, no
> Pixar-style soft shading, no chibi proportions.
>
> Separate the two questions and keep them separate:
> **who the characters are** comes from `assets/references/canonical/` (which are
> 3D renders) — features, colours, proportions, wardrobe;
> **how they are drawn** is this 2D anime style. The canonical files still define
> the design; they no longer define the finish.
>
> Both characters share one style so they can stand in the same frame. Earlier
> 3D and 2.5D rounds are in `assets/mascots/_superseded/`.
>
> This runs warmer than the landing page's control-room register: the *product
> surface* stays precise, the *characters* are the friendly way in. Both are
> correct — do not "fix" one to match the other.

### 1. Zuri — the human

The face of the product. She is who a shop owner is talking to on LINE.

**Style: 2D Japanese anime** — crisp lineart, soft cel shading, a slim adult
figure. Approachable, but a real person: a busy shop owner has to feel they can
just ask her something.

> **LOCKED 2026-09-02** against `assets/references/canonical/zuri-face-lock.png`.
> That file is the face authority. The 2.5D cel-shaded direction **and** the
> big-head chibi direction are both retired.

#### Locked — never changes

- **Round glasses**, thin frame — **mandatory in every single render, no exceptions**
- Dark brown, near-black **chin-length bob** with a straight fringe
- **Amber hair clip**, her left side — the only brand colour she carries
- Dark eyes with highlights, soft blush, small closed-mouth smile
- **Natural adult proportions — roughly 5½ to 6 heads tall.** Normal-sized head,
  long legs, slim build. **Never chibi, never a big head**
- Anime eyes with a detailed layered iris and highlights; glossy anime hair with
  defined strands

#### Free — choose per action

- **Headphones / headset** — on the head, around the neck, or absent
- **Laptop, tablet, magnifier, clipboard** or no prop at all
- Pose, camera angle, crop
- Outfit *within the palette*: cream hoodie or cream cardigan over a black tee,
  black trousers, cream sneakers with amber accents

The glasses are the identity. If a render loses them it is not Zuri, however
good it looks — and two of the three supplied reference images fail this rule
(see `assets/references/canonical/README.md`).

| File (`assets/mascots/locked/zuri-anime-2d/`) | Use |
|---|---|
| `standing-front_seed8606.png` | **primary full-body** — warm smile, clip visible |
| `standing-wave_seed8404.png` | greeting / onboarding |
| `sitting-laptop_seed8505.png` | working; laptop is unbranded |
| `portrait-headphones_seed9505.png` | **LINE avatar** — upper body, headphones optional |

### 2. น้องวางใจ — the signal companion

**Name: น้องวางใจ** (*Nong Wang-jai* — "you can rely on me"). Chosen from the
`___ใจ` family, the same emotional-benefit pattern as AIS's น้องอุ่นใจ. It is the
promise of a system holding your business data, and it survives feature changes.

The one who watches the numbers and raises a flag. Zuri explains; วางใจ notices.

**Style: 2D Japanese anime with a screen face.** Same lineart and cel shading as
Zuri, so the two can share a frame.

> **LOCKED 2026-09-02** against `assets/references/canonical/pair-standing.png`.
> This resolves the panel question that was open in Rev 02: the answer is
> **panel everywhere**. There is one form, not two.

#### Locked — never changes

- **One single amber capsule** — a continuous pill-shaped body, minion-like.
  **No separate head, no neck, no shoulders, no waist.** The whole character is
  one piece
- **Dark charcoal rounded-square screen panel** set into the upper front — this is the face
- Two round glossy **black dot eyes** and one **small curved smile**, both on the panel.
  **Never glowing, never cyan or blue**
- **Amber ring-shaped ear pieces** on the left and right of the capsule
- Two **very short stubby amber arms** attached directly to the sides, ending in
  small rounded **black hands**; two short stubby amber legs, **black feet**
- No mouth, nose or feature anywhere except on the panel
- **Height: about waist-height to Zuri** when they share a frame

#### Free — choose per action

Pose, gesture, held prop, camera angle, and what the panel displays — the panel
is a screen, so expressions live on it and it can also show a simple icon or
chart when the situation calls for it.

| File (`assets/mascots/locked/wangjai-anime-2d/`) | Use |
|---|---|
| `front-wave_seed9101.png` | **primary** — on-spec single capsule, panel set into the front |
| `turnaround_seed9202.png` | reference sheet — back view correctly has no panel |
| `expressions_seed9303.png` | panel expressions |

Together: `assets/mascots/locked/pair-anime-2d/pair-tablet_seed9606.png` —
the best pair to date, though วางใจ still renders chest-height rather than
waist-height. Fix the height before this ships.

#### Retired

Everything before the 2D anime lock is in `assets/mascots/_superseded/`:
the ear-piece round, the panel-less egg form, the original flat pair, the
big-head chibi round, and the 3D render style. Kept for history; none of it ships.

#### Naming — decided

**น้องวางใจ**, from the `___ใจ` family. Rejected alternatives are kept below so
the decision is not re-argued from scratch later:

| Considered | Meaning | Why not |
|---|---|---|
| น้องโล่งใจ · น้องทันใจ · น้องมั่นใจ · น้องสบายใจ | relief / quick / confident / at ease | same family; วางใจ carries trust, which is the larger promise |
| น้องกระจ่าง · น้องแจ่ม · น้องชัด | clarity | maps to the tagline, but describes the *product*, not a companion |
| น้องสรุป · น้องรอบรู้ · น้องจัดให้ · น้องครบ | function-led | instantly clear, but tied to today's feature set |

**Stay in the `___ใจ` register.** If a second character is ever named, it takes a
`___ใจ` name too. Mixing an emotional name with a functional one reads as two
products that merged.
