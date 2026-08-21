import type { Metadata } from "next";
import Link from "next/link";
import { featuredTestimonials, socialProofStats } from "@/lib/content.config";
import { siteConfig } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "You're Booked",
  robots: { index: false, follow: false },
};

const nextSteps = [
  "Check your email for the confirmation and calendar details.",
  "Gather the questions, timing notes, and session ideas you want to talk through.",
  "Come as you are. The consultation is where the plan gets clear.",
];

export default function ScheduleComplete() {
  const quote = featuredTestimonials[0];
  const proof = socialProofStats.slice(0, 4);

  return (
    <main className="bg-(--color-cream) px-6 py-20 text-(--color-ink) md:py-28">
      <div className="mx-auto max-w-6xl">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-(--color-muted)">
            You&apos;re booked
          </p>
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[1] md:text-7xl">
            Your consultation with {siteConfig.brand.photographer ?? siteConfig.brand.name} is reserved.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-relaxed text-(--color-muted) md:text-base">
            This is the calm next step: a real conversation about what you want,
            what you are nervous about, and what needs to happen before the studio
            day feels easy.
          </p>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {nextSteps.map((step, index) => (
            <div key={step} className="border-t border-(--color-border) pt-5">
              <p className="text-xs font-medium uppercase tracking-widest text-(--color-accent-text)">
                0{index + 1}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                {step}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-16 border-y border-(--color-border) py-10">
          <div className="grid gap-9 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="grid gap-5 sm:grid-cols-2">
              {proof.map((stat) => (
                <div key={stat.label}>
                  <p className="font-serif text-3xl text-(--color-accent-text)">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-widest text-(--color-muted)">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <figure>
              <blockquote className="font-serif text-2xl italic leading-snug text-(--color-ink) md:text-3xl">
                &ldquo;{quote.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-xs font-medium uppercase tracking-widest text-(--color-muted)">
                {quote.name} - {quote.detail}
              </figcaption>
            </figure>
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-(--color-ink) px-7 py-4 text-xs font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-(--color-ink) hover:text-(--color-cream)"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
