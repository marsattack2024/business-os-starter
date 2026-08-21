"use client";

import { m } from "framer-motion";
import type { ResolvedQuizTheme } from "@/lib/quiz/types";

interface QuizDesktopNavArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  theme: ResolvedQuizTheme;
  /** "previous" arrow aria-label override (localization). Default "Previous". */
  backLabel?: string;
  /** "next" arrow aria-label override (localization). Default "Next". */
  nextLabel?: string;
}

// Desktop-only dual arrows, bottom-left. Hidden on mobile via `hidden sm:flex`
// — on small screens the slide's own full-width CTA handles forward and the
// mobile back chevron handles back. Left placement balances the chat widget
// that sits on the right.
export function QuizDesktopNavArrows({
  onPrev,
  onNext,
  canPrev,
  canNext,
  theme,
  backLabel,
  nextLabel,
}: QuizDesktopNavArrowsProps) {
  return (
    <m.div
      // Safe-area insets keep the arrows clear of any gesture bar / rounded
      // corner; max() preserves the 1.5rem base offset on flat screens.
      className="pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] z-20 hidden items-center gap-px sm:flex"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <button
        type="button"
        aria-label={backLabel || "Previous"}
        disabled={!canPrev}
        onClick={onPrev}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-l-sm border border-r-0 transition-opacity duration-300 hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          backgroundColor: theme.buttonColor,
          color: theme.buttonTextColor,
          borderColor: "color-mix(in srgb, currentColor 16%, transparent)",
        }}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12.5L10 7.5L15 12.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={nextLabel || "Next"}
        disabled={!canNext}
        onClick={onNext}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-r-sm border transition-opacity duration-300 hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          backgroundColor: theme.buttonColor,
          color: theme.buttonTextColor,
          borderColor: "color-mix(in srgb, currentColor 16%, transparent)",
        }}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </m.div>
  );
}
