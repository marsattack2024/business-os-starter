# Live Tweaks Panel — client design-review workflow

The template ships `components/ui/TweaksPanel.tsx` and `lib/tweaks.config.ts` for running live design-review sessions with a photographer client. Pick variants in the browser, click "Copy choices for Claude →", paste the prompt, Claude locks in the picks.

**Renders only on localhost.** Triple-layered guard (NODE_ENV + hostname check + dev-only build flag) means it never ships to a preview or production deploy.

## Setup

### 1. Define your tweak groups in `lib/tweaks.config.ts`

```ts
export const TWEAK_GROUPS: TweakGroup[] = [
  {
    key: "palette",
    sectionLabel: "Whole page",
    label: "Color Palette",
    target: "main",
    opts: [
      { val: "default", label: "Editorial Cream", swatches: ["#C9A961", "#1A1A1A"] },
      { val: "warm-luxe", label: "Warm Luxe", swatches: ["#B65D3B", "#1A1410"] },
      { val: "moody", label: "Dark Moody", swatches: ["#8C6B49", "#141619"] },
    ],
  },
  {
    key: "hero-density",
    sectionLabel: "Hero",
    label: "Hero Density",
    target: "#hero",
    opts: [
      { val: "spacious", label: "Spacious" },
      { val: "tight",    label: "Tight" },
    ],
  },
  {
    key: "show-testimonials",
    sectionLabel: "Testimonials",
    label: "Testimonials",
    target: "#testimonials",
    opts: [
      { val: "on",  label: "Show" },
      { val: "off", label: "Hide" },
    ],
  },
];

export const TWEAK_DEFAULTS: Record<string, string> = {
  palette: "default",
  "hero-density": "spacious",
  "show-testimonials": "on",
};
```

### 2. Add CSS overrides in `app/globals.css`

```css
/* Palette overrides */
body[data-palette="warm-luxe"] {
  --primitive-accent: #B65D3B;
  --primitive-ink: #1A1410;
  --primitive-cream: #F4ECDB;
}
body[data-palette="moody"] {
  --primitive-accent: #8C6B49;
  --primitive-ink: #141619;
}

/* Hero density */
body[data-hero-density="tight"] {
  --space-section-y: 4rem;
  --space-heading-body-gap: 2rem;
}

/* Section visibility */
body[data-show-testimonials="off"] section[id^="testimonials"] {
  display: none;
}
```

### 3. Mount the panel in your layout

```tsx
// app/(site)/layout.tsx
import { TweaksPanel } from "@/components/ui/TweaksPanel";
import { TWEAK_GROUPS, TWEAK_DEFAULTS } from "@/lib/tweaks.config";

// inside the component:
<TweaksPanel groups={TWEAK_GROUPS} defaults={TWEAK_DEFAULTS} />
```

(The panel returns `null` outside localhost, so this is safe to always import.)

### 4. Run a review session

```bash
npm run dev
```

Open `http://localhost:3000/` in a browser with the photographer. The ✦ button is in the bottom-right corner. Click around. Talk through palettes. Land on a combo.

### 5. Lock in the picks

Click "Copy choices for Claude →" in the panel. Paste the auto-generated message into Claude. Claude promotes the winning CSS to `:root`, removes the override blocks, deletes the TweaksPanel from the layout, deletes the tweaks.config entries that were locked in.

The CSS for the WINNING variants becomes the new default. The losing variants are deleted.

## When to use vs not

**Use:**
- Picking a color palette with a client who isn't on Figma
- A/B testing two layout densities live
- Letting a photographer toggle sections on/off to see what their site looks like simpler

**Don't use:**
- After design is locked — delete the panel + tweaks.config, prevents stale CSS lingering
- For copy edits — that's just a text edit, no panel needed
- For prod feature flags — this is a localhost-only design tool, not a feature flag system

## Cleanup checklist after design is locked

- [ ] Remove `<TweaksPanel />` mount from layout
- [ ] Set `TWEAK_GROUPS = []` and `TWEAK_DEFAULTS = {}` in `lib/tweaks.config.ts` (OR delete the file if you're sure)
- [ ] Remove `body[data-...]` override blocks from `globals.css`
- [ ] Promote the winning palette/spacing/etc. into `:root` `--primitive-*` values

The `TweaksPanel.tsx` component itself can stay. It remains localhost-only and leaves the door open for future review sessions.

## Copy review contract

Copy alternatives are allowed only when every option is source-backed. Put the strongest recommended option first and make it the default. Render one active semantic tree rather than hiding duplicate headings or paragraphs, then promote the selected copy into the canonical content source before launch. The panel is a decision tool, not public A/B testing.

Every group names the visible section it affects and supplies a real `target` selector. Selecting an option snaps to that section immediately, outlines it while the layout settles, and aligns it to the top on mobile so the panel does not cover the changed content.
