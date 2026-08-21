import Image from "next/image";

/**
 * Primes the next/image cache for the quiz's statement photos the moment the
 * runner mounts, so the ExplanationSlide never shows its bare loading-color slot
 * while the photo fetches. The slot is worst on desktop, where the 3:2 box
 * requests a larger srcset candidate — by the time the visitor reads the welcome
 * + a question or two, these are already cached, so the explanation photo paints
 * instantly.
 *
 * Renders the SAME `sizes` the ExplanationSlide uses so the browser caches the
 * exact variant the slide will request (a different `sizes` would fetch a
 * different srcset entry and defeat the preload). Visually hidden + `aria-hidden`
 * (it is plumbing, not content — never announced or shown). Uses `loading="eager"`
 * (not `priority`) so it fetches immediately but at NORMAL priority, priming the
 * cache without stealing bandwidth from the quiz's actual LCP (the backdrop).
 */
export function QuizImagePreloader({ srcs }: { srcs: string[] }) {
  if (srcs.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-50 h-px w-px overflow-hidden opacity-0"
    >
      {srcs.map((src) => (
        <span key={src} className="relative block h-[400px] w-[600px]">
          <Image
            src={src}
            alt="Quiz statement photograph"
            fill
            loading="eager"
            sizes="(max-width:640px) 100vw, 600px"
          />
        </span>
      ))}
    </div>
  );
}
