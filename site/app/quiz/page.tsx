import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site.config";
import { getDefaultQuiz, isQuizEnabled } from "@/lib/quiz/registry";
import { QuizStandaloneScreen } from "@/components/quiz/QuizStandaloneScreen";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * /quiz — standalone landing for the DEFAULT quiz variation. Opens immediately
 * over a backdrop, exits to the homepage, redirects to the thank-you page on
 * completion. Named variations live at /quiz/[slug]. Noindex: a thin ad funnel
 * surface, not a search competitor. Disabled (→ /) when no quiz is configured.
 */
export const metadata: Metadata = {
  title: "Take the Quiz",
  robots: { index: false, follow: true },
};

export default function QuizPage() {
  const quiz = getDefaultQuiz(siteConfig);
  // Redirect when there's no quiz or the default is disabled (a placeholder fork
  // must not serve a live funnel); dev preview still renders.
  if (!quiz || (!isQuizEnabled(quiz) && !IS_DEV)) redirect("/");
  return <QuizStandaloneScreen quiz={quiz} />;
}
