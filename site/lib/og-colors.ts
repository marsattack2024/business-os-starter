/**
 * Hex palette for /opengraph-image, /icon, /apple-icon.
 *
 * `next/og` renders inside Satori (an SVG renderer in a V8 isolate) and
 * cannot resolve CSS custom properties — it has no DOM, no <html>, no
 * stylesheet. So the OG/icon files have to inline hex literals.
 *
 * These values are the hex equivalents of the OKLCH primitives in
 * app/globals.css (`--primitive-*`). When a fork swaps the palette
 * there, also update this file. They are intentionally duplicated
 * (in a single place) rather than computed because OKLCH → sRGB
 * conversion at the edge is overkill for static brand colors.
 *
 * Scaffold defaults are achromatic (unset). After picking a pack from
 * lib/themes/, update these hexes to match.
 */
export const OG_COLORS = {
  cream:  "#F7F7F8", // ~oklch(98.5% 0.002 260)
  ink:    "#1C1C1F", // ~oklch(18% 0.004 260)
  accent: "#6A6A72", // ~oklch(48% 0.008 260)
  muted:  "#5C5C64", // ~oklch(42% 0.006 260) — must match --primitive-muted
} as const;
