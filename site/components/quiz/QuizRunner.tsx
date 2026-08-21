"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { m } from "framer-motion";
import { trackQuizEvent } from "@/lib/quiz/analytics";
import {
  WelcomeSlide,
  QuestionSlide,
  ExplanationSlide,
  OfferChoiceSlide,
  EmailSlide,
  FairEnoughSlide,
  NameSlide,
  PhoneSlide,
  FinalQuestionSlide,
  ThankYouSlide,
} from "./slides";
import { QuizRunnerBackground } from "./runner/QuizRunnerBackground";
import { QuizImagePreloader } from "./runner/QuizImagePreloader";
import { QuizProgressBar } from "./runner/QuizProgressBar";
import { QuizBackArrow } from "./runner/QuizBackArrow";
import { QuizDesktopNavArrows } from "./runner/QuizDesktopNavArrows";
import { QuizCloseButton } from "./runner/QuizCloseButton";
import { buildFlow, nextScreen, screenToQuestionIndex } from "@/lib/quiz/flow";
import { scoreQuiz } from "@/lib/quiz/score";
import { markSubmitted } from "@/lib/quiz/frequency";
import { stagePendingLeadConversion } from "@/lib/tracking/lead-conversions";
import type {
  QuizRunnerData,
  QuizScreen,
  QuizSubmitPayload,
  RecordedAnswer,
  ResolvedQuizTheme,
  RunnerQuestion,
} from "@/lib/quiz/types";

function answerIsCorrect(q: RunnerQuestion, labels: string[]): boolean {
  const best = new Set(q.options.filter((o) => o.isBest).map((o) => o.label));
  const sel = new Set(labels);
  return best.size > 0 && best.size === sel.size && [...best].every((l) => sel.has(l));
}

export interface QuizRunnerProps {
  quiz: QuizRunnerData;
  /** Overlay = true (fill its container) vs full-screen standalone = false. */
  fillParent?: boolean;
  /** True when a backdrop already sits behind the runner (the standalone /quiz
   *  server backdrop), so QuizRunnerBackground can skip its opaque base color. */
  backdropBehind?: boolean;
  /** When provided, a close (X) button is shown and calls this. */
  onClose?: () => void;
  /** Progressive capture: called on the email step and on completion. */
  onSubmit: (payload: QuizSubmitPayload) => Promise<{ ok: boolean }>;
  /** Called shortly after a successful completion (overlay/standalone redirects). */
  onComplete?: (leadEventId?: string) => void;
}

