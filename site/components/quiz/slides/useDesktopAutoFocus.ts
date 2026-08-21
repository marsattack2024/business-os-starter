"use client";

import { useState } from "react";

/**
 * autoFocus on an input pops the on-screen keyboard on mobile/tablet, which
 * covers the slide and disrupts the flow. Gate it to desktop (>=768px) so only
 * pointer users get the focus convenience.
 *
 * The quiz renders entirely client-side (the popup is mount-gated; /quiz is
 * hydration-gated), so `window` exists on first paint — a lazy initializer reads
 * the real viewport once with no effect, no cascading render, and no SSR flash.
 */
export function useDesktopAutoFocus(): boolean {
  const [shouldAutoFocus] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );
  return shouldAutoFocus;
}
