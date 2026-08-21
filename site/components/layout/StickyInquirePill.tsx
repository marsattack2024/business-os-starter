"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface StickyInquirePillProps {
  /** CTA label — keep aligned with the sitewide CTA verb ("Inquire"). */
  label?: string;
  /** Anchor/route the pill points at. */
  href?: string;
}

/**
 * Persistent mobile-only CTA. The homepage is long; once the visitor scrolls
 * past the hero there is otherwise no reachable "Inquire" affordance until the
 * contact section far below (the desktop StickyBar is an announcement strip, and
 * the Navbar CTA is hidden on mobile). This satisfies the CLAUDE.md conversion
 * non-negotiable: "a persistent CTA reachable on every long page (desktop AND
 * mobile)."
 *
 * - Mobile only (`md:hidden`) — desktop already has the always-visible Navbar CTA.
 * - Homepage only — that's where the `#contact` anchor lives; on other routes it
 *   returns null rather than linking to a missing anchor.
 * - Appears after the first viewport scrolls away; passive rAF-throttled scroll
 *   listener (cheap, no layout thrash).
 * - Respects the iOS home indicator via `env(safe-area-inset-bottom)`.
 */
export function StickyInquirePill({
  label = "Inquire",
  href = "#contact",
}: StickyInquirePillProps = {}) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setShow(window.scrollY > window.innerHeight * 0.8);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Only render on the homepage, where #contact resolves.
  if (pathname !== "/") return null;

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-50 px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-(--color-cream) via-(--color-cream)/90 to-transparent transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!show}
    >
      <a
        href={href}
        tabIndex={show ? 0 : -1}
        className="flex items-center justify-center w-full min-h-[52px] tracking-widest uppercase text-xs font-medium bg-(--color-ink) text-(--color-cream) px-8 py-4 shadow-lg hover:bg-(--color-accent-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-cream) transition-colors duration-300"
      >
        {label}
      </a>
    </div>
  );
}
