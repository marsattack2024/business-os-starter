"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/public-routes";
import { getQuizNavCta } from "@/lib/quiz/registry";
import { siteConfig } from "@/lib/site.config";

interface NavbarProps {
  brandName?: string;
  /** Hide the "Journal" (/blog) link when the site has no published posts. */
  showJournal?: boolean;
}

// Anchor items (href "#…") target homepage sections; route items (href "/…")
// are real pages. On non-home routes, anchors resolve to "/#section" so they
// still land correctly after navigating home.
export function Navbar({ brandName = "[Studio Name]", showJournal = true }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Disclosure a11y: Escape closes the mobile menu and restores focus to the
  // hamburger trigger. The drawer is a disclosure (not a modal dialog), so a
  // full focus trap isn't required — but Escape + focus restore are.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Drop the Journal link when the blog has no published posts (keeps nav,
  // sitemap, and llms.txt consistent — no link to an empty index).
  const navItems = NAV_ITEMS.filter((item) => showJournal || item.href !== "/blog");

  // Persistent quiz CTA — the standalone /quiz always opens (ignores caps), a
  // recovery path for visitors who dismissed the popup. Null unless an enabled
  // default quiz sets `navCta` (the template ships the quiz disabled, so this is
  // null until a fork enables + labels its quiz).
  const quizCta = getQuizNavCta(siteConfig);

  const resolve = (href: string) =>
    href.startsWith("#") && pathname !== "/" ? `/${href}` : href;

  const contactHref = resolve("#contact");
  const linkCls =
    "text-xs tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors";

  return (
    <header className="w-full bg-(--color-cream) border-b border-(--color-border) px-6 py-4 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-serif text-2xl tracking-widest text-(--color-ink)">
          {brandName}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navItems.map((item) => {
            if (item.href.startsWith("/")) {
              return (
              <Link key={item.label} href={item.href} className={linkCls}>
                {item.label}
              </Link>
              );
            }
            const href = resolve(item.href);
            return href.startsWith("/") ? (
              <Link key={item.label} href={href} className={linkCls}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={href} className={linkCls}>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Desktop CTAs — standout quiz CTA (when enabled) + Inquire */}
        <div className="hidden md:flex items-center gap-3">
          {quizCta && (
            <Link
              href={quizCta.href}
              className="inline-flex text-xs tracking-widest uppercase bg-(--color-accent) text-(--color-ink) font-medium px-5 py-2 hover:opacity-90 transition-opacity"
            >
              {quizCta.label}
            </Link>
          )}
          {contactHref.startsWith("/") ? (
            <Link
              href={contactHref}
              className="inline-flex text-xs tracking-widest uppercase border border-(--color-ink) px-5 py-2 hover:bg-(--color-ink) hover:text-(--color-cream) transition-colors"
            >
              Inquire
            </Link>
          ) : (
            <a
              href={contactHref}
              className="inline-flex text-xs tracking-widest uppercase border border-(--color-ink) px-5 py-2 hover:bg-(--color-ink) hover:text-(--color-cream) transition-colors"
            >
              Inquire
            </a>
          )}
        </div>

        {/* Mobile hamburger — WCAG-compliant 44x44 touch target */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          className="md:hidden p-3 -mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-(--color-ink)"
        >
          <span className="sr-only">{isOpen ? "Close" : "Open"} menu</span>
          <div className="w-5 flex flex-col gap-1.5" aria-hidden="true">
            <span
              className={`block h-px bg-(--color-ink) transition-transform duration-300 origin-center ${isOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block h-px bg-(--color-ink) transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px bg-(--color-ink) transition-transform duration-300 origin-center ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </div>
        </button>
      </div>

      {/* Mobile nav drawer */}
      <nav
        id="mobile-nav"
        aria-hidden={!isOpen}
        aria-label="Mobile navigation"
        className={`md:hidden absolute top-full left-0 right-0 bg-(--color-cream) border-b border-(--color-border) px-6 transition-all duration-300 ${
          isOpen ? "max-h-[80vh] overflow-y-auto py-6" : "max-h-0 overflow-hidden py-0"
        }`}
      >
        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const cls =
              "text-xs tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors py-3 min-h-[44px] flex items-center";
            if (item.href.startsWith("/")) {
              return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cls}
                tabIndex={isOpen ? 0 : -1}
              >
                {item.label}
              </Link>
              );
            }
            const href = resolve(item.href);
            return href.startsWith("/") ? (
              <Link
                key={item.label}
                href={href}
                onClick={() => setIsOpen(false)}
                className={cls}
                tabIndex={isOpen ? 0 : -1}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={href}
                onClick={() => setIsOpen(false)}
                className={cls}
                tabIndex={isOpen ? 0 : -1}
              >
                {item.label}
              </a>
            );
          })}
          {quizCta && (
            <Link
              href={quizCta.href}
              onClick={() => setIsOpen(false)}
              className="text-xs tracking-widest uppercase bg-(--color-accent) text-(--color-ink) font-medium px-5 py-3 min-h-[44px] flex items-center justify-center hover:opacity-90 transition-opacity mt-2"
              tabIndex={isOpen ? 0 : -1}
            >
              {quizCta.label}
            </Link>
          )}
          {contactHref.startsWith("/") ? (
            <Link
              href={contactHref}
              onClick={() => setIsOpen(false)}
              className="text-xs tracking-widest uppercase border border-(--color-ink) px-5 py-3 min-h-[44px] flex items-center justify-center hover:bg-(--color-ink) hover:text-(--color-cream) transition-colors mt-2"
              tabIndex={isOpen ? 0 : -1}
            >
              Inquire
            </Link>
          ) : (
            <a
              href={contactHref}
              onClick={() => setIsOpen(false)}
              className="text-xs tracking-widest uppercase border border-(--color-ink) px-5 py-3 min-h-[44px] flex items-center justify-center hover:bg-(--color-ink) hover:text-(--color-cream) transition-colors mt-2"
              tabIndex={isOpen ? 0 : -1}
            >
              Inquire
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
