#!/usr/bin/env python3
"""
Story Ad Generator — Gemini, multi-size. BUNDLED + REUSABLE (run it, don't recreate it).

Reads specs_*.json from a campaign directory, generates each ad with Gemini, and
writes PNGs to <dir>/output/. Point it at any campaign folder with --dir.

Usage:
    python3 generate.py --dir ~/Desktop/story-ads/my-campaign            # all ads
    python3 generate.py --dir <campaign>  dfy_02                             # partial ID match
    python3 generate.py --dir <campaign>  dfy_01 dfy_05 --model pro          # multiple + pro model

Deps:  pip install google-genai pillow
Env:   GEMINI_API_KEY (or GOOGLE_API_KEY) — env var, else nearest .env / ~/.env
Models: gemini-3.1-flash-image-preview (default) | gemini-3-pro-image-preview (--model pro)
        NEVER imagen-4.0 / generate_images() — permanently banned.
"""
import sys, json, base64
from pathlib import Path
from io import BytesIO
from PIL import Image
from google import genai
from google.genai import types
from _env import resolve_key

MODEL_FLASH = "gemini-3.1-flash-image-preview"
MODEL_PRO = "gemini-3-pro-image-preview"
SIZES = {"1:1": (1080, 1080), "4:5": (1080, 1350), "9:16": (1080, 1920)}


def parse_args(argv: list[str]) -> tuple[Path, list[str], bool]:
    campaign_dir, filters, use_pro = Path.cwd(), [], False
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--dir" and i + 1 < len(argv):
            campaign_dir = Path(argv[i + 1]).expanduser(); i += 2
        elif a == "--model" and i + 1 < len(argv):
            use_pro = argv[i + 1] == "pro"; i += 2
        else:
            filters.append(a); i += 1
    return campaign_dir, filters, use_pro


def load_specs(campaign_dir: Path) -> list[dict]:
    all_specs, seen = [], set()
    for spec_file in sorted(campaign_dir.glob("specs_*.json")):
        for s in json.loads(spec_file.read_text()):
            if s["id"] not in seen:
                all_specs.append(s); seen.add(s["id"])
    return all_specs


def main() -> None:
    campaign_dir, filters, use_pro = parse_args(sys.argv[1:])
    if not campaign_dir.is_dir():
        sys.exit(f"ERROR: --dir not found: {campaign_dir}")
    api_key = resolve_key("GEMINI_API_KEY", "GOOGLE_API_KEY")
    if not api_key:
        sys.exit("ERROR: Set GEMINI_API_KEY (env or a .env file).")

    specs = load_specs(campaign_dir)
    if not specs:
        sys.exit(f"ERROR: no specs_*.json in {campaign_dir}")
    if filters:
        specs = [s for s in specs if any(f in s["id"] for f in filters)]
        if not specs:
            sys.exit(f"No specs matched {filters}")

    client = genai.Client(api_key=api_key)
    model = MODEL_PRO if use_pro else MODEL_FLASH
    out_dir = campaign_dir / "output"
    out_dir.mkdir(exist_ok=True)
    print(f"Model: {model}\nDir:   {campaign_dir}\nAds:   {len(specs)}\n")

    for spec in specs:
        ad_id = spec["id"]
        size_key = spec.get("size", "9:16")
        tw, th = SIZES.get(size_key, (1080, 1920))
        out_path = out_dir / f"{ad_id}_{size_key.replace(':', 'x')}.png"
        print(f"→ {ad_id} ({size_key} → {tw}×{th}) ...", end=" ", flush=True)
        try:
            resp = client.models.generate_content(
                model=model,
                contents=spec["prompt"],
                config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
            )
            data = None
            for part in resp.candidates[0].content.parts:
                if getattr(part, "inline_data", None) is not None:
                    data = part.inline_data.data; break
                if getattr(part, "text", None):
                    print(f"\n   note: {part.text[:200]}", end=" ")
            if data is None:
                print("FAILED — no image in response"); continue
            img_bytes = base64.b64decode(data) if isinstance(data, str) else bytes(data)
            img = Image.open(BytesIO(img_bytes))
            if img.size != (tw, th):  # Gemini ratio varies → cover-crop to target
                ratio = max(tw / img.width, th / img.height)
                nw, nh = int(img.width * ratio), int(img.height * ratio)
                img = img.resize((nw, nh), Image.LANCZOS)
                left, top = (nw - tw) // 2, (nh - th) // 2
                img = img.crop((left, top, left + tw, top + th))
            img.save(out_path, "PNG")
            print(f"✓ {img.size[0]}×{img.size[1]} → {out_path.name}")
        except Exception as e:
            print(f"ERROR — {e}")
    print(f"\nDone. open '{out_dir}'")


if __name__ == "__main__":
    main()
