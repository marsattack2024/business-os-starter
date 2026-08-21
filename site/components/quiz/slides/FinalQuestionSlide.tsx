"use client";

import { m } from "framer-motion";
import { useDesktopAutoFocus } from "./useDesktopAutoFocus";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface FinalQuestionSlideProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (why: string) => void;
  isSubmitting: boolean;
  /** Required by default; a client can relax it via quiz.optionalFields. */
  required: boolean;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  labels: ResolvedQuizLabels;
}

export function FinalQuestionSlide({
  question,
  value,
  onChange,
  onSubmit,
  isSubmitting,
  required,
  textColor,
  theme,
  labels,
}: FinalQuestionSlideProps) {
  const autoFocus = useDesktopAutoFocus();
  const blockEmpty = required && value.trim().length === 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blockEmpty) return; // required — don't submit an empty answer
    onSubmit(value.trim());
  }

  const surfaceClass = "bg-(--quiz-input)";
  const borderClass = "border-(--quiz-hairline) focus:border-(--quiz-hairline-hover)";

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden px-6 py-12 sm:px-12"
    >
      {/* Inner wrapper owns the scroll so the question + textarea + button stay
          reachable from the top on short viewports; my-auto centers short content. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label htmlFor="quiz-why" className="block text-[1.7rem] font-bold leading-tight sm:text-4xl" style={{ color: textColor }}>
              {question}
            </label>
            <textarea
              id="quiz-why"
              rows={4}
              required={required}
              autoFocus={autoFocus}
              placeholder={labels.whyPlaceholder}
              value={value}
              // On mobile, tap-to-focus raises the keyboard; scroll the field
              // (and the submit button below it) into view so neither is hidden.
              onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
              onChange={(e) => onChange(e.target.value)}
              className={`mt-5 block w-full resize-none rounded-xl border ${surfaceClass} ${borderClass} px-4 py-3.5 text-lg placeholder:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-current/40`}
              style={{ color: textColor }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || blockEmpty}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:translate-y-0 active:brightness-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md disabled:hover:brightness-100"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
            >
              {isSubmitting ? (
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true" style={{ color: theme.buttonTextColor }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                labels.submit
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </m.div>
  );
}
