"use client";
import { useState } from "react";
import { m } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { motionEasings } from "@/lib/motion.config";
import { carouselTestimonials as DEFAULT_CAROUSEL_TESTIMONIALS } from "@/lib/content.config";
import type { CarouselTestimonial } from "./types";

export { DEFAULT_CAROUSEL_TESTIMONIALS };
export type { CarouselTestimonial };

export interface TestimonialsCarouselProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  testimonials?: CarouselTestimonial[];
}

export function TestimonialsCarousel({
  eyebrow = "Lovely Words",
  headline = (
    <>
      The Experience They <em className="italic">Talk About</em>
    </>
  ),
  testimonials = DEFAULT_CAROUSEL_TESTIMONIALS,
}: TestimonialsCarouselProps = {}) {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const visible = [
    testimonials[current % total],
    testimonials[(current + 1) % total],
    testimonials[(current + 2) % total],
  ];

  return (
    <section className="bg-(--color-ink) py-[var(--space-section-y)] px-[var(--space-section-x)] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="text-center mb-[var(--space-heading-body-gap)]"
        >
          <span className="text-eyebrow uppercase tracking-widest text-(--color-on-dark-secondary)">
            {eyebrow}
          </span>
          <h2 className="font-serif text-4xl font-normal text-(--color-cream) mt-[var(--space-heading-eyebrow-gap)] md:text-5xl">
            {headline}
          </h2>
        </m.div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {visible.map((t, i) => (
            <m.div
              key={`${current}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: motionEasings.out }}
              className={`flex flex-col gap-5 p-8 border border-(--color-card-on-dark-border) bg-(--color-card-on-dark-bg) ${
                i > 0 ? "hidden md:flex" : "flex"
              }`}
            >
              <span className="font-serif text-5xl text-(--color-accent-text) opacity-40 leading-none">
                &ldquo;
              </span>
              <blockquote className="font-serif text-base italic text-(--color-cream) leading-relaxed flex-1">
                {t.quote}
              </blockquote>
              <div className="border-t border-(--color-card-on-dark-border) pt-4">
                <p className="text-sm font-medium text-(--color-cream)">{t.name}</p>
                <p className="text-xs tracking-widest uppercase text-(--color-on-dark-secondary) mt-0.5">
                  {t.detail}
                </p>
              </div>
            </m.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="w-11 h-11 border border-(--color-border-on-dark) text-(--color-cream) hover:border-(--color-border-on-dark-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) transition-colors flex items-center justify-center"
          >
            ←
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text)"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "bg-(--color-accent) w-4"
                      : "bg-(--color-indicator-inactive) w-1.5"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="w-11 h-11 border border-(--color-border-on-dark) text-(--color-cream) hover:border-(--color-border-on-dark-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) transition-colors flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
