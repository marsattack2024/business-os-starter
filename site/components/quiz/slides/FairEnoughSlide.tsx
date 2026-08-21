"use client";

import { m } from "framer-motion";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface FairEnoughSlideProps {
  headline: string;
  body: string;
  /** Second-chance CTA (config copy, falls back to `labels.continue`). */
  continueLabel: string;
  /** Reconsider CTA — the runner passes the resolved `labels.reconsider`. */
  reconsiderLabel: string;
  onContinue: () => void;
  onReconsider: () => void;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  /** Resolved chrome strings (arrives via the runner's shared spread). */
  labels: ResolvedQuizLabels;
}

export function FairEnoughSlide({
  headline,
  body,
  continueLabel,
  onContinue,
  textColor,
  theme,
}: FairEnoughSlideProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden px-6 py-12 sm:px-12"
    >
      {/* Inner wrapper owns the scroll so the headline + body + both CTAs stay
          reachable from the top on short viewports; my-auto centers short content. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-xl">
        <h2
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: textColor }}
        >
          {headline}
        </h2>

        <p
          className="mt-4 whitespace-pre-line text-base leading-relaxed"
          style={{ color: textColor, opacity: 0.85 }}
        >
          {body}
        </p>

        <div className="mt-10 flex">
          {/* ONE forward action by design — this slide continues to lead capture.
              No "go back" / reconsider choice: a second suggestion here only adds
              friction when the visitor has a single sensible next step (the global
              nav arrow still allows returning). */}
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-8 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:opacity-80"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
          >
            {continueLabel}
          </button>
        </div>
        </div>
      </div>
    </m.div>
  );
}
