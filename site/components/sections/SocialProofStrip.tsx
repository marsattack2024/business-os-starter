import { socialProofStats as DEFAULT_STATS } from "@/lib/content.config";
import type { SocialProofStat } from "./types";

export interface SocialProofStripProps {
  stats?: SocialProofStat[];
}

export function SocialProofStrip({ stats = DEFAULT_STATS }: SocialProofStripProps = {}) {
  // No verified proof yet, no band. An empty strip is a layout gap; a strip of
  // inherited template numbers is a false claim. See lib/content.config.ts.
  if (stats.length === 0) return null;
  return (
    <section className="bg-(--color-ink) py-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="font-serif text-2xl md:text-3xl text-(--color-accent-text)">
              {stat.value}
            </span>
            <span className="text-eyebrow tracking-widest uppercase text-(--color-cream)/60">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
