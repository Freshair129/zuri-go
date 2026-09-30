# campaign-01 — image prompts

Generated locally: ComfyUI on `127.0.0.1:8188`, template `image_z_image_turbo`
(Z-Image-Turbo), 8 steps, RTX 5060 Ti. ~13 s per 1024², ~18 s per 896×1152.

Reproduce with:

```bash
cd C:\Users\pc\comfy-projects\zuri-brand
comfy workflow set-slot <wf>.json 57.text="<prompt>"
comfy workflow set-slot <wf>.json 57.seed=<seed>
comfy --json run --workflow <wf>.json
```

Addressable slots: `57.text` `57.seed` `57.width` `57.height` `57.steps`.

---

## Zuri — human mascot, tech-girl direction

**Kept · `zuri-techgirl-hoodie_seed1303.png`** — 896×1152, seed `1303`

> stylish contemporary digital illustration, young Asian woman software engineer
> with a sleek dark chin-length bob, small amber orange hair clip, wearing an
> oversized cream tech hoodie, holding a slim laptop, modern clean vector art,
> plain white background, smart friendly expression, startup brand mascot, upper body

Closest to the existing LINE character (dark bob + amber hair accessory) while
reading modern. Seed `1404` is the same prompt, softer pose.

**Kept · `zuri-techgirl-headphones_seed1101.png`** — 896×1152, seed `1101`

> modern flat vector illustration character, confident young Asian woman tech
> professional, chin-length dark brown bob haircut, wireless headphones resting
> around her neck, amber orange smart-casual jacket over a dark top, minimal
> geometric vector style, clean thick lines, plain white background, calm confident
> expression, contemporary tech brand character, upper body

Most confident posture. Hair renders brown rather than the reference's near-black.

**Kept · `zuri-techgirl-3d_seed1505.png`** — 896×1152, seed `1505`

> modern 3D character render, young Asian woman tech professional with a glossy
> dark bob haircut, amber orange minimalist jacket, subtle tech earpiece, soft
> studio lighting, plain white background, confident approachable expression,
> high quality stylised 3D brand mascot, upper body

Closest finish to the existing LINE avatar. Seed `1606` is the same, tighter crop.

---

## Signal companion — robot

**Kept · `sig-flat-panel-face_seed101.png`** — 1024², seed `101`

> flat vector mascot character for a tech brand, friendly rounded assistant robot
> with a warm amber orange body and dark charcoal grey face panel, simple bold
> geometric shapes, minimal corporate flat illustration, centered on plain white
> background, cheerful confident expression, clean thick outlines, modern startup
> brand mascot

Seed `202` = same prompt, rounder, loses the arms.

**Rejected direction** — soft 3D (seeds `303`, `404`). Reads toy, not business OS.
Kept in the generation workspace, not promoted here.

---

## What the prompts cannot do

- **Character consistency.** Every seed is a different person. A production mascot
  needs a character sheet or a trained reference — text-to-image will not hold a
  face across poses.
- **Exact brand colour.** Every render lands terracotta, not `#E8820C`; "dark"
  lands navy, not `#1F2937`. Final art is redrawn to token. Do not colour-pick.
- **Text.** Never ask this model for a logo, a wordmark, or any lettering.

---

## Character sheets — 2026-09-02

Character-bible strings. Repeat the constants block **verbatim** in every prompt;
that repetition is the only consistency lever text-to-image gives you.

### น้องวางใจ — soft 3D

Constants block:

> cute chubby 3D mascot character, smooth matte amber orange rounded egg shaped
> body, dark charcoal grey rounded stub arms and short stubby legs, large glossy
> black eyes with white highlights, tiny simple smiling mouth, soft pink blush
> cheeks, small dark charcoal rounded ear pieces on both sides of the head, soft
> even studio lighting, plain white background, stylised 3D brand mascot render

| Sheet | Seed | Size | Result |
|---|---|---|---|
| Expressions (6-head grid) | `2202` | 1344×768 | ✅ the reference sheet |
| Poses (4 poses) | `2303` | 1344×768 | ⚠️ only 2 poses, over-zoomed |
| Turnaround (4 views) | `2101` | 1344×768 | ❌ drifted to a bear |

**The drift, and the fix.** `ear pieces` pulls the model toward animal ears — at
1344×768 with a turnaround prompt it produced a bear with a belly patch. Replace
with `two small dark charcoal rounded pads set flush against the sides of the
head, not animal ears` and add a negative-intent phrase to the prompt
(`no animal ears, no snout, no belly marking`) before regenerating.

The expression sheet did **not** drift, because the six-head grid gave the model
no room to invent a body. Prefer head-grid sheets when locking a face.

