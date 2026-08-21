"use client";

import { normalizePhoneStrict } from "@/lib/phone";
import { createTrackingEventId, pushGtmEvent } from "@/lib/tracking/gtm";

export const LEAD_EVENT_PARAM = "lead_event";

const PENDING_PREFIX = "p2p:pending-lead:";
const CONSUMED_PREFIX = "p2p:consumed-lead:";
const LEAD_EVENT_TTL_MS = 30 * 60 * 1000;

type FormName = "contact_form" | "quiz";
type LeadType = "inquiry" | "quiz_lead";

export interface StageLeadConversionInput {
  eventId?: string;
  formName: FormName | string;
  leadType: LeadType | string;
  sourcePage: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface PendingLeadConversion {
  event_id: string;
  created_at: number;
  form_name: string;
  lead_type: string;
  source_page: string;
  user_data: {
    email_address?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    address?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(" ") };
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function storageKey(prefix: string, eventId: string): string {
  return `${prefix}${eventId}`;
}

function isFresh(createdAt: number, now = Date.now()): boolean {
  return Number.isFinite(createdAt) && now - createdAt <= LEAD_EVENT_TTL_MS;
}

function cleanupLeadStorage(store: Storage, now = Date.now()): void {
  for (let i = store.length - 1; i >= 0; i -= 1) {
    const key = store.key(i);
    if (!key || (!key.startsWith(PENDING_PREFIX) && !key.startsWith(CONSUMED_PREFIX))) {
      continue;
    }

    const raw = store.getItem(key);
    if (!raw) {
      store.removeItem(key);
      continue;
    }

    try {
      const parsed = key.startsWith(PENDING_PREFIX)
        ? (JSON.parse(raw) as { created_at?: number })
        : { created_at: Number(raw) };
      if (!isFresh(Number(parsed.created_at), now)) store.removeItem(key);
    } catch {
      store.removeItem(key);
    }
  }
}

export function buildPendingLeadConversion(
  input: StageLeadConversionInput,
  now = Date.now()
): PendingLeadConversion {
  const eventId = input.eventId || createTrackingEventId();
  const fallbackName = splitName(clean(input.name));
  const firstName = lower(input.firstName) || lower(fallbackName.firstName);
  const lastName = lower(input.lastName) || lower(fallbackName.lastName);
  const phoneNumber = normalizePhoneStrict(input.phone);

  const userData: PendingLeadConversion["user_data"] = {};
  const email = lower(input.email);
  if (email) userData.email_address = email;
  if (phoneNumber) userData.phone_number = phoneNumber;
  if (firstName) userData.first_name = firstName;
  if (lastName) userData.last_name = lastName;
  if (firstName || lastName) {
    userData.address = {};
    if (firstName) userData.address.first_name = firstName;
    if (lastName) userData.address.last_name = lastName;
  }

  return {
    event_id: eventId,
    created_at: now,
    form_name: clean(input.formName),
    lead_type: clean(input.leadType),
    source_page: clean(input.sourcePage),
    user_data: userData,
  };
}

export function stagePendingLeadConversion(input: StageLeadConversionInput): string {
  const pending = buildPendingLeadConversion(input);
  const store = storage();
  if (store) {
    try {
      cleanupLeadStorage(store);
      store.setItem(storageKey(PENDING_PREFIX, pending.event_id), JSON.stringify(pending));
    } catch {
      // Storage can be disabled; the server still receives the opaque event id.
    }
  }
  return pending.event_id;
}

export function stagePendingLeadConversionFromForm(
  form: HTMLFormElement,
  input: Omit<StageLeadConversionInput, "name" | "firstName" | "lastName" | "email" | "phone">
): string {
  const formData = new FormData(form);
  return stagePendingLeadConversion({
    ...input,
    name: clean(formData.get("name")),
    firstName: clean(formData.get("firstName")),
    lastName: clean(formData.get("lastName")),
    email: clean(formData.get("email")),
    phone: clean(formData.get("phone")),
  });
}

export function consumePendingLeadConversion(eventId: string): PendingLeadConversion | null {
  const cleanEventId = clean(eventId);
  if (!cleanEventId) return null;

  const store = storage();
  if (!store) return null;

  try {
    cleanupLeadStorage(store);
    if (store.getItem(storageKey(CONSUMED_PREFIX, cleanEventId))) return null;

    const key = storageKey(PENDING_PREFIX, cleanEventId);
    const raw = store.getItem(key);
    if (!raw) return null;

    const pending = JSON.parse(raw) as PendingLeadConversion;
    if (pending.event_id !== cleanEventId || !isFresh(Number(pending.created_at))) {
      store.removeItem(key);
      return null;
    }

    store.removeItem(key);
    store.setItem(storageKey(CONSUMED_PREFIX, cleanEventId), String(Date.now()));
    return pending;
  } catch {
    return null;
  }
}

export function pushSubmittedFormConversion(
  pending: PendingLeadConversion,
  pageData: {
    page_path: string;
    page_location: string;
    event_source_url: string;
    conversion_source: string;
  }
): string {
  return pushGtmEvent("submitted_form", {
    event_id: pending.event_id,
    form_name: pending.form_name,
    lead_type: pending.lead_type,
    source_page: pending.source_page,
    user_data: pending.user_data,
    ...pageData,
  });
}

export function hrefWithLeadEvent(href: string, eventId: string | null | undefined): string {
  const cleanEventId = clean(eventId);
  if (!cleanEventId) return href;

  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://example.com";
    const url = new URL(href, base);
    url.searchParams.set(LEAD_EVENT_PARAM, cleanEventId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const separator = href.includes("?") ? "&" : "?";
    return `${href}${separator}${LEAD_EVENT_PARAM}=${encodeURIComponent(cleanEventId)}`;
  }
}
