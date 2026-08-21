"use client";
import { type FormEvent, useActionState, useRef } from "react";
import { usePathname } from "next/navigation";
import { submitInquiry, type SubmitInquiryState } from "@/app/actions/submitInquiry";
import { AttributionFields } from "@/components/ui/AttributionFields";
import { Input, Textarea } from "@/components/ui";
import { contactFormCopy } from "@/lib/content.config";
import { mailtoHref, telHref } from "@/lib/links";
import { siteConfig } from "@/lib/site.config";
import { stagePendingLeadConversionFromForm } from "@/lib/tracking/lead-conversions";

const initialState: SubmitInquiryState = { success: false, errors: {} };

export interface ContactFormProps {
  eyebrow?: string;
  /** Headline with optional italic span (controlled via `italicWord`). */
  headline?: string;
  /** When set, this substring inside `headline` gets wrapped in an italic <em>. */
  italicWord?: string;
  subline?: string;
  successHeadline?: string;
  successBody?: string;
  /** Clickable contact bar shown above the form (agency contact standard —
   *  docs/contact-standard.md). The bar renders when any of these is set. */
  contactPhone?: string;
  contactEmail?: string;
  contactLocation?: string;
  /** Google Maps / place URL — makes the studio address open Maps. */
  contactMapsUrl?: string;
  /**
   * When true, shorten bottom padding so a following cream FAQ can continue
   * as the same close chapter (homepage rhythm).
   */
  flushBottom?: boolean;
}

function withItalic(headline: string, italicWord: string) {
  if (!italicWord || !headline.includes(italicWord)) return headline;
  const [before, after] = headline.split(italicWord);
  return (
    <>
      {before}
      <em className="italic">{italicWord}</em>
      {after}
    </>
  );
}

export function ContactForm({
  eyebrow = contactFormCopy.eyebrow,
  headline = contactFormCopy.headline,
  italicWord = contactFormCopy.italicWord,
  subline = contactFormCopy.subline,
  successHeadline = contactFormCopy.successHeadline,
  successBody = contactFormCopy.successBody,
  contactPhone,
  contactEmail,
  contactLocation,
  contactMapsUrl,
  flushBottom = false,
}: ContactFormProps = {}) {
  const pathname = usePathname();
  const [state, formAction, isPending] = useActionState(submitInquiry, initialState);
  const leadEventInputRef = useRef<HTMLInputElement>(null);
  const showContactBar = Boolean(contactPhone || contactEmail || contactLocation);
  const sectionPad = flushBottom
    ? "pt-[var(--space-section-y)] pb-10 md:pb-12"
    : "py-[var(--space-section-y)]";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const eventId = stagePendingLeadConversionFromForm(event.currentTarget, {
      formName: "contact_form",
      leadType: "inquiry",
      sourcePage: pathname,
    });
    if (leadEventInputRef.current) leadEventInputRef.current.value = eventId;
  }

  if (state.success) {
    return (
      <section
        id="contact"
        className={`bg-(--color-cream) px-[var(--space-section-x)] ${sectionPad}`}
      >
        <div
          role="status"
          aria-live="polite"
          className="max-w-2xl mx-auto border border-(--color-border) p-12 text-center flex flex-col gap-4"
        >
          <p className="font-serif text-3xl text-(--color-ink)">{successHeadline}</p>
          <p className="text-body text-(--color-muted) max-w-sm mx-auto">
            {successBody}
          </p>
        </div>
      </section>
    );
  }

  const locationBody = contactLocation ? (
    contactMapsUrl ? (
      <a
        href={contactMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-body text-(--color-muted) transition-colors hover:text-(--color-accent-text) break-words"
      >
        {contactLocation}
      </a>
    ) : (
      <span className="text-body text-(--color-muted) break-words">{contactLocation}</span>
    )
  ) : null;

  return (
    <section
      id="contact"
      className={`bg-(--color-cream) px-[var(--space-section-x)] ${sectionPad}`}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <div className="mx-auto max-w-2xl text-center flex flex-col gap-4">
          <span className="text-eyebrow tracking-widest uppercase text-(--color-accent-text)">{eyebrow}</span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight text-(--color-ink)">
            {withItalic(headline, italicWord)}
          </h2>
          <p className="text-lead text-(--color-muted)">
            {subline}
          </p>
        </div>

        {/* Clickable contact bar — a one-tap phone/email for visitors not ready
            to fill the form (agency contact standard, docs/contact-standard.md).
            Stack by default; 3-up only from md with room so long NAP never collides. */}
        {showContactBar && (
          <dl className="grid w-full grid-cols-1 gap-6 border-y border-(--color-border) py-6 text-center md:grid-cols-3 md:gap-8">
            {contactPhone && (
              <div className="flex min-w-0 flex-col gap-1.5">
                <dt className="text-eyebrow tracking-widest uppercase text-(--color-accent-text)">Call or Text</dt>
                <dd className="min-w-0">
                  <a href={telHref(contactPhone)} className="text-body text-(--color-ink) transition-colors hover:text-(--color-accent-text)">
                    {contactPhone}
                  </a>
                </dd>
              </div>
            )}
            {contactEmail && (
              <div className="flex min-w-0 flex-col gap-1.5">
                <dt className="text-eyebrow tracking-widest uppercase text-(--color-accent-text)">Email</dt>
                <dd className="min-w-0">
                  <a href={mailtoHref(contactEmail, siteConfig.brand.emailSubject)} className="text-body text-(--color-ink) transition-colors hover:text-(--color-accent-text) break-all">
                    {contactEmail}
                  </a>
                </dd>
              </div>
            )}
            {contactLocation && (
              <div className="flex min-w-0 flex-col gap-1.5">
                <dt className="text-eyebrow tracking-widest uppercase text-(--color-accent-text)">Studio</dt>
                <dd className="min-w-0">{locationBody}</dd>
              </div>
            )}
          </dl>
        )}

        <form action={formAction} onSubmit={handleSubmit} className="relative mx-auto flex w-full max-w-2xl flex-col gap-5">
          {/* Honeypot — visually hidden, must stay empty. */}
          <input
            type="text"
            name="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] w-px h-px opacity-0"
          />
          {/* Ad-click + UTM attribution from cookies (set by AttributionTracker) */}
          <AttributionFields />
          {/* Real per-page lead source (don't hardcode "/") — read server-side
              by submitInquiry and attached to the CRM contact note. */}
          <input type="hidden" name="sourcePage" value={pathname} />
          <input ref={leadEventInputRef} type="hidden" name="leadEventId" />

          <p className="text-xs text-(--color-muted)">
            Fields marked <span className="text-(--color-error)" aria-hidden="true">*</span> are required.
          </p>

          <Input
            label="Full Name"
            name="name"
            type="text"
            autoComplete="name"
            required
            error={state.errors?.name?.[0]}
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.errors?.email?.[0]}
          />
          <Input
            label="Phone"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            error={state.errors?.phone?.[0]}
          />
          <Textarea
            label="Message"
            name="message"
            rows={5}
            required
            placeholder="Tell me about what you're envisioning..."
            error={state.errors?.message?.[0]}
          />

          {state.errors?.root && (
            <p role="alert" aria-live="polite" className="text-xs text-(--color-error)">{state.errors.root[0]}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full tracking-widest uppercase text-xs font-medium bg-(--color-ink) text-(--color-cream) px-8 py-4 hover:bg-(--color-accent-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-cream) transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Sending..." : "Send Inquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}
