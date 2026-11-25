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
| SectionHead | `ui/section-head.tsx` | Line Mask Reveal |
| CentredHead | `ui/centred-head.tsx` | Line Mask Reveal |
| StatFigure | `ui/stat-figure.tsx` | Counter Roll |
| Slab | `ui/slab.tsx` | Slab Clip |
| Texture | `ui/texture.tsx` | Grain Shift (a loop) |
| Marquee | `landing/partners-marquee.tsx` | Marquee Drift |
| ExecutiveGrid | `team/executive-grid.tsx` | one move on arrival |
| Avatar | `ui/avatar.tsx` | none |
| Chip | `ui/chip.tsx` | none |
| TimelineEvent | `events/timeline-event.tsx` | Row Expand |
| LogoWall | `sponsors/logo-wall.tsx`, `logo-card.tsx` | none |
| AsyncState | `shared/async-state-wrapper.tsx` | none |
| Skeleton | `ui/skeleton.tsx`, `ui/row-skeleton.tsx` | sweep |
| RevealImage | `ui/reveal-image.tsx` | Clip Reveal |
| ClosingBand | `layout/closing-band.tsx` (was `landing/cta-section.tsx`) | Slab Clip |
| PageHead | `layout/page-head.tsx` | Line Mask Reveal (through CentredHead) |
| InlineText, InlineParagraph | `edit/engine/fields.tsx` (`EditText`), via `edit/editable-text.tsx` | none |
| InlineHeading | `edit/engine/fields.tsx` (`EditLines`), via `edit/editable-lines.tsx` | none |
| InlineLabel | `edit/engine/fields.tsx` (`EditButton`), via `edit/editable-button.tsx` | none |
| PhotoSlot | `edit/engine/fields.tsx` (`EditImage`), via `edit/editable-image.tsx` | none |
| EditBar, Tray | `edit/engine/edit-bar.tsx`, `edit/engine/edit.css` | Publish label changes in place |
| InlineSelect, InlineNumber, VisibilityChip, StateChip, Grip, AddTile | `edit/engine/list-parts.tsx`, used by `edit/engine/list-editors.tsx` | Reorder (card 15 move row), Add tile (Clip Reveal), removal on Publish |
| Settings page | `app/admin/settings/` (was the dashboard's Admins tab, `app/admin/components/admin-users.tsx`) | none |

## Nav

One component, two modes, never two menus.

**Desktop, 1024 and up.** A floating pill: glyph, wordmark, links inline, and a `--r-pill` `--accent` indicator that slides between items on `layoutId`. No hamburger.

**The one action.** Apply to join sits in the pill as a primary `Button` at every width, phones included, after the links on desktop and before the hamburger on mobile. It reads `home.cta.button_label` and `home.cta.button_href` through `EditableButton`, the same keys as the hero, About and the closing band. Below 640 the wordmark gives way to it and the shark alone marks the home link (the link keeps its accessible name).

**Mobile.** The same pill with the hamburger on the right. It expands downward into a panel: see Nav Expand in `motion.md`. Collapses on the X, on selecting an item, on Escape, and on a click outside. There is no drawer and no scrim.

## Button

Every button is a pill. Nothing else in the system uses `--r-pill`, which is how a pressable thing announces itself with no borders.

| Variant | Rest | Hover |
| --- | --- | --- |
| Primary | `--accent` fill, `--on-accent` label, `--sh-2` | `--accent-deep`, `--sh-3` |
| Secondary | `--page` fill, `--ink` label, `--sh-1` | `--raised` |
| Tertiary | No fill, `--accent-ink` label | `--accent-veil` fill |
| Disabled | `--sunken` fill, `--ink-faint` label | none |

On an `--inverse`, `--accent` or `--logo-ground` slab the primary takes the page fill (the secondary variant), because a velvet button on these grounds has too little contrast to read as a button. The secondary and tertiary take the slab's own ink, with a hover fill mixed from it. Button reads the tone from the enclosing `Slab`, so a page passes no flag. The old `onAccent` prop is deprecated and has no effect.

Label is Instrument Sans 15px weight 500, sentence case, never wrapping. Padding 14px block, 24px inline, which clears 44px at every size. The label names the action and the confirmation echoes it: **Apply to join**, then **Application received**. A trailing arrow means the action leaves the page.

One primary per section. No icon-only buttons on the marketing site.

## CentredHead

The head of a selling moment, centred: the page head, the closing band, and a home section that is one message and a link (About, Partners). Eyebrow, the Archivo title (one `site_content` key per visual line, Line Mask Reveal), at most three lines of copy, then the buttons as children in one centred row. Every string is read through the edit components, so in edit mode the head is a filled-in form. A section whose job is reading or scanning content takes SectionHead instead.

Props: `titleKeys`, `eyebrowKey`, `index`, `bodyKey`, `bodyRole` (`body` for a section head, `subtitle` for a closing band), `id`, `as` (`h2` by default), `children`.

## SectionHead

The head of a section whose job is reading or scanning content, left-aligned: the About story, the event ledger on the home page. Eyebrow (with the section numeral), the Archivo title with Line Mask Reveal, optional meta or copy, then any buttons, all on the left edge the content below starts from. The content keeps that edge: the head and the paragraphs, ledger or photo under it share one left edge, the gutter on an inner page.

Props: `titleKeys` (editable, one key per visual line) or `title` (fixed lines), `eyebrowKey` or `eyebrow`, `index`, `meta`, `bodyKey`, `id`, `as`, `children`.

## Hero

The home page's first section, `landing/hero.tsx`. An `inverse` slab with the `waist` ribbon, full width, with the photo slot `home.hero.image1` as its background: a RevealImage at `absolute inset-0` with `veil`, so `--inverse-veil` sits between the photo and the head. The head is centred and keeps KineticHeadline's motion (Line Mask Reveal, Word Cascade, held on the Curtain). The photo is a sibling of the head and runs its own Clip Reveal, held on the Curtain the same way. Empty, it shows the placeholder every other empty slot shows (the 9 percent ink wash on `--page`) as an opaque surface over the ribbon, under the same veil, so the area reads as a photo area; the hero's secondary ink measures 5.0:1 over it. For visitors the photo is decoration under the veil and the h1 carries the meaning, so it renders with an empty alt inside an `aria-hidden` wrapper. In edit mode the photo is a PhotoSlot with Add photo or Replace photo at its bottom left.

Padding is the page head's: `clamp(7.5rem,14vw,11rem)` top and `--pad-section` bottom. The stats row under it takes `--pad-section` on both sides.

## ClosingBand

The last section of every public page, directly above the footer. An `accent` slab with the `sweep` ribbon and Slab Clip, holding a CentredHead: the title Join (`home.cta.title_line1`), one or two sentences for both audiences (`home.cta.subtitle`), then two buttons side by side. Apply to join is for students and reads `home.cta.button_*`, the same keys as the nav, the hero and About. The business button, Get in touch (`home.cta.business_*`), is the secondary variant, which on the accent slab takes the slab's own ink. No eyebrow by default, since one over the title Join repeats it; `eyebrowKey` adds one.

Apart from the page head (inverse, waist ribbon), it is the page's one loud slab, so no other inverse or accent slab goes on a page that ends with it. A page replaces only the business button, through `businessAction`: Partners passes Become a partner, which opens the contact form, and keeps Apply to join.

## PageHead

The first section of every public page other than home: an `inverse` slab with the `waist` ribbon holding a CentredHead as the page's `h1` (eyebrow, title, optional copy). One padding on every page, the hero's: `clamp(7.5rem,14vw,11rem)` top, which clears the fixed nav pill at 375 and 1280, and `--pad-section` bottom. Pages pass keys only, never a padding or a tone.

Props: `titleKeys`, `eyebrowKey`, `bodyKey`, `id` (the h1 id the slab is labelled by, unique per page). The legal pages, whose copy is not in `site_content`, pass `titleLines` (fixed strings, same Line Mask Reveal, not fields in edit mode) instead of `titleKeys`; CentredHead takes the same prop.

With the ClosingBand it is the only other loud slab a page may carry.

## Field

The component a borderless system has to get right.

The form sits in a `--sunken` slab and each input is a `--page` well at `--r-sm` inside it, one tone step away from its container. Label above in `.label`, value in `.body`, no stroke.

A light fill on white cannot reach 3:1, and no borderless light theme can. Identification is carried by the persistent visible label, which is why a placeholder-only field is forbidden here rather than discouraged. State is `--focus` at focus and `--alert` plus written text at error.

Error copy says what broke and how to fix it: "That is missing an @. Check it and send again." Never "Invalid input". Errors appear on blur or submit, never on the first keystroke. Success replaces the form with `--ok` and the words Message sent, not a toast.

Every field needs a stable `id` and a `<label for>`.

## Slab

The only divider. A slab spans the full viewport width with no side gap and takes `--r-xl`. Slabs that meet are 2px apart (`.stack`), and that 2px of `--page` plus the tone change is the divider. The page gutter is the slab's inline padding, so content keeps its inset. Photos, fields, buttons and chips inside keep their own rounded shapes.

Tones in order of distance from the ground: `--raised` (default), `--sunken` (recessed: footer, form bed, gallery bed), `--inverse` and `--accent` (the statement and the offer).

Adjacent slabs never share a tone, the two loud tones never touch, one loud slab per page except an inverse page head above the closing band. Do not slab everything. On an inner page only the page head and the closing band are slabs; the content sections between them are bare on `--page` with `--pad-section` above and below, except the contact form (`sunken`) and the Partners logo wall (`logo`). A slab that clips its children sets `overflow: hidden` on itself so the child inherits the corner.

A slab is flat. A shadow would fill the 2px join, and a slab is the page, not a thing floating above it.

On an `--inverse`, `--accent` or `--logo-ground` slab the focus ring takes the slab's text colour, and a primary button takes the page fill. Both are handled by the slab; the page does nothing.

`texture` (`sweep`, `rise`, `arc`, `waist`, `pair`) is allowed on the two loud tones only and is a type error elsewhere. It gives the slab its lit ground and draws the Texture behind the content.

## Texture

The signature Lit velvet texture, in `ui/texture.tsx`, drawn only by `Slab`. Layers, back to front: the lit ground (the slab's background, lit from one point), moving grain, the ribbon, the dot matrix. The ribbon is an SVG of solid lines `--tex-dot` thick, drawn on the client into an absolutely positioned layer, so drawing it moves nothing. It redraws only when the slab's size changes, and the same size always draws the same ribbon.

| Shape | Use |
| --- | --- |
| `sweep` | Closing band. Bottom edge to right edge. |
| `rise` | Statement slab. Left edge to top edge. |
| `arc` | Stats band. One crest that swells in the middle. |
| `waist` | Page head. Wide, narrow, wide. |
| `pair` | Wide, short band. Two ribbons, one following the other. |

Accent gives lit velvet, inverse gives lit velvet black. Every shape works on both. The numbers, the `RIBBONS` table and the `SPREAD` table are copied from `docs/redesign/reference.html`; change them there first. Card 17 in `floor.html` renders every shape on both grounds.

## ExecutiveGrid

The roster is one grid read left to right, not a stack of titled tiers.

It used to be three labelled bands, Presidents then Vice Presidents then Assistant Vice Presidents, each a group of ledger rows. Splitting people into named ranks made the page about status rather than about the team, which is not what a club roster is for. **Organization is conveyed by layout.** The order still carries the structure, presidents first and so on down, and each person's title sits under their name for anyone who wants it, but nothing announces a boundary and no group gets a bigger cell.

Bare on `--page`, starting from the gutter. Four columns from 1024 up, three from 640, two below. Every cell is identical: a `--r-disc` headshot, the name in `.title-sm`, the title in `.meta`, centred in the cell. No fill, no shadow, no border, no hover, no link. These are people, not controls, and the page has nothing to navigate to.

Headshots are always visible here, unlike on the event ledger. A profile picture is the content, not a flourish. `Avatar` layers the photo over its initials disc rather than swapping, so a missing or slow headshot shows the designed fallback instead of a hole. Object names only in the DB; call `getPublicUrl(bucket, objectName)` at runtime.

## TimelineEvent

Ledger rows inside one slab, separated by 4px, never by a line. At rest the ledger is pure type: index in `.label`, title in `.title-sm`, date in `.meta`. A wall of titles in Archivo caps reads as a schedule, not a list of cards.

Row Expand on hover, **where the row has a destination**. As built it does not: there is no event registration URL, so the row is an inert list item. A `<button>` with no handler announces itself as pressable to a screen reader and then does nothing, which is worse than no affordance at all. The expand is therefore a pointer-only response to attention. If registration links ever land, make the row a real link.

Status is a chip carrying a word, never colour alone. The `events` table has no status column and `supabase/` is off limits, so it is derived from `date`: future or today is `ok` "Open". Past events drop the chip, take `--ink-muted` and lose the expand entirely, because they are reference and should not look pressable. They render as a different element, not just a differently styled one.

## StatFigure

Number in `--f-data` at 56px with `tabular-nums`, label under it in `.label`, optional suffix in `--accent-ink`.

Only real numbers. If the figure is not something the club could defend in a room, use a SectionHead instead. Three in a row at most.

The home stats row is a selling moment, so it is centred as a group: each figure takes a column of the same width (up to 240px), and the columns are centred together. Two figures sit in the middle with the spacing three have, never beside an empty third column.

## AsyncState

Four states, and none of them is a blank screen: loading, error with a retry, empty, and 404. The spinner is a masked conic gradient, not a `border-top` trick, because borders are out. Empty states name what is missing and do not apologise.

## LogoWall

As built there is exactly **one** tier group, labelled Partners: the `sponsors` table has no `tier` column and `supabase/` is off limits, so scale comes from `display_order` (the lead tile spans two columns) rather than an invented tier. The paragraph below is what to build the day a `tier` column exists.

Also as built, the whole wall sits on `--logo-ground` with `--on-logo-ground` ink, and the marks sit directly on it with no tile behind each one. A per-logo panel on a light slab read as a grid of stickers. Same treatment for the landing page marquee. On Partners this puts three dark sections in a row (the inverse page head, the wall, the closing band). That is an accepted exception to the one-loud-pair rule: supplied logos are mostly light marks on transparent backgrounds and need the dark ground.

Sponsors grouped by tier, `--gold` for the tier bar and label, the explicit mark rather than `--accent`, because a sponsor's tier must look the same on every page. Tile scale carries the hierarchy, not a border.

Never redraw a sponsor's mark. Use their file. Where there is none, set the name in `--f-display` weight 700 in the same tile. Logos sit on `--sunken` so a single-ink mark has a predictable ground.

## RevealImage

A frame that holds its aspect ratio from the first paint, keeps the skeleton mounted behind the picture, and runs Clip Reveal once the bytes are there. The crop is the frame's job: the file is drawn `object-fit: cover` inside a fixed-aspect wrapper, so a wide photo in a tall frame scales up and crops, and the frame never resizes.

Three states, all at the frame's own size:

- **Loading** (`src` undefined, or bytes in flight): the skeleton with its sweep.
- **Loaded**: the photo, after Clip Reveal. The skeleton is still behind it and its sweep has stopped.
- **Empty slot** (`src` null): the placeholder. The skeleton surface with the sweep stopped takes the photo's place inside the clip cell and runs the same Clip Reveal a photo runs, at the frame's size and aspect ratio, with no label. There is no skeleton behind it, since a surface revealed over the same surface shows no motion. No new token. The frame reports ready at once, so a held group is never stuck on it. Visitors, Preview and edit mode all see it, for every slot in `src/lib/image-slots.ts` that has not been filled.

`veil` lays `--inverse-veil` over a photo for text set on it (the hero). An empty veiled slot keeps the veil, and its placeholder is set on `--page` with the page's ink, so it is the same surface every other empty slot shows. On the inverse slab the plain wash would take the slab's light ink and disappear under the veil.

`.skeleton` is in the components layer, so the caller's utilities (`absolute inset-0`, `rounded-full`) win over its defaults.

Every photo on the public site is a slot named `page.section.imageN`; see `src/lib/image-slots.ts`. Brand marks are not slots.

## BentoGallery

Three columns, the repo's existing span pattern: large 2x2, tall 1x2, wide 2x1, then three squares. Cells are `--r-sm` with `overflow: hidden`. Hover brings an `--inverse` veil and a caption. Clicking opens a lightbox with a close button, scrim click, and Escape, returning focus to the cell that opened it.

## Cursor

Dot tracks exactly, ring lags behind on a lerp. Four states: default 38px, hover 46, view 62, text 12. The ring is one of only two strokes in the system, alongside the focus ring, because a ring is its shape. Pointer devices only.

## Editor (admin)

Card 15 in `floor.html`. The dashboard that used it was removed: content is edited in place in edit mode (card 16), and the Settings page uses card 15's list rows. The card stays as the reference for the list rows and for the reorder move (`--d-move`, `--e-move`).

The dashboard worked like this: every content manager tab is a Save bar over a list, and every change in it is staged until one Save. Save rests disabled as "Save changes", reads "Save all changes" with Discard beside it while edits are pending, and "Saved" for two seconds after writing. The list updates in place; a refetch never drops it to a loading state. Reorderable rows carry a three-line grip that alone starts a drag (Framer Motion `Reorder` with drag controls) and takes the arrow keys; the held row lifts to `--sh-3` and neighbours move on `--d-move` / `--e-move`. Executives reorder within their role, because the team page sorts by role first. Leaving an editor with edits pending asks once (Stay, or Discard and leave) and never refuses.

## Edit mode

Card 16 in `floor.html`. Styles are `src/edit/engine/edit.css`, loaded only in the edit chunk, and every line of copy is `src/edit/engine/copy.ts`. Every value in the card is a token or a size the spec gives in pixels.

**Field.** The shell every editable value is drawn in: a fill of the text colour at 9 percent, `--r-sm`, 8px by 12px padding, visible at rest. Hover changes only the cursor. The focus ring is drawn on the shell. Each field is sized to its longest allowed value (`site_content.max_length`), so typing changes the text and never the size. Built in `fields.tsx` as the shell shared by the four components below.

**InlineText and InlineParagraph.** A one-line field is as wide as its longest allowed value, capped at the column. A paragraph takes the column and refuses Enter.

**InlineHeading.** One field for a heading of two lines. Enter starts line 2, a third line is refused, and each line saves to its own key. A line wider than the column wraps inside the field, so no text is hidden. The field's reserved height is every line at its longest allowed value wrapped at the current width, taken from the tallest of several realistic samples and measured in a hidden textarea with the field's own font, plus one row for a line that wraps to three rows or more (where its words fall at the row ends varies), so typing up to the limit leaves its size alone. Only a value with unusually long words, which wraps to more rows than every sample, grows the field past the reserve, because hidden text is the worse failure. A page's line class (the hero's `.title-hero`) is set on the field, so the lines show at their page size.

**InlineLabel.** A button label as a field inside an inert Button. The ring takes the label's colour. The link address is edited in the tray. Tab from the label reaches the button itself (`.ed-btn-link`, a transparent button over the inert face and under the field, ringed round the pill); Enter or a click there moves focus to the link address in the tray, and Escape or Enter in the address returns to the label field. A label-only button has no link address and no second stop.

On an inverse slab, a field in a muted role (`.label`, `.subtitle`, `.meta`, `.body-sm`) writes in the full `--on-inverse` while editing. The field's fill lightens the ground, and over the veiled hero photo the 70 percent ink measured 4.1:1 inside it; full ink measures 6.1:1 over a white photo.

**PhotoSlot.** The photo with Replace photo, or Add photo when the slot is empty, as a chip at the bottom left. Clicking opens the device's file picker, and the chosen file fills the same frame before Publish. A photo below the slot's minimum width shows a warning, and below half of it is refused.

**EditBar and Tray.** Change count, Edit and Preview, Discard, Publish, and the tray. The bar has one fixed size at each width and the tray is the only region whose content changes. There are no dialogs: confirmations, errors, a list row with its Remove, a new area and results appear in the tray. The tray is a grid of label, body and actions, 110px tall below 900px (actions on the label row, a label of up to two lines, three lines of body) and 76px from 900px (actions at the end of the body row, a one-line label). Both heights are written as the fixed padding and row gap in px plus the text part in em of the tray's `--t-body`, so text-only zoom in Safari or Firefox grows the tray with its text and nothing is clipped. Below 900px the bar is 248px tall in three bands: the count on one line with Settings and Sign out under it, beside Edit and Preview; the tray; Discard and Publish. The "Editing" label is hidden there because the pressed Edit or Preview button shows the mode. The bar sits 8px from the screen edges with 12px padding, and Edit and Preview use 12px side padding, which leaves the count 189px, enough for "100 unpublished changes" on one line. From 900px the bar is one 100px row, unchanged. A new list item without its name blocks Publish with that list's Missing name line in the tray, and the name field takes focus (`missingName()` in `publish.ts`). Preview shows the visitor layout with fills removed.

**Lists.** The roster, the event ledger, the logo wall and the counted figures each have an editor in `list-editors.tsx`, reached from the visitor component through `ListEditBranch` (`src/edit/list-draft.ts`), so a visitor downloads none of it. Every field of a row is inline and sized to the column's limit in the database. The Add tile is the last cell. A removed item stays with Will be removed until Publish.

- **InlineSelect.** A native select in a Field, value centred, chevron in `--accent-ink` at rest, 16px on touch screens. Role and area on an executive; the built title is the role's short label, a comma and the area ("VP, Marketing"), or the role alone. The area list ends with Add an area, which turns into a text input in place and refuses a name that matches an existing area ignoring case.
- **InlineNumber.** The figure's number in a Field as wide as 99999 in the figure's font. Counter Roll is off in edit mode.
- **VisibilityChip.** A Chip in a toggle button, Visible or Hidden, `aria-pressed`, as wide as the longer word.
- **StateChip.** Unpublished (warn) or Will be removed (alert). Its slot is always reserved.
- **Grip.** Card 15's grip on a 36px disc at the item's corner. Drag by mouse or touch, or one place per arrow key, announced ("Moved Mei Chen to position 2 of 5"). The held item lifts to `--sh-3` and neighbours move on `--d-move`, `--e-move`. Executives move within their role. Events have no grip: the ledger is ordered by date.
- **AddTile.** The empty photo-slot surface with a tertiary label, the size of an item, arriving with Clip Reveal when an add moves it along. At the list's cap (`LIMITS` in `src/lib/admin-config.ts`: 30 executives, 50 events, 20 partners, 6 figures; rows marked Will be removed do not count) it stays in its place, disabled in the disabled button's colours (`.ed-add[aria-disabled='true']` in `edit.css`), and pressing it says why in the tray. The figures editor is one centred row that wraps, and its Add tile is as wide as a figure's number row, so three figures and the tile share one row at 1280.
- **Options.** A tertiary Button, the last control of every row. It shows the row in the tray and moves focus to the tray's first control (the link address, or Remove), which Tab from the row never reaches. Escape, Enter in the link address, or Tab past either end of the tray returns focus to it. Its name carries the row's name ("Options for Mei Chen, in the edit bar"), as every row field's does ("Name, Mei Chen").
- **Held order.** A row whose date (events) or role (executives) changes keeps its place while focus stays in its list or the tray, then moves once on the move row when focus leaves.
- **Leaving focus.** When a row leaves with focus in it or in its tray (Remove on an added row, or a removed row deleted by Publish), focus moves to the row that takes its place, or to the Add tile.

Settings and Sign out are tertiary buttons at the meta size, 24px tall: under Edit and Preview from 900px, and under the count, beside Edit and Preview, below 900px. Settings opens `/admin/settings`. Sign out leaves edit mode, ends the session and reloads the page (`src/edit/sign-out.ts`), so no edit code stays in memory; drafts stay in the browser. A link address the database would refuse is refused when the field is left: the address goes back to what it was and the tray says how to write one. A button's link takes `https://`, `http://`, a page path (`/` not followed by a second `/`), `#` or `mailto:`; a register link or a partner's site takes `https://` or `http://` only. One input does this for all three (`edit/engine/link-field.tsx`). In Safari on iOS and iPadOS, edit mode adds `maximum-scale=1` to the viewport tag so focusing a field under 16px does not zoom the page (`edit/engine/ios-zoom.ts`); Safari still allows pinch zoom with it. Other iOS browsers and in-app browsers can honour it and lose pinch zoom, so they never get it, and neither do other platforms.

**Settings page.** `/admin/settings`, opened from the bar. Admin accounts (email, last sign-in, Remove on every row but the owner's, pending invites with Withdraw, one invite field), roles (role, short label, team page heading; Edit, Add a role, Delete when unused) and areas (Rename, Add an area, Delete when unused; a name that matches another ignoring case is refused). Built from card 15's list rows: a `--raised` list of `--sunken` rows at `--r-md`, each the name, one meta line and its actions. Each action writes when pressed. A confirmation, a rename or an invite replaces its own row; there are no dialogs. The route shows the sign-in flow until the visitor is an admin at aal2, then imports the page with a dynamic import, so its reads and writes are in a chunk visitors never download. Never indexed.
