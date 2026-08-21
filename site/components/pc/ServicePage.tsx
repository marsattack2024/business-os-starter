import type { CSSProperties } from "react";
import Link from "next/link";
import { photo } from "@/lib/photos";
import { isInternalRoute } from "@/lib/links";
import type { ServicePageContent } from "@/lib/pages/types";
import { Breadcrumbs } from "./Breadcrumbs";
import { ArtDirectedBleedFrame, Frame } from "./Frame";
import { Reveal } from "./Reveal";
import { RevealEngine } from "./RevealEngine";
import { Faq, ProofBand } from "./sections";
import { Band, Body, Cta, Display, Eyebrow, Stack, Wrap, type Plane } from "./kit";

/**
 * SERVICE PAGE — the single render path for every genre and city page.
 *
 * These pages are one page with different words and different photographs, so
 * they share this component and ship nothing but a typed content module
 * (`lib/pages/*.content.ts`) and their own JSON-LD. Structure, band rhythm,
 * image sizing and the mobile crops are decided once here rather than once per
 * page, and a change to any of them is one edit.
 *
 * ── PLANE MAP ──────────────────────────────────────────────────────────────
 * Read before reordering. The rule: no two adjacent bands share a plane, and a
 * photograph sits between any two light ones.
 *
 *   Breadcrumb strip  paper (thin)
 *   Hero photograph   PHOTO-DARK
 *   Hero copy         paper          <- same section, copy on paper, never a scrim
 *   Intro             paper-2
 *   Gallery           paper          <- guarded: absent when `gallery` is empty
 *   Sections          derived from the bands that ACTUALLY render either side
 *   Proof             dark           <- guarded
 *   FAQ               paper-2        <- guarded; `Faq` owns its own plane
 *   Journal           paper          <- guarded
 *   Closing CTA       dark
 *
 * Four of those bands are guarded, so the map above is the FULL page, not every
 * page. `sectionPlanes` therefore reads its neighbours from what renders rather
 * than from that list, and `assertPlaneRhythm` walks the real sequence in
 * development and warns on any seam the content shape can still produce.
 *
 * ── WHY THE HERO IS A BAND AND NOT AN OVERLAY ──────────────────────────────
 * An overlay hero stacks its copy ON the photograph, inside a box sized by
 * `min-height` rather than by a ratio. Measured, that box is ~0.515 on a
 * 390x844 phone, and `object-fit: cover` then shows only ~64% of a 4:5 file's
 * width — it throws away ~18% off EACH side of a crop that was composed
 * deliberately, which on a family portrait is a face at each edge.
 *
 * So this hero gives the photograph a box shaped like the file instead — and
 * the shape is READ FROM THE MANIFEST per key and per branch, because a
 * registry does not ship one ratio per branch. A hardcoded `4/5` + `16/9` pair
 * is right for whichever key it was measured against and silently wrong for the
 * rest, cutting a quarter off the bottom of every 4:3 band.
 *
 * See `.pc-hero-plate` in globals.css for the box itself, including why the
 * desktop bound spends the first-screen budget on the box's WIDTH rather than
 * handing it to `object-fit: cover`.
 *
 * The copy then sits on paper underneath, which is also why there is no scrim
 * and no text shadow anywhere on this page: nothing is ever set over a live
 * photograph, so no headline can land on a bright patch and lose its contrast.
 */

/**
 * Planes for a run of `count` sections that sits between two bands which have
 * already been decided.
 *
 * Sections read well alternating dark / paper-2, so both phases of that
 * alternation are tried first and the one that clears BOTH neighbours wins.
 * Only when neither does — one section between two dark bands, say — does the
 * run borrow `paper` for the offending end. That is rarer and uglier than an
 * alternation, and it is still not a seam.
 *
 * Counting backwards from the end instead, on the assumption that proof-or-FAQ
 * always follows, is wrong: both are guarded, so `faqs: []` with no proof puts
 * the last section against the journal band's own `paper`.
 */
