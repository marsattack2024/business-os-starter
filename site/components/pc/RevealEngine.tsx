"use client";
import { useEffect } from "react";

/**
 * The single client boundary behind every `<Reveal>` on a page.
 *
 * Mount it once, near the top of the page. It does three jobs:
 *
 *   1. Marks `<html class="motion-ready">` so the CSS in globals.css is allowed
 *      to hide revealable elements. Without this class nothing is ever hidden,
 *      which is what makes the whole system fail open.
 *   2. Reveals elements as they approach the viewport, with one shared
 *      IntersectionObserver rather than one per element.
 *   3. Crossfades full-bleed photographs in once they have actually decoded.
 *
 * A `MutationObserver` is deliberately NOT used: the page is statically
 * composed, so the node set is known at mount.
 *
 * SCOPE. This is the engine the ported page system needs and nothing more. A
 * fork that adds a parallax breaker, a marquee, or a persistent mobile CTA
 * pill adds the matching block here — each one is an IntersectionObserver over
 * its own selector, driven from this same effect so the page keeps ONE client
 * boundary. If you add a scroll-driven transform, use a self-healing rAF LOOP
 * that re-arms from inside itself, never the usual `if (ticking) return` flag:
 * that flag latches true when a tab is backgrounded mid-scroll and every later
 * scroll is ignored for the rest of the session.
 */
export function RevealEngine() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion: never hide anything, never listen for scroll.
    if (reduced) return;

    // Opened in a BACKGROUND tab. Browsers throttle both rAF and
    // IntersectionObserver callbacks to nothing while a tab is hidden, so
    // engaging the animation system here would hide the whole page behind
    // callbacks that cannot run, and only the failsafe would bring it back.
    // Someone switching to an already-loaded tab wants to read it, not watch
    // sixty elements fade in at once. Skip the animation for this page view and
    // leave everything visible.
    if (document.hidden) return;

    root.classList.add("motion-ready");

    const revealables = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    const showAll = () => revealables.forEach((el) => el.setAttribute("data-in", ""));

    // Populated by the crossfade block below; the failsafe closes over these so
    // a photograph cannot stay transparent because its load event never fired.
    const fadeImages: HTMLImageElement[] = [];
    const markLoaded = (img: HTMLImageElement) => img.setAttribute("data-loaded", "");

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.setAttribute("data-in", "");
            observer?.unobserve(entry.target);
          }
        },
        // Start the entrance slightly before the element is on screen, so the
        // reader meets it already arriving rather than watching it begin.
        { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
      );
      revealables.forEach((el) => observer?.observe(el));
    } else {
      showAll();
    }

    // Failsafe. If the observer never fires (a background tab that is restored
    // mid-scroll, a browser quirk, an engine that throttles callbacks away),
    // the page must not stay blank. Four seconds is long enough that it never
    // pre-empts a real entrance and short enough that nobody reads a gap.
    const failsafe = window.setTimeout(() => {
      showAll();
      fadeImages.forEach(markLoaded);
    }, 4000);

    // ── Image crossfade ──
    //
    // `next/image` removes its blur placeholder and paints the real file in one
    // step, with no transition (vercel/next.js#39690). On a full-bleed
    // photograph that reads as a snap from a soft wash to a dark, sharp
    // picture rather than as an image arriving.
    //
    // So the image starts transparent over its own dominant-colour backdrop and
    // fades in once it has actually decoded. Same fail-open shape as the
    // reveal: the hidden state lives in CSS behind `html.motion-ready`, which is
    // only present when this effect ran, so a dead script leaves every
    // photograph visible. Images that were already complete (cache hit,
    // bfcache) are marked immediately and never fade, because there is nothing
    // to wait for.
    fadeImages.push(...document.querySelectorAll<HTMLImageElement>("[data-fade-img]"));
    const onImgLoad = (event: Event) => markLoaded(event.currentTarget as HTMLImageElement);
    for (const img of fadeImages) {
      if (img.complete && img.naturalWidth > 0) {
        markLoaded(img);
      } else {
        img.addEventListener("load", onImgLoad, { once: true });
        // A decode failure must not leave a permanently invisible photograph.
        img.addEventListener("error", onImgLoad, { once: true });
      }
    }

    return () => {
      window.clearTimeout(failsafe);
      observer?.disconnect();
      // Symmetric with the mount, and that is load-bearing in a TEMPLATE: a
      // fork that puts a `<Reveal>` on a page but forgets the engine would
      // otherwise inherit a stale `motion-ready` from the previous route and
      // hide that content with nothing left to reveal it. Removing the class
      // means the failure mode of composing this system wrong is "no
      // animation", never "no copy".
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
