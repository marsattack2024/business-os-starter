# Themes / palette packs

The template ships an **unset achromatic scaffold** in `app/globals.css`
(`:root` `--primitive-*`). That is intentional: forks must not all launch as
cream + gold twins.

Before launch, **pick one named pack** (or measure client brand tokens) and
apply it. SEO, quiz, forms, and schema do not depend on which pack you choose.

## Named packs (in this directory)

| Pack | File | Feel |
|---|---|---|
| **warm-atelier** | `warm-atelier.tokens.ts` | Warm paper + terracotta/gold (old default “luxe” lane) |
| **cool-gallery** | `cool-gallery.tokens.ts` | Cool slate + steel |
| **ink-paper** | `ink-paper.tokens.ts` | High-contrast black/white + crimson accent |

Also required at fork time:

1. Palette pack (or custom measured tokens)
2. Type direction (keep Source Serif/Sans, or swap in `app/layout.tsx`)
3. Composition north star (Molly editorial / live client site / Reference Room lesson — see site-builder `references/inspiration-hierarchy.md`)

## Two swap mechanisms

### 1. Global swap — edit `app/globals.css` (preferred for a full client fork)

Copy the pack’s `--primitive-*` values into `:root`, then sync hexes in
`lib/og-colors.ts` (OG/favicon cannot read CSS variables).

### 2. Per-page override — inline style on a wrapper

```tsx
import { coolGallery } from "@/lib/themes/cool-gallery.tokens";

export default function Page() {
  return (
    <div style={coolGallery}>
      {/* page content — inherits the override tokens */}
    </div>
  );
}
```

Server-Component-safe (no hydration mismatch).

## Don't

- Don’t leave the unset scaffold in production for a named brand.
- Don’t create a `<ThemeProvider>` — CSS variables already cover global + page scope.
- Don’t override `--color-*` semantic tokens directly; override `--primitive-*` only.
- Don’t treat warm-atelier as the “correct” photography look — it is one pack.
