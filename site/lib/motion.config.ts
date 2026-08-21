/**
 * Motion design tokens — single source of truth.
 *
 * Consumed by:
 *   - lib/motion.ts (Framer Motion variants — JS values)
 *   - app/globals.css (mirrored as CSS custom properties for CSS transitions)
 *
 * Framer Motion cannot read CSS custom properties at runtime, so motion values
 * live here as TS constants. The mirrored CSS vars in globals.css must be kept
 * in sync manually when these change. Two places, but explicit.
 */

export const motionDurations = {
  xs: 0.2, // quick feedback: rotate, close
  sm: 0.35, // expand/collapse
  base: 0.3, // hover state (matches Tailwind duration-300)
  md: 0.7, // image hover, scroll reveal, scaleIn
  lg: 0.75, // standard entrance: fadeUp
  xl: 0.85, // larger entrance: slide
  hero: 0.9, // hero headline fade-in, fadeIn
} as const;

/** Cubic-bezier control points: [x1, y1, x2, y2]. Framer Motion compatible. */
type CubicBezier = [number, number, number, number];

export const motionEasings = {
  /** Primary entrance easing — used 12+ places across the codebase. */
  out: [0.22, 1, 0.36, 1] as CubicBezier,
};

export const motionOffsets = {
  xs: 20, // AnimateOnScroll bottom translate
  sm: 28, // hero entrance translate-y, AnimateOnScroll side translate
  md: 32, // standard fadeUp distance
  lg: 48, // slide-left/right distance
} as const;

export const motionScale = {
  sm: 0.96, // entrance scale shrink (scaleIn)
  hover: 1.03, // GalleryGrid image hover zoom
} as const;

export const motionStagger = {
  xs: 0.06, // gallery column offset (i * 0.06)
  sm: 0.1, // carousel + delayChildren
  base: 0.12, // staggered list entrance
} as const;
