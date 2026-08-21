import Image from "next/image";
import type { Photo } from "@/lib/photos";

/**
 * FRAME — the only way a photograph enters a page built on this system.
 *
 * Three things are centralised here because getting any of them wrong is
 * invisible in development and expensive in the field:
 *
 * 1. `sizes`. Without it `next/image` assumes 100vw and hands a phone the
 *    desktop file. Every caller must state how wide the image actually renders,
 *    so the callers pass real values rather than inheriting a default.
 * 2. `placeholder="blur"`. Each photograph ships a ~20px preview of ITSELF
 *    (see scripts/build-photo-manifest.mjs), so a decoding frame is a soft
 *    version of the picture instead of a hole. There is deliberately no fade
 *    layered on top: an opacity animation that never receives a frame freezes
 *    at its start value and hides the photograph outright.
 * 3. A matte behind the box, so even the instant before the preview paints
 *    reads as paper.
 *
 * FULL-BLEED IMAGES DO NOT USE THIS COMPONENT and do not use a blur at all;
 * see `BleedFrame` below for why a tiny preview fails at screen size.
 */
export function Frame({
  photo,
  sizes,
  ratio,
  ratioClass,
  priority = false,
  zoom = true,
  className = "",
  imageClassName = "",
  quality,
  position,
}: {
  photo: Photo;
  /** Rendered width at each breakpoint. Required — see note 1 above. */
  sizes: string;
  /** CSS aspect-ratio for the box, e.g. "4 / 5". Omit to use the file's own. */
  ratio?: string;
  /**
   * Aspect ratio as Tailwind classes instead, for the tiles whose crop CHANGES
   * at a breakpoint (`aspect-square lg:aspect-[3/4]`). An inline `aspectRatio`
   * cannot be overridden by a media query, so the two props are mutually
   * exclusive and this one wins.
   */
  ratioClass?: string;
  priority?: boolean;
  /** Slow scale on hover. Off for images inside a link that already moves. */
  zoom?: boolean;
  className?: string;
  imageClassName?: string;
  quality?: number;
  /** object-position, for crops that need the subject held off-centre. */
  position?: string;
}) {
  const boxed = Boolean(ratio || ratioClass);
  return (
    <figure
      className={`relative m-0 overflow-hidden bg-(--color-image-loading) ${ratioClass ?? ""} ${className}`}
      style={ratio && !ratioClass ? { aspectRatio: ratio } : undefined}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        {...(boxed
          ? { fill: true }
          : { width: photo.width, height: photo.height })}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        placeholder="blur"
        blurDataURL={photo.blurDataURL}
        style={position ? { objectPosition: position } : undefined}
        className={`${boxed ? "object-cover" : "h-auto w-full"} ${
          zoom
            ? "transition-transform duration-[900ms] ease-(--motion-ease-out) group-hover:scale-[1.03]"
            : ""
        } ${imageClassName}`}
      />
    </figure>
  );
}

/**
 * A photograph that fills its parent — for full-bleed heroes and breakers,
 * where the parent owns the height and the image is scenery behind text.
 *
 * Absolutely positioned rather than a grid child on purpose: as a grid child a
 * tall portrait source stretches the section to the full image height, which
 * pushes the hero subject below the fold.
 */
export function BleedFrame({
  photo,
  sizes = "100vw",
  priority = false,
  position,
  className = "",
}: {
  photo: Photo;
  sizes?: string;
  priority?: boolean;
  position?: string;
  className?: string;
}) {
  return (
    <>
      {/* The dominant colour of this photograph, painted behind it, and the
          only thing on screen while the file is in flight.

          There is deliberately NO blur placeholder on full-bleed images. A 20px
          preview of a high-contrast scene keeps the right AVERAGE tone but has
          no contrast left, so it enlarges into a milky wash that reads nothing
          like a photograph made of deep shadow and one lit wall.

          A flat, correct darkness dissolving into the real picture is both
          cheaper and more honest than a smeared guess at it. Small grid tiles
          still use the blur (see `Frame`), where it is brief, in context, and
          bridges a real lazy-load gap. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: photo.dominantColor }}
      />
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={priority ? 90 : undefined}
        style={position ? { objectPosition: position } : undefined}
        // Crossfade hook. next/image paints the real file in one step with no
        // transition (vercel/next.js#39690). RevealEngine marks this element
        // loaded once it has decoded, and the CSS in globals.css dissolves it
        // over the dominant-colour backdrop above. Fail-open: the hidden state
        // only applies when scripting is live.
        data-fade-img=""
        className={`object-cover ${className}`}
      />
    </>
  );
}

/**
 * ART-DIRECTED FULL-BLEED IMAGE — for the hero, and only where it earns itself.
 *
 * A typical hero source is a 4:5 portrait. On a phone the hero box is portrait
 * too, so that file is exactly right. On a desktop the box is roughly 16:9 and
 * `object-fit: cover` discards most of the pixels it just downloaded. The
 * reader is waiting on bytes that are cropped off screen, which is most of the
 * reason the placeholder is visible long enough to notice.
 *
 * `<picture>` is the right primitive because the browser picks exactly ONE
 * source. Two `<Image>` elements toggled with `display` do not work: a hidden
 * `<img>` with a `src` is still fetched, so that approach doubles the bytes it
 * was meant to halve.
 *
 * This deliberately steps outside `next/image` for a single image. The trade is
 * explicit: we give up on-demand optimisation for the one file where we already
 * know every rendered size, and we get the correct crop per viewport plus a
 * preload the browser can match by media query. Everything else on the site
 * stays on `next/image`.
 *
 * The variants come from the `ART_DIRECTED` map in
 * `scripts/build-photo-manifest.mjs`. A key with no entry there falls through
 * to `BleedFrame`, so this is safe to use on every hero from day one.
 */
export function ArtDirectedBleedFrame({
  photo,
  breakpoint = "(min-width: 700px)",
  priority = false,
  position,
  className = "",
}: {
  photo: Photo;
  /** Where the wide crop takes over. Must match the layout's own breakpoint. */
  breakpoint?: string;
  priority?: boolean;
  position?: string;
  className?: string;
}) {
  const { landscape, portrait } = photo;
  // No art-directed variants generated for this key: fall back to the normal
  // path rather than silently shipping an unoptimised <img>.
  if (!landscape || !portrait) {
    return (
      <BleedFrame
        photo={photo}
        priority={priority}
        position={position}
        className={className}
      />
    );
  }
  return (
    <>
      {priority && (
        // Preload the exact source the browser will choose. `media` is honoured
        // on preload links, so the phone never preloads the desktop crop.
        <>
          <link
            rel="preload"
            as="image"
            media={breakpoint}
            imageSrcSet={landscape.srcSet}
            imageSizes="100vw"
            fetchPriority="high"
          />
          <link
            rel="preload"
            as="image"
            media={`not all and ${breakpoint}`}
            imageSrcSet={portrait.srcSet}
            imageSizes="100vw"
            fetchPriority="high"
          />
        </>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: photo.dominantColor }}
      />
      <picture>
        <source media={breakpoint} srcSet={landscape.srcSet} sizes="100vw" />
        <source srcSet={portrait.srcSet} sizes="100vw" />
        {/* A bare <img>, not next/image: art direction needs <picture>, and the
            variants are pre-cut at build time. See the note above the component. */}
        <img
          src={portrait.src}
          alt={photo.alt}
          width={portrait.width}
          height={portrait.height}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          loading={priority ? "eager" : "lazy"}
          data-fade-img=""
          style={position ? { objectPosition: position } : undefined}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
        />
      </picture>
    </>
  );
}
