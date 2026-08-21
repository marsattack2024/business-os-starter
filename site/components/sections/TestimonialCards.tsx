"use client";
import Image from "next/image";
import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { featuredTestimonials as DEFAULT_FEATURED_TESTIMONIALS } from "@/lib/content.config";
import type { FeaturedTestimonial } from "./types";

export { DEFAULT_FEATURED_TESTIMONIALS };
export type { FeaturedTestimonial };

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 justify-center" role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 text-(--color-accent-text)"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export interface TestimonialCardsProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  testimonials?: FeaturedTestimonial[];
}

export function TestimonialCards({
  eyebrow = "Client Love",
  headline = (
    <>
      Lovely Words. <em className="italic">Real Women.</em>
    </>
  ),
  testimonials = DEFAULT_FEATURED_TESTIMONIALS,
}: TestimonialCardsProps = {}) {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;
  const t = testimonials[current];

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <section className="bg-(--color-cream) py-[var(--space-section-y)] px-[var(--space-section-x)] border-t border-(--color-border)">
      <div className="max-w-3xl mx-auto">
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="text-center mb-16"
        >
          <span className="text-eyebrow uppercase tracking-widest text-(--color-muted)">
            {eyebrow}
          </span>
          <h2 className="font-serif text-3xl font-normal text-(--color-ink) mt-2 md:text-4xl">
            {headline}
          </h2>
        </m.div>

        <AnimatePresence mode="wait">
          <m.div
            key={current}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-(--color-border) bg-(--color-image-loading)">
              <Image
                src={t.photoSrc ?? "/placeholder/square.svg"}
                alt={`${t.name} headshot`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>

            <Stars count={t.stars ?? 5} />

            <blockquote className="font-serif text-xl md:text-2xl italic text-(--color-ink) leading-relaxed max-w-2xl">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="flex flex-col items-center gap-0.5 pt-2">
              <p className="text-sm font-medium text-(--color-ink)">{t.name}</p>
              <p className="text-xs tracking-widest uppercase text-(--color-muted)">
                {t.detail}
              </p>
            </div>
          </m.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="w-11 h-11 border border-(--color-border) text-(--color-ink) hover:border-(--color-ink) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) transition-colors flex items-center justify-center"
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
                      ? "bg-(--color-accent) w-6"
                      : "bg-(--color-border) w-1.5"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="w-11 h-11 border border-(--color-border) text-(--color-ink) hover:border-(--color-ink) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) transition-colors flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
