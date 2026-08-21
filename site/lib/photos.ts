import { generatedPhotos, type PhotoKey } from "./photos.generated";

/**
 * PHOTO REGISTRY — one entry per photograph, referenced by key everywhere.
 *
 * `photos.generated.ts` owns the mechanical facts (path, intrinsic size,
 * dominant colour, blur preview, art-directed variants) and is rebuilt by
 * `npm run photos:build`. This file owns the ALT TEXT, which is copy: it is
 * read aloud to a blind visitor and indexed by image search, so it belongs with
 * the writing, not with the build output. Nothing here is generated, so nothing
 * here is overwritten by a rebuild.
 *
 * ALT RULES (agency standard):
 *   - Every photograph gets real alt text. `alt=""` is only ever correct for
 *     non-photographic decoration, and a session photograph is never that.
 *   - Describe what is IN the frame, not what the page is selling. "A woman
 *     laughing with her daughter on a studio bench", not "our family package".
 *   - Write it against the pixels. Alt text is a public claim, and a swapped
 *     pair of strings is a live defect on every page that uses either key.
 *
 * ── FORKING THIS ───────────────────────────────────────────────────────────
 * Replace every entry below, in step with the SLUGS map in
 * `scripts/build-photo-manifest.mjs`. The keys must match exactly: `ALT` is
 * typed as `Record<PhotoKey, string>`, so a key present in one and missing from
 * the other is a typecheck failure rather than a blank alt attribute in
 * production.
 *
 * The bracketed strings are deliberate. `npm run content:qa:launch` fails on a
 * `[Bracketed]` token in any path that is not marked `_example`, so a fork that
 * ships this file unedited cannot pass its own launch gate.
 */
const ALT: Record<PhotoKey, string> = {
  EXHERO: "[Describe the hero photograph: who is in it, what they are doing, where]",
  EX01: "[Describe this photograph]",
  EX02: "[Describe this photograph]",
  EX03: "[Describe this photograph]",
  EX04: "[Describe this photograph]",
};

type Variant = {
  readonly srcSet: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

export interface Photo {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Painted behind the frame so an image never starts as a grey hole. */
  readonly dominantColor: string;
  /** Present only on art-directed keys. See scripts/build-photo-manifest.mjs. */
  readonly landscape?: Variant;
  readonly portrait?: Variant;
  readonly blurDataURL: string;
  readonly alt: string;
}

export type { PhotoKey };

/** Look up a photograph by key. Alt text is always present. */
export function photo(key: PhotoKey): Photo {
  return { ...generatedPhotos[key], alt: ALT[key] };
}

/** Same, with a caption-specific alt override (a rare, deliberate exception). */
export function photoWithAlt(key: PhotoKey, alt: string): Photo {
  return { ...generatedPhotos[key], alt };
}
