---
name: generate-video
description: Generate remote videos with Google Veo via the Gemini API (text-to-video, image-to-video, reference images). Use when the owner asks to generate, animate, or create a Veo/Gemini video. Requires GEMINI_API_KEY. For code-rendered Remotion videos, use the optional remotion catalog skill instead.
---

# Generate Video — Veo via Gemini API (remote)

**Official docs:** https://ai.google.dev/gemini-api/docs/video

This is the **remote** generation path (Veo over the Gemini API). It is separate
from optional **Remotion** code-rendered video in `capabilities/catalog.json`.
Any business can use it — realtor, consultant, coach, local service — not only
one agency vertical.

## Requirements (degrade clearly)

- **`GEMINI_API_KEY` or `GOOGLE_API_KEY`** must be set in the environment or a
  local Git-ignored `.env` in the project or home directory. If missing, stop and
  tell the owner how to create a key at Google AI Studio — do not invent a key
  and do not read secrets from unrelated project folders.
- **`ffmpeg`** must be on PATH (Mac or Windows). Veo returns audio; strip it
  before shipping a website hero clip.
- **`python3`** + `requests` for the bundled script.
- Never hardcode API keys. Never commit generated MP4s or `/tmp` scratch scripts.

If the key or ffmpeg is missing, report that blocker and stop. Do not pretend a
local Remotion render ran.

---

## Step 0 — Determine the mode

Ask the user which mode they need (or infer from context):

| Mode | When to use | Key input |
|------|-------------|-----------|
| **A — Text to video** | No image, just a prompt | Text prompt only |
| **B — Image to video** | Have a starting image, want to animate it | Image file path |
| **C — Wide base image pipeline** | Have a portrait/wrong-ratio image, need 16:9 | Image file path → generate wide version first |
| **D — Reference image** | Want subject appearance preserved, not a starting frame | Image file path + `referenceType: "asset"` |

**Default recommendation:** If the user has a portrait (9:16) image and wants a 16:9 video, always use **Mode C** — generate the wide base image first, then animate. This produces the best composition match.

---

## Critical API Gotchas (learned the hard way)

These will silently 400 if you get them wrong:

1. **Image format** — Use `bytesBase64Encoded` + `mimeType` directly. Do NOT use `inlineData` or `fileUri` — both return 400 on this endpoint.
   ```json
   "image": { "bytesBase64Encoded": "...", "mimeType": "image/jpeg" }
   ```

2. **`durationSeconds` must be a number** — `"8"` (string) returns 400. Use `8` (int).

3. **`negativePrompt` not supported** when using `referenceImages` — remove it or get 400.

4. **`personGeneration`** — always set `"allow_adult"` for any video with a person. Required for image-to-video.

5. **Veo 3.1 always generates audio** — strip it with ffmpeg after download. Never ship the raw file to a website.

6. **Safety filters** — avoid describing clothing/swimwear explicitly in prompts for person videos. Describe the motion and environment instead; the starting image already establishes the subject.

7. **`referenceImages` vs `image`** — these do different things:
   - `image` in instances = starting frame (true image-to-video, animates FROM the photo)
   - `referenceImages` with `referenceType: "asset"` = appearance reference only (model may not match scale/composition)

---

## Supported Parameters

```python
"parameters": {
    "aspectRatio": "16:9",          # or "9:16"
    "durationSeconds": 4,           # 4, 6, or 8 (int, not string)
    "resolution": "720p",           # "720p" (default), "1080p", "4k" (8s only)
    "personGeneration": "allow_adult",
}
```

**Duration rules:**
- `1080p` and `4k` → must be `8`
- Extension, reference images → must be `8`
- Otherwise → `4`, `6`, or `8`
- **Minimum is 4** — can't do 3s at the model level; trim with ffmpeg if needed

---

## Mode A — Text to Video

```python
payload = {
    "instances": [{ "prompt": PROMPT }],
    "parameters": {
        "aspectRatio": "16:9",
        "durationSeconds": 8,
        "personGeneration": "allow_adult",
    },
}
```

---

## Mode B — Image to Video (starting frame)

Best for: animating an image that already has the right aspect ratio.

```python
with open(IMAGE_PATH, "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode()

payload = {
    "instances": [{
        "prompt": PROMPT,
        "image": {
            "bytesBase64Encoded": img_b64,
            "mimeType": "image/jpeg",   # or "image/png"
        },
    }],
    "parameters": {
        "aspectRatio": "16:9",
        "durationSeconds": 6,
        "personGeneration": "allow_adult",
    },
}
```

**Prompt strategy for locked-camera, slow motion:**
```
"Animate this image with extremely subtle, slow motion.
The camera is completely locked — absolutely no camera movement,
no pan, no tilt, no zoom, no drift. [Subject] continues in the
exact same direction at the same depth, same distance from camera.
Preserve the exact visual style, color palette, and lighting of
the starting image. No style change. No morphing. No cuts."
```

---

## Mode C — Wide Base Image Pipeline (recommended for 16:9 from portrait source)

**Step 1: Generate 16:9 base image with Gemini**

