import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank You",
  // Prevent indexing of the post-submit confirmation page — it shouldn't
  // surface in search results or be advertised to AI crawlers.
  robots: { index: false, follow: false },
};

export default function ThankYou() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-(--color-cream) px-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <h1 className="font-serif text-5xl font-normal text-(--color-ink) md:text-6xl">
          Thank You
        </h1>
        <p className="text-sm leading-relaxed text-(--color-muted)">
          Your message has been received. I&apos;ll be in touch soon. I can&apos;t
          wait to hear more about your vision.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center tracking-widest uppercase text-xs font-medium border border-(--color-ink) px-6 py-3 hover:bg-(--color-ink) hover:text-(--color-cream) transition-colors duration-300 mt-4"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
