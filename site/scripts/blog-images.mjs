#!/usr/bin/env node
/**
 * blog-images.mjs — the INLINE blog-image migration primitive.
 *
 * Downloads original blog images at FULL resolution, converts them to WebP, writes
 * them to `public/blog/<slug>/<NN-name>.webp`, and records each output's real pixel
 * dimensions into `content/blog/_image-dims.json` (keyed by the MDX image path →
 * `[w, h]`) so `lib/mdx.ts` stamps width/height on every <img> → no CLS.
 *
 * WHY THIS EXISTS: a blog migration that ships only the cover image (re-authoring
 * the body from prose) silently DROPS every inline body image. That is a FAILED
 * migration. Use this primitive to bring the body images over IN ORDER, then
 * re-interleave the local paths into the MDX at their original positions.
 *
 * Usage:
 *   npm run blog:images -- --manifest path/to/manifest.json
 *   npm run blog:images -- --slug my-post --url "https://site/.../IMG-1024x683.jpg" --name 01-cozy-sweater
 *
 * Manifest (preferred — preserves reading order; build it from the verbatim body):
 *   [ { "slug": "my-post",
 *       "images": [ { "url": "<original url>", "name": "01-cozy-sweater" }, ... ] } ]
 *
 * URL normalization (so we fetch the ORIGINAL, not a tiny responsive variant):
 *   WordPress  → strip `-WIDTHxHEIGHT` and `-scaled` before the extension.
 *   Squarespace→ append `?format=2000w`.
 * Idempotent: skips outputs already on disk (and backfills their dims).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("blog-images: requires `sharp` (Next.js ships it; otherwise `npm i -D sharp`).");
  process.exit(1);
}

const root = process.cwd();
const PUBLIC_BLOG = join(root, "public", "blog");
const DIMS_FILE = join(root, "content", "blog", "_image-dims.json");
const MAX_EDGE = 1600; // blog body images render in a reading column; cap the long edge
const QUALITY = 82;
const UA = "Mozilla/5.0 (compatible; blog-images/1.0)";

function fullRes(url) {
  if (/squarespace-cdn\.com/.test(url) || /[?&]format=/.test(url)) {
    return url.includes("?") ? url : `${url}?format=2000w`;
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

async function loadDims() {
  try {
    return JSON.parse(await readFile(DIMS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--manifest") a.manifest = argv[++i];
    else if (t === "--slug") a.slug = argv[++i];
    else if (t === "--url") a.url = argv[++i];
    else if (t === "--name") a.name = argv[++i];
  }
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const jobs = [];
  if (a.manifest) {
    const manifest = JSON.parse(await readFile(resolve(root, a.manifest), "utf8"));
    for (const post of manifest) {
      (post.images || []).forEach((img, i) => {
        jobs.push({ slug: post.slug, url: img.url, name: img.name || String(i + 1).padStart(2, "0") });
      });
    }
  } else if (a.slug && a.url) {
    jobs.push({ slug: a.slug, url: a.url, name: a.name || "01" });
  } else {
    console.error("usage: --manifest <file.json>   OR   --slug <slug> --url <url> [--name NN-keyword]");
    process.exit(1);
  }

  const dims = await loadDims();
  let written = 0;
  let skipped = 0;
  for (const job of jobs) {
    const file = job.name.endsWith(".webp") ? job.name : `${job.name}.webp`;
    const mdxPath = `/blog/${job.slug}/${file}`; // the key lib/mdx.ts looks up
    const outAbs = join(PUBLIC_BLOG, job.slug, file);

    if (existsSync(outAbs)) {
      if (!dims[mdxPath]) {
        const meta = await sharp(outAbs).metadata();
        dims[mdxPath] = [meta.width, meta.height];
      }
      skipped++;
      continue;
    }

    const input = await fetchBuffer(job.url);
    const out = await sharp(input)
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    await mkdir(dirname(outAbs), { recursive: true });
    await writeFile(outAbs, out);
    const meta = await sharp(out).metadata();
    dims[mdxPath] = [meta.width, meta.height]; // [w, h] tuple — the format lib/mdx.ts expects
    console.log(`OK  ${mdxPath}  ${meta.width}x${meta.height}  ${Math.round(out.length / 1024)}KB`);
    written++;
  }

  await mkdir(dirname(DIMS_FILE), { recursive: true });
  await writeFile(DIMS_FILE, `${JSON.stringify(dims, null, 2)}\n`);
  console.log(`\nblog-images: ${written} written, ${skipped} skipped → dims in content/blog/_image-dims.json`);
}

main().catch((err) => {
  console.error("blog-images error:", err.message);
  process.exit(1);
});
