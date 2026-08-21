"use client";
import { useRef, useEffect, useState } from "react";
import { motionOffsets } from "@/lib/motion.config";

/** How long to wait for the observer before showing the content regardless. */
const REVEAL_FAILSAFE_MS = 4000;

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in milliseconds before the animation plays */
  delay?: number;
  /** Direction the element slides in from */
  from?: "bottom" | "left" | "right";
  /** IntersectionObserver threshold (0–1) */
  threshold?: number;
}

/**
 * Thin client wrapper for scroll-triggered entrance animations.
 * Section components remain server components — only this wrapper is client.
 *
 * ── FAIL-OPEN CONTRACT (read before editing) ──
 *
 * This component renders `opacity: 0` and relies on JavaScript to turn it on,
 * which means every failure mode of that JavaScript is a failure mode of
 * READING THE PAGE. Three guards keep an entrance animation from becoming the
 * reason a paragraph cannot be read:
 *
 *   1. `document.hidden` at mount — a background tab throttles both rAF and
 *      IntersectionObserver callbacks to nothing. Start visible instead; nobody
 *      switching to an already-loaded tab wants to watch it animate in.
 *   2. A REVEAL_FAILSAFE_MS timer — if the observer never fires (restored tab,
 *      throttled renderer, browser quirk), show anyway.
 *   3. A `<noscript>` override in app/layout.tsx, keyed off
 *      `data-animate-on-scroll`, for when the script never runs at all.
 *
 * Removing any of the three re-opens the hole. We shipped a page that blanked
 * itself twice this way.
 *
 * PERFORMANCE NOTE: this is one client boundary and one observer PER element,
 * which is right for a handful of sections and wrong for a long editorial page.
 * Past roughly 20 revealed elements, use the shared-engine pattern instead:
 * `components/pc/Reveal` is a server component that emits a `data-reveal`
 * attribute, and `components/pc/RevealEngine` drives a single observer over all
 * of them from one boundary. Its hidden state also lives in CSS behind
 * `html.motion-ready` rather than in an inline style, so it fails open without
 * needing the `<noscript>` override this component depends on.
 *
 * Both systems ship. Use this one for a short page assembled from
 * `components/sections/*`; use the shared engine for a page composed of planes
 * through `components/pc/ServicePage`.
 */
export function AnimateOnScroll({
  children,
  className = "",
  delay = 0,
  from = "bottom",
  threshold = 0.1,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () =>
      typeof window !== "undefined" &&
      // Reduced motion: the reader asked for no animation.
      // document.hidden: a background tab throttles observer callbacks to
      // nothing, so engaging the animation would hide the page behind a
      // callback that cannot run. Both mean "start visible, stay visible".
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.hidden),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    // Guard 2: the observer never fired. Long enough never to pre-empt a real
    // entrance, short enough that nobody reads a gap.
    const failsafe = window.setTimeout(() => setVisible(true), REVEAL_FAILSAFE_MS);
    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, [threshold, visible]);

  const initialTransform =
    from === "left"
      ? `translateX(-${motionOffsets.sm}px)`
      : from === "right"
      ? `translateX(${motionOffsets.sm}px)`
      : `translateY(${motionOffsets.xs}px)`;

  // Duration + easing read from CSS vars (see globals.css @theme); the global
  // prefers-reduced-motion @media block already neutralizes transition-duration.
  return (
    <div
      ref={ref}
      // Guard 3: the hook for the <noscript> override in app/layout.tsx.
      data-animate-on-scroll=""
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : initialTransform,
        transition: `opacity var(--motion-duration-md) var(--motion-ease-out) ${delay}ms, transform var(--motion-duration-md) var(--motion-ease-out) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