### Zuri — 2.5D anime

Constants block:

> 2.5D anime style character, cel shaded 3D render, cute young Asian tech girl,
> dark chin length bob with a small amber orange hair clip, large round glasses,
> big expressive anime eyes, soft blush, warm friendly smile, cozy otaku tech
> aesthetic, plain white background, upper body, high quality

| Variant | Seed | Wardrobe |
|---|---|---|
| **Primary** | `3404` | gaming headset with amber cups, cream cardigan, amber buttons |
| Refined | `3101` | cream hoodie, headphones at neck |
| Playful | `3303` | amber hoodie, holding a laptop |
| Alt | `3202` | cream hoodie, second seed |

All at 896×1152, 8 steps.

**Still needed:** turnaround + expression sheet for Zuri. Use the head-grid
approach that worked for วางใจ, not a full-body turnaround.

---

## Metrics Map REV 02.3 — reference-based paired poses (2026-09-25)

Generated with the image-generation tool from the supplied draft Zuri teaching
image and the current 2D Wangjai front-wave reference. These are draft assets,
not final brand artwork. The image-generation IDs are kept in the filenames;
there is no ComfyUI seed for these files.

### Chart pose — `metrics-pair-chart_gen-04ac9b83.png`

References: `output/draft/assets/mascot/zuri-teaching_seed7101.png` and
`assets/mascots/wangjai/wangjai-anime-2d/front-wave_seed9101.png`.

> A transparent-background 2D Japanese anime editorial illustration for a
> marketing metrics guide. Retain Zuri's adult proportions, chin-length
> near-black bob, thin round glasses, amber clip on her left, cream cardigan,
> black top, black trousers and cream sneakers. Retain Nong Wangjai as one
> small amber capsule robot with charcoal rounded-square front panel, black dot
> eyes, curved smile, amber side rings, short arms and legs, black hands and
> feet. Zuri turns naturally toward a blank chart card and points with a pen;
> Wangjai raises one arm and shows a simple three-bar icon on its face panel.
> Crisp 2D line art, soft cel shading, transparent background, no setting,
> text, lettering, logo, shadow, gradient, glow or extra characters.

Color correction prompt for this selected pose: “Edit this illustration with
the smallest possible change: recolor Zuri's trousers from blue to near-black
charcoal (#1F2937), keeping the exact same cut and folds. Preserve every other
detail, pose, face, glasses, hair, amber hair clip, cream cardigan, chart card,
Wangjai's exact capsule body and face panel, linework, composition,
transparency, size, and colors. This is a targeted clothing-color correction
only.” Final generated ID: `04ac9b83-9dac-4ae7-91f8-33e582ef2984`.

### Clipboard pose — `metrics-pair-clipboard_gen-80d72fb8.png`

> Make a new transparent-background 2D Japanese anime editorial illustration
> of the same two brand mascots. Keep Zuri adult with thin round glasses,
> chin-length near-black bob, amber clip on her left, cream cardigan, black top
> and trousers, cream sneakers with amber details. Keep Wangjai as one small
> waist-height amber capsule with a charcoal rounded-square face panel, black
> dot eyes and curved smile, amber side rings and short black-tipped limbs.
> Zuri stands at a slight three-quarter angle with a clipboard, turning toward
> Wangjai with an inviting explanatory gesture; Wangjai leans forward and
> raises an arm as if noticing a checked signal. Fully visible, natural,
> asymmetrical pose, crisp flat 2D anime line art, transparent background, no
> text, logos, setting, shadows, gradients, extra characters or blue clothes.

Final generated ID: `80d72fb8-8a88-4f98-ad03-178a51df99a9`.

### Analysis pose — `metrics-pair-analysis_gen-d190a201.png`

> Create a different transparent-background 2D Japanese anime editorial
> illustration of the same Zuri and Nong Wangjai characters. Keep Zuri adult
> with thin round glasses, chin-length near-black bob, amber clip, cream
> cardigan, black top and trousers, cream sneakers with amber accents. Keep
> Wangjai as one waist-height amber capsule robot with charcoal rounded-square
> front panel, black dot eyes and curved smile, amber rings, short arms/legs,
> black hands/feet. Zuri sits sideways on a simple stool at a slim unbranded
> laptop, one hand near the trackpad and the other open toward the screen as
> she explains. Wangjai stands beside the laptop, tilted toward the screen,
> with a small magnifier icon on the panel. Natural complete pose, crisp 2D
> line art, soft cel shading, transparent background, no setting, shadow,
> gradient, glow, text, numbers, logos, extra figures or blue clothing.

Final generated ID: `d190a201-2855-461a-8316-d08df8f62b49`.
