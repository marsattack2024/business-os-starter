export interface StickyBarProps {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Thin announcement strip — sticky at the top on desktop, scrolls away on mobile
 * (mobile real-estate is precious; a 32px pinned bar eats too much above-the-fold).
 * Toggle via siteConfig.announcement — omit the field entirely to remove the bar.
 */
export function StickyBar({ text, ctaLabel, ctaHref }: StickyBarProps) {
  return (
    <div className="relative md:sticky md:top-0 z-50 w-full bg-(--color-ink) py-2 px-[var(--space-section-x)] text-center">
      <p className="text-xs tracking-widest uppercase text-(--color-cream)">
        {text}
        {ctaLabel && ctaHref && (
          <>
            {" • "}
            <a
              href={ctaHref}
              className="underline hover:text-(--color-accent-text) transition-colors"
            >
              {ctaLabel}
            </a>
          </>
        )}
      </p>
    </div>
  );
}
