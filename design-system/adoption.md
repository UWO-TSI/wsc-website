# Adoption

What the app actually provides, after the Floor foundation landed. `README.md` is the
system; this file is the wiring. Read both before touching a component.

Open `floor.html` in a browser first. Nothing in here substitutes for that.

## What is already done

| Concern | Where | Notes |
| --- | --- | --- |
| Tokens | `src/app/globals.css` | Every runtime var, the `@theme inline` map, the four type roles, `.slab`, `.stack`, the reveal keyframes, the texture styles. |
| Fonts | `src/app/layout.tsx` | `next/font` → `--font-archivo`, `--font-instrument`, `--font-geist-mono`, consumed by `--f-display` / `--f-text` / `--f-data`. |
| One theme | `src/app/globals.css` | Showroom only. `color-scheme: light` on `:root`. There is no theme stamp, provider or toggle. |
| Texture | `src/components/ui/texture.tsx` | Lit velvet, drawn by `Slab` when `texture` is set. Check it on card 17 in `floor.html`. |
| Reveals | `src/lib/reveal.tsx` | `useReveal()`: one shared IntersectionObserver per threshold. |
| Framer variants | `src/lib/motion.ts` | `E`, `D`, `STAGGER`, and the variants CSS cannot express. |

## The token vocabulary

Spend these. Never a hex, never a raw number, never a new curve.

Tailwind utilities resolve through `@theme inline`:

- Surfaces: `bg-page`, `bg-raised`, `bg-sunken`, `bg-inverse`, `bg-accent`, `bg-accent-veil`, and
  `bg-inverse-tile` for a tile inside an inverse slab
- Ink: `text-ink`, `text-ink-muted`, `text-ink-faint`, `text-on-inverse`, `text-on-accent`, `text-accent-ink`
- Fixed marks: `text-velvet`, `text-gold`, `bg-gold`: the Western lockup and sponsor tiers only
- Logo ground: `bg-logo-ground` with `text-on-logo-ground`, the third fixed mark. Every supplied
  logo is placed on it: sponsor tiles on the partners page and in the landing marquee, and the
  Tethos lockup in the footer. A sponsor's mark is artwork we may not redraw and most are
  light-on-transparent, so they wash out on the white page ground.
- The accent **as a word** is `.accent-mark`, not the `text-accent-ink` utility. `--accent-ink` is
  legible on `--page`, `--raised` and `--sunken` and nowhere else: on an `accent` slab it is the
  ground itself, and on `inverse` or `logo` it is a near match. `.accent-mark` falls back to that
  slab's own ink automatically, and a tertiary `Button` does the same through `.btn-tertiary`. Use
  it for section numerals, stat suffixes, and anything else spending the accent as type.
- Our own single-ink marks (the club shark, the two social glyphs) are the opposite case: they are
  masked and filled with `currentColor` via `.mark-mask`, so one white asset reads correctly on
  every ground and can take `--accent` on hover. Never recolour a sponsor's mark this way.
- Status: `text-ok`, `text-warn`, `text-alert`, always with a word
- Corners: `rounded-xs|sm|md|lg|xl|pill`, `rounded-full` for a disc
- Elevation: `shadow-1`, `shadow-2`, `shadow-3`
- Easing: `ease-enter`, `ease-exit`, `ease-move`, `ease-snap`
- Families: `font-display`, `font-text`, `font-data`

Durations and layers have no Tailwind alias on purpose, so write them as the var:
`duration-[var(--d-hover)]`, `z-[var(--layer-nav)]`.

Type roles are plain classes, not utilities: `title-hero`, `title`, `title-sm`, `subtitle`,
`body`, `body-sm`, `label`, `meta`. There is nothing between them. `measure` caps running copy
at the 62 character measure.

## Primitives

All in `src/components/`. Compose from these; do not rebuild them.

