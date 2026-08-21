"use client";

import { useEffect } from "react";
import { captureAttributionFromUrl } from "@/lib/contact-attribution";

/**
 * Captures ad-click attribution (gclid, fbclid, ttclid, msclkid, gbraid,
 * wbraid, li_fat_id) and UTM params into first-party cookies on every
 * page load. Read back on form submission via getStoredAttribution() and
 * threaded to the CRM as attribution source.
 *
 * Renders nothing. Cheap: one effect on mount.
 *
 * Mount once in the root layout — it's a no-op on SSR (typeof window
 * check inside captureAttributionFromUrl).
 */
export function AttributionTracker() {
  useEffect(() => {
    captureAttributionFromUrl();
  }, []);

  return null;
}
