import Link from "next/link";
import { photo, type PhotoKey } from "@/lib/photos";
import { Frame } from "./Frame";
import { Reveal } from "./Reveal";
import { Band, Display, Eyebrow, SectionHead, Stack, Wrap } from "./kit";

/**
 * SHARED SECTIONS for the band-and-plane page system.
 *
 * ── WHY THESE EXIST ALONGSIDE components/sections/* ────────────────────────
 * They are not a second copy of the homepage sections. `components/sections/*`
 * are self-contained blocks: each owns its own `<section>`, its own padding
 * (`--space-section-y`), its own background, and in most cases a client
 * boundary and default content pulled from `lib/content.config.ts`. That is
 * exactly right for a homepage assembled from independent parts.
 *
 * These three are the opposite: they are BANDS in a rhythm. Each one renders a
 * `Band` with an explicit `plane`, which is the contract `ServicePage`'s
 * `sectionPlanes` and `assertPlaneRhythm` reason about when they decide what
 * colour every band on the page should be. A section that hardcodes its own
 * background cannot participate in that, so it cannot be one of these.
 *
 * Reach for the homepage owner unless you are composing a page out of planes:
 *
 *   FAQ         `components/sections/FAQSection` is the client accordion with
 *               a CTA footer and related links, and it stays the homepage's.
 *               `Faq` below is a server component built on native <details>,
 *               ships zero JavaScript, and sits on the `paper-2` plane.
 *   Testimonials `components/sections/{TestimonialsCarousel,TestimonialCards,
 *               TestimonialsGrid}` are the homepage's. `ProofBand` below is
 *               quotes-only, plane-aware, and renders nothing when a page has
 *               no real named quote to show.
 *   Gallery     `components/sections/GalleryGrid` is the 2-column masonry with
 *               per-item heights. `GenreGrid` below is a grid of LINKED tiles
 *               with a derived column count. Different job, different contract.
 */

/* ═══════════════════════════════════════════════════════════════
   PROOF BAND
   ═══════════════════════════════════════════════════════════════ */

/**
 * Named quotes, optionally opened by a review count.
 *
 * Two variants of one band, so the quote typography is written once here and
 * the variants are props:
 *
 *   `count` omitted  the count block is not rendered, and an optional `eyebrow`
 *                    opens the band instead. The accent rule moves from the
 *                    count block onto each quote, so the band keeps its accent.
 *   `onDark`         the band is ink and the type takes the on-dark tokens.
 *
 * A quote with no name is not proof. Pass real, attributed quotes or pass none
 * and let the page render no band at all.
 */
