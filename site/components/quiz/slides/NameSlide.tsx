"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { useDesktopAutoFocus } from "./useDesktopAutoFocus";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface NameSlideProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (name: string) => void;
  isSubmitting: boolean;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  labels: ResolvedQuizLabels;
}

export function NameSlide({
  label,
  value,
  onChange,
  onSubmit,
  isSubmitting,
  textColor,
  theme,
  labels,
}: NameSlideProps) {
  const [error, setError] = useState("");
  const autoFocus = useDesktopAutoFocus();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value.trim()) {
      setError(labels.nameRequired);
      return;
    }
    setError("");
    onSubmit(value.trim());
  }

  // Subtle backdrop fills give the input/button a readable surface against
  // the photo without a solid card — token-driven via the runner's --quiz-* vars.
  const surfaceClass = "bg-(--quiz-input)";
  const borderClass = "border-(--quiz-hairline) focus:border-(--quiz-hairline-hover)";

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden px-6 py-12 sm:px-12"
    >
      {/* Inner wrapper owns the scroll so the label + input + button stay
          reachable from the top on short viewports; my-auto centers short content. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label htmlFor="quiz-name" className="block text-2xl font-bold sm:text-3xl" style={{ color: textColor }}>
              {label} <span style={{ color: theme.dangerColor }}>*</span>
            </label>
            <input
              id="quiz-name"
              type="text"
              required
              autoComplete="name"
              autoFocus={autoFocus}
              placeholder={labels.namePlaceholder}
              value={value}
              // On mobile, tap-to-focus raises the keyboard; scroll the field
              // (and the submit button below it) into view so neither is hidden.
              onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
              onChange={(e) => {
                onChange(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "quiz-name-error" : undefined}
              className={`mt-4 block w-full rounded-xl border ${surfaceClass} px-4 py-3 text-base placeholder:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-current/50 ${error ? "border-(--quiz-danger) focus:ring-(--quiz-danger)" : borderClass}`}
              style={{ color: textColor }}
            />
            {error && (
              <p id="quiz-name-error" className="mt-2 text-base" style={{ color: theme.dangerColor }}>
                {error}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-8 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
            >
              {isSubmitting ? labels.saving : labels.continue}
            </button>
          </div>
        </form>
        </div>
      </div>
    </m.div>
  );
}
