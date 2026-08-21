#!/usr/bin/env python3
"""
Veo 3.1 video generator (Gemini API). BUNDLED + REUSABLE — run it, don't recreate it.

Modes:
  text    text-to-video                            --mode text  --prompt "..."
  image   image-to-video (animate FROM a frame)    --mode image --image start.png --prompt "..."
  ref     reference image (appearance only)        --mode ref   --image subj.jpg  --prompt "..."
(The old "wide base image" pipeline = first make a 16:9 image with the generate-story-ads
 scripts, then run this with --mode image on that PNG.)

Usage:
  python3 generate_video.py --mode text  --prompt "..."                      --out ~/Desktop/clip.mp4
  python3 generate_video.py --mode image --image frame.png --prompt "..."    --out clip.mp4 --duration 6
  python3 generate_video.py --mode ref   --image subject.jpg --prompt "..."  --out clip.mp4 --aspect 9:16

Veo always generates audio → this strips it + web-optimizes (libx264, faststart) via ffmpeg.
Deps: pip install requests (ffmpeg on PATH).   Env: GEMINI_API_KEY (env var or nearest .env).
Models: veo-3.1-generate-preview (default) | veo-3.1-fast-generate-preview |
        veo-3.1-lite-generate-preview | veo-2.0-generate-001 (silent, no ref/image).
"""
import base64, os, sys, time, subprocess, argparse
from pathlib import Path

try:
    import requests
except ImportError:
    os.system(f"{sys.executable} -m pip install requests -q"); import requests

BASE = "https://generativelanguage.googleapis.com/v1beta"


def resolve_key() -> str | None:
    for n in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        if os.environ.get(n):
            return os.environ[n].strip()
    for p in (Path.cwd() / ".env", Path.cwd() / ".env.local", Path.home() / ".env"):
        if p.exists():
            for line in p.read_text().splitlines():
                line = line.strip()
                if line.startswith(("GEMINI_API_KEY=", "GOOGLE_API_KEY=")):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def build_payload(mode, prompt, image_path, aspect, duration):
    params = {"aspectRatio": aspect, "durationSeconds": int(duration), "personGeneration": "allow_adult"}
    inst = {"prompt": prompt}
    if mode in ("image", "ref"):
        if not image_path:
            sys.exit(f"--mode {mode} requires --image")
        b64 = base64.b64encode(Path(image_path).expanduser().read_bytes()).decode()
        mime = "image/png" if str(image_path).lower().endswith(".png") else "image/jpeg"
        if mode == "image":
            inst["image"] = {"bytesBase64Encoded": b64, "mimeType": mime}
        else:  # ref — appearance only; duration must be 8
            inst["referenceImages"] = [{"image": {"bytesBase64Encoded": b64, "mimeType": mime}, "referenceType": "asset"}]
            params["durationSeconds"] = 8
    return {"instances": [inst], "parameters": params}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["text", "image", "ref"], default="text")
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--image")
    ap.add_argument("--out", required=True)
    ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    ap.add_argument("--duration", type=int, default=8, choices=[4, 6, 8])
    ap.add_argument("--model", default="veo-3.1-generate-preview")
    args = ap.parse_args()

    api_key = resolve_key()
    if not api_key:
        sys.exit("ERROR: Set GEMINI_API_KEY (env or a .env file).")
    headers = {"x-goog-api-key": api_key}
    out = Path(args.out).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)

    payload = build_payload(args.mode, args.prompt, args.image, args.aspect, args.duration)
    print(f"Model: {args.model}  mode={args.mode}  {args.aspect}  {payload['parameters']['durationSeconds']}s")

    r = requests.post(f"{BASE}/models/{args.model}:predictLongRunning",
                      headers={**headers, "Content-Type": "application/json"}, json=payload, timeout=60)
    if not r.ok:
        sys.exit(f"ERROR {r.status_code}: {r.text}")
    op = r.json()["name"]
    print(f"Operation: {op}\nPolling (1–6 min)...")

    while True:
        time.sleep(15)
        s = requests.get(f"{BASE}/{op}", headers=headers, timeout=30).json()
        gvr = s.get("response", {}).get("generateVideoResponse", {})
        if gvr.get("raiMediaFilteredCount", 0) > 0:
            sys.exit(f"Safety block: {gvr.get('raiMediaFilteredReasons')}")
        if s.get("done"):
            break
        print("  still generating...")

    uri = s["response"]["generateVideoResponse"]["generatedSamples"][0]["video"]["uri"]
    raw = out.with_suffix(".raw.mp4")
    with open(raw, "wb") as f:
        for chunk in requests.get(uri, headers=headers, stream=True).iter_content(8192):
            f.write(chunk)

    # Veo always emits audio — strip it + web-optimize.
    subprocess.run(["ffmpeg", "-y", "-i", str(raw), "-an", "-c:v", "libx264", "-crf", "23",
                    "-preset", "fast", "-movflags", "faststart", str(out)], check=True)
    raw.unlink(missing_ok=True)
    print(f"Done: {out} ({out.stat().st_size // 1024}KB)")


if __name__ == "__main__":
    main()
