---
name: live-preview-tweaks
description: Run a local design-review panel for the new-build website when an owner needs to compare a small number of visual or layout choices before locking them in.
---

# Live Preview Tweaks

Use the new-build template's existing local-only panel for open design decisions:

- `site/components/ui/TweaksPanel.tsx` renders the panel.
- `site/lib/tweaks.config.ts` defines its empty-by-default groups and defaults.
- `site/docs/live-tweaks-setup.md` is the canonical wiring guide.

## Use it when

The owner needs to compare a small number of legitimate choices—such as palette,
hero density, image crop, or section visibility—during a local review. Do not use
it for routine copy edits, public experiments, analytics, CRM behavior, or data changes.

## Workflow

1. Read `site/docs/live-tweaks-setup.md` and inspect the active route before adding controls.
2. Define only the unresolved choices in `site/lib/tweaks.config.ts`; each option must have a clear visual result and a real target selector.
3. Add the associated CSS/token overrides in `site/app/globals.css` and mount `TweaksPanel` from `site/app/(site)/layout.tsx` only for the review session.
4. Run `cd site && npm run dev` and review the choices locally with the owner.
5. After a decision, promote the selected values into the permanent configuration/styles, remove unused variants and the panel mount, then run `npm run typecheck` and `npm run build`.

## Safety

The template panel is guarded to render only on localhost. Preserve that guard;
never expose a design-review control to public visitors without explicit approval.
Do not use it to mutate customer, provider, analytics, payment, or lead data.
