# Adoption

What the app actually provides, after the Floor foundation landed. `README.md` is the
system; this file is the wiring. Read both before touching a component.

Open `floor.html` in a browser first. Nothing in here substitutes for that.

## What is already done

| Concern | Where | Notes |
| --- | --- | --- |
| Tokens | `src/app/globals.css` | Every runtime var, the `@theme inline` map, the four type roles, `.slab`, `.stack`, the reveal keyframes. |
| Fonts | `src/app/layout.tsx` | `next/font` → `--font-archivo`, `--font-instrument`, `--font-geist-mono`, consumed by `--f-display` / `--f-text` / `--f-data`. |
| Theme stamp | `src/app/layout.tsx` | Blocking script reads `localStorage['wsc-theme']`, falls back to `prefers-color-scheme`, writes `data-theme` on `<html>` before paint. |
| Theme state | `src/providers/theme-provider.tsx` | `useTheme()` → `{ theme, setTheme, toggleTheme }`. Reads the stamped attribute through `useSyncExternalStore`; do not mirror it in state anywhere else. |
| Theme Wipe | `src/lib/theme.ts` | Sequence 11. Pass the toggle element as `origin`. |
| Reveals | `src/lib/reveal.tsx` | `useReveal()`: one shared IntersectionObserver per threshold. |
| Framer variants | `src/lib/motion.ts` | `E`, `D`, `STAGGER`, and the variants CSS cannot express. |

## The token vocabulary

Spend these. Never a hex, never a raw number, never a new curve.

Tailwind utilities resolve through `@theme inline`, so one class name is velvet in Showroom
and gold in Afterhours:

- Surfaces: `bg-page`, `bg-raised`, `bg-sunken`, `bg-inverse`, `bg-accent`, `bg-accent-veil`
- Ink: `text-ink`, `text-ink-muted`, `text-ink-faint`, `text-on-inverse`, `text-on-accent`, `text-accent-ink`
- Fixed marks: `text-velvet`, `text-gold`, `bg-gold`: the Western lockup and sponsor tiers only
- Logo ground: `bg-logo-ground` with `text-on-logo-ground`, the third fixed mark and the one
  surface that does **not** flip with the theme. Every supplied logo sits on it: sponsor tiles on
  the partners page and in the landing marquee, and the TSI lockup in the footer. A sponsor's mark
  is artwork we may not redraw and most are light-on-transparent, so they wash out on the Showroom
  ground. Ink on it is `--on-logo-ground`, never `--on-inverse`, which flips and would put dark
  text on a dark ground in Afterhours.
- Our own single-ink marks (the club shark, the two social glyphs) are the opposite case: they are
  masked and filled with `currentColor` via `.mark-mask`, so one white asset reads correctly in
  both themes and can take `--accent` on hover. Never recolour a sponsor's mark this way.
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
| `ui/button` | `variant: 'primary' \| 'secondary' \| 'tertiary'`, `href`, `arrow`, `onAccent`, `disabled`. Magnetic Pull is built in. One primary per section. |
| `ui/eyebrow` | `index` renders the section numeral in `--accent-ink`. |
| `ui/slab` | `tone: 'raised' \| 'sunken' \| 'inverse' \| 'accent'`, `clip` for Slab Clip, `overflowHidden`, `as`. |
| `ui/section-head` | `title` is an **array, one entry per visual line**. Owns its own Line Mask Reveal. |
| `ui/chip` | `status: 'ok' \| 'warn' \| 'alert' \| 'neutral'`. The word is the signal. |
| `ui/stat-figure` | `value: number`, `label`, `suffix`. Counter Roll at 70% visible. Real numbers only, three in a row at most. |
| `ui/avatar` | `name`, `src`, `size`. Missing headshot renders initials on `--sunken`, by design. |
| `ui/theme-toggle` | Lives in the nav bar at every breakpoint, outside the mobile panel. |
| `shared/async-state-wrapper` | Loading, error with retry, empty. Empty copy names what is missing. |

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
  `--gold`, not `--accent`, because a sponsor's standing must read the same in both themes.
- **Event status.** `events` has no status column, so the Open / Closed chip derives from
  `date`. Future or today is `ok` "Open". Past events drop the chip, take `--ink-muted` and
  lose the hover expand, because they are reference and should not look pressable.
- **Stat figures.** The three on the landing page (150 members, 10 annual events, 5 industry
  partners) are the club's own existing claims. Do not add a fourth, and do not invent one.

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

1. Both themes. Toggle it and look.
2. Keyboard only. Every row, chip and control reachable, focus ring never removed.
3. No borders. Not on a section, a row, an input or an image.
4. One primary button per section, one loud slab per page, adjacent slabs never the same tone.
5. Reduced motion on. Nothing is invisible, nothing loops.
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
