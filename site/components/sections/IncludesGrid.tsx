import { includesItems as DEFAULT_INCLUDES_ITEMS } from "@/lib/content.config";

export { DEFAULT_INCLUDES_ITEMS };

export interface IncludesGridProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  items?: string[];
  /** "dark" renders on ink — use to break up long cream runs. */
  tone?: "cream" | "dark";
}

export function IncludesGrid({
  eyebrow = "What's Included",
  headline = (
    <>
      Everything in <em className="italic">Every Session</em>
    </>
  ),
  items = DEFAULT_INCLUDES_ITEMS,
  tone = "cream",
}: IncludesGridProps = {}) {
  const dark = tone === "dark";
  return (
    <section
      id="services"
      className={`py-[var(--space-section-y)] px-[var(--space-section-x)] ${
        dark ? "bg-(--color-ink)" : "bg-(--color-cream)"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="text-center flex flex-col gap-4">
          <span
            className={`text-eyebrow tracking-widest uppercase ${
              dark ? "text-(--color-accent)" : "text-(--color-accent-text)"
            }`}
          >
            {eyebrow}
          </span>
          <h2
            className={`font-serif text-4xl md:text-5xl font-normal leading-tight ${
              dark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"
            }`}
          >
            {headline}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item}
              className={`flex items-center gap-3 border px-5 py-4 ${
                dark ? "border-(--color-card-on-dark-border)" : "border-(--color-border)"
              }`}
            >
              <span
                className={`text-lg ${dark ? "text-(--color-accent)" : "text-(--color-accent-text)"}`}
                aria-hidden="true"
              >
                &#10003;
              </span>
              <span className={`text-body ${dark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"}`}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
