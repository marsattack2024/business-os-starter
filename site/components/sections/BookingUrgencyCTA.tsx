export interface BookingUrgencyCTAProps {
  headline: React.ReactNode;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Compact dark CTA strip — typically placed below the FAQ / above the footer.
 * Reads as a final scarcity nudge. Uses a smaller vertical rhythm (py-20)
 * vs full sections so it doesn't compete with the main hero/CTA.
 */
export function BookingUrgencyCTA({
  headline,
  body,
  ctaLabel = "Inquire Today",
  ctaHref = "#contact",
}: BookingUrgencyCTAProps) {
  return (
    <section className="bg-(--color-ink) py-[var(--space-section-y-compact)] px-[var(--space-section-x)] text-center">
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        <h2 className="font-serif text-3xl font-normal text-(--color-cream) leading-tight md:text-4xl">
          {headline}
        </h2>
        <p className="text-body text-(--color-on-dark-secondary)">{body}</p>
        <div className="flex justify-center pt-2">
          <a
            href={ctaHref}
            className="inline-flex items-center justify-center tracking-widest uppercase text-xs font-medium border border-(--color-indicator-inactive) text-(--color-cream) px-8 py-3 hover:bg-(--color-card-on-dark-border) transition-colors duration-300"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
