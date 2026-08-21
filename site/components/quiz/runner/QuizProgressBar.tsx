"use client";

import { m } from "framer-motion";
import type { ResolvedQuizTheme } from "@/lib/quiz/types";

interface QuizProgressBarProps {
  progress: number; // 0..1
  theme: ResolvedQuizTheme;
}

// Thin progress bar pinned to the top of the runner. Filled portion uses the
// theme's button color; track is a subtle wash so it stays visible regardless
// of the background photo.
export function QuizProgressBar({ progress, theme }: QuizProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div
      className="absolute inset-x-0 top-0 z-20 h-1 bg-(--quiz-hairline-dim)"
      role="progressbar"
      aria-label="Quiz progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <m.div
        className="h-full"
        style={{ backgroundColor: theme.buttonColor }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  );
}
