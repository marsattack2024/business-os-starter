// lib/schema.ts
import { siteConfig } from "@/lib/site.config";
import { absoluteUrl, getCanonicalBaseUrl, isRealPublicValue } from "@/lib/site-url";

/** LocalBusiness schema — drives Google rich result on homepage.
 *  Defaults flow from siteConfig (single source of truth). Pass overrides
 *  at the call site only when a page needs to vary from the defaults. */
export function buildLocalBusinessSchema(overrides?: {
  phone?: string;
  city?: string;
  state?: string;
  priceRange?: string;
  description?: string;
}) {
  const url = getCanonicalBaseUrl();
  if (!isRealPublicValue(siteConfig.brand.name)) return null;
  const phone = overrides?.phone ?? siteConfig.brand.phone;
  const city = overrides?.city ?? siteConfig.brand.location?.city;
  const state = overrides?.state ?? siteConfig.brand.location?.state;
  const street = siteConfig.brand.location?.address;
  const zip = siteConfig.brand.location?.zip;
  const mapUrl = siteConfig.brand.location?.mapUrl;
  const email = siteConfig.brand.email;
  const serviceAreas = siteConfig.brand.serviceAreas ?? [];
  const hours = siteConfig.brand.hours ?? [];
  const reviews = siteConfig.brand.reviews;
  const geo = siteConfig.brand.location?.geo;
  // sameAs is how a search engine collapses scattered mentions into ONE entity.
  // The Google Business Profile place URL belongs here alongside the social
  // profiles: it is the single strongest identity signal a local business has,
  // and it is already trusted. It is also emitted as `hasMap`; the duplication
  // is intentional, because the two properties answer different questions
  // ("where is it" vs "who is it").
  const sameAs = [
    ...siteConfig.socials.map((s) => s.href),
    siteConfig.brand.location?.mapUrl ?? "",
  ].filter((h) => h && h !== "#");
  return {
    "@context": "https://schema.org",
    // PhotographyBusiness is the precise LocalBusiness subtype for a studio.
    "@type": ["PhotographyBusiness", "LocalBusiness"],
    // One canonical business node shared with Organization (#org) so WebSite.publisher resolves here.
    "@id": `${url}#org`,
    name: siteConfig.brand.name,
    url,
    description: overrides?.description ?? siteConfig.seo.description,
    // Prefer the Facebook-safe share photo when set; otherwise the generated
    // brand card. Never invent a missing static /og-default.jpg path.
    image: siteConfig.seo.defaultOgImage
      ? (siteConfig.seo.defaultOgImage.startsWith("http")
          ? siteConfig.seo.defaultOgImage
          : absoluteUrl(siteConfig.seo.defaultOgImage))
      : `${url}/opengraph-image`,
    ...(isRealPublicValue(phone) && { telephone: phone }),
    ...(isRealPublicValue(city) && {
      address: {
        "@type": "PostalAddress",
        ...(isRealPublicValue(street) && { streetAddress: street }),
        addressLocality: city,
        ...(isRealPublicValue(state) && { addressRegion: state }),
        ...(isRealPublicValue(zip) && { postalCode: zip }),
        addressCountry: "US",
      },
    }),
    ...(isRealPublicValue(mapUrl) && { hasMap: mapUrl }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(serviceAreas.length > 0 && { areaServed: serviceAreas }),
    // Top-level `email` in addition to the ContactPoint below: consumers read
    // one or the other, and answer engines overwhelmingly read the flat field.
    ...(isRealPublicValue(email) && { email }),
    ...(isRealPublicValue(email) && {
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        ...(isRealPublicValue(phone) && { telephone: phone }),
        email,
      },
    }),
    // Premium default ($5k+ boutique positioning); set siteConfig.brand.priceRange
    // per client, or override at the call site.
    priceRange: overrides?.priceRange ?? siteConfig.brand.priceRange ?? "$$$",
    // City-level GeoCoordinates — emit only when set. For privacy-sensitive
    // studios (boudoir / in-home) use a CITY centroid, never the home address.
    ...(geo && {
      geo: { "@type": "GeoCoordinates", latitude: geo.latitude, longitude: geo.longitude },
    }),
    // Operating hours — emit only when set. By-appointment studios may omit this;
    // when present it powers the hours line in the Google business rich result.
    ...(hours.length > 0 && {
      openingHoursSpecification: hours.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days,
        opens: h.opens,
        closes: h.closes,
      })),
    }),
    // Aggregate rating — emitted ONLY when siteConfig.brand.reviews carries
    // real, sourced numbers. There is deliberately no default and no fallback:
    // an invented rating is a structured-data policy violation, and a wrong one
    // is worse than none. See the `reviews` docs in site.config for why this
    // does not produce stars in Search (self-serving reviews are ineligible)
    // and what it IS for (answer engines reading JSON-LD).
    ...(reviews &&
      isRealPublicValue(reviews.ratingValue) &&
      isRealPublicValue(reviews.reviewCount) && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: reviews.ratingValue,
          reviewCount: reviews.reviewCount,
        },
      }),
  };
}

