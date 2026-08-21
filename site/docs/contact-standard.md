# Contact + NAP standard

Every non-campaign page that hosts the contact/inquiry section — at minimum the
**homepage** and any dedicated **/contact** page — must surface a **clickable
phone** (`tel:`) and **clickable email** (`mailto:`) right alongside the form, not
only the form itself. The **footer** must carry the full **NAP** (business name,
address, phone) wherever possible.

## Why

A visitor who isn't ready to fill out a form still needs a one-tap way to reach
the studio. Hiding contact behind a form loses the caller/texter. Clickable phone
+ email also strengthen local SEO / NAP consistency and AI-agent discovery.

## The minimum

- **Contact section (homepage + any `/contact` page):** a clickable `tel:` phone
  and `mailto:` email, plus short copy that sets expectations — what happens next,
  a response-time promise ("we'll be in touch with pricing and session details,"
  "responded to within 24 hours" / "usually the same business day"). The studio
  address is a bonus here.
- **Footer:** business name + full address + phone (NAP); email if possible.

Campaign / funnel landing pages (e.g. `40-over-40`) are intentionally exempt — they
drive a single conversion action and shouldn't scatter contact options.

## How it's wired (this template)

- `components/sections/ContactForm.tsx` renders a labelled contact bar (Call/Text,
  Email, Studio) whenever it receives `contactPhone` / `contactEmail` /
  `contactLocation`. **The homepage passes `siteConfig.brand.phone` +
  `siteConfig.brand.email` by default.** Add `contactLocation` to also show the
  address in the bar — see `sites/grateful-goddess-boudoir` for the full pattern.
- `components/layout/Footer.tsx` renders the NAP from `siteConfig.brand`
  (phone → `tel:`, email → `mailto:`, plus the composed address).

So the rule holds as long as `siteConfig.brand.phone` / `email` / `location` are
set — and they should be, since they also feed the LocalBusiness JSON-LD. Never
ship a form-only contact section.
```
