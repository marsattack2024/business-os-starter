"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { m } from "framer-motion";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface ExplanationSlideProps {
  statementTitle: string;
  statementBody: string;
  imageSrc?: string | null;
  /** Advance CTA. The runner passes the resolved `labels.continue`. */
  nextLabel: string;
  onNext: () => void;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  /** Resolved chrome strings (arrives via the runner's shared spread). */
  labels: ResolvedQuizLabels;
}

export function ExplanationSlide({
  statementTitle,
  statementBody,
  imageSrc,
  nextLabel,
  onNext,
  textColor,
  theme,
}: ExplanationSlideProps) {
  // This component instance is reused across each question's reveal (e1→e4), so
  // the scroll container keeps the previous reveal's scroll position. Reset it to
  // the top whenever the content changes, so a tall reveal always opens on its
  // header instead of mid-paragraph.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [statementTitle, statementBody]);

  // Enter continues to the next slide.
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

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      ref={scrollRef}
      className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain"
    >
      {/* The slide owns the scroll surface so text, image, and CTA move together
          on mobile. The inner block uses `my-auto` (NOT the parent's
          justify-center) so it centers when there's room but, when the content
          is taller than the viewport, collapses to the top and stays fully
          scrollable — justify-center would push the header off the top edge
          where it can't be scrolled back to. */}
      <div className="flex min-h-full flex-col px-6 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-12 sm:py-10">
        <div className="mx-auto my-auto flex w-full max-w-xl flex-col">
          {statementTitle && (
            // A bolded lead, not a giant h2 — statementTitle can be a full
            // sentence transition, so it stays at xl/2xl rather than display size.
            <p
              className="font-serif text-2xl font-medium leading-snug sm:text-[1.75rem]"
              style={{ color: textColor }}
            >
              {statementTitle}
            </p>
          )}

          <p
            className={`${statementTitle ? "mt-4" : ""} whitespace-pre-line font-serif text-lg leading-[1.7] sm:text-xl`}
            style={{ color: textColor, opacity: 0.82 }}
          >
            {statementBody}
          </p>

          {/* Image sits BELOW the text, LEFT-ALIGNED with the copy column.
              Intrinsic width (not a wide fill slot) so portrait frames don't
              leave empty cream that looks centered. Sand offset echoes the
              site's passe-partout without boxing hard. */}
          {imageSrc && (
            <div className="relative mt-8 w-fit max-w-[min(100%,22rem)] self-start sm:max-w-md">
              <div
                className="absolute inset-0 -z-10 translate-x-1.5 translate-y-1.5"
                style={{ backgroundColor: "var(--quiz-frame)" }}
                aria-hidden="true"
              />
              <Image
                src={imageSrc}
                alt={statementTitle || "Photograph illustrating this answer"}
                width={448}
                height={560}
                sizes="(max-width:640px) 90vw, 448px"
                className="pointer-events-none relative h-auto max-h-[36vh] w-auto max-w-full object-contain sm:max-h-[40vh]"
              />
            </div>
          )}

          <div className="mt-8 mb-[calc(2rem+env(safe-area-inset-bottom))] flex w-full sm:mb-0">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center border px-8 py-3.5 font-sans text-xs font-medium uppercase tracking-[var(--tracking-label)] transition-[color,background-color,transform] duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 active:scale-[0.98]"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
                borderColor: theme.buttonColor,
              }}
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
}
