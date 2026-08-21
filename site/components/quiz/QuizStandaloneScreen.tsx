import Image from "next/image";
import { QuizStandalone } from "./QuizStandalone";
import type { SiteQuiz } from "@/lib/quiz/types";

/**
 * Server-rendered shell for a standalone quiz route (`/quiz` and `/quiz/[slug]`).
 * Paints the per-viewport backdrop, then mounts the client runner. Shared by both
 * routes so the backdrop logic lives in exactly one place.
 *
 * The default backdrop is the quiz background image so the template stays
 * decoupled from any specific homepage; a fork can set
 * `quiz.standalone.backdrop` to "none" for a solid-ink backdrop instead.
 */
export function QuizStandaloneScreen({ quiz }: { quiz: SiteQuiz }) {
  const backdrop = quiz.standalone?.backdrop ?? "image";
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen outline-none">
      {backdrop === "image" && quiz.background.imageSrc && (
        <div className="fixed inset-0 -z-10 bg-(--color-ink)" aria-hidden="true">
          {/* Match the runner's per-viewport image via CSS so the brief
              pre-mount backdrop never shows the wrong (desktop) photo on a
              phone. */}
          <Image
            src={quiz.background.imageSrcMobile ?? quiz.background.imageSrc}
            alt="Studio session backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover sm:hidden"
          />
          <Image
            src={quiz.background.imageSrc}
            alt="Studio session backdrop"
            fill
            priority
            sizes="100vw"
            className="hidden object-cover sm:block"
          />
        </div>
      )}
      {backdrop !== "image" && (
        <div className="fixed inset-0 -z-10 bg-(--color-ink)" aria-hidden="true" />
      )}
      <QuizStandalone siteQuiz={quiz} />
    </main>
  );
}
