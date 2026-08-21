import type { ReactNode } from "react";

/**
 * REVEAL — scroll entrance that cannot hide the page.
 *
 * The obvious implementation renders `opacity: 0` and lets JavaScript turn it
 * on. That is fail-CLOSED: if the script never runs, never hydrates, or the
 * animation is created in a tab that receives no frames, the reader is left
 * looking at an empty page with all the copy technically present.
 *
 * So the hidden state is applied by CSS that is gated on a class the browser
 * only has if scripting is alive (`RevealEngine` adds `motion-ready` to
 * `<html>`), and inside a `prefers-reduced-motion: no-preference` block. No
 * script, stalled script, or reduced-motion setting → the element was never
 * hidden in the first place. There is also a timed failsafe in the engine, so
 * even a broken IntersectionObserver ends with a fully visible page.
 *
 * This is a SERVER component. It emits one attribute; a single observer in
 * `RevealEngine` drives every instance on the page, so a page with sixty
 * revealed elements still ships one client boundary. That is the whole reason
 * this exists alongside `components/ui/AnimateOnScroll`, which is one boundary
 * and one observer PER element — right for a short page, wrong for this one.
 */
export function Reveal({
  children,
  delay,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  /** Stagger in ms. Keep under ~240 or the last item feels detached. */
  delay?: number;
  as?: "div" | "li" | "article" | "figure";
  className?: string;
}) {
  return (
    <Tag
      data-reveal=""
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
