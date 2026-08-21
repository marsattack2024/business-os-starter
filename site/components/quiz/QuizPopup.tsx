"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig } from "@/lib/site.config";
import { getPopupQuizForPath, isQuizEnabled } from "@/lib/quiz/registry";
import { hrefWithLeadEvent } from "@/lib/tracking/lead-conversions";
import { useQuizTriggers } from "./useQuizTriggers";
import { QuizErrorBoundary } from "./QuizErrorBoundary";

// Lazy-load the runner (framer-motion + every slide) so the popup's heavy
// subtree only ships when the popup actually opens, not on every site page.
const QuizExperience = dynamic(
  () => import("./QuizExperience").then((m) => m.QuizExperience),
  { ssr: false },
);

/**
 * Triggered quiz popup, mounted once in the site layout. Picks the right quiz
 * VARIATION for the current path (a site can host several — different offers per
 * genre/service page), then self-gates on enabled + frequency caps. Opens via
 * exit-intent / time-delay / scroll-depth (whichever fires first). Dev
 * convenience (resolved inside the hook, where window is available): on
 * localhost the popup runs regardless of the enabled flag, and `?quizPreview=1`
 * force-opens it on any page, ignoring caps.
 */
export function QuizPopup() {
  const pathname = usePathname();
  const router = useRouter();

  // Resolve which variation (if any) backs this path. The resolver already did
  // the showOn match, so the chosen quiz is page-appropriate by construction.
  const quiz = getPopupQuizForPath(siteConfig, pathname);
  const enabled = quiz ? isQuizEnabled(quiz) : false;

  const triggers = useQuizTriggers({
    id: quiz?.id ?? "disabled",
    maxShowsPerDay: quiz?.triggers?.maxShowsPerDay,
    seenCooldownDays: quiz?.triggers?.seenCooldownDays,
    submittedCooldownDays: quiz?.triggers?.submittedCooldownDays,
    delayMs: quiz?.triggers?.delaySeconds != null ? quiz.triggers.delaySeconds * 1000 : null,
    scrollDepthPct: quiz?.triggers?.scrollDepthPct ?? null,
    exitIntent: Boolean(quiz?.triggers?.exitIntent),
    blockedPathSegments: quiz?.triggers?.blockedPathSegments ?? ["thank-you", "quiz-thank-you"],
    enabled: Boolean(quiz) && enabled,
    pageAllowed: true,
  });

  if (!quiz || !triggers.isOpen) return null;

  return (
    <QuizErrorBoundary>
      <QuizExperience
        siteQuiz={quiz}
        onClose={triggers.close}
        onComplete={(leadEventId) =>
          router.push(hrefWithLeadEvent(quiz.redirectTo ?? "/thank-you", leadEventId))
        }
      />
    </QuizErrorBoundary>
  );
}