function sectionPlanes(count: number, before: Plane, after: Plane): Plane[] {
  for (const phase of [0, 1]) {
    const run: Plane[] = Array.from({ length: count }, (_, i) =>
      (i + phase) % 2 === 0 ? "dark" : "paper-2",
    );
    if (run[0] !== before && run[count - 1] !== after) return run;
  }
  const order: Plane[] = ["dark", "paper-2", "paper"];
  const run: Plane[] = [];
  let prev = before;
  for (let i = 0; i < count; i++) {
    const next = i === count - 1 ? after : undefined;
    prev =
      order.find((p) => p !== prev && p !== next) ?? order.find((p) => p !== prev)!;
    run.push(prev);
  }
  return run;
}

/**
 * Development-only guard on the plane rhythm.
 *
 * `sectionPlanes` can always place the sections, but it cannot fix a page whose
 * FIXED bands abut — `proof` with no FAQs and no journal links puts the dark
 * proof band straight against the dark closing CTA, and no section exists to
 * separate them. That envelope is a content decision made in `lib/pages/*`, so
 * the template says so out loud while the page is being written instead of
 * shipping a tall block of flat ink nobody looked at.
 *
 * Server-side `console.warn`, stripped from the production bundle by the
 * `NODE_ENV` check, and never a throw: a plane seam is a composition defect,
 * not a reason to fail a page.
 */
function assertPlaneRhythm(slug: string, planes: readonly (Plane | null)[]) {
  if (process.env.NODE_ENV === "production") return;
  const rendered = planes.filter((p): p is Plane => p !== null);
  for (let i = 1; i < rendered.length; i++) {
    if (rendered[i] === rendered[i - 1]) {
      console.warn(
        // Unbracketed prefix, matching GenreGrid's warnings in ./sections.
        // A square-bracketed capitalised token is exactly what content:qa's
        // launch gate scans for, so a log prefix must not use that shape.
        `ServicePage: ${slug}: two adjacent bands share the "${rendered[i]}" plane. ` +
          `Give the page a proof quote, an FAQ or a journal link so the bands alternate.`,
      );
    }
  }
}

/**
 * ONE editorial link out of a section, set under its last paragraph.
 *
 * The journal's own in-body link language (`.post-prose a` in globals.css):
 * accent, underlined at a 3px offset, resolving to ink on hover. Deliberately
 * NOT a `Cta` — a page has one call to action and a second bordered block of
 * uppercase would compete with it. This is a sentence you can click, which is
 * what a link down to a city page should look like.
 *
 * `inline-block py-2.5` gives a 14px line a 44px tap target without adding a
 * visible gap, matching the hit-area floor every other link on this site keeps.
 */
function SectionLink({
  href,
  label,
  onDark,
}: {
  href: string;
  label: string;
  onDark: boolean;
}) {
  return (
    <p className="text-body max-w-(--text-measure)">
      <Link
        href={href}
        className={`inline-block py-2.5 underline decoration-1 underline-offset-[3px] transition-colors ${
          onDark
            ? "text-(--color-accent-light) hover:text-(--color-on-dark-primary)"
            : "text-(--color-accent-text) hover:text-(--color-ink)"
        }`}
      >
        {label}
      </Link>
    </p>
  );
}

