"use client";

import { m } from "framer-motion";
import type { ResolvedQuizTheme } from "@/lib/quiz/types";

interface QuizBackArrowProps {
  onPrev: () => void;
  theme: ResolvedQuizTheme;
  /** aria-label override (localization). Default "Previous". */
  backLabel?: string;
}

// Mobile-only back chevron, bottom-left. Desktop uses QuizDesktopNavArrows
// instead. On mobile the slide's own full-width primary CTA handles forward,
// so a forward arrow would just duplicate it.
export function QuizBackArrow({ onPrev, theme, backLabel }: QuizBackArrowProps) {
  return (
    <m.div
      // Safe-area insets keep the chevron above the home indicator / clear of the
      // rounded corner on notched phones; falls back to 1rem on flat screens.
      className="quiz-inset-bottom quiz-inset-left absolute z-20 sm:hidden"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <button
        type="button"
        aria-label={backLabel || "Previous"}
        onClick={onPrev}
        className="flex h-11 w-11 items-center justify-center rounded-sm border transition-opacity duration-300 hover:opacity-90 active:opacity-80"
        style={{
          backgroundColor: theme.buttonColor,
          color: theme.buttonTextColor,
          borderColor: "color-mix(in srgb, currentColor 16%, transparent)",
        }}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12.5 5L7.5 10L12.5 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </m.div>
  );
}
