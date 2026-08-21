import { whyBookReasons as DEFAULT_WHY_BOOK_REASONS } from "@/lib/content.config";
import type { WhyBookReason } from "./types";

export { DEFAULT_WHY_BOOK_REASONS };
export type { WhyBookReason };

export interface WhyBookProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  reasons?: WhyBookReason[];
}

export function WhyBook({
  eyebrow = "Why Book With Me",
  headline = (
    <>
      Everything You Need. <em className="italic">Nothing You Don&apos;t.</em>
    </>
  ),
  reasons = DEFAULT_WHY_BOOK_REASONS,
}: WhyBookProps = {}) {
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
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="flex flex-col gap-3 border-t border-(--color-border) pt-6"
            >
              <h3 className="font-serif text-xl text-(--color-ink)">{reason.title}</h3>
              <p className="text-body leading-relaxed text-(--color-muted)">{reason.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
