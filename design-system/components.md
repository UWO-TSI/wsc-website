# Components

Every component here has a live card in `floor.html`. Look at the card before building the React version. The second column names the file in `src/components/` that this replaces.

| Component | Replaces | Sequence |
| --- | --- | --- |
| Nav (desktop) | `layout/nav.tsx` | Fill Sweep |
| Nav (mobile) | `layout/nav.tsx` | Nav Expand |
| Footer | `layout/footer.tsx` | none |
| Preloader | `layout/preloader.tsx` | Curtain |
| Cursor | `cursor/custom-cursor.tsx` | Magnetic Pull |
| Button | `ui/button.tsx` | Magnetic Pull |
| Eyebrow | `ui/eyebrow.tsx` | travels with its title |
| Field | `contact/field.tsx` | none |
| KineticHeadline | `landing/hero.tsx` | Line Mask Reveal, Word Cascade |
| SectionHead | `landing/about-section.tsx` | Line Mask Reveal |
| StatFigure | `ui/stat-figure.tsx` | Counter Roll |
| Slab | `ui/slab.tsx` | Slab Clip |
| Marquee | `landing/partners-marquee.tsx` | Marquee Drift |
| ExecutiveGrid | `team/executive-grid.tsx` | one move on arrival |
| ThemeToggle | `ui/theme-toggle.tsx` | Theme Wipe |
| Avatar | `ui/avatar.tsx` | none |
| Chip | `ui/chip.tsx` | none |
| TimelineEvent | `events/timeline-event.tsx` | Row Expand |
| LogoWall | `sponsors/logo-wall.tsx`, `logo-card.tsx` | none |
| BentoGallery | `about/bento-gallery.tsx` | Clip Reveal |
| AsyncState | `shared/async-state-wrapper.tsx` | none |
| Skeleton | `ui/skeleton.tsx`, `ui/row-skeleton.tsx` | sweep |
| RevealImage | `ui/reveal-image.tsx` | Clip Reveal |
| CTABand | `landing/cta-section.tsx` | Slab Clip |

## Nav

One component, two modes, never two menus.

**Desktop, 1024 and up.** A floating pill: glyph, wordmark, links inline, and a `--r-pill` `--accent` indicator that slides between items on `layoutId`. No hamburger.

**Mobile.** The same pill with the hamburger on the right. It expands downward into a panel: see Nav Expand in `motion.md`. Collapses on the X, on selecting an item, on Escape, and on a click outside. There is no drawer and no scrim.

The theme toggle lives in the bar at every breakpoint, outside the panel, so it is reachable without opening the menu.

## Button

Every button is a pill. Nothing else in the system uses `--r-pill`, which is how a pressable thing announces itself with no borders.

| Variant | Rest | Hover |
| --- | --- | --- |
| Primary | `--accent` fill, `--on-accent` label, `--sh-2` | `--accent-deep`, `--sh-3` |
| Secondary | `--page` fill, `--ink` label, `--sh-1` | `--raised` |
| Tertiary | No fill, `--accent-ink` label | `--accent-veil` fill |
| Disabled | `--sunken` fill, `--ink-faint` label | none |

On an `--accent` slab the primary inverts to a `--page` fill with `--ink`, because an accent button on an accent field has nowhere to go.

Label is Instrument Sans 15px weight 500, sentence case, never wrapping. Padding 14px block, 24px inline, which clears 44px at every size. The label names the action and the confirmation echoes it: **Apply to join**, then **Application received**. A trailing arrow means the action leaves the page.

One primary per section. No icon-only buttons on the marketing site.

## Field

The component a borderless system has to get right.

The form sits in a `--sunken` slab and each input is a `--page` well at `--r-sm` inside it, one tone step away from its container in both themes. Label above in `.label`, value in `.body`, no stroke.

A light fill on white cannot reach 3:1, and no borderless light theme can. Identification is carried by the persistent visible label, which is why a placeholder-only field is forbidden here rather than discouraged. State is `--focus` at focus and `--alert` plus written text at error.

Error copy says what broke and how to fix it: "That is missing an @. Check it and send again." Never "Invalid input". Errors appear on blur or submit, never on the first keystroke. Success replaces the form with `--ok` and the words Message sent, not a toast.

Every field needs a stable `id` and a `<label for>`.

## Slab

