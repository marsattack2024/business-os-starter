#!/usr/bin/env python3
"""
Story Ad Generator — OpenAI gpt-image-2, multi-size. BUNDLED + REUSABLE.

gpt-image-2 (GA 2026-04-21): exact ratios → simple upscale, no cropping.
No response_format param — returns b64_json in data[0].b64_json directly.

Usage:
    python3 generate_openai.py --dir ~/Desktop/story-ads/my-campaign        # all
    python3 generate_openai.py --dir <campaign>  dfy_01                         # partial ID match
    python3 generate_openai.py --dir <campaign>  --quality medium               # cheaper/faster

Deps:  pip install openai pillow
Env:   OPENAI_API_KEY — env var, else nearest .env / ~/.env
Note:  "boudoir" can trip OpenAI moderation — specs should say "elegant portrait
       photography studio" for the OpenAI pass (Gemini is more permissive).
       403 org-verification → platform.openai.com/settings/organization/general
"""
import sys, json, base64
from pathlib import Path
from io import BytesIO
from PIL import Image
from openai import OpenAI
from _env import resolve_key

MODEL = "gpt-image-2"
# Exact ratios for each target — no cropping, simple upscale only.
OPENAI_SIZE = {"1:1": "1024x1024", "4:5": "1024x1280", "9:16": "1008x1792"}
TARGET = {"1:1": (1080, 1080), "4:5": (1080, 1350), "9:16": (1080, 1920)}


def parse_args(argv: list[str]) -> tuple[Path, list[str], str]:
    campaign_dir, filters, quality = Path.cwd(), [], "high"
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--dir" and i + 1 < len(argv):
            campaign_dir = Path(argv[i + 1]).expanduser(); i += 2
        elif a == "--quality" and i + 1 < len(argv):
            quality = argv[i + 1]; i += 2
        else:
            filters.append(a); i += 1
    return campaign_dir, filters, quality


def load_specs(campaign_dir: Path) -> list[dict]:
    all_specs, seen = [], set()
    for spec_file in sorted(campaign_dir.glob("specs_*.json")):
        for s in json.loads(spec_file.read_text()):
            if s["id"] not in seen:
                all_specs.append(s); seen.add(s["id"])
    return all_specs


def main() -> None:
    campaign_dir, filters, quality = parse_args(sys.argv[1:])
    if not campaign_dir.is_dir():
        sys.exit(f"ERROR: --dir not found: {campaign_dir}")
    api_key = resolve_key("OPENAI_API_KEY")
    if not api_key:
        sys.exit("ERROR: Set OPENAI_API_KEY (env or a .env file).")

    specs = load_specs(campaign_dir)
    if not specs:
        sys.exit(f"ERROR: no specs_*.json in {campaign_dir}")
    if filters:
        specs = [s for s in specs if any(f in s["id"] for f in filters)]
        if not specs:
            sys.exit(f"No specs matched {filters}")

    client = OpenAI(api_key=api_key)
    out_dir = campaign_dir / "output_openai"
    out_dir.mkdir(exist_ok=True)
    print(f"Model: {MODEL} (quality={quality})\nDir:   {campaign_dir}\nAds:   {len(specs)}\n")

    for spec in specs:
        ad_id = spec["id"]
        size_key = spec.get("size", "9:16")
        oai_size = OPENAI_SIZE.get(size_key, "1024x1536")
        tw, th = TARGET.get(size_key, (1080, 1920))
        out_path = out_dir / f"{ad_id}_{size_key.replace(':', 'x')}_oai.png"
        print(f"→ {ad_id} ({size_key} → {tw}×{th}) ...", end=" ", flush=True)
        try:
            safe_prompt = (
                spec["prompt"]
                + " LAYOUT SAFETY: All text centered horizontally, at least 12% from left and"
                + " right edges. CTA button at least 8% from bottom edge. Nothing cropped or touching an edge."
            )
            resp = client.images.generate(
                model=MODEL, prompt=safe_prompt, size=oai_size, quality=quality, n=1
            )
            item = resp.data[0]
            if getattr(item, "b64_json", None):
                img_bytes = base64.b64decode(item.b64_json)
            elif getattr(item, "url", None):
                import urllib.request
                with urllib.request.urlopen(item.url) as r:
                    img_bytes = r.read()
            else:
                print("FAILED — no image data"); continue
            img = Image.open(BytesIO(img_bytes))
            if img.size != (tw, th):  # exact ratio → plain upscale, no crop
                img = img.resize((tw, th), Image.LANCZOS)
            img.save(out_path, "PNG")
            print(f"✓ {img.size[0]}×{img.size[1]} → {out_path.name}")
        except Exception as e:
            print(f"ERROR — {e}")
    print(f"\nDone. open '{out_dir}'")


if __name__ == "__main__":
    main()
