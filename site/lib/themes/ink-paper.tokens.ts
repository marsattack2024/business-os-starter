import type { CSSProperties } from "react";

/**
 * Palette pack: ink-paper
 * High-contrast black / white with a single sharp accent (crimson).
 * Use when the brand wants poster energy, not warm luxury paper.
 *
 *   1. Copy into app/globals.css `:root` --primitive-*
 *   2. Sync lib/og-colors.ts
 */
export const inkPaper: CSSProperties = {
  "--primitive-ink": "#0A0A0A",
  "--primitive-cream": "#FAFAFA",
  "--primitive-accent": "#B42318",
  "--primitive-accent-text": "#8A1A12",
  "--primitive-muted": "#525252",
  "--primitive-border": "#E5E5E5",
  "--primitive-image-loading": "#EEEEEE",
} as CSSProperties;
