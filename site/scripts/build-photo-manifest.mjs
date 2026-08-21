#!/usr/bin/env node
/**
 * build-photo-manifest.mjs — turns a folder of session originals into the
 * site's typed photo registry.
 *
 * WHY THIS EXISTS
 * `next/image` can only avoid layout shift if it knows a photograph's intrinsic
 * size, and it can only load *gracefully* if it has something to show while the
 * full file decodes. A `fill` image with no placeholder is a hole in the page
 * until the byte stream lands, which on a slow phone is the difference between
 * "the studio's work" and "a grey rectangle". So every photograph is registered
 * once, with its real dimensions and a tiny inline preview of ITSELF, and every
 * component reads that registry instead of hardcoding a path.
 *
 * The preview is a 20px-wide WebP encoded as a data URI (~400-700 bytes). It is
 * handed to `next/image` as `placeholder="blur" blurDataURL={...}`, so first
 * paint is a soft version of the actual picture that sharpens into it. Nothing
 * is hidden behind an animation that could stall.
 *
 * Usage:
 *   npm run photos:build -- --src /path/to/originals
 *   npm run photos:build -- --src <dir> --force
 *
 * Reads `<src>/<KEY>.jpg` for every KEY in SLUGS below, writes
 * `public/images/<slug>.webp`, and regenerates `lib/photos.generated.ts`.
 * Idempotent: existing WebP outputs are reused unless --force is passed, so a
 * copy-only rerun is cheap — which is also how `npm run intake:images` can feed
 * this script: intake writes the WebP straight to the slug path, and this run
 * registers it without re-encoding.
 *
 * ── FORKING THIS ───────────────────────────────────────────────────────────
 * Three data maps below are yours to replace, and nothing else in this file
 * should need to change:
 *
 *   SLUGS         KEY -> public path. The key is the studio's shoot reference;
 *                 the slug is what ends up in the URL, so it must DESCRIBE the
 *                 photograph (image search reads it) and its leading folder
 *                 should place it in the right genre.
 *   ART_DIRECTED  the keys that get pre-cropped hero variants. Optional, and
 *                 empty is a valid answer — see the note above it.
 *   lib/photos.ts the ALT TEXT, which is copy and therefore lives with the
 *                 writing rather than in this build output.
 *
 * The template ships ONE example key so the page system renders on a fresh
 * fork. Delete it once you have real photographs; nothing else references it.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("build-photo-manifest: requires `sharp` (Next.js ships it).");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const srcDir = args.src ? resolve(args.src) : null;
const force = Boolean(args.force);

const OUT_DIR = join(root, "public/images");
const MANIFEST = join(root, "lib/photos.generated.ts");
const MAX_EDGE = 2400;
const QUALITY = 82;

/**
 * Blur preview width.
 *
 * A tiny preview keeps the right AVERAGE tone at any size but loses all
 * CONTRAST. Downsampling a scene of deep shadow and one lit wall converges
 * everything on mid-grey, which enlarges into a milky wash.
 *
 * That is fine on a small grid tile, where the blur is brief, in context, and
 * bridges a real lazy-load gap. It is wrong at full-bleed, so the full-bleed
 * components do not use a blur at all: they paint `dominantColor` and dissolve
 * the real photograph over it. See components/pc/Frame.tsx.
 */
const PREVIEW_WIDTH = 20;

