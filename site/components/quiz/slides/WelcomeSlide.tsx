"use client";

import { useEffect } from "react";
import { m } from "framer-motion";
import { siteConfig } from "@/lib/site.config";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface WelcomeSlideProps {
  headline: string;
  subheadline?: string;
  startLabel: string;
  onNext: () => void;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  /** Resolved chrome strings (arrives via the runner's shared spread; the start
   *  CTA already comes pre-resolved as `startLabel`). */
  labels: ResolvedQuizLabels;
}

export function WelcomeSlide({
  headline,
  subheadline,
  startLabel,
  onNext,
  textColor,
  theme,
}: WelcomeSlideProps) {
  // Enter starts the quiz.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "Enter") {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext]);

  const brandName = siteConfig.brand?.name?.trim();
  const showBrand =
    Boolean(brandName) && !brandName.startsWith("[") && brandName.toLowerCase() !== "studio name";

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      // Non-scrolling root; the inner wrapper owns the scroll so tall content on
      // short/landscape viewports stays reachable from the top instead of being
      // trapped above the centered edge.
      className="flex h-full flex-col overflow-hidden px-6 py-16 sm:px-12 sm:py-12"
    >
      {/* Scrolls when content exceeds the viewport; my-auto centers short content. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-xl">
          {showBrand && (
            <p
              className="font-sans text-[0.72rem] font-medium uppercase tracking-[var(--tracking-eyebrow)]"
              style={{ color: textColor, opacity: 0.55 }}
            >
              {brandName}
            </p>
          )}

          <h1
            className={`${showBrand ? "mt-4" : ""} font-serif text-[2.05rem] font-medium leading-[1.08] tracking-tight sm:text-[2.75rem]`}
            style={{ color: textColor }}
          >
            {headline}
          </h1>

          {subheadline && (
            <p
              className="mt-5 font-serif text-lg leading-relaxed sm:text-xl"
              style={{ color: textColor, opacity: 0.72 }}
            >
              {subheadline}
            </p>
          )}

          <div className="mt-10">
            <button
              type="button"
              onClick={onNext}
              // Full-width on mobile so the CTA reads as a bar; desktop matches
              // the site's square atelier buttons (tracking + ghost fill feel).
              className="group inline-flex min-h-[52px] w-full items-center justify-center gap-3 border px-8 py-3.5 font-sans text-xs font-medium uppercase tracking-[var(--tracking-label)] transition-[color,background-color,transform] duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 active:scale-[0.98] sm:w-auto"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
                borderColor: theme.buttonColor,
              }}
            >
              {startLabel}
              <svg
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
}
