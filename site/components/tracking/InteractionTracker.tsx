"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pushGtmEvent } from "@/lib/tracking/gtm";

const CTA_TEXT = /\b(apply|book|consult|consultation|contact|inquire|inquiry|quiz|start|schedule)\b/i;

function isTrackedCta(element: HTMLElement, href: string | null, label: string): boolean {
  if (element.dataset.gtmTrack === "cta") return true;
  if (href && /(?:^|[/#?])contact\b|#contact\b|quiz|40-over-40/i.test(href)) return true;
  if (element instanceof HTMLButtonElement && element.type === "submit") return true;
  return CTA_TEXT.test(label);
}

export function InteractionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>("a,button,[role='button']");
      if (!element) return;

      const link = element instanceof HTMLAnchorElement ? element : element.closest("a");
      const href = link?.getAttribute("href") ?? null;

      // Phone and email links are handled by GTM's native link-click triggers so
      // they can remain conversion events instead of lower-value CTA clicks.
      if (href?.startsWith("tel:") || href?.startsWith("mailto:")) return;

      const label = (element.getAttribute("aria-label") || element.textContent || "")
        .replace(/\s+/g, " ")
        .trim();

      if (!isTrackedCta(element, href, label)) return;

      pushGtmEvent("cta_click", {
        cta_label: label.slice(0, 120),
        cta_href: href,
        page_path: pathname,
        page_location: window.location.href,
        element_type: element.tagName.toLowerCase(),
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname]);

  return null;
}