/**
 * ART DIRECTION — the hero is cropped by the browser, and that is expensive.
 *
 * A typical hero source is a 4:5 PORTRAIT. On mobile the hero box is portrait
 * too, so the file is exactly right. On desktop the box is roughly 16:9, and
 * `object-fit: cover` throws away most of the pixels it just downloaded. The
 * reader waits for bytes that are cropped off screen, which is most of why the
 * placeholder is visible long enough to notice.
 *
 * So the wide viewports get a pre-cropped landscape file instead. Measured on a
 * real build: 352KB -> 194KB, a 45% cut on the LCP image, with no visible
 * difference because those pixels were never on screen.
 *
 * `focus` is the vertical centre of the crop, matching the `object-position`
 * the design uses, so the art-directed file frames the subject identically.
 *
 * `focusX` is the same idea for the NARROW branch, and it exists because a
 * LANDSCAPE source has the opposite problem. Every mobile hero box is TALLER
 * than a landscape file, so handing a phone a downscaled 3:2 file makes the
 * BROWSER pick the crop: `object-fit: cover` keeps the middle band of the width
 * and throws the rest away, centred, with no idea what is in the picture.
 *
 * A key that declares `focusX` therefore gets a REAL portrait crop cut here,
 * at `portraitRatio` (4:5 by default) and horizontally centred on the viewed
 * point of interest, instead of a shrunken landscape. In a 4:5 box the browser
 * then has nothing left to guess: file shape and box shape agree.
 *
 * Declare `focusX` on landscape sources only. On a portrait source the file is
 * already the right shape and the build fails rather than silently recropping.
 *
 * ── THIS MAP IS OPTIONAL ───────────────────────────────────────────────────
 * An empty `{}` is a valid, working configuration: a key with no entry ships
 * its master only, and `ArtDirectedBleedFrame` falls back to `BleedFrame` for
 * it. Add an entry when a key is actually used as a hero and you have opened
 * the file and read its point of interest off the pixels. Every `focus` and
 * `focusX` is a composition decision about a specific photograph; there is no
 * sensible default and guessing one is how a subject's head gets cropped.
 *
 * The single entry below is the EXAMPLE key, kept so the shape is executable
 * rather than described. Replace it.
 */
const ART_DIRECTED = {
  EXHERO: {
    // A landscape source. `ratio` is chosen against the SOURCE shape: a
    // portrait source can give a 4:3 band, a landscape source cannot (its own
    // height runs out), so a landscape master declares 16:9.
    ratio: 16 / 9,
    // Vertical centre of the wide crop, 0 = top edge. Above centre here so the
    // band keeps headroom above a standing subject.
    focus: 0.4,
    widths: [1200, 1600, 2000, 2400],
    // Horizontal centre of the NARROW crop cut out of this landscape frame.
    focusX: 0.5,
    // The mobile branch still needs real widths. A phone must never be handed
    // the 1600px master because it happens to be the correct SHAPE.
    portraitWidths: [640, 828, 1080],
  },
};

/**
 * KEY -> public slug.
 *
 * Every key should be VIEWED before it is registered: what the photograph
 * shows, where its point of interest sits, which crops it tolerates and which
 * pages may use it are decisions no build step can make. Keep that record
 * wherever the client's asset sheet lives, and add a key here only after
 * adding its row there.
 *
 * The `_example` prefix on the shipped key is load-bearing twice over: it marks
 * the file as template scaffolding, and `scripts/content-qa.mjs` skips any path
 * containing `_example`, so the placeholder alt text below does not trip the
 * launch gate on the template itself. A fork's real keys carry no such
 * exemption, which is the point.
 */
const SLUGS = {
  EXHERO: "_example/example-landscape-hero",
  EX01: "_example/example-portrait-one",
  EX02: "_example/example-portrait-two",
  EX03: "_example/example-portrait-three",
  EX04: "_example/example-portrait-four",
};

await mkdir(OUT_DIR, { recursive: true });

const entries = [];
let converted = 0;
let reused = 0;

