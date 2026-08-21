"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-(--color-cream) flex flex-col items-center justify-center gap-8 px-6">
        <span className="text-xs uppercase tracking-widest text-(--color-muted)">Error</span>
        <h1 className="font-serif text-4xl font-normal text-(--color-ink) text-center">
          Something went wrong
        </h1>
        <p className="text-sm text-(--color-muted) max-w-sm text-center leading-relaxed">
          We hit an unexpected error. Try again. If it persists, please reach out.
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-xs uppercase tracking-widest border border-(--color-ink) text-(--color-ink) px-8 py-4 hover:bg-(--color-ink) hover:text-(--color-cream) transition-colors duration-300"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
