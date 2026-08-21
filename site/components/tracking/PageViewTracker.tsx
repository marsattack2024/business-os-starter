"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { createTrackingEventId, pushGtmEvent } from "@/lib/tracking/gtm";
import {
  LEAD_EVENT_PARAM,
  consumePendingLeadConversion,
  pushSubmittedFormConversion,
} from "@/lib/tracking/lead-conversions";

function pagePathWithSearch(pathname: string, searchParamsString: string): string {
  return searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
}

function pageLocation(pathname: string, searchParamsString: string): string {
  return `${window.location.origin}${pagePathWithSearch(pathname, searchParamsString)}`;
}

function trackingSearchParamsString(searchParamsString: string): string {
  const params = new URLSearchParams(searchParamsString);
  params.delete(LEAD_EVENT_PARAM);
  return params.toString();
}

function conversionEventForPath(pathname: string): "submitted_form" | "scheduled_call" | null {
  const normalized = pathname.toLowerCase();
  if (
    normalized.includes("schedule-complete") ||
    normalized.includes("schedule-confirmed") ||
    normalized.includes("booking-confirmed") ||
    normalized.includes("appointment-confirmed") ||
    normalized.includes("scheduled-call-ty")
  ) {
    return "scheduled_call";
  }

  if (normalized.includes("thank-you")) {
    return "submitted_form";
  }

  return null;
}

function tryPushLeadConversion(
  leadEventId: string | null,
  pageData: {
    page_path: string;
    page_location: string;
    event_source_url: string;
    conversion_source: string;
  }
): boolean {
  if (!leadEventId) return false;

  const pending = consumePendingLeadConversion(leadEventId);
  if (!pending) return false;

  pushSubmittedFormConversion(pending, pageData);
  return true;
}

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const isFirstMount = useRef(true);
  const trackedConversions = useRef<Set<string>>(new Set());

  useEffect(() => {
    const trackingSearchParams = trackingSearchParamsString(searchParamsString);
    const currentPagePath = pagePathWithSearch(pathname, trackingSearchParams);
    const currentPageLocation = pageLocation(pathname, trackingSearchParams);
    const leadEventId = new URLSearchParams(searchParamsString).get(LEAD_EVENT_PARAM);
    const isSubmittedFormPath = conversionEventForPath(pathname) === "submitted_form";

    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (isSubmittedFormPath) {
        tryPushLeadConversion(leadEventId, {
          page_path: currentPagePath,
          page_location: currentPageLocation,
          event_source_url: currentPageLocation,
          conversion_source: "initial_lead_event_redirect",
        });
      }
      return;
    }

    const pageEventId = createTrackingEventId();

    pushGtmEvent("app_page_view", {
      event_id: pageEventId,
      page_view_source: "react_app_router",
      page_path: currentPagePath,
      page_location: currentPageLocation,
      event_source_url: currentPageLocation,
      page_title: document.title,
    });

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView", {}, { eventID: pageEventId });
    }

    const conversionEvent = conversionEventForPath(pathname);
    if (!conversionEvent) return;

    if (conversionEvent === "submitted_form") {
      tryPushLeadConversion(leadEventId, {
        page_path: currentPagePath,
        page_location: currentPageLocation,
        event_source_url: currentPageLocation,
        conversion_source: "spa_lead_event_redirect",
      });
      return;
    }

    const conversionKey = `${conversionEvent}:${currentPagePath}`;
    if (trackedConversions.current.has(conversionKey)) return;
    trackedConversions.current.add(conversionKey);

    pushGtmEvent(conversionEvent, {
      page_path: currentPagePath,
      page_location: currentPageLocation,
      event_source_url: currentPageLocation,
      conversion_source: "spa_route_change",
    });
  }, [pathname, searchParamsString]);

  return null;
}