```python
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

with open(ORIGINAL_IMAGE, "rb") as f:
    orig_bytes = f.read()

response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[
        types.Part.from_bytes(data=orig_bytes, mime_type="image/jpeg"),
        "Create a photorealistic 16:9 landscape version of this image. "
        "Extend the canvas left and right while keeping the exact same subject, "
        "scale, lighting, and composition. [Describe scene details]. "
        "Photorealistic — must look like an actual photograph. No illustration.",
    ],
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
    ),
)

# Extract image bytes
img_part = next(
    p.inline_data for p in response.candidates[0].content.parts
    if hasattr(p, "inline_data") and p.inline_data
)
from PIL import Image
import io
Image.open(io.BytesIO(img_part.data)).save(WIDE_IMAGE_PATH, "PNG")
```

**Step 2: Use wide image as Veo starting frame** → same as Mode B, but with the PNG output.

---

## Mode D — Reference Image (appearance preservation)

Use when you want the model to preserve a subject's appearance across a scene it generates.
**Not** for animating FROM a specific starting frame.

```python
payload = {
    "instances": [{
        "prompt": PROMPT,
        "referenceImages": [{
            "image": {
                "bytesBase64Encoded": img_b64,
                "mimeType": "image/jpeg",
            },
            "referenceType": "asset",
        }],
    }],
    "parameters": {
        "aspectRatio": "16:9",
        "durationSeconds": 8,       # must be 8 with referenceImages
        "personGeneration": "allow_adult",
    },
    # No negativePrompt — not supported with referenceImages
}
```

---

## Generating — bundled script (run it, do NOT recreate it)

The full Veo pipeline (start → poll → download → ffmpeg audio-strip, all modes) lives
in this skill at `scripts/generate_video.py`. Run it; never paste a per-use script:

```bash
# Bundled in THIS skill. Set V from the loader's "Base directory for this skill":
V="<this skill's base directory>/scripts/generate_video.py"
python3 "$V" --mode text  --prompt "..."                       --out ~/Desktop/clip.mp4
python3 "$V" --mode image --image frame.png --prompt "..."     --out clip.mp4 --duration 6
python3 "$V" --mode ref   --image subject.jpg --prompt "..."   --out clip.mp4 --aspect 9:16
```

Payload shapes, prompt strategies, and Veo gotchas are in the Mode A–D + Supported
Parameters sections above (the script encodes them); `--mode ref` forces 8s. The old
"wide base image" route = make a 16:9 image first (generate-story-ads scripts), then
`--mode image`. Deps: `pip install requests` + ffmpeg on PATH. Key: `GEMINI_API_KEY`.

---

## Website Intro Video Pattern (Option A — Fade to Black)

When the video is for a website intro/loading screen:

```html
<div id="jj-intro">
  <!-- muted + playsinline required for autoplay -->
  <video id="jj-video" autoplay muted playsinline preload="auto" src="video.mp4"></video>
  <div id="jj-veil"></div>   <!-- black overlay that fades in -->
  <div id="jj-logo">...</div>
  <button id="jj-skip" onclick="jjEnd()">Skip ›</button>
</div>
```

**Timing:**
- `0.3s` — video fades in from black
- `1.4s` — logo rises in
- `1.6s` — skip button appears
- `3.0s` — black veil fades in (dissolves video)
- `4.2s` — intro removed, site content fades in

**Session skip** (return visitors): wrap the intro block in a check:
```js
if (!sessionStorage.getItem('intro_seen')) {
  sessionStorage.setItem('intro_seen', '1');
  // show intro
}
```
Remove that check for testing (fires every visit).

---

## ffmpeg Reference

```bash
# Strip audio only
ffmpeg -i input.mp4 -an -c:v copy output.mp4

# Strip audio + re-encode for web (recommended)
ffmpeg -i input.mp4 -an -c:v libx264 -crf 23 -preset fast -movflags faststart output.mp4

# Trim to N seconds (if model output is too long)
ffmpeg -i input.mp4 -t 4 -an -c:v libx264 -crf 23 -movflags faststart output.mp4

# Check if audio track exists
ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 input.mp4
```

---

## Model Variants

| Model ID | Notes |
|----------|-------|
| `veo-3.1-generate-preview` | Full quality, audio always on, supports referenceImages |
| `veo-3.1-fast-generate-preview` | Faster, same features |
| `veo-3.1-lite-generate-preview` | No referenceImages, no 4k |
| `veo-3.0-generate-001` | Stable (not preview), no referenceImages |
| `veo-2.0-generate-001` | No audio, stable, no referenceImages |

Default to `veo-3.1-generate-preview` unless the user needs silence at the model level (then `veo-2.0-generate-001`, but note it doesn't support image-to-video reference images).

---


---

## Website motion (optional, any vertical)

After you have a muted web-ready MP4, you may add a short intro or Ken Burns
hero on the owner's site. Prefer the business's existing brand colors and fonts
in `site/app/globals.css`. Keep motion subtle, honor `prefers-reduced-motion`,
and do not invent a photographer-only aesthetic.

For code-timed marketing videos (captions, product demos, template renders),
consider the optional Remotion skill in `capabilities/catalog.json` instead of
Veo.


## Output Checklist

- [ ] Video saved to `~/Desktop/` or user-specified path
- [ ] Audio stripped with ffmpeg
- [ ] `-movflags faststart` applied for web
- [ ] File size reported (target <5MB for web hero, <10MB acceptable)
- [ ] Script lives in `/tmp/` — not committed to repo
- [ ] `GEMINI_API_KEY` read from env only — never hardcoded
