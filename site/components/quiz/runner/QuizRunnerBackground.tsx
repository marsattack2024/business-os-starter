"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { QuizBackground } from "@/lib/quiz/types";

interface QuizRunnerBackgroundProps {
  background: QuizBackground;
  /** Paint the opaque base color behind the photo. True for the popup (it covers
   *  the page behind the modal). False on the standalone /quiz route, where a
   *  priority server backdrop already sits behind — so a base here would only
   *  flash a flat color ("beige square") over it before the photo paints. */
  solidBase?: boolean;
}

// Full-bleed photo backdrop for the runner — effectively the quiz LCP, so it
// loads with `priority` and paints at its configured opacity immediately, with NO
// load-gated fade. The previous fade-in-on-`onLoad` left a flat base color
// "sitting there" while the photo loaded: worst on desktop (larger image) and on
// cached loads, where `onLoad` can fire before React attaches and the fade sticks
// at opacity 0 so only the base color ever shows. `priority` makes the photo land
// fast; the base color stays only as the sub-frame fallback before it decodes.
// Overlay + image can differ between desktop and mobile so a quiz can be light on
// desktop and dark on a phone.
export function QuizRunnerBackground({ background, solidBase = true }: QuizRunnerBackgroundProps) {
  // Initialize from the real viewport so the correct image shows on first paint
  // (no desktop→mobile image swap flash); the resize effect keeps it in sync.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const imageSrc =
    isMobile && background.imageSrcMobile ? background.imageSrcMobile : background.imageSrc;

  if (!background.imageSrc) return null;

  const focalX = isMobile
    ? background.bgFocalXMobile ?? 50
    : background.bgFocalXDesktop ?? 50;
  const focalY = isMobile
    ? background.bgFocalYMobile ?? 50
    : background.bgFocalYDesktop ?? 50;
  const opacity = background.opacity ?? 0.85;
  const overlayStrength =
    isMobile && background.overlayStrengthMobile != null
      ? background.overlayStrengthMobile
      : background.overlayStrength ?? -45;
  const isDarkOverlay = overlayStrength < 0;
  const overlayColor =
    (isMobile && background.overlayColorMobile) || background.overlayColor;
  const baseColor = overlayColor ?? (isDarkOverlay ? "0, 0, 0" : "255, 255, 255");

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        solidBase ? (isDarkOverlay ? "bg-black" : "bg-(--color-cream)") : ""
      }`}
      aria-hidden="true"
    >
      <Image
        src={imageSrc}
        alt="Studio session backdrop"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: `${focalX}% ${focalY}%`, opacity }}
      />
      {overlayStrength !== 0 &&
        (() => {
          const a = Math.min(Math.abs(overlayStrength) / 100, 1);
          if (background.gradientOverlay) {
            // Denser at the title + CTA ends, lighter mid so the photo reads
            // through while long text stays legible.
            const hi = Math.min(a + 0.12, 1);
            const lo = Math.max(a - 0.02, 0);
            return (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(${baseColor}, ${hi}) 0%, rgba(${baseColor}, ${lo}) 46%, rgba(${baseColor}, ${hi}) 100%)`,
                }}
              />
            );
          }
          return (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgb(${baseColor})`, opacity: a }}
            />
          );
        })()}
    </div>
  );
}
