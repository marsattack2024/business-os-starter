"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { m } from "framer-motion";
import type {
  AnswerFormat,
  RunnerAnswerOption,
  ResolvedQuizLabels,
  ResolvedQuizTheme,
} from "@/lib/quiz/types";

interface QuestionSlideProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  format: AnswerFormat;
  options: RunnerAnswerOption[];
  onAnswer: (labels: string[]) => void;
  /** Prior selection (when the visitor navigates Back), so a multi-select restores
   *  its checkmarks instead of forcing a re-pick. */
  initialSelected?: string[];
  isDark: boolean;
  textColor: string;
  theme: ResolvedQuizTheme;
  labels: ResolvedQuizLabels;
}

const REVEAL_DELAY_MS = 500;

// Multi-select formats let the visitor toggle several options and confirm
// with a Continue button; single-select formats auto-advance after a brief
// reveal so the dimming animation is visible.
const MULTI_SELECT: ReadonlySet<AnswerFormat> = new Set<AnswerFormat>([
  "select_all",
  "all_of_the_above",
]);

export function QuestionSlide({
  questionNumber,
  totalQuestions,
  question,
  format,
  options,
  onAnswer,
  initialSelected,
  textColor,
  theme,
  labels,
}: QuestionSlideProps) {
  const isMulti = MULTI_SELECT.has(format);

  // Single-select: one locked label (drives the dim/reveal). Multi-select:
  // a live set toggled by taps, confirmed via the Continue button. Multi-select
  // seeds from a prior answer so Back restores the checkmarks (single-select stays
  // unlocked so the visitor can simply re-pick).
  const [lockedLabel, setLockedLabel] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(
    () => (MULTI_SELECT.has(format) ? (initialSelected ?? []) : []),
  );

  const handleSingleSelect = useCallback(
    (option: RunnerAnswerOption) => {
      if (lockedLabel !== null) return;
      setLockedLabel(option.label);
      setTimeout(() => {
        onAnswer([option.label]);
      }, REVEAL_DELAY_MS);
    },
    [lockedLabel, onAnswer],
  );

  const handleToggle = useCallback((label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }, []);

  // Keyboard: press a letter (A/B/C…) to pick that answer; Enter confirms a
  // multi-select. Single-select keys lock + advance just like a click.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (key === "ENTER") {
        if (isMulti && selected.length > 0) {
          e.preventDefault();
          onAnswer(selected);
        }
        return;
      }
      const opt = options.find((o) => o.label.toUpperCase() === key);
      if (!opt) return;
      e.preventDefault();
      if (isMulti) handleToggle(opt.label);
      else handleSingleSelect(opt);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, isMulti, selected, handleToggle, handleSingleSelect, onAnswer]);

  function isOptionActive(label: string): boolean {
    return isMulti ? selected.includes(label) : lockedLabel === label;
  }

  function getButtonClasses(label: string): string {
    // Atelier answer rows: sharp corners, hairline frame, soft fill — not
    // rounded SaaS cards with heavy hover lift.
    const base =
      "flex min-h-[52px] w-full items-start gap-3.5 rounded-none border px-0 py-0 text-left transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";
    const rest =
      "bg-(--quiz-surface) hover:bg-(--quiz-surface-hover) hover:border-(--quiz-hairline-hover) hover:shadow-[0_10px_28px_-18px_rgba(44,38,32,0.45)] border-(--quiz-hairline)";
    const strong = "bg-(--quiz-surface-strong) shadow-[0_12px_32px_-16px_rgba(44,38,32,0.5)]";
    const dimmed = "bg-(--quiz-surface-dim) border-(--quiz-hairline-dim)";

    const active = isOptionActive(label);

    if (isMulti) return active ? `${base} ${strong}` : `${base} ${rest}`;
    // Single-select
    if (lockedLabel === null) return `${base} ${rest}`;
    if (active) return `${base} ${strong}`;
    return `${base} ${dimmed}`;
  }

  function getOptionOpacity(label: string): number {
    if (isMulti) return 1;
    if (lockedLabel === null) return 1;
    return lockedLabel === label ? 1 : 0.35;
  }

  const continueDisabled = selected.length === 0;
  const accent = theme.accentColor;
  const accentText = theme.accentTextColor;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden px-6 py-12 sm:px-12"
    >
      {/* Inner wrapper owns the scroll so a long question + options stays
          reachable from the top on short/landscape viewports; my-auto centers
          short content vertically. */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain">
        <div className="my-auto w-full max-w-xl">
        <p
          className="font-sans text-[0.72rem] font-medium uppercase tracking-[var(--tracking-eyebrow)]"
          style={{ color: textColor, opacity: 0.55 }}
        >
          {labels.questionProgress
            .replace("{current}", String(questionNumber))
            .replace("{total}", String(totalQuestions))}
        </p>

        <h2
          className="mt-3 font-serif text-[1.65rem] font-medium leading-[1.15] tracking-tight sm:text-[2.15rem]"
          style={{ color: textColor }}
        >
          {question}
        </h2>

        <div className="mt-8 space-y-2.5">
          {options.map((option) => {
            const active = isOptionActive(option.label);
            return (
              <button
                key={option.label}
                type="button"
                disabled={!isMulti && lockedLabel !== null}
                aria-pressed={isMulti ? active : undefined}
                onClick={() =>
                  isMulti ? handleToggle(option.label) : handleSingleSelect(option)
                }
                className={getButtonClasses(option.label)}
                style={{
                  color: textColor,
                  opacity: getOptionOpacity(option.label),
                  ...(active ? { borderColor: accent } : {}),
                }}
              >
                <span
                  className="flex h-[52px] w-12 shrink-0 items-center justify-center border-r font-sans text-sm font-medium tracking-wide transition-colors"
                  style={
                    active
                      ? {
                          backgroundColor: accent,
                          borderColor: accent,
                          color: accentText,
                        }
                      : {
                          color: textColor,
                          borderColor: "var(--quiz-hairline)",
                          backgroundColor: "var(--quiz-badge)",
                        }
                  }
                >
                  {option.label}
                </span>
                {option.imageSrc && (
                  <span className="relative my-2 ml-3 h-10 w-10 shrink-0 overflow-hidden self-center">
                    <Image
                      src={option.imageSrc}
                      alt={option.text || option.label}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span className="min-w-0 flex-1 px-4 py-3.5 font-serif text-base leading-snug sm:text-lg">
                  {option.text}
                </span>
                {isMulti && (
                  <span
                    className="mr-3 mt-3.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-all"
                    style={
                      active
                        ? { backgroundColor: accent, borderColor: accent }
                        : { borderColor: "var(--quiz-hairline)" }
                    }
                    aria-hidden="true"
                  >
                    {active && (
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke={accentText} strokeWidth="2.5">
                        <path d="M4 10l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isMulti && (
          <div className="mt-8">
            <p
              className="mb-3 font-sans text-sm font-medium"
              style={{ color: textColor, opacity: 0.65 }}
            >
              {selected.length > 0
                ? labels.selectedHint.replace("{count}", String(selected.length))
                : labels.selectAllHint}
            </p>
            <button
              type="button"
              disabled={continueDisabled}
              onClick={() => onAnswer(selected)}
              className="inline-flex min-h-[52px] w-full items-center justify-center border px-8 py-3.5 font-sans text-xs font-medium uppercase tracking-[var(--tracking-label)] transition-[color,background-color,transform] duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
                borderColor: theme.buttonColor,
              }}
            >
              {labels.continue}
            </button>
          </div>
        )}
        </div>
      </div>
    </m.div>
  );
}
