/**
 * Module-singleton accessor for an optional Lenis smooth-scroll instance.
 *
 * The base template ships NO Lenis/GSAP editorial stack (see CLAUDE.md), so by
 * default `getLenis()` returns `null` and every `lenis?.stop()` / `lenis?.start()`
 * call is a harmless no-op. An editorial fork that DOES run Lenis (e.g. a
 * homepage with scroll-driven animation) registers its single instance here via
 * `setLenis(lenis)` in its provider's effect, and UI like the quiz overlay or
 * anchor links then drive that same instance instead of fighting it.
 *
 * Kept dependency-free on purpose: the structural `LenisLike` type means this
 * module never imports the `lenis` package, so a brochure fork compiles and
 * works without adding Lenis. A fork that installs Lenis can pass its real
 * `Lenis` instance to `setLenis` — it's structurally compatible.
 */

/** Minimal surface the quiz overlay needs — pause/resume smooth scroll. */
export interface LenisLike {
  stop: () => void;
  start: () => void;
}

let instance: LenisLike | null = null;

export function setLenis(next: LenisLike | null): void {
  instance = next;
}

export function getLenis(): LenisLike | null {
  return instance;
}