export function ServicePage({ content }: { content: ServicePageContent }) {
  const sections = content.sections ?? [];
  const hasGallery = content.gallery.length > 0;
  const hasProof = content.proof.length > 0;
  const hasFaqs = content.faqs.length > 0;
  const hasRelated = content.related.length > 0;

  /**
   * The bands either side of the section run — read from what RENDERS, not from
   * the plane map's full-page order. Every one of `gallery`, `proof`, `faqs`
   * and `related` is guarded, so the neighbour is whichever guard passes first.
   */
  const planeBefore: Plane = hasGallery ? "paper" : "paper-2";
  const planeAfter: Plane = hasProof
    ? "dark"
    : hasFaqs
      ? "paper-2"
      : hasRelated
        ? "paper"
        : "dark"; // the closing CTA, which always renders
  const planes = sectionPlanes(sections.length, planeBefore, planeAfter);

  assertPlaneRhythm(content.slug, [
    "paper", // the hero's copy, on cream
    "paper-2", // intro
    hasGallery ? "paper" : null,
    ...planes,
    hasProof ? "dark" : null,
    hasFaqs ? "paper-2" : null,
    hasRelated ? "paper" : null,
    "dark", // closing CTA
  ]);

  /**
   * The hero box's shape, per branch, straight off the manifest. `?? heroPhoto`
   * covers a key with no art-directed variants: `ArtDirectedBleedFrame` falls
   * back to serving the master, so the box falls back to the master's shape and
   * that file is not re-cropped either.
   */
  const heroPhoto = photo(content.hero.image);
  const heroNarrow = heroPhoto.portrait ?? heroPhoto;
  const heroWide = heroPhoto.landscape ?? heroPhoto;

  /**
   * A gallery with an odd number of tiles strands its last one beside an empty
   * cell in the two-column mobile grid. That tile spans the full mobile width
   * instead, at the same 4:5 as every other tile, and the grid never shows a
   * hole at any count from 4 to 8.
   */
  const orphanTile = content.gallery.length % 2 === 1 ? content.gallery.length - 1 : -1;

  return (
    <>
      {/* One client boundary for every scroll entrance and the hero's crossfade.
          Fail-open: without it nothing is ever hidden, it just never animates. */}
      <RevealEngine />

      {/* ── Breadcrumb strip ──
          Above the photograph, not on it. A trail set over a live image is the
          one piece of furniture on the page small enough that a bright patch
          behind it costs real legibility, and it is also what a reader arriving
          from search reads first. */}
      <div className="bg-(--color-cream)">
        <Wrap className="py-4">
          <Breadcrumbs
            trail={[
              { name: "Home", href: "/" },
              /* The optional middle crumb. It is what gives a city page its
                 link back up to its hub, so it is a navigation element and not
                 only a search signal. */
              ...(content.parent ? [content.parent] : []),
              { name: content.breadcrumb, href: content.slug },
            ]}
          />
        </Wrap>
      </div>

      {/* ── Hero ── */}
      <section className="bg-(--color-cream)">
        {/* The box's shape IS the file's shape, per branch — see `.pc-hero-plate`
            in globals.css. The three numbers below are the only page-specific
            input it needs; nothing here may hardcode a ratio, because the
            registry does not ship one ratio per branch. */}
        <div
          className="pc-hero-plate relative overflow-hidden bg-(--color-ink)"
          style={
            {
              "--plate-a": `${heroNarrow.width} / ${heroNarrow.height}`,
              "--plate-a-wide": `${heroWide.width} / ${heroWide.height}`,
              // The same wide ratio as a bare number, for the `calc()` that
              // turns the height budget into a max-width. `calc()` cannot
              // multiply by a `w / h` ratio value.
              "--plate-a-wide-n": `${heroWide.width / heroWide.height}`,
            } as CSSProperties
          }
        >
          <ArtDirectedBleedFrame
            photo={heroPhoto}
            priority
            /**
             * Top-anchored by default. With the box derived from the file there
             * is normally nothing left for `object-fit` to discard, so this is
             * insurance rather than composition: if a key's box and file ever
             * disagree by a rounding hair, the hair comes off the bottom of the
             * frame and not off a head. Choose each key's `focus` so the top
             * edge sits just above the subject's hair, which is what makes the
             * top the safe anchor. A page overrides this only where its asset
             * sheet says the key needs something else.
             */
            position={content.hero.position ?? "50% 0%"}
          />
          {/* A faint floor so the photograph seats against the paper below
              instead of ending on a hard line. Nothing is set over it. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_74%,rgba(0,0,0,0.2)_100%)]"
          />
        </div>

        {/* Tighter above than below on purpose: this copy belongs to the
            photograph, and the gap under it is what separates the hero from the
            intro band.

            This padding is also the second term in the hero plate's height
            budget. `.pc-hero-plate` reserves 16rem of the first screen: the
            masthead and breadcrumb strip, the 3rem below, and the eyebrow's own
            line. Changing either number moves the other. */}
        <Wrap className="flex flex-col gap-6 pt-[clamp(2rem,4vw,3rem)] pb-[clamp(3rem,7vw,5.5rem)]">
          <Reveal>
            <Eyebrow>{content.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <Display as="h1">{content.headline}</Display>
          </Reveal>
          <Reveal delay={140}>
            <p className="max-w-(--text-measure) text-lead text-(--color-ink-soft)">
              {content.lede}
            </p>
          </Reveal>
          <Reveal delay={200}>
            {/* Wrapped, so the underline rule is the width of the words rather
                than the width of the column. */}
            <div>
              <Cta href={content.cta.href}>{content.cta.label}</Cta>
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* ── Intro ──
          Title left, prose right on a wide screen: the h2 keeps its editorial
          size without pushing the first paragraph off the first screen. */}
      <Band plane="paper-2">
        <Wrap className="grid gap-[clamp(1.75rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Reveal>
            <Display>{content.intro.title}</Display>
          </Reveal>
          <Reveal delay={90} className="flex flex-col gap-5">
            {content.intro.body.map((paragraph) => (
              <Body key={paragraph}>{paragraph}</Body>
            ))}
          </Reveal>
        </Wrap>
      </Band>

      {/* ── Gallery ──
          Two columns on a phone, four from 1024. No eyebrow and no headline:
          the work is the statement, and a label over it would be the template
          inventing copy that belongs to the page. */}
      {content.gallery.length > 0 && (
        <Band plane="paper" id="gallery">
          <Wrap>
            <div className="grid grid-cols-2 gap-[clamp(0.85rem,1.6vw,1.35rem)] lg:grid-cols-4">
              {content.gallery.map((key, i) => {
                const orphan = i === orphanTile;
                // A div, not a figure: `Frame` already emits the <figure>, and
                // there is no caption here that would justify nesting one
                // figure inside another.
                return (
                  <Reveal
                    key={`${key}-${i}`}
                    delay={(i % 4) * 70}
                    className={`group ${orphan ? "col-span-2 lg:col-span-1" : ""}`}
                  >
                    <Frame
                      photo={photo(key)}
                      /* 4:5 on every tile including the full-width one. A
                         mosaic that squares its full-width tile is wrong here:
                         an asset sheet clears keys at specific ratios, and
                         several will say so explicitly ("never crop tighter
                         than the feet"), which a square breaks. One ratio means
                         no tile can receive a crop nobody viewed, and full
                         width at 4:5 is only ~420px tall on a 375px phone. */
                      ratio="4 / 5"
                      sizes={
                        orphan
                          ? "(min-width: 1024px) 25vw, 100vw"
                          : "(min-width: 1024px) 25vw, 50vw"
                      }
                    />
                  </Reveal>
                );
              })}
            </div>
          </Wrap>
        </Band>
      )}

      {/* ── Sections ──
          The page's deeper register: a sub-genre, a team package, what a reveal
          appointment is. `id` makes one deep-linkable. */}
      {sections.map((section, i) => {
        const plane = planes[i];
        const onDark = plane === "dark";
        return (
          <Band key={section.id ?? `${i}-${section.title}`} plane={plane} id={section.id}>
            {section.image ? (
              <Wrap className="grid items-center gap-[clamp(2rem,4vw,3.75rem)] lg:grid-cols-2">
                {/* Photograph first on a phone, alternating sides from 1024 —
                    so a run of sections reads as a spread rather than a list. */}
                <Reveal className={`group ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <Frame
                    photo={photo(section.image)}
                    ratio="4 / 5"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </Reveal>
                <Reveal delay={90} className="flex flex-col gap-5">
                  <Display>{section.title}</Display>
                  {section.body.map((paragraph) => (
                    <Body key={paragraph} onDark={onDark}>
                      {paragraph}
                    </Body>
                  ))}
                  {section.link && (
                    <SectionLink
                      href={section.link.href}
                      label={section.link.label}
                      onDark={onDark}
                    />
                  )}
                </Reveal>
              </Wrap>
            ) : (
              /* No photograph: the same title-left / prose-right split as the
                 intro band. A full-width h2 stretches to the container's full
                 width on a desktop and reads as a banner rather than a heading. */
              <Wrap className="grid gap-[clamp(1.75rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <Reveal>
                  <Display>{section.title}</Display>
                </Reveal>
                <Reveal delay={90} className="flex flex-col gap-5">
                  {section.body.map((paragraph) => (
                    <Body key={paragraph} onDark={onDark}>
                      {paragraph}
                    </Body>
                  ))}
                  {section.link && (
                    <SectionLink
                      href={section.link.href}
                      label={section.link.label}
                      onDark={onDark}
                    />
                  )}
                </Reveal>
              </Wrap>
            )}
          </Band>
        );
      })}

      {/* ── Proof ──
          The shared band, on ink. Text only, and named: a quote with no name is
          not proof, so a page with nothing real to show renders no band at all
          rather than a decorative one. This variant omits `ProofBand`'s count
          block on purpose — a studio-wide review total is not this genre's.

          It is the SHARED band and not a local copy because quote typography
          written out twice, identically apart from two colour tokens, drifts
          the first time one copy is tuned. */}
      {hasProof && <ProofBand onDark eyebrow="Kind words" quotes={content.proof} />}

      {/* ── FAQ ──
          The shared section: native <details>, an accent `+` that rotates,
          first one open. The heading is section furniture and lives here; the
          questions are the page's own, and the same array should feed
          `buildFAQSchema` at the route. */}
      {content.faqs.length > 0 && (
        <Faq
          eyebrow="Questions"
          headline="Before you book"
          faqs={content.faqs.map((f) => ({ question: f.q, answer: f.a }))}
        />
      )}

      {/* ── Journal ── */}
      {content.related.length > 0 && (
        <Band plane="paper">
          <Wrap>
            <Stack gap="gap-[clamp(1.75rem,3vw,2.5rem)]">
              <Reveal>
                <Eyebrow>From the journal</Eyebrow>
              </Reveal>
              <ul className="grid list-none gap-x-[clamp(1.5rem,3vw,2.5rem)] p-0 md:grid-cols-3">
                {content.related.map((post, i) => {
                  const label = (
                    <>
                      {post.title}
                      <span
                        aria-hidden="true"
                        className="mt-3 block h-px w-10 bg-(--color-accent) transition-[width] duration-300 group-hover:w-16"
                      />
                    </>
                  );
                  const linkClass =
                    "group flex min-h-[44px] flex-col justify-center py-5 font-serif text-h3 text-(--color-ink) transition-colors hover:text-(--color-accent-text)";
                  return (
                    <Reveal
                      key={post.href}
                      as="li"
                      delay={(i % 3) * 70}
                      className="border-t border-(--color-border)"
                    >
                      {isInternalRoute(post.href) ? (
                        <Link href={post.href} className={linkClass}>
                          {label}
                        </Link>
                      ) : (
                        <a href={post.href} className={linkClass}>
                          {label}
                        </a>
                      )}
                    </Reveal>
                  );
                })}
              </ul>
            </Stack>
          </Wrap>
        </Band>
      )}

      {/* ── Closing CTA ──
          The page's own eyebrow and its own headline, repeated over the one
          destination it pushes toward. Deliberately no new sentence: a shared
          template writing studio copy is how a claim nobody approved ends up on
          six pages at once. */}
      <Band plane="dark">
        <Wrap className="flex flex-col items-center gap-7 text-center">
          <Reveal>
            <Eyebrow onDark>{content.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <Display className="max-w-[20ch] text-(--color-on-dark-primary)">
              {content.headline}
            </Display>
          </Reveal>
          <Reveal delay={140}>
            <Cta href={content.cta.href} onDark>
              {content.cta.label}
            </Cta>
          </Reveal>
        </Wrap>
      </Band>
    </>
  );
}
