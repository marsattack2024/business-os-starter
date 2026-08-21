# Thank-you page convention

Every funnel/landing page that hosts a lead form (or a quiz) redirects on success
to its **own** thank-you page, named `<page-slug>-thank-you`. Each funnel therefore
keeps a distinct post-submit UX/reporting URL instead of collapsing every visitor
onto one generic page.

For editable React forms, the thank-you URL is **not** proof of conversion by
itself. The form/quiz code stages the lead metadata in the browser, appends an
opaque `lead_event=<eid...>` only after the server/API accepts the lead, and the
route tracker replays `submitted_form` only when it consumes that pending event.
Direct visits, refreshes, bookmarks, and crawlers on thank-you pages must not fire
lead conversions.

## The rule

| Form / funnel lives on | Redirects on success to |
|---|---|
| `/` (general homepage inquiry) | `/thank-you` |
| `/40-over-40` (campaign application) | `/40-over-40-thank-you` |
| `/quiz` + the homepage quiz popup | `/quiz-thank-you` |
| any new funnel page `/X` | `/X-thank-you` |

The pattern is simply **the page URL + `-thank-you`**; the homepage's base case is
`/thank-you`.

## How it's wired

- **Forms** (contact + application) post their `sourcePage`, and the shared
  `submitInquiry` server action redirects via `confirmedLeadRedirect(sourcePage,
  leadEventId)` from `lib/tracking/lead-redirect.ts`. Unregistered sources fall
  back to `/thank-you`, so a redirect can never 404. The redirect is a
  server-action redirect, so it works with or without client JS (progressive
  enhancement); after CRM success it appends `lead_event` when the browser staged
  a pending lead event. The forms' inline-success branch remains only as the
  silent honeypot response for bots.
- **Quiz** redirects independently via `siteConfig.quiz.redirectTo` (default
  `/quiz-thank-you`) — the engine handles it, no map entry needed. It only
  appends `lead_event` after the final quiz capture succeeds.

## When you add a new funnel

1. Build the funnel page at `/<slug>`.
2. Build its thank-you page at `/<slug>-thank-you` (`noindex`, on-brand copy).
3. Register it: add `"/<slug>": "/<slug>-thank-you"` to `THANK_YOU_BY_SOURCE` in
   `lib/tracking/lead-redirect.ts`.
4. Keep conversion tags bound to the app-owned `submitted_form` dataLayer event.
   Use the thank-you URL only as page context, not as the lead trigger.

Thank-you pages are always `noindex`, and the quiz popup never opens on them
(`triggers.blockedPathSegments` includes `thank-you` by default).
