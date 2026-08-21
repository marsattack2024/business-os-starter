import { siteConfig } from "@/lib/site.config";
import type { ReactNode } from "react";

export interface UrgencyBlockProps {
  headline?: ReactNode;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Accent-colored urgency band. Pairs the scarcity message with a contrasting
 * cream CTA. Defaults read from siteConfig.bookingCTA so a fork only needs
 * to set bookingCTA once to power both this and BookingUrgencyCTA.
 *
 * If you don't want two scarcity sections on the page, prefer BookingUrgencyCTA
 * (the compact dark variant) and skip this.
 */
export function UrgencyBlock({
  headline = siteConfig.bookingCTA?.headline,
  body = siteConfig.bookingCTA?.body,
  ctaLabel = siteConfig.bookingCTA?.ctaLabel ?? "Inquire Today",
  ctaHref = siteConfig.bookingCTA?.ctaHref ?? "#contact",
}: UrgencyBlockProps = {}) {
  if (!headline || !body) return null;

  return (
    <section className="py-[var(--space-section-y)] px-[var(--space-section-x)] bg-(--color-accent)">
      <div className="max-w-2xl mx-auto text-center flex flex-col gap-6">
        <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight text-(--color-ink)">
          {headline}
        </h2>
        <p className="text-lead leading-relaxed text-(--color-ink)">{body}</p>
        <div>
          <a
            href={ctaHref}
            className="inline-flex items-center justify-center tracking-widest uppercase text-xs font-medium bg-white text-(--color-ink) px-8 py-4 hover:bg-(--color-ink) hover:text-white transition-colors duration-300"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
