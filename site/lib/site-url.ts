import { siteConfig } from "@/lib/site.config";

export function getCanonicalBaseUrl(): string {
  return siteConfig.seo.baseUrl.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = getCanonicalBaseUrl();
  if (!path || path === "/") return `${base}/`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hasPlaceholderValue(value: unknown): boolean {
  return typeof value === "string" && /\[[^\]]+\]|yourdomain\.com|555\D*000\D*0000/i.test(value);
}

export function isRealPublicValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !hasPlaceholderValue(value);
}
