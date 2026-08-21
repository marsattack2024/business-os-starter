"use client";

import { m } from "framer-motion";
import type { ResolvedQuizTheme } from "@/lib/quiz/types";

interface QuizCloseButtonProps {
  onClose: () => void;
  theme: ResolvedQuizTheme;
  /** aria-label override (localization). Default "Close quiz". */
  closeLabel?: string;
}

// X button, top-left — keeps quiz chrome on the left so the chat widget
// can own the right edge without competing for attention.
export function QuizCloseButton({ onClose, theme, closeLabel }: QuizCloseButtonProps) {
  return (
    <m.div
      // Safe-area insets keep the X clear of the notch / rounded corner on
      // notched phones (viewportFit:"cover"); falls back to 1rem on flat screens.
      className="quiz-inset-top quiz-inset-left absolute z-30"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        aria-label={closeLabel || "Close quiz"}
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-sm border transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
        style={{
          backgroundColor: theme.buttonColor,
          color: theme.buttonTextColor,
          borderColor: "color-mix(in srgb, currentColor 18%, transparent)",
        }}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 5L15 15M15 5L5 15" strokeLinecap="round" />
        </svg>
      </button>
    </m.div>
  );
}
