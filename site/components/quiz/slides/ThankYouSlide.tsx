"use client";

import { m } from "framer-motion";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface ThankYouSlideProps {
  headline: string;
  lines: string[];
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  /** Resolved chrome strings (arrives via the runner's shared spread). */
  labels: ResolvedQuizLabels;
}

// Net-new success state. Centered confirmation headline plus each closing
// line as its own relaxed paragraph.
export function ThankYouSlide({ headline, lines, textColor }: ThankYouSlideProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden px-6 py-12 text-center sm:px-12"
    >
      {/* Inner wrapper owns the scroll so the confirmation stays reachable from
          the top on short viewports; my-auto centers short content. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-xl">
        <h2
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: textColor }}
        >
          {headline}
        </h2>

        {lines.map((line) => (
          <p
            key={line}
            className="mt-4 text-base leading-relaxed"
            style={{ color: textColor, opacity: 0.85 }}
          >
            {line}
          </p>
        ))}
        </div>
      </div>
    </m.div>
  );
}
