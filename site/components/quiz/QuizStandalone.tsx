"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { QuizExperience } from "./QuizExperience";
import { hrefWithLeadEvent } from "@/lib/tracking/lead-conversions";
import type { SiteQuiz } from "@/lib/quiz/types";

const noop = () => () => {};
/** True only after client hydration — no setState-in-effect, no SSR mismatch. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * Standalone /quiz route experience: opens immediately (no triggers, no caps),
 * exits to the homepage, and redirects to the thank-you page on completion.
 * Renders client-only (after mount) so the runner picks the right per-viewport
 * theme on its first paint instead of flashing the desktop theme from SSR.
 */
export function QuizStandalone({ siteQuiz }: { siteQuiz: SiteQuiz }) {
  const router = useRouter();
  if (!useHydrated()) return null;
  return (
    <QuizExperience
      siteQuiz={siteQuiz}
      inline
      sourceAgent="quiz-standalone"
      onClose={() => router.push("/")}
      onComplete={(leadEventId) =>
        router.push(hrefWithLeadEvent(siteQuiz.redirectTo ?? "/thank-you", leadEventId))
      }
    />
  );
}
