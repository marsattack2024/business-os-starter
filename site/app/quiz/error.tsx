"use client";
import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary for the standalone quiz routes (/quiz, /quiz/[slug]). Without
 * it a runtime render error (e.g. a malformed config that slips past the build
 * gate) would white-screen the whole document. Degrades to a contained branded
 * fallback with a retry + a way home.
 */
export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[QuizError]", { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <main className="min-h-screen bg-(--color-cream) flex flex-col items-center justify-center gap-8 px-6">
      <span className="text-xs uppercase tracking-widest text-(--color-muted)">Quiz unavailable</span>
      <h1 className="font-serif text-4xl font-normal text-(--color-ink) text-center">
        Something went wrong
      </h1>
      <p className="text-sm text-(--color-muted) max-w-sm text-center leading-relaxed">
        We couldn&apos;t load the quiz just now. Try again, or head back and reach out directly.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="text-xs uppercase tracking-widest border border-(--color-ink) text-(--color-ink) px-8 py-4 hover:bg-(--color-ink) hover:text-(--color-cream) transition-colors duration-300"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-(--color-muted) underline underline-offset-4 hover:text-(--color-ink) transition-colors duration-300"
        >
          Back to site
        </Link>
      </div>
    </main>
  );
}
