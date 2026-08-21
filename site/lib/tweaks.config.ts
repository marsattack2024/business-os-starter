import type { TweakGroup } from "@/components/ui/TweaksPanel";

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  NOT DEAD CODE. Intentionally scaffolded + waiting.              ║
 * ║                                                                  ║
 * ║  This file + components/ui/TweaksPanel.tsx ship empty so a fork  ║
 * ║  can wire them in 5 minutes for a client design review session,  ║
 * ║  then remove the mount when the design is locked. The panel is   ║
 * ║  triple-guarded — it physically cannot render on Vercel preview  ║
 * ║  or prod even if accidentally left wired.                        ║
 * ║                                                                  ║
 * ║  See CLAUDE.md → "Optional: live design tweaks" for the          ║
 * ║  high-level activation steps. This header is the deep how-to.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ─── WHY THIS EXISTS ───────────────────────────────────────────────
 *
 *   Letting a photographer click between design variants in a live
 *   review call (palette, hero crop, layout density, which sections
 *   show, dark vs light) without redeploying between every nudge.
 *
 *   The mechanism is just `document.body.setAttribute()` plus CSS
 *   attribute selectors — no React re-render, no page reload, no
 *   network. Changes are visually instant.
 *
 * ─── THREE PATTERNS YOU CAN COMBINE ────────────────────────────────
 *
 *   1. Multiple independent tweaks running simultaneously.
 *      Each TweakGroup gets its own body data-attribute. The panel
 *      can drive 10 of them at once — palette + hero crop + which
 *      testimonial style + dark vs light + CTA copy variant, etc.
 *
 *   2. Section-scoped tweaks.
 *      The body attribute is global, but the CSS selector decides
 *      WHERE the override lands — one tweak can affect only the
 *      hero, another only the gallery. Both run at the same time.
 *
 *   3. Whole-page "version A vs version B."
 *      A `data-layout` tweak combined with conditional CSS can hide
 *      half the sections and show alternates. Same URL, same DOM,
 *      different visible composition — still no reload.
 *
 * ─── WORKED EXAMPLE: ALL THREE PATTERNS AT ONCE ────────────────────
 *
 *   // lib/tweaks.config.ts
 *   export const TWEAK_GROUPS: TweakGroup[] = [
 *     // PATTERN 1 — global theme swap (affects every section)
 *     {
 *       key: "palette",
 *       sectionLabel: "Whole page",
 *       label: "Palette",
 *       target: "main",
 *       opts: [
 *         { val: "default", label: "Unset scaffold", swatches: ["#6A6A72", "#1C1C1F"] },
 *         { val: "moody",   label: "Boudoir Moody",   swatches: ["#8C6B49", "#141619"] },
 *         { val: "warm",    label: "Warm Luxe",       swatches: ["#B65D3B", "#1A1410"] },
 *       ],
 *     },
 *     // PATTERN 2 — scoped to ONE section (hero only)
 *     {
 *       key: "hero-crop",
 *       sectionLabel: "Hero",
 *       label: "Hero crop",
 *       target: "#hero",
 *       opts: [
 *         { val: "center", label: "Centered subject" },
 *         { val: "right",  label: "Subject right" },
 *         { val: "left",   label: "Subject left" },
 *       ],
 *     },
 *     // PATTERN 2 — scoped to the testimonials section
 *     {
 *       key: "testimonials",
 *       sectionLabel: "Testimonials",
 *       label: "Testimonials",
 *       target: "#testimonials",
 *       opts: [
 *         { val: "cards",    label: "Featured cards (1-up)" },
 *         { val: "carousel", label: "Carousel (3-up dark)" },
 *         { val: "off",      label: "Hide section" },
 *       ],
 *     },
 *     // PATTERN 3 — whole-page version toggle
 *     {
 *       key: "layout",
 *       sectionLabel: "Page order",
 *       label: "Page version",
 *       target: "main",
 *       opts: [
 *         { val: "long",  label: "Long scroll (default)" },
 *         { val: "short", label: "Tight one-pager" },
 *       ],
 *     },
 *   ];
 *
 *   export const TWEAK_DEFAULTS: Record<string, string> = {
 *     palette: "default",
 *     "hero-crop": "center",
 *     testimonials: "cards",
 *     layout: "long",
 *   };
 *
 *   // app/globals.css — the actual visual swaps
 *
 *   // Pattern 1: palette is body-wide
 *   body[data-palette="moody"] {
 *     --primitive-cream: oklch(96% 0.02 60);
 *     --primitive-accent: #8C6B49;
 *     --primitive-ink: #141619;
 *   }
 *   body[data-palette="warm"] {
 *     --primitive-accent: #B65D3B;
 *     --primitive-ink: #1A1410;
 *   }
 *
 *   // Pattern 2: hero-crop scoped to one section only
 *   body[data-hero-crop="right"] section.hero img { object-position: 80% 15%; }
 *   body[data-hero-crop="left"]  section.hero img { object-position: 20% 15%; }
 *
 *   // Pattern 2: testimonials scoped — show one, hide others
 *   body[data-testimonials="cards"]    section.testimonials-carousel { display: none; }
 *   body[data-testimonials="carousel"] section.testimonials-cards    { display: none; }
 *   body[data-testimonials="off"]      section[class*="testimonials"]{ display: none; }
 *
 *   // Pattern 3: whole-page version — hide a bunch of sections at once
 *   body[data-layout="short"] section.gallery,
 *   body[data-layout="short"] section.process,
 *   body[data-layout="short"] section.image-quote {
 *     display: none;
 *   }
 *
 *   (Each section needs a matching CSS class for the selectors above
 *   to grab — `<section className="hero">`, etc. The template's sections
 *   mostly don't have these yet; add them when you wire a tweak that
 *   needs them.)
 *
 * ─── HOW TO MOUNT THE PANEL ────────────────────────────────────────
 *
 *   // app/(site)/layout.tsx
 *   import { TweaksPanel } from "@/components/ui";
 *   import { TWEAK_GROUPS, TWEAK_DEFAULTS } from "@/lib/tweaks.config";
 *   //  ... inside the layout's return tree, anywhere:
 *   <TweaksPanel groups={TWEAK_GROUPS} defaults={TWEAK_DEFAULTS} />
 *
 * ─── HANDOFF AFTER THE REVIEW ──────────────────────────────────────
 *
 *   Photographer picks their favorite combo → clicks "Copy choices
 *   for Claude →" in the panel → pastes the prompt to an agent.
 *   The agent promotes the winning values to permanent defaults in
 *   :root (or wherever) and removes both the TweaksPanel mount and
 *   the now-unused override blocks from globals.css.
 *
 * ─── KEEP THESE ARRAYS EMPTY UNTIL YOU NEED THE PANEL ──────────────
 *
 *   With empty groups the panel still renders but shows nothing,
 *   so leaving the mount in costs nothing. To turn the system fully
 *   "off" between reviews, remove the <TweaksPanel /> mount in the
 *   layout. The component + types stay tree-shaken either way.
 */

export const TWEAK_GROUPS: TweakGroup[] = [];

export const TWEAK_DEFAULTS: Record<string, string> = {};