export function QuizRunner({ quiz, fillParent, backdropBehind, onClose, onSubmit, onComplete }: QuizRunnerProps) {
  const [screen, setScreen] = useState<QuizScreen>("welcome");
  // Actual visited path (not the linear flow), so Back follows the real branch.
  const [history, setHistory] = useState<QuizScreen[]>([]);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [answers, setAnswers] = useState<RecordedAnswer[]>([]);
  // Controlled capture fields so Back never loses what the visitor typed.
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [why, setWhy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // The exact email already captured at the email step — guards against a second
  // POST + inflated quiz_email_submitted when the visitor backs up and resubmits.
  const lastEmailSentRef = useRef<string | null>(null);

  const flow = useMemo(() => buildFlow(quiz.questions.length), [quiz.questions.length]);
  // Statement photos to preload as soon as the runner mounts, so the explanation
  // slide never shows its bare loading-color slot while the photo fetches.
  const statementImageSrcs = useMemo(
    () =>
      Array.from(
        new Set(
          quiz.questions
            .map((q) => q.statementImageSrc)
            .filter((s): s is string => typeof s === "string" && s.length > 0),
        ),
      ),
    [quiz.questions],
  );

  // Per-viewport theming: a quiz can be light on desktop and dark on mobile.
  // Initialize from the real viewport (the quiz renders client-side) so the
  // correct theme/image shows on the first paint — no light→dark flash.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Resolve final colors per-viewport from `mode` + the site's design tokens.
  // Light = ink text / ink button / cream button-text; dark = the inverse. No
  // hex is hardcoded here — clients get their palette via --color-* tokens.
  const t = quiz.theme;
  const mode = isMobile && t.modeMobile ? t.modeMobile : t.mode ?? "light";
  const isDark = mode === "dark";
  const activeTheme: ResolvedQuizTheme = {
    font: t.font,
    textColor: t.textColor ?? (isDark ? "var(--color-cream)" : "var(--color-ink)"),
    buttonColor: t.buttonColor ?? (isDark ? "var(--color-cream)" : "var(--color-ink)"),
    buttonTextColor: t.buttonTextColor ?? (isDark ? "var(--color-ink)" : "var(--color-cream)"),
    accentColor: t.accentColor ?? "var(--color-accent)",
    accentTextColor: t.accentTextColor ?? "var(--color-cream)",
    dangerColor: isDark ? "var(--color-error-on-dark)" : "var(--color-error)",
  };
  const textColor = activeTheme.textColor;

  // Translucent scrim surfaces (option chips, inputs, borders) as CSS variables
  // on the runner root, so they're token-driven — NOT hardcoded black/white — and
  // brand-aware: each is a color-mix of the site's own --color-cream / --color-ink
  // (so a fork's palette tints them) at the same per-viewport opacities the design
  // was tuned at. Set as vars (not inline styles) so slides keep their CSS :hover.
  const surfaceBase = isDark ? "var(--color-ink)" : "var(--color-cream)";
  const hairlineBase = isDark ? "var(--color-cream)" : "var(--color-ink)";
  const mix = (base: string, pct: number) => `color-mix(in srgb, ${base} ${pct}%, transparent)`;
  // Richer cream/ink mixes than the old washed translucents — enough body to
  // feel like atelier paper, not flat SaaS glass. Dark mobile gets denser fills
  // so cream type sits on ink planes instead of floating over the photo.
  const surfaceVars: Record<string, string> = {
    "--quiz-surface": mix(surfaceBase, isDark ? 48 : 78),
    "--quiz-surface-hover": mix(surfaceBase, isDark ? 68 : 92),
    "--quiz-surface-strong": mix(surfaceBase, isDark ? 82 : 98),
    "--quiz-surface-dim": mix(surfaceBase, isDark ? 22 : 32),
    "--quiz-input": mix(surfaceBase, isDark ? 40 : 42),
    "--quiz-badge": mix(surfaceBase, isDark ? 55 : 62),
    "--quiz-frame": mix(surfaceBase, isDark ? 55 : 70),
    // Hairlines read as ink rules on cream / cream rules on ink.
    "--quiz-hairline": mix(hairlineBase, isDark ? 32 : 28),
    "--quiz-hairline-hover": mix(hairlineBase, isDark ? 55 : 48),
    "--quiz-hairline-dim": mix(hairlineBase, isDark ? 18 : 14),
    "--quiz-danger": activeTheme.dangerColor,
  };

  // Fire quiz_viewed once per open (guard StrictMode double-invoke + remounts).
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    trackQuizEvent("quiz_viewed", { quiz_id: quiz.id });
  }, [quiz.id]);

  // Fire quiz_question_answered only the FIRST time a step is answered, so a Back
  // + re-answer doesn't inflate per-step answer/correct ratios.
  const answeredStepsRef = useRef<Set<number>>(new Set());

  const currentIdx = Math.max(0, flow.indexOf(screen));
  const progress = currentIdx <= 0 ? 0 : currentIdx / (flow.length - 1);
  const showProgressBar = screen !== "welcome" && screen !== "thank-you";
  const showNav = screen !== "welcome" && screen !== "thank-you";
  // Forward arrow only where advancing needs no input (statement reveals).
  const canForward = /^e\d+$/.test(screen);

  // Screens whose own field auto-focuses (desktop) — don't steal that focus.
  const isInputScreen =
    screen === "email" || screen === "name" || screen === "phone" || screen === "final-question";

  // A11y: slides remount per screen, so after each advance move focus onto the
  // new slide (non-input screens) and announce the step via a polite live region
  // — otherwise SR/keyboard users are stranded with focus dropped to <body>.
  const slideRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isInputScreen) return; // the slide's own input takes focus instead
    slideRef.current?.focus();
  }, [screen, isInputScreen]);

  function liveMessage(): string {
    if (screen === "welcome") return quiz.welcome.headline;
    if (/^q\d+$/.test(screen)) {
      return `Question ${screenToQuestionIndex(screen) + 1} of ${quiz.questions.length}`;
    }
    if (/^e\d+$/.test(screen)) {
      return quiz.questions[screenToQuestionIndex(screen)]?.statementTitle || "Here's the answer";
    }
    if (screen === "offer") return quiz.offerGate.question;
    if (screen === "email") return quiz.email.offerHeadline;
    if (screen === "fair-enough") return quiz.fairEnough.headline;
    if (screen === "name") return quiz.nameLabel;
    if (screen === "phone") return quiz.phoneLabel;
    if (screen === "final-question") return quiz.finalQuestion;
    if (screen === "thank-you") return quiz.thankYou.headline;
    return "";
  }

  function go(next: QuizScreen) {
    setApiError(null);
    setDirection(1);
    setHistory((h) => [...h, screen]);
    setScreen(next);
  }

  function goBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setApiError(null);
    setDirection(-1);
    setHistory((h) => h.slice(0, -1));
    setScreen(prev);
  }

  function handleAnswer(qIndex: number, labels: string[]) {
    const q = quiz.questions[qIndex];
    if (!q) return;
    const correct = answerIsCorrect(q, labels);
    setAnswers((prev) => {
      const without = prev.filter((a) => a.questionIndex !== qIndex);
      return [...without, { questionIndex: qIndex, selected: labels, isCorrect: correct }];
    });
    if (!answeredStepsRef.current.has(qIndex)) {
      answeredStepsRef.current.add(qIndex);
      trackQuizEvent("quiz_question_answered", {
        quiz_id: quiz.id,
        step: qIndex + 1,
        is_correct: correct,
      });
    }
    go(`e${qIndex + 1}` as QuizScreen);
  }

  async function handleEmailSubmit(value: string) {
    // Progressive capture. Disable the button for the duration of the request so
    // a double-click can't fire two captures, but never trap the visitor: advance
    // regardless of the outcome (the email is also re-sent at the completion
    // step). Record the analytics event only once the server confirms the
    // capture, so quiz_email_submitted isn't inflated by failures.
    if (isSubmitting) return;
    // Already captured this exact email at this step? Skip the network + analytics
    // (it's re-sent at the completion step regardless) and just advance.
    if (lastEmailSentRef.current === value) {
      go("name");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await onSubmit({ stage: "email", email: value, quizId: quiz.id });
      if (result.ok) {
        // Only mark sent on SUCCESS — a transient failure must be retryable on a
        // back-nav resubmit (the lead is re-sent at completion regardless).
        lastEmailSentRef.current = value;
        trackQuizEvent("quiz_email_submitted", { quiz_id: quiz.id });
      }
    } catch {
      /* best-effort: the email may still be captured at the completion step. */
    } finally {
      setIsSubmitting(false);
      go("name");
    }
  }

  async function handleFinalSubmit(whyValue: string) {
    setIsSubmitting(true);
    setApiError(null);
    const { correct, total } = scoreQuiz(answers, quiz.questions);
    const answersPayload = answers
      .sort((a, b) => a.questionIndex - b.questionIndex)
      .map((a) => {
        const q = quiz.questions[a.questionIndex];
        const texts = a.selected.map((l) => q.options.find((o) => o.label === l)?.text ?? l);
        return { q: q.question, a: texts.join(", ") };
      });
    let leadEventId: string | undefined;
    try {
      const result = await onSubmit({
        stage: "complete",
        email,
        name: name || undefined,
        phone: phone || undefined,
        why: whyValue || undefined,
        whyQuestion: quiz.finalQuestion,
        quizId: quiz.id,
        resultKey: `${correct}of${total}`,
        score: correct,
        answers: answersPayload,
      });
      if (result.ok) {
        leadEventId = stagePendingLeadConversion({
          formName: "quiz",
          leadType: "quiz_lead",
          sourcePage: typeof window !== "undefined" ? window.location.pathname : "/quiz",
          name,
          email,
          phone,
        });
      }
    } catch {
      // Never trap the visitor: the lead may already have been captured at the
      // email step, and we never block the exit. Redirect regardless.
    }
    setIsSubmitting(false);
    markSubmitted(quiz.id);
    trackQuizEvent("quiz_completed", { quiz_id: quiz.id, score: correct });
    // No in-quiz thank-you slide: on completion, redirect straight to the
    // configured destination. Fall back to the thank-you slide only when there is
    // no redirect target (inline/preview), so the visitor is never stranded.
    if (onComplete) onComplete(leadEventId);
    else go("thank-you");
  }

  function renderSlide() {
    const shared = { isDark, textColor, theme: activeTheme, labels: quiz.labels } as const;
    if (screen === "welcome") {
      return (
        <WelcomeSlide
          headline={quiz.welcome.headline}
          subheadline={quiz.welcome.subheadline}
          startLabel={quiz.welcome.startLabel}
          onNext={() => go("q1")}
          {...shared}
        />
      );
    }
    if (/^q\d+$/.test(screen)) {
      const qIndex = screenToQuestionIndex(screen);
      const q = quiz.questions[qIndex];
      if (!q) return null;
      return (
        <QuestionSlide
          questionNumber={qIndex + 1}
          totalQuestions={quiz.questions.length}
          question={q.question}
          format={q.format}
          options={q.options}
          initialSelected={answers.find((a) => a.questionIndex === qIndex)?.selected}
          onAnswer={(labels) => handleAnswer(qIndex, labels)}
          {...shared}
        />
      );
    }
    if (/^e\d+$/.test(screen)) {
      const qIndex = screenToQuestionIndex(screen);
      const q = quiz.questions[qIndex];
      if (!q) return null;
      return (
        <ExplanationSlide
          statementTitle={q.statementTitle}
          statementBody={q.statementBody}
          imageSrc={q.statementImageSrc}
          nextLabel={quiz.labels.continue}
          onNext={() => go(nextScreen(screen, flow))}
          {...shared}
        />
      );
    }
    if (screen === "offer") {
      return (
        <OfferChoiceSlide
          question={quiz.offerGate.question}
          yesLabel={quiz.offerGate.yesLabel}
          noLabel={quiz.offerGate.noLabel}
          onAccept={() => go("email")}
          onDecline={() => go("fair-enough")}
          {...shared}
        />
      );
    }
    if (screen === "email") {
      return (
        <EmailSlide
          offerHeadline={quiz.email.offerHeadline}
          benefits={quiz.email.benefits}
          cta={quiz.email.cta}
          value={email}
          onChange={setEmail}
          onSubmit={handleEmailSubmit}
          isSubmitting={isSubmitting}
          error={apiError}
          {...shared}
        />
      );
    }
    if (screen === "fair-enough") {
      return (
        <FairEnoughSlide
          headline={quiz.fairEnough.headline}
          body={quiz.fairEnough.body}
          continueLabel={quiz.fairEnough.continueLabel}
          reconsiderLabel={quiz.fairEnough.reconsiderLabel}
          onContinue={() => go("email")}
          onReconsider={goBack}
          {...shared}
        />
      );
    }
    if (screen === "name") {
      return (
        <NameSlide
          label={quiz.nameLabel}
          value={name}
          onChange={setName}
          onSubmit={() => go("phone")}
          isSubmitting={false}
          {...shared}
        />
      );
    }
    if (screen === "phone") {
      return (
        <PhoneSlide
          label={quiz.phoneLabel}
          value={phone}
          onChange={setPhone}
          onSubmit={() => go("final-question")}
          isSubmitting={false}
          required={quiz.phoneRequired}
          {...shared}
        />
      );
    }
    if (screen === "final-question") {
      return (
        <FinalQuestionSlide
          question={quiz.finalQuestion}
          value={why}
          onChange={setWhy}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
          required={quiz.whyRequired}
          {...shared}
        />
      );
    }
    if (screen === "thank-you") {
      return <ThankYouSlide headline={quiz.thankYou.headline} lines={quiz.thankYou.lines} {...shared} />;
    }
    return null;
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${fillParent ? "h-full w-full" : "h-dvh w-screen"} overflow-hidden`}
      style={{ fontFamily: quiz.theme.font, ...(surfaceVars as CSSProperties) }}
    >
      <QuizRunnerBackground background={quiz.background} solidBase={!backdropBehind} />
      <QuizImagePreloader srcs={statementImageSrcs} />
      <div className="relative z-10 h-full w-full overflow-hidden">
        {/* Keyed wrapper remounts the slide subtree on each screen change. The
            wrapper drives a directional slide (forward = up from below, back =
            down from above) with DIRECT props — not variant labels, which don't
            propagate under LazyMotion strict. Each slide adds its own fade. */}
        <m.div
          ref={slideRef}
          tabIndex={-1}
          key={screen}
          initial={{ y: direction * 24 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="h-full outline-none"
        >
          {renderSlide()}
        </m.div>
      </div>

      {/* Polite live region: announces each step to assistive tech as slides change. */}
      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage()}
      </div>

      {showProgressBar && <QuizProgressBar progress={progress} theme={activeTheme} />}

      {apiError && (
        <div
          role="alert"
          // Sit above the mobile back chevron AND the home indicator: add the
          // bottom safe inset to the 5rem base so the toast never tucks under it.
          className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-(--color-ink) px-4 py-2 text-sm font-medium text-(--color-white) shadow-lg"
        >
          {/* Danger dot carries the error semantics; white-on-ink text clears AA
              in both modes (the danger color itself can be light in dark mode). */}
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: activeTheme.dangerColor }} aria-hidden="true" />
          {apiError}
        </div>
      )}

      {showNav && (
        <>
          {history.length > 0 && (
            <QuizBackArrow onPrev={goBack} theme={activeTheme} backLabel={quiz.labels.back} />
          )}
          <QuizDesktopNavArrows
            onPrev={goBack}
            onNext={() => go(nextScreen(screen, flow))}
            canPrev={history.length > 0}
            canNext={canForward}
            theme={activeTheme}
            backLabel={quiz.labels.back}
            nextLabel={quiz.labels.next}
          />
        </>
      )}

      {onClose && screen !== "thank-you" && (
        <QuizCloseButton onClose={onClose} theme={activeTheme} closeLabel={quiz.labels.close} />
      )}
    </m.div>
  );
}
