import { empathyBody as DEFAULT_BRIEF_BODY } from "@/lib/content.config";

export interface EmpathyPullQuote {
  text: string;
  attribution?: string;
}

export interface EmpathyBlockProps {
  /**
   * "brief"     = 2-paragraph centered block (default; current behavior).
   * "narrative" = long-form personal letter — left-aligned, multiple
   *               paragraphs, optional pull quote + signature. Use for
   *               sites that want a high-touch "letter from the photographer"
   *               moment (boudoir, milestone, wedding).
   */
  variant?: "brief" | "narrative";
  /** "dark" renders the block on ink — use to break up long cream runs. */
  tone?: "cream" | "dark";
  headline?: React.ReactNode;
  /**
   * Body paragraphs. Each string becomes one <p>. Defaults to the brief
   * 2-paragraph copy if not provided.
   */
  body?: string[];
  /** Optional pull quote (rendered as a blockquote with accent left-border). Narrative only. */
  pullQuote?: EmpathyPullQuote;
  /** Optional signature line (e.g. "— Molly"). Narrative only. */
  signature?: string;
}

const DEFAULT_BRIEF_HEADLINE = (
  <>
    You hate how you look in photos.
    <br />
    <em className="italic">I hear that all the time.</em>
  </>
);

export function EmpathyBlock({
  variant = "brief",
  tone = "cream",
  headline,
  body,
  pullQuote,
  signature,
}: EmpathyBlockProps = {}) {
  const isNarrative = variant === "narrative";
  const dark = tone === "dark";
  const resolvedHeadline = headline ?? DEFAULT_BRIEF_HEADLINE;
  const resolvedBody = body ?? DEFAULT_BRIEF_BODY;

  return (
    <section
      className={`py-[var(--space-section-y)] px-[var(--space-section-x)] ${
        dark ? "bg-(--color-ink)" : "bg-(--color-cream)"
      }`}
    >
      <div
        className={`max-w-2xl mx-auto flex flex-col gap-${isNarrative ? "7" : "6"} ${isNarrative ? "" : "text-center"}`}
      >
        <h2
          className={`font-serif text-4xl md:text-5xl font-normal leading-tight ${
            dark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"
          }`}
        >
          {resolvedHeadline}
        </h2>

        {resolvedBody.map((paragraph, i) => (
          <p
            key={i}
            className={`text-body ${dark ? "text-(--color-on-dark-secondary)" : "text-(--color-muted)"}`}
          >
            {paragraph}
          </p>
        ))}

        {isNarrative && pullQuote && (
          <blockquote className="border-l-2 border-(--color-accent) pl-6 py-1 my-1">
            <p
              className={`font-serif text-xl md:text-2xl italic leading-relaxed ${
                dark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"
              }`}
            >
              &ldquo;{pullQuote.text}&rdquo;
            </p>
            {pullQuote.attribution && (
              <cite
                className={`text-eyebrow tracking-widest uppercase mt-3 block not-italic ${
                  dark ? "text-(--color-on-dark-muted)" : "text-(--color-muted)"
                }`}
              >
               – {pullQuote.attribution}
              </cite>
            )}
          </blockquote>
        )}

        {isNarrative && signature && (
          <p
            className={`text-body font-medium ${dark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"}`}
          >
            {signature}
          </p>
        )}
      </div>
    </section>
  );
}
