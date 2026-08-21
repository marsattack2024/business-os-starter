import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { processSteps as DEFAULT_PROCESS_STEPS } from "@/lib/content.config";
import type { ProcessStep } from "./types";

export { DEFAULT_PROCESS_STEPS };
export type { ProcessStep };

export interface ProcessStepsProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  subheading?: string;
  steps?: ProcessStep[];
  /** "dark" renders on ink — use to break up long cream runs. */
  tone?: "cream" | "dark";
}

export function ProcessSteps({
  eyebrow = "How It Works",
  headline = (
    <>
      Here&apos;s What Happens <em className="italic">After You Reach Out</em>
    </>
  ),
  subheading = "The whole experience is designed to feel simple and guided from the very first message.",
  steps = DEFAULT_PROCESS_STEPS,
  tone = "cream",
}: ProcessStepsProps = {}) {
  const dark = tone === "dark";
  return (
    <section
      className={`py-[var(--space-section-y)] px-[var(--space-section-x)] border-t ${
        dark
          ? "bg-(--color-ink) border-(--color-card-on-dark-border)"
          : "bg-(--color-cream) border-(--color-border)"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll className="text-center mb-16">
          <span
            className={`text-eyebrow uppercase tracking-widest ${
              dark ? "text-(--color-accent)" : "text-(--color-muted)"
            }`}
          >
            {eyebrow}
          </span>
          <h2
            className={`font-serif text-4xl font-normal mt-[var(--space-heading-eyebrow-gap)] leading-tight md:text-5xl ${
              dark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"
            }`}
          >
            {headline}
          </h2>
          {subheading && (
            <p
              className={`mt-[var(--space-subheading-gap)] text-lead max-w-md mx-auto ${
                dark ? "text-(--color-on-dark-secondary)" : "text-(--color-muted)"
              }`}
            >
              {subheading}
            </p>
          )}
        </AnimateOnScroll>

        <div
          className={`grid md:grid-cols-3 gap-0 md:divide-x ${
            dark ? "md:divide-(--color-card-on-dark-border)" : "md:divide-(--color-border)"
          }`}
        >
          {steps.map((step, i) => (
            <AnimateOnScroll
              key={step.number}
              delay={i * 120}
              className="flex flex-col gap-5 px-8 py-10 first:pl-0 last:pr-0"
            >
              <span
                className={`font-serif text-7xl leading-none ${
                  dark ? "text-(--color-accent) opacity-30" : "text-(--color-accent-text) opacity-20"
                }`}
              >
                {step.number}
              </span>
              <div className={`w-8 h-px ${dark ? "bg-(--color-card-on-dark-border)" : "bg-(--color-border)"}`} />
              <h3
                className={`font-serif text-2xl font-normal ${
                  dark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"
                }`}
              >
                {step.title}
              </h3>
              <p className={`text-body ${dark ? "text-(--color-on-dark-secondary)" : "text-(--color-muted)"}`}>
                {step.body}
              </p>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