for (const [key, slug] of Object.entries(SLUGS)) {
  const dest = join(OUT_DIR, `${slug}.webp`);
  await mkdir(dirname(dest), { recursive: true });

  if (!existsSync(dest) || force) {
    if (!srcDir) {
      console.error(
        `build-photo-manifest: ${slug}.webp is missing and no --src was given.\n` +
          `  Pass --src <dir of KEY.jpg originals> to (re)generate it.`
      );
      process.exit(1);
    }
    const source = join(srcDir, `${key}.jpg`);
    if (!existsSync(source)) {
      console.error(`build-photo-manifest: missing source ${source}`);
      process.exit(1);
    }
    await sharp(source)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);
    converted += 1;
  } else {
    reused += 1;
  }

  const buf = await readFile(dest);
  const meta = await sharp(buf).metadata();

  // The preview is generated from the SHIPPED file, not the original, so the
  // blur always matches the pixels the visitor will actually receive.
  const preview = await sharp(buf)
    .resize({ width: PREVIEW_WIDTH })
    .webp({ quality: 35, alphaQuality: 0, effort: 6 })
    .toBuffer();

  // Dominant colour, painted behind the image. It is what the reader sees in
  // the instant before even the preview decodes, and it means a full-bleed
  // frame is never a grey hole or a flash of paper on a dark photograph.
  const { dominant } = await sharp(buf).stats();
  const dominantColor = `rgb(${dominant.r} ${dominant.g} ${dominant.b})`;

  // Art-directed wide crop, when this key declares one.
  let landscape;
  let portrait;
  const art = ART_DIRECTED[key];
  if (art) {
    const bandHeight = Math.round(meta.width / art.ratio);
    if (bandHeight > meta.height) {
      // The declared band is taller than the photograph, so there is nothing to
      // crop off. Almost always a portrait ratio put on a landscape source.
      console.error(
        `build-photo-manifest: ${key} declares a ${art.ratio.toFixed(2)}:1 band, ` +
          `which is ${bandHeight}px tall on a ${meta.width}x${meta.height} source.\n` +
          `  Pick a ratio wider than the source's own ${(meta.width / meta.height).toFixed(2)}:1.`
      );
      process.exit(1);
    }
    const top = Math.max(0, Math.round((meta.height - bandHeight) * art.focus));
    const sources = [];
    for (const width of art.widths) {
      if (width > meta.width) continue;
      const outSlug = `${slug}-w${width}`;
      const outPath = join(OUT_DIR, `${outSlug}.webp`);
      // Always re-cut, never reuse. The master WebP is skipped when it exists
      // because re-encoding it needs the original and costs real time; a
      // derived crop needs neither. Skipping these on existence makes `focus`
      // un-editable: changing it leaves the old crop on disk under the same
      // filename, the build prints success, and the manifest points at a crop
      // nobody asked for. Ten seconds of sharp is worth more than that failure
      // mode.
      await sharp(buf)
        .extract({ left: 0, top, width: meta.width, height: bandHeight })
        .resize({ width })
        .webp({ quality: QUALITY })
        .toFile(outPath);
      const m = await sharp(await readFile(outPath)).metadata();
      sources.push({ src: `/images/${outSlug}.webp`, width: m.width, height: m.height });
    }
    if (sources.length === 0) {
      console.error(
        `build-photo-manifest: ${key} is ${meta.width}px wide, narrower than every ` +
          `width in its \`widths\` list, so no wide variant could be cut.\n` +
          `  Add a smaller width, or drop this key from ART_DIRECTED.`
      );
      process.exit(1);
    }
    const largest = sources[sources.length - 1];
    landscape = {
      srcSet: sources.map((s) => `${s.src} ${s.width}w`).join(", "),
      src: largest.src,
      width: largest.width,
      height: largest.height,
    };

    // The narrow branch. A portrait source is already the right shape and ships
    // whole; a landscape source is cut to `portraitRatio` around `focusX` first,
    // so the phone gets a picture composed for a portrait box instead of one
    // the browser will centre-crop blind.
    const portraitCrop = art.focusX == null ? null : portraitCropFor(key, art, meta);
    const portraitSourceWidth = portraitCrop ? portraitCrop.width : meta.width;
    const portraitSources = [];
    for (const width of art.portraitWidths) {
      if (width > portraitSourceWidth) continue;
      const outSlug = `${slug}-p${width}`;
      const outPath = join(OUT_DIR, `${outSlug}.webp`);
      const cut = portraitCrop ? sharp(buf).extract(portraitCrop) : sharp(buf);
      await cut.resize({ width }).webp({ quality: QUALITY }).toFile(outPath);
      const m = await sharp(await readFile(outPath)).metadata();
      portraitSources.push({ src: `/images/${outSlug}.webp`, width: m.width, height: m.height });
    }
    if (portraitSources.length === 0) {
      console.error(
        `build-photo-manifest: ${key}'s narrow crop is ${portraitSourceWidth}px wide, ` +
          `narrower than every width in its \`portraitWidths\` list.\n` +
          `  Add a smaller width, or drop this key from ART_DIRECTED.`
      );
      process.exit(1);
    }
    const fallback = portraitSources[portraitSources.length - 1];
    portrait = {
      srcSet: portraitSources.map((s) => `${s.src} ${s.width}w`).join(", "),
      src: fallback.src,
      width: fallback.width,
      height: fallback.height,
    };
  }

  entries.push({
    key,
    slug,
    src: `/images/${slug}.webp`,
    width: meta.width,
    height: meta.height,
    dominantColor,
    landscape,
    portrait,
    blurDataURL: `data:image/webp;base64,${preview.toString("base64")}`,
  });
}