| Import | Props worth knowing |
| --- | --- |
| `ui/button` | `variant: 'primary' \| 'secondary' \| 'tertiary'`, `href`, `arrow`, `disabled`. Magnetic Pull is built in. One primary per section. Inside an inverse, accent or logo `Slab` the primary takes the page fill on its own; `onAccent` is deprecated and does nothing. |
| `ui/eyebrow` | `index` renders the section numeral in `--accent-ink`. |
| `ui/slab` | `tone: 'page' \| 'raised' \| 'sunken' \| 'inverse' \| 'accent' \| 'logo'`, `texture` (inverse and accent only: `sweep`, `rise`, `arc`, `waist`, `pair`), `clip` for Slab Clip, `overflowHidden`, `as`. Provides its tone to `useSlabTone()`. |
| `ui/section-head` | `title` is an **array, one entry per visual line**. Owns its own Line Mask Reveal. |
| `ui/chip` | `status: 'ok' \| 'warn' \| 'alert' \| 'neutral'`. The word is the signal. |
| `ui/stat-figure` | `value: number`, `label`, `suffix`. Counter Roll at 70% visible. Real numbers only, three in a row at most. |
| `ui/avatar` | `name`, `src`, `size`. Missing headshot renders initials on `--sunken`, by design. |
| `shared/async-state-wrapper` | Loading, error with retry, empty. Empty copy names what is missing. |

## Layout and alignment

A section is a full-width container: it spans the viewport with no side gap, takes `--r-xl`, and
puts `--gut` inside itself as inline padding. `.slab` does all three. Containers that meet are 2px
apart: wrap them in `.stack`. Do not add `mx-[var(--gut)]` or any side margin to a slab.

- **Selling sections are centred:** the hero, section heads and closing bands. Eyebrow, then the
  Archivo title, then at most three lines of copy, then the buttons.
- **Reading content is left-aligned:** long paragraphs and the event ledger.

On an inverse, accent or logo slab the focus ring and the primary button adapt on their own (see
`Slab` and `Button` in `components.md`). A loud slab that sells takes `texture`; see the shape
table in `components.md`.

## Patterns every page copies

Three pieces set on the home page. Pages compose them; they do not add their own.

