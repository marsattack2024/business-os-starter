import type { CSSProperties } from "react";

/**
 * Palette pack: warm-atelier
 * Former “luxury cream + gold/terracotta” lane (Mayberry/Wendy-adjacent).
 * Apply only when intake intentionally chooses this direction — not the scaffold default.
 *
 *   1. Copy these values into app/globals.css `:root` --primitive-*
 *   2. Sync lib/og-colors.ts hexes
 *   Or wrap a page: <div style={warmAtelier}>…</div>
 */
export const warmAtelier: CSSProperties = {
  "--primitive-ink": "#1A1410",
  "--primitive-cream": "#F4ECDB",
  "--primitive-accent": "#B65D3B",
  "--primitive-accent-text": "#8A4528",
  "--primitive-muted": "#8A7E70",
  "--primitive-border": "#E0D4C2",
  "--primitive-image-loading": "#E8DFD0",
} as CSSProperties;

/** @deprecated Use `warmAtelier` — kept for any leftover imports. */
export const exampleWarmLuxe = warmAtelier;