export function ProofBand({
  count,
  countLabel,
  quotes,
  eyebrow,
  onDark = false,
}: {
  /** Review count. Omit for a quotes-only band. */
  count?: number;
  countLabel?: string;
  quotes: readonly { quote: string; name: string }[];
  /** Accent label opening the band. Only read when there is no count block. */
  eyebrow?: string;
  onDark?: boolean;
}) {
  const hasCount = typeof count === "number";
  const quoteGrid = (
    <div className="grid gap-[clamp(1.6rem,3vw,2.6rem)] sm:grid-cols-2">
      {quotes.map((q, i) => (
        <Reveal
          key={`${q.name}-${i}`}
          as="figure"
          /* Two columns from `sm`, so the second row starts its stagger over
             rather than trailing further behind the first. */
          delay={(i % 2) * 90}
          className={
            hasCount
              ? "m-0"
              : `m-0 border-l-2 ${
                  onDark ? "border-(--color-accent-light)" : "border-(--color-accent)"
                } pl-6`
          }
        >
          <blockquote
            className={`font-serif text-[clamp(1.2rem,1.05rem+0.55vw,1.5rem)] leading-[1.4] ${
              onDark ? "text-(--color-on-dark-primary)" : "text-(--color-ink)"
            }`}
          >
            <p>&ldquo;{q.quote}&rdquo;</p>
          </blockquote>
          <figcaption
            className={`mt-[0.85rem] text-[0.78rem] font-semibold uppercase tracking-[0.15em] ${
              onDark ? "text-(--color-on-dark-muted)" : "text-(--color-muted)"
            }`}
          >
            {q.name}
          </figcaption>
        </Reveal>
      ))}
    </div>
  );

  if (!hasCount) {
    return (
      <Band plane={onDark ? "dark" : "paper"}>
        <Wrap>
          {eyebrow ? (
            <Stack gap="gap-[clamp(2rem,4vw,3rem)]">
              <Reveal>
                <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>
              </Reveal>
              {quoteGrid}
            </Stack>
          ) : (
            quoteGrid
          )}
        </Wrap>
      </Band>
    );
  }

  return (
    <Band plane={onDark ? "dark" : "paper"}>
      <Wrap className="grid gap-[clamp(2rem,5vw,4rem)] md:grid-cols-[auto_1fr] md:items-start">
        <Reveal
          className={`flex flex-col gap-2.5 border-l-2 ${
            onDark ? "border-(--color-accent-light)" : "border-(--color-accent)"
          } pl-6`}
        >
          <div
            aria-hidden="true"
            className={`flex gap-[0.3rem] text-xl leading-none ${
              onDark ? "text-(--color-accent-light)" : "text-(--color-accent)"
            }`}
          >
            {"★★★★★"}
          </div>
          <span className="font-serif text-[clamp(2.6rem,1.9rem+2.6vw,3.9rem)] leading-[0.95] tabular-nums">
            <span className="text-[0.5em]">Over</span> {count}
          </span>
          <span
            className={`text-[0.82rem] font-semibold uppercase tracking-[0.14em] ${
              onDark ? "text-(--color-on-dark-muted)" : "text-(--color-muted)"
            }`}
          >
            {countLabel}
          </span>
        </Reveal>
        {quoteGrid}
      </Wrap>
    </Band>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENRE GRID
   ═══════════════════════════════════════════════════════════════ */

/** One tile. `feature` is the weighted one; there is at most one per grid. */
export type GenreTile = {
  label: string;
  href: string;
  image: PhotoKey;
  position?: string;
  feature?: boolean;
  wideOnMobile?: boolean;
};

/**
 * A set of destinations, as photographs you can click. The hub grid that points
 * at the pages `ServicePage` renders.
 *
 * ── WHY A 2x2 BLOCK AND NOT A WIDE TILE ────────────────────────────────────
 * The weighted tile has to be bigger without breaking the grid, and there is
 * exactly one shape that does it: two columns by two rows. The block's own shape
 * then lands on the same ratio as everything else, because a 2x2 span of a 4:5
 * unit with a uniform gap is itself ~4:5 (measured at the shipped container:
 * 848 x 1054 = 0.804 against 0.800). So the section is ONE ratio at two sizes,
 * which is what makes it read as a collection rather than as a mosaic.
 *
 * A one-row wide tile was tried first and does not work: to match the height of
 * its neighbours it needs a 5:3 landscape crop, which is a crop most portrait
 * sources cannot give.
 *
 * ── WHY THE DESKTOP COLUMN COUNT IS DERIVED ────────────────────────────────
 * The feature block occupies FOUR cells, not one, so a grid of `n` tiles has to
 * fill `n + 3` cells with no hole. Six tiles need 9 cells, which is three
 * columns; five tiles need 8, which is four. Hardcoding three columns is a bug
 * waiting for the day a tile is removed: the grid grows a dead cell at the
 * bottom right, and no test and no type can see it, because the tile count is
 * data and the column count was markup.
 *
 * So the column count is computed from the cell count instead. A count that
 * divides by neither is a real layout bug rather than a shrug, so development
 * says so out loud instead of rendering the hole.
 *
 * ── WHY THE LABEL SITS ON THE PHOTOGRAPH ───────────────────────────────────
 * Under it, the feature tile's own label would have to live inside the 2x2
 * block or below it, and either choice breaks the row alignment the block
 * depends on. On it, every tile is purely an image box and the geometry holds.
 *
 * The cost is contrast over a live photograph, so the scrim is measured rather
 * than eyeballed. The worst case is a frame ending on near-white ground: white
 * type on a 0.62 black wash over white measures 2.4:1, under the 4.5:1 floor.
 * The gradient below therefore reaches 0.82 by 78% of the tile's height and
 * 0.94 at the bottom edge, and the label block is padded so its type never
 * rises above that 78% line. Worst case measured on white: ~5.0:1.
 *
 * One line per tile, and it is deliberate. A second, smaller line would sit at
 * the same depth in the scrim while needing the same 4.5:1, and small text is
 * where a gradient over an unknown photograph stops being safe.
 */
export function GenreGrid({
  eyebrow,
  headline,
  body,
  tiles,
  id,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  tiles: readonly GenreTile[];
  id?: string;
}) {
  // The feature tile spans four cells at `lg`; every other tile spans one.
  const cells = tiles.length + (tiles.some((t) => t.feature) ? 3 : 0);
  const lgCols = cells % 3 === 0 ? 3 : cells % 4 === 0 ? 4 : 0;
  const lgColsClass = lgCols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  if (process.env.NODE_ENV === "development") {
    if (lgCols === 0) {
      console.warn(
        `GenreGrid: ${tiles.length} tiles fill ${cells} cells, which divides by ` +
          `neither 3 nor 4, so the last desktop row will strand a cell. Add or ` +
          `remove a tile, or give this grid a column count that divides ${cells}.`,
      );
    }
    /**
     * The phone grid is two columns, and a two-cell tile can only start on an
     * even column. `wideOnMobile` is therefore not a free flag: put it on a tile
     * that lands mid-row and it pushes itself to the next row and leaves the
     * hole it exists to prevent. Walk the real sequence and say so.
     */
    let col = 0;
    for (const tile of tiles) {
      const span = tile.feature || tile.wideOnMobile ? 2 : 1;
      if (span === 2 && col % 2 === 1) {
        console.warn(
          `GenreGrid: the full-width phone tile "${tile.label}" starts at ` +
            `column 2, so it wraps and strands the cell beside the tile before ` +
            `it. Drop its wideOnMobile, or reorder so an even number of ` +
            `single tiles precedes it.`,
        );
      }
      col += span;
    }
    if (col % 2 === 1) {
      console.warn(
        `GenreGrid: ${tiles.length} tiles fill ${col} phone cells, an odd ` +
          `number, so the last tile sits beside a hole. Give the last tile ` +
          `wideOnMobile.`,
      );
    }
  }

  return (
    <Band plane="paper-2" id={id}>
      <Wrap>
        <Stack gap="gap-[clamp(2.25rem,5vw,3.5rem)]">
          <Reveal>
            <SectionHead eyebrow={eyebrow} headline={headline} body={body} />
          </Reveal>
          <div
            className={`grid grid-cols-2 gap-[clamp(0.85rem,1.6vw,1.35rem)] ${lgColsClass}`}
          >
            {tiles.map((tile, i) => (
              <Reveal
                key={tile.href}
                delay={(i % 3) * 70}
                className={
                  tile.feature
                    ? "col-span-2 lg:row-span-2"
                    : tile.wideOnMobile
                      ? "col-span-2 lg:col-span-1"
                      : "col-span-1"
                }
              >
                <Link
                  href={tile.href}
                  className="group relative block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-text)"
                >
                  <Frame
                    photo={photo(tile.image)}
                    /* The feature tile gives up its own ratio from `lg` and
                       fills the two rows it spans instead; every other tile is
                       4:5 at every width. */
                    ratioClass={
                      tile.feature ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[4/5]"
                    }
                    /* Widths follow the derived column count: at three columns
                       a plain tile is ~28vw and the block ~58vw; at four they
                       are ~21vw and ~44vw. A hint that overstates the width
                       makes every phone and laptop fetch a file it does not
                       need. */
                    sizes={
                      tile.feature
                        ? lgCols === 4
                          ? "(min-width: 1024px) 44vw, 100vw"
                          : "(min-width: 1024px) 58vw, 100vw"
                        : tile.wideOnMobile
                          ? lgCols === 4
                            ? "(min-width: 1024px) 21vw, 100vw"
                            : "(min-width: 1024px) 28vw, 100vw"
                          : lgCols === 4
                            ? "(min-width: 1024px) 21vw, 50vw"
                            : "(min-width: 1024px) 28vw, 50vw"
                    }
                    position={tile.position}
                  />
                  {/* Measured scrim. See the note above the component before
                      softening any of these four stops. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_30%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.82)_78%,rgba(0,0,0,0.94)_100%)]"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-[clamp(1rem,2vw,1.6rem)]">
                    <span
                      /* `text-balance`: at 174px a label of more than two words
                         wraps, and an orphaned last word is an ugly break. */
                      className={`font-serif leading-[1.1] text-balance text-(--color-on-dark-primary) ${
                        tile.feature
                          ? "text-[clamp(1.5rem,1.15rem+1.5vw,2.5rem)]"
                          : "text-[clamp(1.15rem,1rem+0.6vw,1.6rem)]"
                      }`}
                    >
                      {tile.label}
                    </span>
                    {/* The affordance. An accent rule that opens on hover, the
                        same gesture the journal links use, rather than a button
                        stamped over a photograph. */}
                    <span
                      aria-hidden="true"
                      className="block h-px w-9 bg-(--color-accent-light) transition-[width] duration-300 group-hover:w-16"
                    />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Stack>
      </Wrap>
    </Band>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════ */

/**
 * Native `<details>`, not a JavaScript accordion: it is keyboard accessible and
 * findable by in-page search for free, and it works before hydration. The first
 * answer is open by default, because the first question should be the one
 * standing between a hesitant reader and the form.
 *
 * The heading is section furniture and belongs to this component; the questions
 * belong to the page, and the same array should feed `buildFAQSchema` at the
 * route so the visible answers and the structured ones cannot drift.
 */
export function Faq({
  eyebrow,
  headline,
  faqs,
}: {
  eyebrow: string;
  headline: string;
  faqs: readonly { question: string; answer: string }[];
}) {
  return (
    <Band plane="paper-2" id="faq">
      <Wrap>
        <Stack gap="gap-[clamp(2rem,4vw,2.75rem)]" className="items-center">
          <Reveal className="flex flex-col items-center gap-4 text-center">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Display>{headline}</Display>
          </Reveal>
          <Reveal delay={80} className="w-full max-w-[76ch]">
            {faqs.map((faq, i) => (
              <details
                key={faq.question}
                open={i === 0}
                className="group border-b border-(--color-border)"
              >
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-[1.35rem] font-serif text-[clamp(1.15rem,1.05rem+0.4vw,1.45rem)] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-sans text-[1.35rem] text-(--color-accent) transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[66ch] pb-6 text-body text-(--color-ink-soft)">
                  {faq.answer}
                </p>
              </details>
            ))}
          </Reveal>
        </Stack>
      </Wrap>
    </Band>
  );
}