const body = entries
  .map(
    (e) =>
      `  ${e.key}: {\n` +
      `    src: "${e.src}",\n` +
      `    width: ${e.width},\n` +
      `    height: ${e.height},\n` +
      `    dominantColor: "${e.dominantColor}",\n` +
      (e.portrait
        ? `    portrait: {\n` +
          `      srcSet:\n        "${e.portrait.srcSet}",\n` +
          `      src: "${e.portrait.src}",\n` +
          `      width: ${e.portrait.width},\n` +
          `      height: ${e.portrait.height},\n` +
          `    },\n`
        : "") +
      (e.landscape
        ? `    landscape: {\n` +
          `      srcSet:\n        "${e.landscape.srcSet}",\n` +
          `      src: "${e.landscape.src}",\n` +
          `      width: ${e.landscape.width},\n` +
          `      height: ${e.landscape.height},\n` +
          `    },\n`
        : "") +
      `    blurDataURL:\n      "${e.blurDataURL}",\n` +
      `  },`
  )
  .join("\n");

await writeFile(
  MANIFEST,
  `// GENERATED by scripts/build-photo-manifest.mjs — do not edit by hand.
// Run \`npm run photos:build\` after adding or replacing a session photograph.
//
// Each entry carries the shipped file's real intrinsic size (so next/image can
// reserve the box and never shift the layout) and a ~20px inline preview of the
// same photograph (so the box is a soft version of the picture rather than a
// hole while the full file decodes).

export interface GeneratedPhoto {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Painted behind the frame so no image ever starts as a grey hole. */
  readonly dominantColor: string;
  /**
   * Pre-cropped wide variant, present only on art-directed keys. The portrait
   * src above stays correct for mobile, where the hero box is portrait too.
   */
  readonly landscape?: {
    readonly srcSet: string;
    readonly src: string;
    readonly width: number;
    readonly height: number;
  };
  /** Responsive widths of the portrait crop, for the narrow branch. */
  readonly portrait?: {
    readonly srcSet: string;
    readonly src: string;
    readonly width: number;
    readonly height: number;
  };
  readonly blurDataURL: string;
}

export const generatedPhotos = {
${body}
} as const satisfies Record<string, GeneratedPhoto>;

export type PhotoKey = keyof typeof generatedPhotos;
`
);

const bytes = entries.reduce((n, e) => n + e.blurDataURL.length, 0);
console.log(
  `photos: ${entries.length} registered (${converted} converted, ${reused} reused) | previews ${(bytes / 1024).toFixed(1)}KB inline`
);

/**
 * The narrow branch's crop box for a landscape source: the tallest 4:5 (or
 * `portraitRatio`) window the frame can give, taking the full height and
 * sliding horizontally so `focusX` is its centre, clamped to the edges.
 *
 * Full height on purpose: nothing vertical is thrown away, so the only choice
 * being made here is the one the viewed point of interest answers — which part
 * of the WIDTH the phone gets.
 */
function portraitCropFor(key, art, meta) {
  if (meta.width <= meta.height) {
    console.error(
      `build-photo-manifest: ${key} declares focusX, but its source is ` +
        `${meta.width}x${meta.height} — already portrait or square.\n` +
        `  focusX cuts a portrait window out of a LANDSCAPE frame. A portrait ` +
        `source ships whole; drop focusX.`
    );
    process.exit(1);
  }
  const ratio = art.portraitRatio ?? 4 / 5;
  const width = Math.min(meta.width, Math.round(meta.height * ratio));
  const height = Math.min(meta.height, Math.round(width / ratio));
  const centred = Math.round(art.focusX * meta.width - width / 2);
  const left = Math.min(Math.max(centred, 0), meta.width - width);
  return { left, top: 0, width, height };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const name = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[name] = true;
    } else {
      out[name] = next;
      i += 1;
    }
  }
  return out;
}