**Closing band.** `src/components/layout/closing-band.tsx`, the last child of every public page.
Title Join, one or two sentences for both audiences, then two buttons side by side: Apply to join
(students, primary) and a business button (secondary, which on the accent slab takes the slab's ink).

| Prop | Default | Use |
| --- | --- | --- |
| `titleKeys` | `['home.cta.title_line1']` (Join) | One `site_content` key per visual line. |
| `eyebrowKey` | none | Optional. Off by default, because an eyebrow over the title Join repeats it. |
| `bodyKey` | `home.cta.subtitle` | One or two sentences. `null` for none. |
| `businessAction` | `EditableButton` on `home.cta.business_label` / `home.cta.business_href`, secondary (Get in touch, `/contact-us`) | Replaces the business button only. Apply to join on `home.cta.button_*` always stays. |
| `id` | `closing-heading` | The heading id the section is labelled by. |

```tsx
<ClosingBand />                                       // home, legal pages, events, team
<ClosingBand
  businessAction={
    <EditableButton
      labelKey="sponsors.cta.partner_label"
      hrefKey="sponsors.cta.partner_href"
      variant="secondary"
    />
  }
/>
```

It is the page's one loud slab, except for the page head: a page other than home may open with `PageHead` (below). A page that ends with the band has no other `inverse` or `accent` slab, and the section above it is not `accent`. Server-component pages can render it directly; for a page whose root is one element, return a fragment with the band after it.

**Page head.** `src/components/layout/page-head.tsx`, `PageHead`, the first child of every public
page other than home: an `inverse` slab with the `waist` ribbon and a `CentredHead` as the `h1`. It owns
the padding (the hero's, `clamp(7.5rem,14vw,11rem)` top and `clamp(3rem,7vw,5.5rem)` bottom), so pages
never set one.

| Prop | Default | Use |
| --- | --- | --- |
| `titleKeys` | required | One `site_content` key per visual line. |
| `eyebrowKey` | none | The eyebrow over the title. |
| `bodyKey` | none | At most three lines of copy under the title. |
| `id` | required | The `h1` id the slab is labelled by. Unique per page. |

```tsx
<PageHead id="about-title" eyebrowKey="about.header.eyebrow" titleKeys={['about.header.title']} />
```

**Centred section head.** `src/components/ui/centred-head.tsx`, `CentredHead`: `titleKeys`, `eyebrowKey`, `index`, `bodyKey`, `bodyRole`, `id`, `as`, and the buttons as children. Use it for every section head on a selling page. `SectionHead` stays for left-aligned heads whose title is not editable copy.

**The one action.** Apply to join is always `<EditableButton labelKey="home.cta.button_label" hrefKey="home.cta.button_href" arrow />`. The nav already carries it at every width. Never give a page its own Apply to join key.

**A label-only button.** When a button's label is a `site_content` key but its action is not (a
row's own URL, a form submit), omit `hrefKey` and pass the action instead: `href`, `type`, `disabled`,
`aria-label`, and `label` for a busy state such as Sending. While editing, the label field sits over an
inert copy of the button, as it does for every `EditableButton`. Never put an `EditableText` inside a
`Button`: in edit mode that nests a field in a real `<button>`.

```tsx
<EditableButton labelKey="events.ledger.register_label" variant="secondary" href={event.register_url} />
<EditableButton labelKey="contact.form.submit_label" type="submit" disabled={busy} label={busy ? 'Sending' : undefined} />
```

**Full width.** The shell wraps `main` and the footer in one `.stack`, so the last section of a page meets the footer 2px apart. A page with several slabs wraps them in its own `.stack`.

## Running a sequence

Scroll-triggered sequences are CSS keyframes gated on `[data-run]`, driven by `useReveal()`.
Motion law 1 is why: the server-rendered HTML carries no `data-run`, so a crawler, a no-JS
request and a viewer landing mid-page all get a finished page. The hidden state is something
JS opts into.

```tsx
const ref = useReveal<HTMLDivElement>();          // 0.15 threshold, shared observer
<div ref={ref}>
  <h2 className="title">
    <span className="ln"><i>Trained on</i></span>  {/* Line Mask Reveal */}
    <span className="ln"><i>the floor</i></span>
  </h2>
  <p className="subtitle cascade">{cascade('Not in a classroom.')}</p>
  <figure className="clip-cell"><span className="clip-inner">…</span></figure>
</div>
```

Classes: `ln > i` (Line Mask), `cascade > span` (Word Cascade), `clip-slab` (Slab Clip),
`clip-cell` + `clip-inner` (Clip Reveal), `arrive` (the single move for the one element per
section that is not a title, a slab or an image). Stagger children by setting `--i` on each.

`useReveal({ threshold, immediate, enabled })`. `immediate` skips the observer, for the hero.
`enabled: false` leaves the element at rest, which is how a section waits out the preloader.

Framer Motion owns what CSS cannot: `layoutId` on the nav indicator, `AnimatePresence` for the
preloader, lightbox and mobile panel, and the measured-height nav panel. GSAP owns exactly one
thing, Scroll Scrub on the story section, and loads only on that route.

Reduced motion is already handled per sequence in `globals.css` and in `useReveal`. Do not add
a blanket `animation: none` anywhere: it would leave masked content invisible.

## Data decisions taken during adoption

Both follow from hard rule 1, never touch `supabase/`. Revisit them only with a migration.

- **Sponsor tiers.** `sponsors` has no `tier` column, so LogoWall ships one `--gold` tier bar
  reading "Partners" and takes tile scale from `display_order` rather than inventing a tier.
  `--gold`, not `--accent`, because a sponsor's standing must read the same on every page.
- **Event status.** `events` has no status column, so the Open / Closed chip derives from
  `date`. Future or today is `ok` "Open". Past events drop the chip, take `--ink-muted` and
  lose the hover expand, because they are reference and should not look pressable.
- **Stat figures.** The three on the landing page (150 members, 10 annual events, 5 industry
  partners) are the club's own existing claims. Do not add a fourth, and do not invent one.

## Loading

The rule: **a section reserves its own space from the first paint and fills in.** Nothing appears
out of nowhere when a query resolves or an image decodes.

Three things follow from it, and all three were wrong before:

1. **The slab goes outside the async wrapper, not inside.** The band, its tone and its corner are
   known before the data is, so they paint immediately and only the contents fill in. With the
   wrapper outside there is no slab at all while loading, and the whole section arrives at once.
2. **`AsyncStateWrapper` takes a `skeleton`.** Always pass one for a list or a grid, built to the
   shape of the real content. The spinner fallback is only right where the content genuinely has
   no predictable shape, because its bed is a different shape from whatever replaces it and the
   page reflows when the two swap. `RowSkeleton` covers both ledger directories.
3. **Images go through `RevealImage`**, never a bare `next/image`, in anything user-facing. It
   holds its aspect ratio from the first paint, skeletons behind the picture, and gates the reveal
   on `useReveal`'s `ready` flag so the sequence waits for the bytes rather than just the viewport.
   `sequence="clip"` is Clip Reveal and is right for photography; `sequence="fade"` is for a
   supplied logo, which has no meaningful moment of arrival.

A component that already has a designed fallback does not need a skeleton on top of it. `Avatar`
layers the headshot over its initials disc rather than swapping between them, so the fallback is
the loading state.

Never return `null` from a section while its query is in flight. That is the worst version of the
problem: the section does not exist, and then the page grows by a whole band and shoves everything
below it down.

## Motion deviations from the spec

Two of the sequences ship differently from `motion.md`. Both differences are
intended, and both are reversible.

- **Sequence 7, Marquee Drift, has no scroll skew.** The spec gives the track a `skewX` up to 4
  degrees proportional to scroll velocity. Built and shipped, it read as a rendering glitch rather
  than as momentum, so it was cut under motion law 3: a move either carries meaning or it does not
  ship. Everything else in the sequence stands, and the marquee gained two things the spec does not
  describe: it counts how many copies it needs from the real rendered width instead of hardcoding
  two (with few sponsors, two copies can be narrower than the viewport and the loop shows a gap),
  and its duration is derived from one group's width at a constant px/sec so the speed does not
  change with the number of partners.
- **Sequence 8, Scroll Scrub, is not used anywhere.** It existed only on the about page's story
  section, over two panels and 200vh, which meant the pin grabbed the page and released it inside
  half a screen. That section is now four statically laid out panels on an asymmetric grid. The
  sequence remains part of the system and its card is still in `floor.html`; nothing on the site
  currently spends it. **GSAP is therefore no longer a dependency**, so if you reintroduce Scroll
  Scrub, install it and import it dynamically inside that route's component and subscribe ScrollTrigger to Lenis
  there through `useLenis()`, never in `LenisProvider`, which is mounted everywhere.

## Images

`public/` is organized by what a file **is**, not by where it is used. Only `robots.txt` sits at
the root.

| Folder | Holds |
| --- | --- |
| `public/logos/` | Brand marks, ours and other people's: the club shark, the Tethos mark, the social glyphs. |
| `public/screenshots/` | README captures. Not used by the site. |

**No photography lives in the repo.** Every photo is an admin-managed slot (`src/lib/image-slots.ts`,
`site_images`), uploaded through `/admin` → Images into the `site-images` bucket: JPEG, PNG, WebP or
AVIF, 2 MB at most, enforced by the bucket. Camera originals are kept outside git in the
gitignored `archive/`.

The social share image is `src/app/opengraph-image.png`, a Next file convention rather than a
`public/` asset: it is served, sized and injected into the OpenGraph and Twitter tags
automatically, with its alt text from `opengraph-image.alt.txt`. Do not add an explicit `images`
entry to the metadata alongside it.

## Copy

Literal, grounded, confident, concise. Benchmark is Stripe and Cloudflare, not a student club
microsite. Say what the club does in the plainest accurate words.

Banned: slogan syntax ("One X, every Y"), superlatives ("premier", "seamless", "endless"),
comparative positioning ("not your average club"), cutesy section labels, fragment-punchiness,
and em dashes anywhere, including in code comments.

Titles are Archivo all caps by the type role, so pass the words and let the role do the
casing. A button label names the action and its confirmation echoes it: "Apply to join", then
"Application received". Error copy says what broke and how to fix it: "That is missing an @.
Check it and send again", never "Invalid input".

## Migration status

Complete. Every component on the public site and in `/admin` is on Floor, the pre-Floor
`motion-legacy.ts` shim is deleted, and no `--color-*` token or hex literal remains in `src/`.

## Before you call a component done

1. Look at it rendered, on every tone it can be placed on.
2. Keyboard only. Every row, chip and control reachable, focus ring never removed.
3. No borders. Not on a section, a row, an input or an image.
4. One primary button per section, adjacent slabs never the same tone, one loud slab per page. The one exception is the page head: an inverse page head with the waist ribbon may open a page that ends with the closing band.
5. Reduced motion on. Nothing is invisible, nothing loops, and the grain is still.
6. `npx tsc --noEmit` and `npm run lint` clean, `npm run build` passing.
7. Its card exists in `floor.html`. If it is not in `floor.html`, it does not exist.

## The preloader handoff

`usePreloader()` from `src/providers/preloader-provider.tsx` returns `{ complete, markComplete }`.

Motion law 2 gives the one orchestrated moment to the hero, and it has to start as the Curtain
leaves rather than play underneath it. So the hero holds its reveal on `complete`:

```tsx
const { complete } = usePreloader();
const ref = useReveal<HTMLElement>({ immediate: true, enabled: complete });
```

Everything below the fold ignores this and uses the observer as usual. On any route with no
preloader, including `/admin`, `complete` is true from the first render.
