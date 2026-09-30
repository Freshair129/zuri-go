# Art style — anime ensemble

The house style for every illustrated asset: character art, infographics, LINE
stickers, deck openers, social. Locked 2026-09-02.

## The look

| Property | Spec |
|---|---|
| Rendering | Cel animation. Flat fills, **no gradients**, no soft 3D shading |
| Lineart | **Thin, clean, crisp.** Even weight. No sketchy or brush lines |
| Shading | **2–3 flat tone levels only.** One base, one shadow, optionally one highlight |
| Eyes | **Large, with multiple layered highlights** — a main catchlight plus one or two smaller ones |
| Faces | Sharp features, friendly expression. Adult, never childlike |
| Hair | Drawn in **defined clumps**, each with a clear glossy highlight band |
| Colour | Bright and clean, **anchored by navy and amber orange** |
| Proportions | **Working adults, ~7 heads tall.** Never chibi, never school-age |
| Ground | Flat white |

## Palette

Amber orange and navy carry the brand; everything else stays bright but secondary.
**Write "amber", never "ember"** — see the last section.

| Role | Hex | Note |
|---|---|---|
| Amber Orange | `#E8820C` | the brand signal — same token as the product |
| Navy | `#1E2A4A` | **new for illustration.** Deeper and bluer than the product's ink `#1F2937`. Illustration only — do not use it in UI, where `#1F2937` remains correct |
| Line black | `#1A1A1A` | lineart |
| Mustard | `#C6A052` | product palette; no longer used on QA |
| Cream | `#F5EFE4` | Zuri's wardrobe |

> The navy is an addition to the palette, made to serve the illustration style.
> Flag it if the product team wants illustration and UI to share one dark value.

## Manga devices — use them, deliberately

These are what make the style read as anime rather than "flat illustration".
Each one encodes something; do not scatter them for decoration.

| Device | Use it for |
|---|---|
| **Speed lines** | energy, momentum, a launch, a decision landing. Radiating for impact, parallel for motion |
| **Reaction marks** — sweat drop, exclamation, vein pop, sparkle | a character's response to a number or an event |
| **Manga panels** — hard dividing rules | sequence and time. A workflow, a handoff, a before/after |
| **Arrows between figures** | direction of flow in a process |
| **Impact frames** | one moment that matters — a milestone, a warning |

In an infographic, the panel grid carries the structure and the characters carry
the reaction. Text always sits in HTML or the layout layer — **never generated**.

## The cast

Six characters. They wear real office clothing, so the row is read by **hair, build
and prop** rather than by costume — see the die-cut section below for why that trade
was made.

| Character | Role | Reads as | Prop |
|---|---|---|---|
| **ZURI** | the product's face; talks to the customer | bob, round glasses, open cream cardigan | none — open hand |
| **น้องวางใจ** | watches the numbers, raises the flag | tiny capsule, waist height | — |
| **PM** | decides and sets direction | tall, navy suit, no tie | tablet |
| **BA** | digs into requirements and data | navy blazer, white blouse | notebook |
| **DEV** | builds it | charcoal knit, thin glasses | laptop |
| **QA** | finds what is broken | grey blazer, low ponytail | clipboard |

Files: `assets/mascots/diecut/` (**current — die-cut, office wardrobe**) ·
`assets/mascots/cast/` and `ensemble/` (superseded costume round, history only).
Zuri's and วางใจ's locked constants stay as written in `brand-profile.md`.

## Two failure modes that keep recurring

**1. The era label summons someone else's characters.**
Prompting *"late 2000s–early 2010s Japanese anime"* pulls the whole cast into one
dominant series' house style — the first DEV render read as a recognisable
character from it. That is both off-brief and a real IP risk.

**Fix:** never name the era. Prompt the *qualities* instead — thin crisp lineart,
2–3 tone cel shading, layered eye highlights, hair in clumps — and give every
character one feature the default would not produce (an undercut, freckles and
goggles, ginger hair, a beard). Rejected set:
`output/rejected/derivative-house-style/`.

**2. น้องวางใจ loses its spec inside a busy group prompt.**
In every ensemble render so far the robot came back with **cyan glowing eyes** and
a **separate head** instead of black dots on a one-piece capsule. When it is one
of seven elements the model drops its specific description.

**Fix:** generate group scenes with the humans only, then composite วางใจ in from
a clean solo render. Do not accept a group shot where the robot is off-spec —
check the eyes and the silhouette every time.

## Character art: die-cut, office wardrobe

**Two rules set on 2026-09-03, after the first internal card.**

