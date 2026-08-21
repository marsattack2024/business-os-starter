import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/site.config";
import {
  getQuizzes,
  getQuizBySlug,
  quizSlug,
  isQuizEnabled,
  validateQuizRegistry,
} from "@/lib/quiz/registry";
import { validateSiteQuizAlignment } from "@/lib/quiz/validate";
import { QuizStandaloneScreen } from "@/components/quiz/QuizStandaloneScreen";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * /quiz/[slug] — standalone landing for a NAMED quiz variation. Lets one site run
 * several quizzes (different offers per genre/service page) at distinct URLs.
 * Statically generated from the configured variations; an unknown slug 404s.
 * Noindex, same as /quiz.
 */
export const metadata: Metadata = {
  title: "Take the Quiz",
  robots: { index: false, follow: true },
};

// Only slugs returned by generateStaticParams are valid routes — an unknown or
// disabled slug 404s at the routing layer (not just the runtime guard below).
export const dynamicParams = false;

export function generateStaticParams() {
  const quizzes = getQuizzes(siteConfig);
  // Build-time config gate (fails `next build`, not just the dev console):
  // cross-variation invariants (unique id/slug, one default, slug↔id collisions)
  // + each variation's own alignment (bg image, statementImages, color/overlay
  // overrides, ≥1 question). Validates ALL configured quizzes, even disabled, so
  // config errors surface early.
  const errors = [
    ...validateQuizRegistry(quizzes),
    ...quizzes.flatMap((q) => {
      const res = validateSiteQuizAlignment(q);
      return res.ok ? [] : res.errors.map((e) => `quiz "${q.id}": ${e}`);
    }),
  ];
  if (errors.length) {
    throw new Error(`[quiz] invalid config:\n- ${errors.join("\n- ")}`);
  }
  // Only ENABLED variations get a live standalone page — a disabled placeholder
  // fork must not ship a crawlable funnel.
  return quizzes.filter(isQuizEnabled).map((q) => ({ slug: quizSlug(q) }));
}

export default async function QuizSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = getQuizBySlug(siteConfig, slug);
  // 404 for an unknown slug or a disabled variation (dev preview still renders).
  if (!quiz || (!isQuizEnabled(quiz) && !IS_DEV)) notFound();
  return <QuizStandaloneScreen quiz={quiz} />;
}
