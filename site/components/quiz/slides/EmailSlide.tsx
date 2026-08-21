"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { isValidEmail } from "@/lib/quiz/validate";
import { useDesktopAutoFocus } from "./useDesktopAutoFocus";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface EmailSlideProps {
  offerHeadline: string;
  benefits: string[];
  cta: string;
  /** Optional explicit sr-only label override; defaults to `labels.emailLabel`. */
  emailLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (email: string) => void;
  isSubmitting: boolean;
  error?: string | null;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  labels: ResolvedQuizLabels;
}

export function EmailSlide({
  offerHeadline,
  benefits,
  cta,
  emailLabel,
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  isDark,
  textColor,
  theme,
  labels,
}: EmailSlideProps) {
  const [localError, setLocalError] = useState("");
  const autoFocus = useDesktopAutoFocus();

  // Surface either the parent-supplied error (e.g. a failed submit) or the
  // local client-side validation message.
  const shownError = error || localError;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value.trim()) {
      setLocalError(labels.emailRequired);
      return;
    }
    if (!isValidEmail(value)) {
      setLocalError(labels.emailInvalid);
      return;
    }
    setLocalError("");
    onSubmit(value.trim());
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden px-6 py-12 sm:px-12"
    >
      {/* Inner wrapper owns the scroll so the offer + benefits + form stay
          reachable from the top on short viewports; my-auto centers short content. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        {/* The offer content sits on a frosted scrim panel so the cream copy keeps
            a consistent dark backdrop — over the background photo alone the
            checklist washed out where the image was light. */}
        <div
          className="my-auto w-full max-w-xl rounded-2xl p-6 ring-1 ring-white/10 backdrop-blur-md sm:p-8"
          style={{ backgroundColor: isDark ? "rgba(8,7,6,0.5)" : "rgba(255,255,255,0.72)" }}
        >
        <h2
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: textColor }}
        >
          {offerHeadline}
        </h2>

        <ul className="mt-6 space-y-3">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3"
              style={{ color: textColor }}
            >
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-(--color-accent)"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-base leading-relaxed">{benefit}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          <div>
            <label htmlFor="quiz-email" className="sr-only">
              {emailLabel || labels.emailLabel}
            </label>
            <input
              id="quiz-email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              autoFocus={autoFocus}
              placeholder={labels.emailPlaceholder}
              value={value}
              // On mobile, tap-to-focus raises the keyboard; scroll the field
              // (and the submit button below it) into view so neither is hidden.
              onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
              onChange={(e) => {
                onChange(e.target.value);
                if (localError) setLocalError("");
              }}
              aria-invalid={shownError ? "true" : undefined}
              aria-describedby={shownError ? "quiz-email-error" : undefined}
              className={`block w-full rounded-xl border bg-(--quiz-input) px-4 py-3 text-base placeholder:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-current/50 ${
                shownError
                  ? "border-(--quiz-danger) focus:ring-(--quiz-danger)"
                  : "border-(--quiz-hairline) focus:border-(--quiz-hairline-hover)"
              }`}
              style={{ color: textColor }}
            />
            {shownError && (
              <p id="quiz-email-error" className="mt-2 text-base" style={{ color: theme.dangerColor }}>
                {shownError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-8 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
          >
            {isSubmitting ? (
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ color: theme.buttonTextColor }}
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              cta
            )}
          </button>
        </form>
        </div>
      </div>
    </m.div>
  );
}
