"use client";

import { sendGAEvent, sendGTMEvent } from "@next/third-parties/google";
import { siteConfig } from "@/lib/site.config";

/**
 * Route a quiz analytics event to whichever tag layer the site ACTUALLY loads.
 *
 * The root layout mounts GoogleTagManager when a GTM id is set and only mounts
 * GoogleAnalytics when there's a GA id AND no GTM ("most setups load GA via GTM").
 * `sendGAEvent` reads a dataLayer name set only by the <GoogleAnalytics> component,
 * so on a GTM-only site it no-ops and the whole quiz funnel records nothing.
 * Here we detect the active layer and push a GTM-native event object via
 * `sendGTMEvent` (GTM forwards it to GA4), falling back to `sendGAEvent` only on a
 * GA-only site.
 */
export function trackQuizEvent(name: string, params: Record<string, unknown> = {}): void {
  // Telemetry must never break the UI (these fire in effects + unmount cleanup),
  // so a throwing/absent tag layer is swallowed. When no tag is mounted (dev, or a
  // non-prod deploy), the underlying call is itself a harmless no-op.
  try {
    const gtmId = siteConfig.analytics?.gtmId || process.env.NEXT_PUBLIC_GTM_ID;
    if (gtmId) {
      sendGTMEvent({ event: name, ...params });
    } else {
      sendGAEvent("event", name, params);
    }
  } catch {
    /* analytics is best-effort — never let it surface as a render/effect error */
  }
}