/** FAQPage schema — enables Google FAQ rich result.
 *  WARNING: `faqs` strings are serialized into an inline <script> via
 *  JsonLd.tsx. If callers ever wire FAQ content from a CMS or user input,
 *  sanitize at the boundary first (lib/sanitize.ts). */
export function buildFAQSchema(faqs: Array<{ q: string; a: string }>) {
  const safeFaqs = faqs.filter((faq) => isRealPublicValue(faq.q) && isRealPublicValue(faq.a));
  if (safeFaqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: safeFaqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** Person schema — for the photographer. Wire on the homepage near the
 *  MeetPhotographer section or on /about when that route lands. */
export function buildPersonSchema(opts: {
  name: string;
  jobTitle?: string;
  image?: string;
  sameAs?: string[];
  bio?: string;
}) {
  if (!isRealPublicValue(opts.name)) return null;
  const base = getCanonicalBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    ...(opts.jobTitle && { jobTitle: opts.jobTitle }),
    ...(opts.image && {
      // metadataBase does NOT apply to hand-built JSON-LD — absolutize.
      image: opts.image.startsWith("http")
        ? opts.image
        : absoluteUrl(opts.image),
    }),
    ...(opts.bio && { description: opts.bio }),
    ...(opts.sameAs && opts.sameAs.length > 0 && { sameAs: opts.sameAs }),
    worksFor: {
      "@type": "Organization",
      "@id": `${base}#org`,
      name: siteConfig.brand.name,
      url: base,
    },
  };
}

/** BlogPosting schema — Google article rich result for blog posts. */
export function buildArticleSchema(opts: {
  title: string;
  description?: string;
  url: string; // absolute canonical URL
  image?: string; // absolute or root-relative
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}) {
  const base = getCanonicalBaseUrl();
  if (!isRealPublicValue(opts.title)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    ...(opts.description && { description: opts.description }),
    ...(opts.image && {
      image: opts.image.startsWith("http") ? opts.image : absoluteUrl(opts.image),
    }),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: { "@type": "Person", name: isRealPublicValue(opts.authorName) ? opts.authorName : siteConfig.brand.name },
    publisher: {
      "@type": "Organization",
      name: siteConfig.brand.name,
      url: base,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  };
}

/** BreadcrumbList schema — Home → … → current, for search rich results. */
export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const safeItems = items.filter((item) => isRealPublicValue(item.name) && isRealPublicValue(item.url));
  if (safeItems.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: safeItems.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** WebPage schema — page-type structured data for landing/marketing pages,
 *  tied back to the business (LocalBusiness) and the site. */
export function buildWebPageSchema(opts: {
  name: string;
  description?: string;
  url: string;
  image?: string;
}) {
  const base = getCanonicalBaseUrl();
  if (!isRealPublicValue(opts.name)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    ...(opts.description && { description: opts.description }),
    url: opts.url,
    ...(opts.image && {
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: opts.image.startsWith("http") ? opts.image : absoluteUrl(opts.image),
      },
    }),
    isPartOf: { "@type": "WebSite", name: siteConfig.brand.name, url: base },
    about: { "@type": "LocalBusiness", "@id": `${base}#org`, name: siteConfig.brand.name, url: base },
  };
}

/** Service schema — the right type for a service/landing page (a specific offering
 *  of the local business). Ties back to LocalBusiness via @id. Emit on service pages. */
export function buildServiceSchema(opts: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  serviceType?: string;
  /** Supply a price to emit an Offer ("from $X" in results). */
  offers?: { price?: string; priceRange?: string; priceCurrency?: string };
}) {
  const base = getCanonicalBaseUrl();
  if (!isRealPublicValue(opts.name)) return null;
  const serviceAreas = siteConfig.brand.serviceAreas ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    ...(opts.serviceType && { serviceType: opts.serviceType }),
    ...(opts.description && { description: opts.description }),
    url: opts.url,
    ...(opts.image && {
      image: opts.image.startsWith("http") ? opts.image : absoluteUrl(opts.image),
    }),
    provider: { "@type": "LocalBusiness", "@id": `${base}#org`, name: siteConfig.brand.name, url: base },
    ...(serviceAreas.length > 0 && { areaServed: serviceAreas }),
    ...(opts.offers && {
      offers: {
        "@type": "Offer",
        ...(opts.offers.price && { price: opts.offers.price }),
        ...(opts.offers.priceCurrency && { priceCurrency: opts.offers.priceCurrency }),
        ...(opts.offers.priceRange && { priceRange: opts.offers.priceRange }),
        availability: "https://schema.org/InStock",
        url: opts.url,
      },
    }),
  };
}

