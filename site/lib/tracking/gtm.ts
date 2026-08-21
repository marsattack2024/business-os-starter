"use client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type GtmEventPayload = Record<string, unknown>;

export function createTrackingEventId(): string {
  return `eid.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;
}

export function pushGtmEvent(event: string, payload: GtmEventPayload = {}): string {
  if (typeof window === "undefined") return "";

  const eventId =
    typeof payload.event_id === "string" && payload.event_id.length > 0
      ? payload.event_id
      : createTrackingEventId();

  const target = window as Window & { dataLayer?: GtmEventPayload[] };
  target.dataLayer = target.dataLayer || [];
  target.dataLayer.push({ event, event_id: eventId, ...payload });

  return eventId;
}
