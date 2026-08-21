"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { formatUsPhone, isValidPhone } from "@/lib/quiz/validate";
import { useDesktopAutoFocus } from "./useDesktopAutoFocus";
import type { ResolvedQuizLabels, ResolvedQuizTheme } from "@/lib/quiz/types";

interface PhoneSlideProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (phone: string) => void;
  isSubmitting: boolean;
  /** Phone is required by default; a client can relax it via quiz.optionalFields. */
  required: boolean;
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  labels: ResolvedQuizLabels;
}

export function PhoneSlide({
  label,
  value,
  onChange,
  onSubmit,
  isSubmitting,
  required,
  textColor,
  theme,
  labels,
}: PhoneSlideProps) {
  const [error, setError] = useState("");
  const autoFocus = useDesktopAutoFocus();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (required && !value.trim()) {
      setError(labels.phoneRequired);
      return;
    }
    // Validate a non-empty value regardless (an optional field still must be valid
    // if filled).
    if (value.trim() && !isValidPhone(value)) {
      setError(labels.phoneInvalid);
      return;
    }
    setError("");
    onSubmit(value.trim());
  }

  const surfaceClass = "bg-(--quiz-input)";
  const borderClass = error
    ? "border-(--quiz-danger) focus:ring-(--quiz-danger)"
    : "border-(--quiz-hairline) focus:border-(--quiz-hairline-hover)";

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
            <label
              htmlFor="quiz-phone"
              className="block text-2xl font-bold sm:text-3xl"
              style={{ color: textColor }}
            >
              {label}
              {required && <span style={{ color: theme.dangerColor }}> *</span>}
            </label>
            <input
              id="quiz-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus={autoFocus}
              required={required}
              placeholder={labels.phonePlaceholder}
              value={value}
              // On mobile, tap-to-focus raises the keyboard; scroll the field
              // (and the submit button below it) into view so neither is hidden.
              onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
              onChange={(e) => {
                onChange(formatUsPhone(e.target.value));
                if (error) setError("");
              }}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "quiz-phone-error" : undefined}
              className={`mt-4 block w-full rounded-xl border ${surfaceClass} ${borderClass} px-4 py-3 text-base placeholder:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-current/50`}
              style={{ color: textColor }}
            />
            {error && (
              <p id="quiz-phone-error" className="mt-2 text-base" style={{ color: theme.dangerColor }}>
                {error}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-8 py-3 text-base font-semibold shadow-sm transition-transform hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
