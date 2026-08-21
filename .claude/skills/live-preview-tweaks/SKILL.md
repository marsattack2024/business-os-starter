---
name: live-preview-tweaks
description: Add or remove a live design tweaks panel on the Business OS Next.js site so the owner can compare palette, layout, copy, and motion options before locking the homepage. Use while the site is still a placeholder or when design decisions are open.
---

# Live Preview Tweaks — Owner design panel

A floating panel that lets the owner (or a trusted reviewer) toggle between design and functional
options — live, with no reload. The widget is always the same. The config defines
what's inside it. Any open decision becomes a group of buttons: pick one, the page
updates instantly. Install once per project, configure per use case, lock in and
remove when the owner decides.

## Business OS wiring

This repo's website lives under `site/` (Next.js App Router). Prefer paths:

- `site/components/TweaksPanel.tsx`
- `site/lib/tweaks.config.ts`

Mount the panel from `site/app/layout.tsx` or `site/app/page.tsx` only while
design decisions are open. `update-website` should suggest this panel when the
homepage is still a placeholder or when two or more visual directions are unresolved.
Remove the panel after the owner locks the look — do not leave tweak UI on a
public production site without explicit approval.


---

## When to Proactively Suggest This

**During design planning** (e.g. while running `/ui-ux-pro-max` or `/build-page`):
If you're choosing between 2+ visual directions, don't pick one — build a tweaks
panel so the client can pick live. Say:

> "Before I commit to a palette, I can add a Tweaks panel so you (or the client)
> can toggle between options live in the browser. Want me to add that?"

**During implementation:**
If a landing page has obvious decisions still open (palette, hero layout, CTA copy
variant), add the panel by default and note it in the PR description.

**When to skip it:**
If the design is already approved and locked, don't add the panel — it adds complexity
with no benefit.

---

## Architecture: One Component, One Config

The system has two files that live in every project:

```
site/components/TweaksPanel.tsx    ← shared island, never edit this
site/lib/tweaks.config.ts          ← edit this for every new use case
```

`TweaksPanel.tsx` is static — it reads from `tweaks.config.ts` and renders itself.
Every new page or project just edits the config file, not the component.

---

## The Core Mental Model

**Every open design decision becomes a tweak group.**

That's it. You don't pick from a predefined list of "allowed" tweaks. You look at
the design and ask: "What hasn't been decided yet?" Each undecided thing gets a key
in `TWEAK_DEFAULTS` and a group of buttons in `TWEAK_GROUPS`. The panel renders
whatever you put in the config.

### Two mechanisms, covering everything

**Mechanism A — CSS attribute overrides (for visual changes)**

Anything that changes how something *looks* without swapping out the component:
colors, fonts, spacing, radius, motion, dark/light, border styles, shadows.

Set a `data-*` attribute on `<body>`, write CSS override blocks that respond to it.
One attribute flip → entire page updates. Zero JS looping.

```css
/* Default in :root */
:root { --primary: #d2684a; --bg: #fbf7f0; --r-card: 14px; }

/* Override block — any key, any name you choose */
body[data-palette="ocean"]  { --primary: #1a6fa8; --bg: #f0f6fb; }
body[data-palette="dark"]   { --primary: #8b7cf8; --bg: #0f0f13; --ink: #e8e4dc; }
body[data-density="tight"]  { --section-y: 56px; --gap-md: 12px; }
body[data-density="roomy"]  { --section-y: 128px; --gap-md: 32px; }
body[data-radius="sharp"]   { --r-card: 4px; --r-btn: 6px; }
body[data-animation="none"] { --transition-speed: 0ms; }
```

Any CSS variable your design system uses can be a tweak target. If it's a var,
it's switchable.

**Mechanism B — Component swaps (for structural/functional changes)**

Anything that requires different JSX — different component, different animation,
different interactive widget. Use `data-variant` on a wrapper and CSS show/hide:

```tsx
{/* In JSX — build all variants, CSS decides which is visible */}
<div data-section="hero-widget">
  <div className="variant-calculator"><CalculatorWidget /></div>
  <div className="variant-scanner"><ScannerWidget /></div>
  <div className="variant-static"><StaticGraphic /></div>
</div>
```

```css
/* Default: show calculator */
.variant-scanner, .variant-static { display: none; }

/* When tweaked */
[data-hero-widget="scanner"] .variant-calculator,
[data-hero-widget="scanner"] .variant-static { display: none; }
[data-hero-widget="scanner"] .variant-scanner { display: block; }

[data-hero-widget="static"] .variant-calculator,
[data-hero-widget="static"] .variant-scanner { display: none; }
[data-hero-widget="static"] .variant-static { display: block; }
```

`applyState()` sets `document.querySelector('[data-section="hero-widget"]')
.setAttribute('data-hero-widget', state.heroWidget)`.

