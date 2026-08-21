"use client";

import { m } from "framer-motion";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface OfferChoiceSlideProps {
  question: string;
  yesLabel: string;
  noLabel: string;
  onAccept: () => void;
  onDecline: () => void;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  labels: ResolvedQuizLabels;
}

export function OfferChoiceSlide({
  question,
  yesLabel,
  noLabel,
  onAccept,
  onDecline,
  textColor,
  theme,
  labels,
}: OfferChoiceSlideProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden px-6 py-12 sm:px-12"
    >
      {/* Inner wrapper owns the scroll so the offer + both choices stay reachable
          from the top on short viewports; my-auto centers short content. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-xl">
        <p
          className="text-base font-semibold uppercase tracking-wide"
          style={{ color: textColor, opacity: 0.75 }}
        >
          {labels.offerEyebrow}
        </p>

        <h2
          className="mt-2 text-2xl font-bold leading-snug sm:text-3xl"
          style={{ color: textColor }}
        >
          {question}
        </h2>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex min-h-[52px] w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-base font-medium shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:opacity-80"
            style={{
              backgroundColor: theme.buttonColor,
              borderColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base font-bold"
              style={{ backgroundColor: theme.buttonTextColor, color: theme.buttonColor }}
            >
              A
            </span>
            <span className="pt-0.5">{yesLabel}</span>
          </button>

          <button
            type="button"
            onClick={onDecline}
            className="flex min-h-[52px] w-full items-start gap-3 rounded-xl border border-(--quiz-hairline) bg-transparent px-4 py-3.5 text-left text-base font-medium transition-colors hover:border-(--quiz-hairline-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            style={{ color: textColor }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-(--quiz-hairline) bg-transparent text-base font-bold"
              style={{ color: textColor }}
            >
              B
            </span>
            <span className="pt-0.5">{noLabel}</span>
          </button>
        </div>
        </div>
      </div>
    </m.div>
  );
}