The only divider. Inset from the viewport by the page gutter, `--r-xl` from tablet up and `--r-lg` below, separated from neighbours by 24px of visible `--page`.

Tones in order of distance from the ground: `--raised` (default), `--sunken` (recessed: footer, form bed, gallery bed), `--inverse` and `--accent` (the statement and the offer).

Adjacent slabs never share a tone, the two loud tones never touch, one loud slab per page. Do not slab everything: the hero and at least one section per page sit bare. A slab that clips its children sets `overflow: hidden` on itself so the child inherits the corner.

Never put a shadow above `--sh-1` on a slab. A slab is the page, not a thing floating above it.

## ExecutiveGrid

The roster is one grid read left to right, not a stack of titled tiers.

It used to be three labelled bands, Presidents then Vice Presidents then Assistant Vice Presidents, each a group of ledger rows. Splitting people into named ranks made the page about status rather than about the team, which is not what a club roster is for. **Organization is conveyed by layout.** The order still carries the structure, presidents first and so on down, and each person's title sits under their name for anyone who wants it, but nothing announces a boundary and no group gets a bigger cell.

Four columns from 1024 up, three from 640, two below. Every cell is identical: a `--r-disc` headshot, the name in `.title-sm`, the title in `.meta`, centred. No fill, no shadow, no border, no hover, no link. These are people, not controls, and the page has nothing to navigate to.

Headshots are always visible here, unlike on the event ledger. A profile picture is the content, not a flourish. `Avatar` layers the photo over its initials disc rather than swapping, so a missing or slow headshot shows the designed fallback instead of a hole. Object names only in the DB; call `getPublicUrl(bucket, objectName)` at runtime.

## TimelineEvent

Ledger rows inside one slab, separated by 4px, never by a line. At rest the ledger is pure type: index in `.label`, title in `.title-sm`, date in `.meta`. A wall of titles in Archivo caps reads as a schedule, not a list of cards.

Row Expand on hover, **where the row has a destination**. As built it does not: there is no event registration URL, so the row is an inert list item. A `<button>` with no handler announces itself as pressable to a screen reader and then does nothing, which is worse than no affordance at all. The expand is therefore a pointer-only response to attention. If registration links ever land, make the row a real link.

Status is a chip carrying a word, never colour alone. The `events` table has no status column and `supabase/` is off limits, so it is derived from `date`: future or today is `ok` "Open". Past events drop the chip, take `--ink-muted` and lose the expand entirely, because they are reference and should not look pressable. They render as a different element, not just a differently styled one.

## StatFigure

Number in `--f-data` at 56px with `tabular-nums`, label under it in `.label`, optional suffix in `--accent-ink`.

Only real numbers. If the figure is not something the club could defend in a room, use a SectionHead instead. Three in a row at most.

## AsyncState

Four states, and none of them is a blank screen: loading, error with a retry, empty, and 404. The spinner is a masked conic gradient, not a `border-top` trick, because borders are out. Empty states name what is missing and do not apologise.

## LogoWall

As built there is exactly **one** tier group, labelled Partners: the `sponsors` table has no `tier` column and `supabase/` is off limits, so scale comes from `display_order` (the lead tile spans two columns) rather than an invented tier. The paragraph below is what to build the day a `tier` column exists.

Also as built, the whole wall sits on `--logo-ground` with `--on-logo-ground` ink, and the marks sit directly on it with no tile behind each one. A per-logo panel on a light slab read as a grid of stickers. Same treatment for the landing page marquee.

Sponsors grouped by tier, `--gold` for the tier bar and label, the explicit mark rather than `--accent`, because a sponsor's tier must look the same in both themes. Tile scale carries the hierarchy, not a border.

Never redraw a sponsor's mark. Use their file. Where there is none, set the name in `--f-display` weight 700 in the same tile. Logos sit on `--sunken` so a single-ink mark has a predictable ground.

## BentoGallery

Three columns, the repo's existing span pattern: large 2x2, tall 1x2, wide 2x1, then three squares. Cells are `--r-sm` with `overflow: hidden`. Hover brings an `--inverse` veil and a caption. Clicking opens a lightbox with a close button, scrim click, and Escape, returning focus to the cell that opened it.

## Cursor

Dot tracks exactly, ring lags behind on a lerp. Four states: default 38px, hover 46, view 62, text 12. The ring is one of only two strokes in the system, alongside the focus ring, because a ring is its shape. Pointer devices only.