### Real examples of what becomes a tweak group

These are examples, not a fixed list. Anything undecided can be a group:

| Open decision | Key name | Options |
|---|---|---|
| Brand palette | `palette` | warm / ocean / midnight / sand |
| Light vs dark | `mode` | light / dark / auto |
| Text size | `fontscale` | small / regular / large |
| Corner feel | `radius` | sharp / soft / pill |
| Spacing breath | `density` | compact / normal / airy |
| Hero layout | `heroLayout` | split / centered / full-bleed |
| Hero widget | `heroWidget` | calculator / scanner / illustration / video |
| Animation level | `motion` | full / reduced / none |
| Headline word | `headlineWord` | today / now / free / instantly |
| Show social proof | `socialProof` | on / off |
| Show video section | `videoSection` | on / off |
| CTA style | `ctaStyle` | pill / square / ghost |
| Testimonial format | `testimonials` | text / video / stats |
| Nav style | `nav` | sticky / fixed / minimal |

Mix and match. Keep only what's relevant to the current page. Three groups is often
enough — don't expose every possible variation or the panel becomes overwhelming.

---

## Step 1 — `tweaks.config.ts` (edit this per project)

```ts
// site/lib/tweaks.config.ts
export const TWEAK_DEFAULTS = {
  palette:   'warm',
  fontscale: 'regular',
  radius:    'rounded',
  density:   'normal',
  mode:      'light',
  heroStyle: 'classic',
  headline:  'today',
} as const;

export type TweakKey = keyof typeof TWEAK_DEFAULTS;
export type TweakState = Record<TweakKey, string>;

export const TWEAK_GROUPS: {
  key: TweakKey;
  label: string;
  opts: { val: string; label: string; swatches?: string[] }[];
}[] = [
  {
    key: 'palette',
    label: 'Color palette',
    opts: [
      { val: 'warm',     label: 'Warm',     swatches: ['#fbf7f0','#d2684a','#1e3a52'] },
      { val: 'ocean',    label: 'Ocean',    swatches: ['#f0f6fb','#1a6fa8','#0a4060'] },
      { val: 'midnight', label: 'Midnight', swatches: ['#0f0f13','#8b7cf8','#4a3fa8'] },
      { val: 'sand',     label: 'Sand',     swatches: ['#fdf6e3','#c0874a','#6b4226'] },
    ],
  },
  {
    key: 'mode',
    label: 'Mode',
    opts: [
      { val: 'light', label: 'Light' },
      { val: 'dark',  label: 'Dark'  },
    ],
  },
  {
    key: 'fontscale',
    label: 'Text size',
    opts: [
      { val: 'small',   label: 'Small'   },
      { val: 'regular', label: 'Regular' },
      { val: 'large',   label: 'Large'   },
    ],
  },
  {
    key: 'radius',
    label: 'Corner style',
    opts: [
      { val: 'sharp',   label: 'Sharp'   },
      { val: 'rounded', label: 'Rounded' },
      { val: 'soft',    label: 'Soft'    },
    ],
  },
  {
    key: 'heroStyle',
    label: 'Hero layout',
    opts: [
      { val: 'classic',   label: 'Classic'   },
      { val: 'editorial', label: 'Editorial' },
      { val: 'centered',  label: 'Centered'  },
    ],
  },
  {
    key: 'headline',
    label: 'Headline word',
    opts: [
      { val: 'today',  label: 'today'  },
      { val: 'now',    label: 'now'    },
      { val: 'free',   label: 'free'   },
    ],
  },
];
```

Only include groups that are actually relevant to the page. Remove unused keys from
both `TWEAK_DEFAULTS` and `TWEAK_GROUPS`.

---

## Step 2 — `TweaksPanel.tsx` (shared, never edit)

