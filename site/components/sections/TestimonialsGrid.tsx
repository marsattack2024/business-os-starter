import { carouselTestimonials as DEFAULT_GRID_TESTIMONIALS } from "@/lib/content.config";
import type { CarouselTestimonial } from "./types";

export { DEFAULT_GRID_TESTIMONIALS };
export type GridTestimonial = CarouselTestimonial;

export interface TestimonialsGridProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  testimonials?: CarouselTestimonial[];
}

/**
 * Flat-grid testimonials variant (3 columns desktop, 2 tablet, 1 mobile).
 * Each card: quote + 5 stars + name + detail. Alternative layout to
 * TestimonialCards (1-up carousel) and TestimonialsCarousel (dark 3-up).
 *
 * Shares CarouselTestimonial shape with TestimonialsCarousel — same source
 * array in content.config. Forks can pass their own testimonials prop for
 * grid-only content.
 */
export function TestimonialsGrid({
  eyebrow = "Client Love",
  headline = (
    <>
      Don&apos;t Take My Word <em className="italic">For It</em>
    </>
  ),
  testimonials = DEFAULT_GRID_TESTIMONIALS,
}: TestimonialsGridProps = {}) {
  return (
    <section className="py-[var(--space-section-y)] px-[var(--space-section-x)] bg-(--color-cream)">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="text-center flex flex-col gap-4">
          <span className="text-eyebrow tracking-widest uppercase text-(--color-accent-text)">
            {eyebrow}
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight text-(--color-ink)">
            {headline}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name + t.detail}
              className="flex flex-col gap-4 border border-(--color-border) p-6"
            >
              <div className="flex gap-1" role="img" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-(--color-accent-text) text-sm">
                    &#9733;
                  </span>
                ))}
              </div>
              <p className="text-body leading-relaxed text-(--color-muted) italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-auto">
                <p className="text-sm font-medium text-(--color-ink)">{t.name}</p>
                <p className="text-xs tracking-widest uppercase text-(--color-muted)">
                  {t.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