**1. Die-cut, never a profile frame.** Characters are cut out to transparent PNG and
stand free on the layout — full body, feet visible. Circular avatar crops read as a
contact list, not a cast. Cutouts live in `assets/mascots/diecut/`.

Cutting recipe — `projects/internal-cases/diecut.py`, the **only** copy. Generate on
pure white with `no shadow` in the prompt, then three steps in order:

1. **Largest connected component** — drops expression heads, ghost duplicates and
   stray lettering the model adds, with no manual masking.
2. **Erode the mask by 1 px** — the outermost ring of an anti-aliased edge is a blend
   of ink *and white*. Keeping it is what makes the fringe. Thick anime lineart loses
   nothing visible.
3. **Alpha bleed** — every pixel *outside* the mask takes the colour of the nearest
   pixel *inside* it. Transparent pixels still carry RGB, and browsers and resizers
   interpolate that RGB; if it is white you get a halo the moment the asset is scaled
   or composited.

**Measure it, do not eyeball it.** Count the semi-transparent edge pixels whose RGB is
near-white. Before this fix Zuri's full-body cut measured **49.7 %**; after, the worst
asset in the kit is **1.6 %** and the mean is **0.7 %**. Composite on `#0D1116` to
confirm — a white ring is invisible on the white ground the asset was cut from, which
is exactly why it shipped unnoticed.

Anything that needs a cutout **imports this function**. It was duplicated into
`build_stickers.py` and `build_oa.py`, so the LINE set kept the halo after the cards
were fixed — and LINE has a dark mode, which is precisely where it shows.

Add `single character alone, no duplicate character, no character sheet` to the
negative prompt. When a duplicate is *touching* the main figure it survives the
largest-component step and has to be cropped by hand — regenerate first, crop second.

**2. Office wardrobe, not costume.** The team reads as a real company:

| | Wears |
|---|---|
| PM | navy suit jacket, white shirt, no tie, brown shoes |
| BA | navy blazer over a white blouse, tailored trousers |
| DEV | charcoal knit sweater over a collared shirt, chinos, thin glasses |
| QA | light grey blazer, pale blue shirt, dark trousers |
| ZURI | unchanged — cream cardigan, black tee, black wide-leg trousers, amber clip |

Retired as too cartoonish: the amber hair streak, spiky ginger hair, safety goggles,
mustard utility vest, shaved undercut.

**The trade this makes:** professional clothing removes most of the silhouette
differentiation the earlier cast had. Role now reads from the **label and the prop**
(tablet / notebook / laptop / clipboard), not the outfit. Keep hair length, build and
prop distinct so the row still scans.

## Never write "ember" in a prompt

`ember orange` makes the model draw **actual fire** — Zuri came back holding a flame,
with a flame-shaped hair clip. Write `amber orange`, and keep
`fire, flame, ember, sparks, glowing effects` in the negative prompt.

## Crop sets — one character, several framings

A full-body die-cut shrunk into a dialogue slot puts the face at ~20 px. The face
*is* the content in a dialogue panel, so the crop has to match the job.

| Crop | Folder | Height in use | Use it for |
|---|---|---|---|
| **full** | `assets/mascots/diecut/` | 150–250 px | hero, summary, standing scenes, anywhere the body language or the prop matters |
| **bust** | `assets/mascots/diecut/bust/` | 140–180 px | dialogue, reactions, anything where the expression carries the meaning |

**Crop, do not scale.** Cropping a bust out of a full-body render gives a
low-resolution face — the face is only a small part of the source pixels. Busts
are generated as their own close-framed renders (`head and shoulders portrait,
upper chest visible`), so the face has real detail.

### Mood set

Every role has three busts. The case JSON picks one per line with `"mood"`:

| Mood | Reads as |
|---|---|
| `calm` | attentive, neutral — the default |
| `worried` | uncertain, slight frown — the problem being felt |
| `positive` | confident, clear smile — the fix landing, or false confidence |

`mood` defaults to `calm` when a voice omits it. Files are
`bust/<role>-<mood>.png`; the contact sheet is `bust/_sheet.png`.

**Mood is a storytelling control, not decoration.** CASE 02 puts Dev on
`positive` while the other three are `worried` — the whole joke of the card is
that only Dev thinks the work is finished, and the faces say it before the text
does.

### Sizing rule that bit

A bust is roughly square, so `height: 164px; width: auto` overflowed a narrow
grid column and got clipped. Dialogue rows are now **2 × 2 with the bubble beside
the face**, and the image is capped with `max-width` — four portraits in one row
does not leave enough width for a readable face.
