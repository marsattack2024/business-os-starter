---
name: generate-story-ads
description: Generate Instagram and Facebook paid ad images at Meta sizes (1:1, 4:5, 9:16) with Gemini and/or OpenAI. Use for story ads, feed ads, social creatives, or multi-size ad pipelines for any business. Requires GEMINI_API_KEY and/or OPENAI_API_KEY.
---

# Story / feed ad generator — Meta size pipeline

**Output:** 1080×1080 / 1080×1350 / 1080×1920 PNGs ready for Meta Ads Manager upload.
Works for any business (realtor, consultant, local service, coach) — not locked to one vertical.

## Requirements (degrade clearly)

- At least one of **`GEMINI_API_KEY`** or **`OPENAI_API_KEY`** in the environment or a
  local Git-ignored `.env`. If neither is set, stop and tell the owner which key
  is needed. Do not invent keys or read unrelated project folders.
- One-time deps: `pip install google-genai openai pillow` (or only the provider in use).
- Mac and Windows both work when Python and the keys are available.

## Workflow: Write copy first, then generate

1. **Write ad copy** in the owner's voice (`write-content` / `meta-ads` / offer context) —
   angles, hooks, headlines, CTAs. Do not invent testimonials or results.
2. **Map each concept** to a size and visual category (below).
3. **Write specs** — one JSON object per ad, or a combined `specs_*.json`.
4. **Generate** — Gemini first (faster), OpenAI second (different aesthetic) when both keys exist.
5. **Review side by side** — pick winners; note what worked for the next round.

## Multi-size support (Meta)

| Size key | Final output | Use for |
|---|---|---|
| `"1:1"` | 1080×1080 | Square feed |
| `"4:5"` | 1080×1350 | Portrait feed (often strongest) |
| `"9:16"` | 1080×1920 | Stories / Reels |

**Campaign mix rule:** mostly 1:1 + 4:5 for cold/warm feed; 9:16 for Stories retargeting.
Adjust to the business — do not force a photographer-only mix.

## SDK + models

### Gemini (primary)

```bash
pip install google-genai pillow
```

Use `google-genai` — not the deprecated `google-generativeai` package.

| Model | Use for |
|---|---|
| `gemini-3.1-flash-image-preview` | Default — fast |
| `gemini-3-pro-image-preview` | Higher quality finals |

### OpenAI (secondary)

```bash
pip install openai pillow
```

Use current gpt-image models documented in the OpenAI images API. Map sizes to the
API's accepted dimensions inside the bundled script — do not guess new size enums.

## Spec shape

Each ad spec needs at least:

```json
{
  "id": "offer_01",
  "size": "4:5",
  "prompt": "..."
}
```

Prompt rules that prevent common failures:

- Lead with a short **no debug annotations** instruction (no rulers, coordinates, safe-zone marks).
- Minimal on-image copy: eyebrow, headline, short subhead, CTA — no bullet lists.
- Title Case for on-image text; spell-check before generate.
- Describe the business scene concretely (property exterior, office desk, consulting table,
  product flat-lay) — not a generic purple SaaS gradient.

## Visual categories (any vertical)

### A — Scene / product photo

Photorealistic setting that signals the offer: a listing exterior, a clean consulting desk,
a workshop bench, a storefront. No fake people unless the owner supplies approved imagery.

### B — Diagram / comparison

Old way vs new way. Flat editorial, sparse labels (3–5 words max per panel).

### C — Bold typography

Dark or brand-color canvas, one object or texture, large headline, one CTA.

Use brand colors from `site/app/globals.css` / `context/` when available. If none exist,
ask the owner for 2–3 hex values rather than inventing a luxury gold/cream system.

## Generating — bundled scripts

```bash
S=".claude/skills/generate-story-ads/scripts"
OUT="$HOME/Desktop/story-ads/<campaign>"   # or another owner-chosen folder outside Git

python3 "$S/generate.py"        --dir "$OUT"
python3 "$S/generate.py"        --dir "$OUT"  offer_01
python3 "$S/generate.py"        --dir "$OUT"  --model pro
python3 "$S/generate_openai.py" --dir "$OUT"
```

Each reads `specs_*.json` from `--dir`, writes Gemini to `<dir>/output/` and OpenAI to
`<dir>/output_openai/`. Keep campaign folders on the Desktop (or similar) — not inside
the private business repository unless the owner explicitly wants them there and Git-ignored.

## Folder structure

```
~/Desktop/story-ads/<campaign-name>/
├── specs_<campaign>_01_10.json
├── output/
└── output_openai/
```

## Common failures

| Symptom | Fix |
|---|---|
| Coordinate / margin marks in image | Strengthen the no-annotation preamble |
| Bullet lists appear | Forbid bullets; shorten on-image copy |
| Hard edge instead of soft text zone | Describe a photographic dissolve into the text background |
| Wrong aspect | Confirm `size` in the spec matches the intended Meta placement |
| Missing key | Stop; ask owner to set `GEMINI_API_KEY` / `OPENAI_API_KEY` |

## Done when

- PNGs exist at the requested Meta sizes
- Claims in the creatives match `context/rules.md`
- Keys never entered chat or Git
