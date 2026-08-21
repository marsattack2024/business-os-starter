"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import { motionDurations } from "@/lib/motion.config";
import { Button } from "@/components/ui";
import { faqs as DEFAULT_FAQS } from "@/lib/content.config";
import type { FAQ } from "./types";

export { DEFAULT_FAQS };
export type { FAQ };

function FAQItem({ q, a }: FAQ) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <m.div variants={fadeUp} className="border-b border-(--color-border)">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-cream)"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="font-serif text-lg font-normal text-(--color-ink) group-hover:text-(--color-accent-text) transition-colors">
          {q}
        </span>
        <m.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: motionDurations.xs }}
          className="text-2xl leading-none text-(--color-muted) shrink-0"
          aria-hidden="true"
        >
          +
        </m.span>
      </button>

      {/*
        The answer is ALWAYS in the DOM and collapsed with a CSS grid row,
        rather than conditionally mounted.

        Mounting on expand kept every answer out of the server-rendered HTML,
        so the FAQ copy — the longest-tail, most question-shaped text on the
        page — reached crawlers only through FAQPage JSON-LD. Google renders
        JS and would get there; the AI crawlers these studios want citations
        from largely do not.

        The 0fr → 1fr transition is an inline style on the SSR markup, so the
        panel is already collapsed on first paint: no flash of open answers
        before hydration, which a framer mount animation could not guarantee.
      */}
      <div
        id={panelId}
        role="region"
        aria-hidden={!open}
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none"
        // minmax(0, Nfr), not a bare `Nfr`: a bare fr track is `minmax(auto, Nfr)`,
        // and that auto minimum refuses to shrink below the answer's min-content
        // height, so `0fr` stayed fully open. Pinning the minimum to 0 is what
        // actually lets the row collapse.
        style={{
          gridTemplateRows: open ? "minmax(0, 1fr)" : "minmax(0, 0fr)",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="text-body text-(--color-muted) pb-6 max-w-2xl">
            {a}
          </p>
        </div>
      </div>
    </m.div>
  );
}

export interface FAQSectionProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  faqs?: FAQ[];
  footerText?: string;
  footerCtaLabel?: string;
  footerCtaHref?: string;
  relatedLinks?: ReadonlyArray<{ label: string; href: string }>;
  /**
   * Continue a cream contact chapter: border-top + reduced top pad so FAQ is
   * not a third back-to-back cream “section start.”
   */
  continueFromAbove?: boolean;
}

export function FAQSection({
  eyebrow = "Got Questions",
  headline = (
    <>
      Frequently Asked <em className="italic">Questions</em>
    </>
  ),
  faqs = DEFAULT_FAQS,
  footerText = "Still have questions? Reach out. I’m happy to help.",
  footerCtaLabel = "Inquire",
  footerCtaHref = "#contact",
  /** Empty by default — home/footer already own site nav. Pass links only on thin pages. */
  relatedLinks = [],
  continueFromAbove = false,
}: FAQSectionProps = {}) {
  return (
    <section
      className={`bg-(--color-cream) px-[var(--space-section-x)] ${
        continueFromAbove
          ? "border-t border-(--color-border) pb-[var(--space-section-y)] pt-12 md:pt-16"
          : "py-[var(--space-section-y)]"
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="text-center mb-[var(--space-heading-body-gap)]"
        >
          <span className="text-eyebrow uppercase tracking-widest text-(--color-muted)">
            {eyebrow}
          </span>
          <h2 className="font-serif text-4xl font-normal text-(--color-ink) mt-[var(--space-heading-eyebrow-gap)] md:text-5xl">
            {headline}
          </h2>
        </m.div>

        <m.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
        >
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </m.div>

        {relatedLinks && relatedLinks.length > 0 ? (
          <div className="mt-10 border-t border-(--color-border) pt-8">
            <p className="text-center text-[0.7rem] uppercase tracking-[0.28em] text-(--color-muted)">
              Galleries &amp; info
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3">
              {relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs uppercase tracking-[0.16em] text-(--color-ink) underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mt-12"
        >
          {footerText && (
            <p className="text-body text-(--color-muted) mb-4">{footerText}</p>
          )}
          {footerCtaLabel && footerCtaHref && (
            <Button variant="ghost" href={footerCtaHref}>{footerCtaLabel}</Button>
          )}
        </m.div>
      </div>
    </section>
  );
}