/** Organization schema — brand entity for knowledge-panel + sitelinks signals.
 *  Emit ONCE on the homepage. logo/sameAs omitted until real assets/handles exist
 *  (a wrong-shaped logo or empty sameAs weakens the result more than absence).
 *  Populate siteConfig.socials → sameAs lights up automatically. */
export function buildOrganizationSchema(opts?: { logo?: string; sameAs?: string[] }) {
  const base = getCanonicalBaseUrl();
  if (!isRealPublicValue(siteConfig.brand.name)) return null;
  const sameAs =
    opts?.sameAs ?? siteConfig.socials.map((s) => s.href).filter((h) => h && h !== "#");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}#org`,
    name: siteConfig.brand.name,
    url: base,
    description: siteConfig.seo.description,
    ...(opts?.logo && {
      logo: {
        "@type": "ImageObject",
        url: opts.logo.startsWith("http") ? opts.logo : `${base}${opts.logo}`,
      },
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/** WebSite schema — ties pages to the brand entity. Add a SearchAction only when the
 *  site has a real on-site search route (a SearchAction pointing at a 404 is invalid). */
export function buildWebSiteSchema() {
  const base = getCanonicalBaseUrl();
  if (!isRealPublicValue(siteConfig.brand.name)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}#website`,
    name: siteConfig.brand.name,
    url: base,
    publisher: { "@id": `${base}#org` },
  };
}

/** Blog schema — for the blog index. Ties the post list to the brand entity (#org)
 *  so the Journal reads as a structured collection for search + AI answers. */
export function buildBlogSchema(
  posts: Array<{ title: string; slug: string; excerpt?: string; coverImage?: string; date: string }>,
) {
  const base = getCanonicalBaseUrl();
  if (!isRealPublicValue(siteConfig.brand.name) || posts.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${base}/blog#blog`,
    name: `${siteConfig.brand.name} Journal`,
    url: `${base}/blog`,
    publisher: { "@id": `${base}#org` },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: absoluteUrl(`/blog/${p.slug}`),
      ...(isRealPublicValue(p.excerpt) && { description: p.excerpt }),
      ...(isRealPublicValue(p.coverImage) && {
        image: p.coverImage!.startsWith("http") ? p.coverImage : absoluteUrl(p.coverImage!),
      }),
      datePublished: p.date,
    })),
  };
}

/** HowTo schema — session process steps already shown on the homepage.
 *  Emits only when every step has a real name + text (no empty shells). */
export function buildHowToSchema(opts: {
  name: string;
  description?: string;
  steps: Array<{ name: string; text: string; image?: string }>;
}) {
  const safeSteps = opts.steps.filter(
    (step) => isRealPublicValue(step.name) && isRealPublicValue(step.text),
  );
  if (!isRealPublicValue(opts.name) || safeSteps.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    ...(opts.description && { description: opts.description }),
    step: safeSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && {
        image: step.image.startsWith("http") ? step.image : absoluteUrl(step.image),
      }),
    })),
  };
}
