const LEAD_EVENT_ID_RE = /^eid\.\d+\.\d+$/;

const THANK_YOU_BY_SOURCE: Record<string, string> = {};

export function thankYouForLeadSource(sourcePage: string | undefined): string {
  const clean = (sourcePage ?? "").split(/[?#]/)[0].replace(/\/+$/, "");
  return THANK_YOU_BY_SOURCE[clean] ?? "/thank-you";
}

export function hrefWithValidatedLeadEvent(path: string, rawLeadEventId: unknown): string {
  const leadEventId =
    typeof rawLeadEventId === "string" && LEAD_EVENT_ID_RE.test(rawLeadEventId)
      ? rawLeadEventId
      : "";
  if (!leadEventId) return path;

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lead_event=${encodeURIComponent(leadEventId)}`;
}

export function confirmedLeadRedirect(sourcePage: string | undefined, rawLeadEventId: unknown): string {
  return hrefWithValidatedLeadEvent(thankYouForLeadSource(sourcePage), rawLeadEventId);
}