```tsx
// site/components/TweaksPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { TWEAK_DEFAULTS, TWEAK_GROUPS, type TweakKey, type TweakState } from '@/lib/tweaks.config';

export function TweaksPanel() {
  const [state, setState] = useState<TweakState>({ ...TWEAK_DEFAULTS });
  const [visible, setVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  function applyState(s: TweakState) {
    // Apply all keys as data-attributes on <body>
    (Object.keys(s) as TweakKey[]).forEach(key => {
      document.body.setAttribute(`data-${key}`, s[key]);
    });
    // Swap __WORD__ copy placeholders
    document.querySelectorAll<HTMLElement>('[data-tweak-copy]').forEach(el => {
      const template = el.getAttribute('data-tweak-copy') ?? '';
      // Replace __WORD__ with whatever key is referenced in the template
      // Convention: __PALETTE__, __HEADLINE__, etc. match TWEAK_DEFAULTS keys
      let html = template;
      (Object.keys(s) as TweakKey[]).forEach(k => {
        html = html.replace(`__${k.toUpperCase()}__`, `<em>${s[k]}</em>`);
      });
      el.innerHTML = html;
    });
  }

  function setKey(key: TweakKey, val: string) {
    const next = { ...state, [key]: val };
    setState(next);
    applyState(next);
    try {
      window.parent.postMessage({
        type: '__edit_mode_set_keys',
        edits: { [key]: val },
        fullState: next,
      }, '*');
    } catch (_) {}
  }

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data ?? {};
      if (d.type === '__activate_edit_mode')   setEditMode(true);
      if (d.type === '__deactivate_edit_mode') { setEditMode(false); setVisible(false); }
      if (d.type === '__set_tweak_state') {
        const next = { ...TWEAK_DEFAULTS, ...d.state } as TweakState;
        setState(next);
        applyState(next);
      }
    }
    window.addEventListener('message', onMessage);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (_) {}
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => { applyState(state); }, []);

  const showToggle = editMode || process.env.NODE_ENV === 'development';

  return (
    <>
      {showToggle && (
        <button
          onClick={() => setVisible(v => !v)}
          aria-label="Toggle tweaks"
          style={{
            position:'fixed', right:16, bottom:16, width:46, height:46,
            borderRadius:'50%', background:'var(--ink,#1c1814)', color:'#fff',
            border:'none', cursor:'pointer', fontSize:18, zIndex:9999,
            boxShadow:'0 10px 24px -8px rgba(0,0,0,0.35)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >✦</button>
      )}

      {visible && (
        <div style={{
          position:'fixed', right:16, bottom:72, width:272,
          background:'#fff', borderRadius:14, padding:'18px 16px',
          boxShadow:'0 8px 40px rgba(0,0,0,0.18)', zIndex:9998,
          fontFamily:'system-ui,sans-serif', fontSize:13,
          maxHeight:'80vh', overflowY:'auto',
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <strong style={{fontSize:14}}>Tweaks</strong>
            <button onClick={() => setVisible(false)}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#999'}}>×</button>
          </div>
          <p style={{color:'#888',fontSize:12,marginBottom:16}}>Changes are instant. Pick your favorites.</p>

          {TWEAK_GROUPS.map(group => (
            <div key={group.key} style={{marginBottom:16}}>
              <div style={{
                fontWeight:600, marginBottom:8, color:'#555', fontSize:11,
                textTransform:'uppercase', letterSpacing:'0.1em',
              }}>{group.label}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {group.opts.map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setKey(group.key, opt.val)}
                    style={{
                      padding:'6px 10px', borderRadius:8, border:'1.5px solid',
                      borderColor: state[group.key] === opt.val ? '#1c1814' : '#e0e0e0',
                      background:  state[group.key] === opt.val ? '#1c1814' : '#fff',
                      color:       state[group.key] === opt.val ? '#fff' : '#333',
                      cursor:'pointer', fontSize:12, fontWeight:500,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    }}
                  >
                    {opt.swatches && (
                      <span style={{display:'flex',gap:2}}>
                        {opt.swatches.map(s => (
                          <span key={s} style={{
                            width:10,height:10,borderRadius:3,background:s,
                            border:'1px solid rgba(0,0,0,0.1)',display:'inline-block',
                          }}/>
                        ))}
                      </span>
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={{borderTop:'1px solid #f0f0f0',marginTop:8,paddingTop:12}}>
            <button
              onClick={() => {
                const lines = (Object.keys(state) as TweakKey[])
                  .map(k => `${k}: ${state[k]}`).join('\n');
                alert('Final choices:\n\n' + lines + '\n\nSend these to your developer.');
              }}
              style={{
                width:'100%',padding:'9px',borderRadius:8,border:'1.5px solid #1c1814',
                background:'#1c1814',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,
              }}
            >Lock in these choices ✓</button>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## Step 3 — Wire into layout.tsx

```tsx
// app/layout.tsx
import { TweaksPanel } from '@/components/TweaksPanel';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-palette="warm" data-mode="light" data-fontscale="regular"
            data-radius="rounded" data-density="normal">
        {children}
        <TweaksPanel />
      </body>
    </html>
  );
}
```

Set every `data-*` attribute that has a corresponding CSS override block.

---

## Step 4 — Removal Workflow (Lock In & Strip)

When the client has picked their choices, remove the system cleanly:

### Manual removal (3 steps)

**1. Promote the winner to permanent defaults in CSS**

Look at the chosen palette, e.g. `palette: ocean`. In your CSS file:
- Copy the `body[data-palette="ocean"] { ... }` block
- Paste its values into `:root { ... }` replacing the old defaults
- Delete all `body[data-palette="..."]` override blocks

Repeat for every tweak dimension (fontscale, radius, etc.).

**2. Strip the markup**

- Remove `data-*` attributes from `<body>` in `layout.tsx`
- Remove `<TweaksPanel />` import and render from `layout.tsx`
- Find all `data-tweak-copy` attributes in JSX and replace with hardcoded final copy
- Find all `data-variant` attributes on hero/section elements and remove them
- Delete unused hero layout variants from JSX (the ones that weren't chosen)

**3. Delete the files**

```bash
rm site/components/TweaksPanel.tsx
rm site/lib/tweaks.config.ts
```

Then run `npx tsc --noEmit` to confirm no dangling imports.

### Automated removal (when asked)

When the user says "lock in the design" or "remove the tweaks panel", Codex should:

1. Ask: "Which options did you (or the client) choose? Give me the final state."
   Or: "Should I use the defaults from `TWEAK_DEFAULTS`?"
2. Edit `globals.css` / `theme.css` — promote chosen values to `:root`, delete overrides
3. Edit `layout.tsx` — remove `data-*` attrs and `<TweaksPanel />`
4. Find/replace all `data-tweak-copy` elements with hardcoded final HTML
5. Remove non-chosen hero variants from JSX
6. Delete `TweaksPanel.tsx` and `tweaks.config.ts`
7. Run `npx tsc --noEmit` — confirm clean

---

## Integration with `/ui-ux-pro-max`

When `/ui-ux-pro-max` generates a design with multiple visual directions, **suggest
adding a tweaks panel instead of committing to one direction**. Use this language:

> "I've designed 3 palette directions for this. Before I lock one in, I can wire up
> a Tweaks panel so you can toggle between them live at localhost:3000 — takes about
> 5 minutes. Want that?"

The `/ui-ux-pro-max` skill generates the palette token values; this skill wires them
into the live-switching system. They chain naturally: design exploration → tweaks
panel → client picks → lock in → remove.

---

## Quick Reference

| Task | What to do |
|---|---|
| Add a new palette | Add CSS block + entry to `TWEAK_GROUPS` in config |
| Add a new tweak dimension | Add key to `TWEAK_DEFAULTS`, CSS block, group to `TWEAK_GROUPS` |
| Show panel in dev only | Default behavior — `process.env.NODE_ENV === 'development'` |
| Show panel to client via iframe | Parent sends `__activate_edit_mode` postMessage |
| Capture client's choices | Parent listens for `__edit_mode_set_keys`, saves `fullState` |
| Lock in and ship | Promote winner to `:root`, delete TweaksPanel + config |
| Share with client (no URL) | Run `bundle-standalone.mjs` — single HTML file, no server needed |

---

## Production Safety — Never Visible to Real Users

The ✦ toggle button and panel are **invisible in production by default** through
two independent layers of protection. Both must be present.

### Layer 1 — Environment gate (always on)

The toggle button only renders when one of these is true:
- `process.env.NODE_ENV === 'development'` (local dev server)
- A parent iframe has sent `__activate_edit_mode` via postMessage

In a Vercel production deploy, `NODE_ENV` is always `'production'`, so the button
never renders. No `if (process.env.NODE_ENV !== 'production')` check needed — the
component already does this internally.

### Layer 2 — postMessage activation (for client previews)

When you want to share a preview URL with a client via an iframe shell, the parent
page sends `__activate_edit_mode`. Without that message, the panel stays hidden
even if someone visits the page directly.

### Vercel env var as an extra safety valve (optional, recommended)

Add to your project:
```bash
vercel env add NEXT_PUBLIC_TWEAKS_ENABLED   # set to "true" in Preview, leave unset in Production
```

Then gate the whole component render:
```tsx
// app/layout.tsx
{process.env.NEXT_PUBLIC_TWEAKS_ENABLED === 'true' && <TweaksPanel />}
```

This way TweaksPanel isn't even in the production JS bundle. Vercel Preview
deployments get the panel; production never loads the component at all.

**If you forget to remove TweaksPanel before shipping:** the environment gate means
real users never see it. But still remove it — dead code is a liability.

---

## Rules

**One config file per project, one component.** Never copy TweaksPanel.tsx into
multiple places. If two pages need different options, edit the same config file —
scope group visibility conditionally by page path if needed.

**All design tokens must be CSS variables.** If a color or size is hardcoded in a
component, the tweaks system can't reach it. Audit before adding tweaks: every
value that might change must go through `var(--token-name)`.

**Three groups maximum per panel.** More than three and the panel becomes a settings
screen instead of a decision tool. If you need more options, split into two separate
review sessions.

**Remove it completely when done.** A stale TweaksPanel in production (even hidden)
is dead code. Once the design is locked, run the removal workflow — 10 minutes,
zero trace left.
