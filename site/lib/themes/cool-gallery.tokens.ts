import type { CSSProperties } from "react";

/**
 * Palette pack: cool-gallery
 * Cool paper + slate ink + steel accent. Good for modern studio / fashion-adjacent brands.
 *
 *   1. Copy into app/globals.css `:root` --primitive-*
 *   2. Sync lib/og-colors.ts
 */
export const coolGallery: CSSProperties = {
  "--primitive-ink": "#12141A",
  "--primitive-cream": "#F4F5F7",
  "--primitive-accent": "#5B6B7C",
  "--primitive-accent-text": "#3D4A57",
  "--primitive-muted": "#5A6270",
  "--primitive-border": "#D8DCE3",
  "--primitive-image-loading": "#E6E9EF",
} as CSSProperties;
