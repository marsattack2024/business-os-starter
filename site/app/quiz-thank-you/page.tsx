import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "You completed the quiz",
  // Post-completion funnel surface — keep it out of search + AI crawlers.
  robots: { index: false, follow: false },
};

/**
 * Generic, config-driven quiz confirmation. Distinct from the plain
 * /thank-you: it references completing the quiz, restates the offer, and offers
 * the next step (book to redeem) via an optional scheduler embed + video slot.
 *
 * Lives OUTSIDE the `(site)` route group on purpose (see
 * docs/TEMPLATE-STANDARDS.md §11 "Campaign / landing pages carry no full site
 * nav, and never a competing offer"). A visitor who just converted on the quiz
 * should not see the full Navbar's `navCta` looping them back into the same
 * /quiz funnel, the Footer's full nav, or another QuizPopup trigger — so this
 * page carries only a minimal brand header (logo, no nav links, no offer CTA)
 * and a minimal NAP/legal footer, same recipe as `/current-pricing-guide`.
 *
 * ALL copy comes from `siteConfig.quiz.thankYouPage` with neutral fallbacks —
 * no client-specific text is hardcoded here. A fork fills `thankYouPage` (and
 * `schedulerEmbedUrl` / `redemptionVideoUrl`) to brand it.
 */
export default function QuizThankYou() {
  const quiz = siteConfig.quiz;
  const tp = quiz?.thankYouPage ?? {};

  const eyebrow = tp.eyebrow ?? "Quiz complete";
  const headline = tp.headline ?? "You did it. Thanks for taking the quiz.";
  const body =
    tp.body ??
    "We received your answers. Pick a time below and we’ll take it from there. There’s no pressure, just a real conversation about what you have in mind.";
  const videoPlaceholder = tp.videoPlaceholder ?? "A personal note, coming soon";
  const schedulerHeading = tp.schedulerHeading ?? "Book your session";
  const schedulerUrl = tp.schedulerEmbedUrl ?? quiz?.schedulerEmbedUrl;
  const videoUrl = tp.redemptionVideoUrl ?? quiz?.redemptionVideoUrl;
  const ctaText = tp.ctaText ?? "Start your inquiry";
  const ctaHref = tp.ctaHref ?? "/#contact";

  const { brand, footerLinks } = siteConfig;
  const year = new Date().getFullYear();
  const hasContact = Boolean(brand.phone || brand.email || brand.location);

  return (
    <>
      {/* Minimal brand header — logo/wordmark only, no nav links, no offer CTA. */}
      <header className="w-full bg-(--color-cream) border-b border-(--color-border) px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/" className="font-serif text-2xl tracking-widest text-(--color-ink)">
            {brand.name}
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="outline-none bg-(--color-cream) px-6 py-20 text-(--color-ink) md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mx-auto w-fit text-xs font-semibold uppercase tracking-(--tracking-label) text-(--color-muted)">
            {eyebrow}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl font-medium leading-[0.98] sm:text-6xl lg:text-7xl">
            {headline}
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg font-light text-(--color-muted)">
            {body}
          </p>

          {/* Video slot (placeholder until a real video URL is configured). */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-ink)">
              {videoUrl ? (
                <video src={videoUrl} controls playsInline className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-(--color-cream)">
                  <svg className="h-12 w-12 opacity-80" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p className="text-xs font-semibold uppercase tracking-(--tracking-label) opacity-80">
                    {videoPlaceholder}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scheduler embed — book to redeem. */}
          <div className="mx-auto mt-12 max-w-2xl text-left">
            <h2 className="text-center font-serif text-3xl font-medium sm:text-4xl">
              {schedulerHeading}
            </h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-(--color-border) bg-white">
              {schedulerUrl ? (
                <iframe
                  src={schedulerUrl}
                  title={schedulerHeading}
                  className="h-[680px] w-full"
                  style={{ border: "none" }}
                  scrolling="no"
                />
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <p className="font-serif text-xl text-(--color-ink)">
                    The booking calendar will appear here.
                  </p>
                  <p className="max-w-md text-base font-light text-(--color-muted)">
                    We&apos;ll be in touch personally within 1–2 business days to lock in
                    your time. Prefer to reach out now?
                  </p>
                  <Link
                    href={ctaHref}
                    className="mt-2 inline-flex items-center justify-center rounded-full bg-(--color-ink) px-8 py-4 text-xs font-semibold uppercase tracking-(--tracking-label) text-(--color-cream) transition-colors duration-300 hover:bg-(--color-accent-text)"
                  >
                    {ctaText}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-(--color-ink) px-8 py-4 text-xs font-semibold uppercase tracking-(--tracking-label) transition-colors duration-300 hover:bg-(--color-ink) hover:text-(--color-cream)"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal footer — NAP + copyright + legal links only, no full nav, no quiz CTA. */}
      <footer className="bg-(--color-ink) pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] px-[var(--space-section-x)]">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {hasContact && (
            <div className="flex flex-col items-center gap-2 pb-6 border-b border-(--color-card-on-dark-border) text-center">
              {brand.phone && (
                <a
                  href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}
                  className="text-sm text-(--color-on-dark-secondary) hover:text-(--color-cream) transition-colors"
                >
                  {brand.phone}
                </a>
              )}
              {brand.email && (
                <a
                  href={`mailto:${brand.email}`}
                  className="text-sm text-(--color-on-dark-secondary) hover:text-(--color-cream) transition-colors break-all"
                >
                  {brand.email}
                </a>
              )}
              {brand.location && (
                <p className="text-sm text-(--color-on-dark-secondary)">
                  {brand.location.city}, {brand.location.state}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-(--color-on-dark-muted) tracking-widest uppercase text-center">
              &copy; {year} {brand.name}. All rights reserved.
            </p>
            {footerLinks && footerLinks.length > 0 && (
              <div className="flex gap-6">
                {footerLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs text-(--color-on-dark-secondary) hover:text-(--color-cream) uppercase tracking-widest transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
