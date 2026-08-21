#!/usr/bin/env node
/**
 * intake-images.mjs — the DESIGN-ASSET image intake primitive.
 *
 * Sibling to scripts/blog-images.mjs, but for the asset REGISTRY (hero, gallery,
 * portrait, section breakers) — the images referenced from `lib/site.config.tsx`
 * (`siteConfig.images`) and the section configs, NOT blog body images.
 *
 * Downloads originals at FULL resolution, converts to WebP, and writes them to a
 * caller-chosen path under `public/` (default area `public/images/`). next/image
 * derives intrinsic dimensions from the static import at build time, so — unlike
 * blog-images — this does NOT write a dims file. Use blog-images.mjs for body
 * images in the reading column (which DO need _image-dims.json for CLS).
 *
 * WHY THIS EXISTS: forks used to hand-fetch + hand-convert hero/gallery swaps
 * (rename per repo convention, cwebp, resize), which was slow and easy to get
 * wrong (responsive variants instead of originals, inconsistent quality). This
 * makes an image swap one command and guarantees full-res originals + WebP.
 *
 * Usage:
 *   npm run intake:images -- --manifest path/to/manifest.json
 *   npm run intake:images -- --url "https://site/.../IMG-2048x1365.jpg" --dest images/hero.webp
 *   npm run intake:images -- --url "<url>" --dest images/gallery/01-studio.webp --max 2000 --quality 86
 *
 * Manifest (preferred — batch a whole gallery / asset set in order):
 *   [ { "url": "<original url>", "dest": "images/gallery/01-studio.webp" },
 *     { "url": "<original url>", "dest": "images/hero.webp", "max": 2600 } ]
 *
 * `dest` is relative to `public/` (a leading slash is tolerated). It must end in
 * `.webp`. Per-item `max`/`quality` override the defaults below.
 *
 * URL normalization (so we fetch the ORIGINAL, not a tiny responsive variant):
 *   WordPress  → strip `-WIDTHxHEIGHT` and `-scaled` before the extension.
 *   Squarespace→ append `?format=2500w`.
 * Idempotent: skips outputs already on disk (pass --force to overwrite).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("intake-images: requires `sharp` (Next.js ships it; otherwise `npm i -D sharp`).");
  process.exit(1);
}

const root = process.cwd();
const PUBLIC = join(root, "public");
const MAX_EDGE = 2400; // design assets (hero/gallery) render larger than blog body images
const QUALITY = 84;
const UA = "Mozilla/5.0 (compatible; intake-images/1.0)";

function fullRes(url) {
  if (/squarespace-cdn\.com/.test(url) || /[?&]format=/.test(url)) {
    return url.includes("?") ? url : `${url}?format=2500w`;
  }
  return url
    .replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp|gif)(?:$|\?))/i, "")
    .replace(/-scaled(?=\.(?:jpe?g|png|webp|gif)(?:$|\?))/i, "");
}

async function fetchBuffer(url) {
  const candidates = [...new Set([fullRes(url), url])];
  for (const u of candidates) {
    try {
      const res = await fetch(u, { headers: { "User-Agent": UA } });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error(`download failed: ${url}`);
}

function parseArgs(argv) {
  const a = { force: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--manifest") a.manifest = argv[++i];
    else if (t === "--url") a.url = argv[++i];
    else if (t === "--dest") a.dest = argv[++i];
    else if (t === "--max") a.max = Number(argv[++i]);
    else if (t === "--quality") a.quality = Number(argv[++i]);
    else if (t === "--force") a.force = true;
  }
  return a;
}

function normalizeDest(dest) {
  const clean = String(dest).replace(/^\/+/, "");
  if (!/\.webp$/i.test(clean)) {
    throw new Error(`dest must end in .webp: ${dest}`);
  }
  return clean;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  let jobs = [];
  if (a.manifest) {
    const manifest = JSON.parse(await readFile(resolve(root, a.manifest), "utf8"));
    jobs = manifest.map((m) => ({ url: m.url, dest: m.dest, max: m.max, quality: m.quality }));
  } else if (a.url && a.dest) {
    jobs = [{ url: a.url, dest: a.dest, max: a.max, quality: a.quality }];
  } else {
    console.error("usage: --manifest <file.json>   OR   --url <url> --dest images/<name>.webp [--max px] [--quality n] [--force]");
    process.exit(1);
  }

  let written = 0;
  let skipped = 0;
  for (const job of jobs) {
    const rel = normalizeDest(job.dest);
    const outAbs = join(PUBLIC, rel);
    if (existsSync(outAbs) && !a.force) {
      skipped++;
      continue;
    }
    const input = await fetchBuffer(job.url);
    const max = Number.isFinite(job.max) ? job.max : MAX_EDGE;
    const quality = Number.isFinite(job.quality) ? job.quality : QUALITY;
    const out = await sharp(input)
      .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    await mkdir(dirname(outAbs), { recursive: true });
    await writeFile(outAbs, out);
    const meta = await sharp(out).metadata();
    console.log(`OK  /${rel}  ${meta.width}x${meta.height}  ${Math.round(out.length / 1024)}KB`);
    written++;
  }

  console.log(`\nintake-images: ${written} written, ${skipped} skipped (use --force to overwrite).`);
}

main().catch((err) => {
  console.error("intake-images error:", err.message);
  process.exit(1);
});
