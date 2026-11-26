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
| Field | `contact/field.tsx` | none |
| KineticHeadline | `landing/hero.tsx` | Line Mask Reveal, Word Cascade |
| SectionHead | `ui/section-head.tsx` | Line Mask Reveal |
| CentredHead | `ui/centred-head.tsx` | Line Mask Reveal |
| StatFigure | `ui/stat-figure.tsx` | Counter Roll |
| Slab | `ui/slab.tsx` | Slab Clip |
| Texture | `ui/texture.tsx` | Grain Shift (a loop) |
| Marquee, brand strip | `landing/partners-marquee.tsx` | Marquee Drift above 8 logos, none at 8 or fewer |
| FormatCard, CardRow | `landing/formats-section.tsx`, `ui/card-row.tsx` | Clip Reveal |
| ProofBand | `landing/proof-band.tsx` | Counter Roll |
| NextEvent | `landing/events-preview.tsx` | Arrive |
| AudienceSplit | `landing/audience-split.tsx` | none |
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
| Destructive | `--alert` fill, `--on-accent` label, `--sh-2` | `--sh-3` |
| Confirm | `--ok` fill, `--on-accent` label, `--sh-2` | `--sh-3` |
| Disabled | `--sunken` fill, `--ink-faint` label | none |

On an `--inverse`, `--accent` or `--logo-ground` slab the primary takes the page fill (the secondary variant), because a velvet button on these grounds has too little contrast to read as a button. The secondary and tertiary take the slab's own ink, with a hover fill mixed from it. Button reads the tone from the enclosing `Slab`, so a page passes no flag. The old `onAccent` prop is deprecated and has no effect.

Destructive and confirm are the edit bar's Discard and Publish only. They are the status colours, so the bar reads as a tool laid over the site and its two outcomes read apart; nothing on the visitor site uses them. `arrow="back"` puts a leading arrow on a button that returns (Back to editing on Settings).

Label is Instrument Sans 15px weight 500, sentence case, never wrapping. Padding 14px block, 24px inline, which clears 44px at every size. The label names the action and the confirmation echoes it: **Apply to join**, then **Application received**. A trailing arrow means the action leaves the page.

One primary per section. No icon-only buttons on the marketing site.

## CentredHead

The head of a selling moment, centred: the page head, the closing band, and a home section that is one message and a link (About, Partners). The Archivo title (one `site_content` key per visual line, Line Mask Reveal), at most three lines of copy, then the buttons as children in one centred row. The title holds the title measure (`.measure-title`) and the copy the running measure (`.measure`), each in its own face. Every string is read through the edit components, so in edit mode the head is a filled-in form. A section whose job is reading or scanning content takes SectionHead instead.

Props: `titleKeys`, `bodyKey`, `bodyRole` (`body` for a section head, `subtitle` for a closing band), `id`, `as` (`h2` by default), `children`.

## SectionHead

The head of a section whose job is reading or scanning content, left-aligned: the event ledger on the home page. The Archivo title with Line Mask Reveal, optional meta or copy, then any buttons, all on the left edge the content below starts from. The content keeps that edge: the head and the paragraphs, ledger or photo under it share one left edge, the gutter on an inner page.

Props: `titleKeys` (editable, one key per visual line) or `title` (fixed lines), `meta`, `bodyKey`, `id`, `as`, `children`.

## Hero

The home page's first section, `landing/hero.tsx`: one full-bleed photo (`home.hero.image1`) that fills the first screen (at least `100svh`), under `--inverse-veil`, on an inverse slab with no ribbon. A centred head over it keeps KineticHeadline's motion (Line Mask Reveal, Word Cascade, held on the Curtain): a two-line headline, the subtitle naming real companies and a real number, then one button per audience, Apply to join (`home.cta.button_*`) and Partner with us (`home.hero.partner_*`, secondary). The brand strip follows directly below. The photo counts as a photo, not as the page's inverse container, so the ProofBand stays inverse. It replaced a hero that set the head over a three-photo mosaic.

## ClosingBand

The last section of every public page, directly above the footer. An `accent` slab with the `sweep` ribbon and Slab Clip, holding a CentredHead: the title Join (`home.cta.title_line1`), one or two sentences for both audiences (`home.cta.subtitle`), then two buttons side by side. Apply to join is for students and reads `home.cta.button_*`, the same keys as the nav, the hero and About. The business button, Get in touch (`home.cta.business_*`), is the secondary variant, which on the accent slab takes the slab's own ink.

Apart from the page head (inverse, with a ribbon), it is the page's one loud slab, so no other inverse or accent slab goes on a page that ends with it. A page replaces only the business button, through `businessAction`: Partners passes Become a partner, which opens the contact form, and keeps Apply to join.

## PageHead

The first section of every public page other than home: an `inverse` slab with a ribbon holding a CentredHead as the page's `h1` (title, optional copy). Each page passes its own ribbon through `texture` so the inner pages open differently: About `rise`, Events `arc`, Executive team `pair`, and `waist` (the default) on Partners, Contact and the legal pages. `sweep` is a type error there, because the closing band below draws it. One padding on every page, the hero's: `clamp(7.5rem,14vw,11rem)` top, which clears the fixed nav pill at 375 and 1280, and `--pad-section` bottom. Pages pass keys only, never a padding or a tone.

Props: `titleKeys`, `bodyKey`, `id` (the h1 id the slab is labelled by, unique per page). The legal pages, whose copy is not in `site_content`, pass `titleLines` (fixed strings, same Line Mask Reveal, not fields in edit mode) instead of `titleKeys`; CentredHead takes the same prop.

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
| `waist` | The default page head. Wide, narrow, wide. |
| `pair` | Wide, short band. Two ribbons, one following the other. |

Accent gives lit velvet, inverse gives lit velvet black. Every shape works on both. The numbers, the `RIBBONS` table and the `SPREAD` table are copied from `docs/redesign/reference.html`; change them there first. Card 17 in `floor.html` renders every shape on both grounds.

## ExecutiveGrid

The roster is one tier per role, in `exec_groups.display_order`, and every portrait is the same size in every tier. Only the order of the tiers shows rank, presidents first; a larger portrait for a higher role made the people in later tiers look less important. No heading names a tier, because the title under each name already gives the role. Roles with nobody visible are dropped, and anyone whose role is not in the lookup goes in one last tier.

Each tier is a centred flex row that wraps, so a short last row is centred under the full rows above it. Every cell in a tier has the same width, so names wrap at the same width across the row. The gap between tiers (64px) is larger than the gap between rows inside a tier (40px). Within a cell: a `--r-disc` headshot, the name in `.title-sm`, the title in `.meta`, centred. A word longer than the cell breaks inside the cell, so a long name never runs into the next one. No fill, no shadow, no border, no hover, no link. These are people, not controls, and the page has nothing to navigate to.

Bare on `--page`, starting from the gutter. The skeleton has the shape of a typical roster: two lead cells, then six standard cells. In edit mode the roster editor shows the same tiers, cells and portrait size, so it matches Preview. A drag moves a person within their role's tier; changing the role moves them to that role's tier once focus leaves the roster. The Add tile is the last cell of the last tier.

Headshots are always visible here, unlike on the event ledger. A profile picture is the content, not a flourish. `Avatar` layers the photo over its initials disc rather than swapping, so a missing or slow headshot shows the designed fallback instead of a hole. Object names only in the DB; call `getPublicUrl(bucket, objectName)` at runtime.

## TimelineEvent

Ledger rows inside one slab, separated by 4px, never by a line. At rest the ledger is pure type: index in `.label`, title in `.title-sm`, date in `.meta`. A wall of titles in Archivo caps reads as a schedule, not a list of cards.

Row Expand on hover, **where the row has a destination**. As built it does not: there is no event registration URL, so the row is an inert list item. A `<button>` with no handler announces itself as pressable to a screen reader and then does nothing, which is worse than no affordance at all. The expand is therefore a pointer-only response to attention. If registration links ever land, make the row a real link.

Status is a chip carrying a word, never colour alone. The `events` table has no status column and `supabase/` is off limits, so it is derived from `date`: future or today is `ok` "Open". Past events drop the chip, take `--ink-muted` and lose the expand entirely, because they are reference and should not look pressable. They render as a different element, not just a differently styled one.

## StatFigure

Number in `--f-text` 600 at 56px with `tabular-nums`, label under it in `.label`, optional suffix in `--accent-ink`.

Only real numbers. If the figure is not something the club could defend in a room, use a SectionHead instead. Four in a row at most. `size="hero"` sets the figure in Archivo at a large size for the ProofBand; the default is Instrument Sans 600 at 56px.

## Brand strip

The landing partner section on the logo ground, headed by one `.label` line ("Events and competitions with") instead of a section head, so the logos sit directly under the hero. With 8 logos or fewer it is a static centred row, because a few logos looping past read as a short list repeated. Above 8 it runs Marquee Drift as before. With no active partner the strip is left out, except in edit mode, where it stays with only its label so the label can be edited.

## FormatCard and CardRow

A FormatCard is a tile (`--page`, `--sh-1`, `--r-lg`): a 4:5 photo at `--r-md`, the format's name in `.title-sm`, one sentence in `.body`, and the companies involved in `.meta`, hidden while empty. Cards are `clamp(280px, 40vw, 460px)` wide and never shrink.

CardRow is the row that holds them on Home's "Real partners, real experiences" section, a raised slab with a one-line CentredHead. The row scrolls sideways with scroll snap on each card's left edge, instead of wrapping. It opens at its start: the first card sits one gutter (`--gut`) from the viewport's left edge and the row runs to the right edge, so only the next card is cut off and shows there is more. Previous and Next (secondary buttons with a chevron, each with an aria-label) scroll one card and are disabled at their end; they are hidden when every card fits. The row is focusable for arrow keys, and touch and trackpads scroll it directly. Reduced motion makes the buttons jump instead of glide. CardRow is `ui/card-row.tsx`, shared by the visitor row and its editor.

The cards are rows of `event_formats`, shown in `display_order` with `visible` filtered. Each card's photo is an object in the `site-images` bucket, named in `image_path`; a card with no photo shows the empty photo frame. An empty sentence or companies line is left off the card. While the query is in flight or after it fails, the four shipped cards show (`src/lib/event-format-fallbacks.ts`), so the row never shows empty. When the query answers with no visible card, the whole section is left out, so its heading never shows over nothing. In edit mode the same row holds every card, hidden ones included, and with no card it shows the Add tile alone; if the query fails in edit mode, the AsyncState error and its retry show in place of the row, since the shipped cards are not rows and cannot be edited. In the editor the photo takes Replace photo or Add photo, the Visibility chip and the Grip sit on the photo's corners as on a headshot, the name, sentence and companies line are inline fields at their column limits (28, 140, 60), and the Add tile is the last card, at most 12 cards (`LIMITS.MAX_EVENT_FORMATS`).

## ProofBand

Home's one inverse slab, with the `arc` texture. A CentredHead, up to four StatFigures at `size="hero"` from `site_stats` (2 by 2 on a phone), then one named result on `--inverse-tile`, hidden while its key is empty. The figures are the club's own claims; the result is a real outcome or nothing.

## NextEvent

A photo beside a raised panel holding the soonest upcoming event: date, time and room in `.meta`, the title in `.title`, the description, and Register as the section's one primary when the event has a link. Up to two more upcoming events follow as raised rows, then See all events stays as the secondary. With nothing upcoming the panel shows the empty message and keeps See all events. Past events are left to the Events page.

## About page

Order: PageHead (`rise` ribbon), one story grid, then ClosingBand. This is the production site's layout.

The story grid is twelve columns from lg: four facts and two 3:2 photos (`about.story.image1`, `image2`). Each photo spans the two facts beside it. The top pair is a raised fact, then a bare one, with the first photo on the right; the bottom pair swaps, with the second photo on the left and a sunken fact then a raised one on the right. Below lg the cells stack in reading order (fact, photo, fact, photo, fact, fact), two columns from md. Each fact is a `.title-sm` heading and one or two paragraphs (`about.story.factN_*`); an empty second paragraph is dropped. The facts arrive staggered and the photos use Clip Reveal. The only primary button is the closing band's Apply to join.

## AudienceSplit

Two large tiles side by side on a sunken slab, up to 1280px wide together and at least `clamp(26rem, 42vw, 36rem)` tall, students then companies: a two-line `.title`, three points in `.subtitle` with an accent tick, one primary button and a `.meta` note under it. Each tile has its own primary because each is a separate audience's decision. Apply to join reads `home.cta.*`; Partner with us reads `home.hero.partner_*`, the same keys as the hero's second button.

The home stats row is a selling moment, so it is centred as a group: each figure takes a column of the same width (up to 240px), and the columns are centred together. Two figures sit in the middle with the spacing three have, never beside an empty third column.

## AsyncState

Four states, and none of them is a blank screen: loading, error with a retry, empty, and 404. The spinner is a masked conic gradient, not a `border-top` trick, because borders are out. Empty states name what is missing and do not apologise.

## LogoWall

As built there is exactly **one** tier group, labelled Partners: the `sponsors` table has no `tier` column and `supabase/` is off limits, so scale comes from `display_order` (the lead tile spans two columns) rather than an invented tier. The paragraph below is what to build the day a `tier` column exists.

Also as built, the whole wall sits on `--logo-ground` with `--on-logo-ground` ink, and the marks sit directly on it with no tile behind each one. A per-logo panel on a light slab read as a grid of separate dark patches. Same treatment for the landing page marquee. On Partners this puts three dark sections in a row (the inverse page head, the wall, the closing band). That is an accepted exception to the one-loud-pair rule: supplied logos are mostly light marks on transparent backgrounds and need the dark ground.

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

Dot tracks exactly, ring lags behind on a lerp. Four states: default 38px, hover 46, view 62, text 12. The ring is one of only two strokes in the system, alongside the focus ring, because a ring is its shape. Pointer devices only, and off while editing (Preview shows it again).

## Editor (admin)

Card 15 in `floor.html`. The dashboard that used it was removed: content is edited in place in edit mode (card 16), and the Settings page uses card 15's list rows. The card stays as the reference for the list rows and for the reorder move (`--d-move`, `--e-move`).

The dashboard worked like this: every content manager tab is a Save bar over a list, and every change in it is staged until one Save. Save rests disabled as "Save changes", reads "Save all changes" with Discard beside it while edits are pending, and "Saved" for two seconds after writing. The list updates in place; a refetch never drops it to a loading state. Reorderable rows carry a three-line grip that alone starts a drag (Framer Motion `Reorder` with drag controls) and takes the arrow keys; the held row lifts to `--sh-3` and neighbours move on `--d-move` / `--e-move`. Executives reorder within their role, because the team page sorts by role first. Leaving an editor with edits pending asks once (Stay, or Discard and leave) and never refuses.

## Edit mode

Card 16 in `floor.html`. Styles are `src/edit/engine/edit.css`, loaded only in the edit chunk, and every line of copy is `src/edit/engine/copy.ts`. Every value in the card is a token or a size the spec gives in pixels.

**Field.** The shell every editable value is drawn in: a fill of the text colour at 9 percent (16 percent on the inverse and accent grounds and inside a button, where 9 percent of a light ink does not show), so it is always one step off its ground, `--r-sm`, 8px by 12px padding, visible at rest. Hover changes only the cursor. The focus ring is drawn on the shell. On page copy (`.ed-out`) the fill reaches outward by its padding, so the text sits exactly where Preview puts it and neighbouring fields share Preview's left edges; list fields keep their padding inside. A one-line field is the size of the text it holds (its label while empty), capped at the column, and follows the text as it is typed; a paragraph takes its column, as it does in Preview; a heading takes the title measure. `site_content.max_length` is the limit, not the size. Built in `fields.tsx` as the shell shared by the four components below.

**InlineText and InlineParagraph.** A one-line field is as wide as its text, capped at the column. A paragraph takes the column and refuses Enter.

**InlineHeading.** One field for a heading of two lines. Enter starts line 2, a third line is refused, and each line saves to its own key. The field takes the full width its title may take (the title measure or the column, whichever is narrower), so every heading field on the site is one size and a line wraps where it wraps in Preview. It is as tall as its lines need, measured in a hidden textarea with the field's own font on every keystroke, so no text is hidden. A heading of several lines on a page is one field, never one field per line (the audience headings on Home use it). A page's line class (the hero's `.title-hero`) is set on the field, so the lines show at their page size.

**InlineLabel.** A button label as a field inside an inert Button, as wide as the label, so the button is its Preview size. The ring takes the label's colour. The link address is edited in the tray. Tab from the label reaches the button itself (`.ed-btn-link`, a transparent button over the inert face and under the field, ringed round the pill); Enter or a click there moves focus to the link address in the tray, and Escape or Enter in the address returns to the label field. A label-only button has no link address and no second stop.

On an inverse slab, a field in a muted role (`.label`, `.subtitle`, `.meta`, `.body-sm`) writes in the full `--on-inverse` while editing. The field's fill lightens the ground, and over the veiled hero photo the 70 percent ink measured 4.1:1 inside it; full ink measures 6.1:1 over a white photo.

**PhotoSlot.** The photo with Replace photo, or Add photo when the slot is empty, as a chip at the bottom left. Clicking opens the device's file picker, and the chosen file fills the same frame before Publish. A photo below the slot's minimum width shows a warning, and below half of it is refused.

**EditBar and Tray.** Left to right from 900px: Settings (a gear on a 40px disc) and Sign out, the change count, the tray, Edit and Preview, Discard and Publish, in one row. Below 900px the gear, the count and Edit and Preview share the first row, the tray is the second and Discard and Publish the third; Sign out is on the Settings page there. The bar is the page ground with `--sh-3`. Discard is the destructive button (`--alert`) and Publish the confirm button (`--ok`), so the bar reads as a tool laid over the site and its two outcomes read apart; Edit and Preview keep the accent. The bar is functional only: no mode label and no idle copy. The count shows the number of unpublished changes and has room for it on one line; the pressed Edit or Preview button shows the mode; the tray is empty until a field has focus or there is a confirmation, error or result to show, and it is the only region whose content changes. There are no dialogs: confirmations, errors, a list row with its Remove, a new area and results appear in the tray. The tray is a grid of label, body and actions, 110px tall below 900px (actions on the label row, a label of up to two lines, three lines of body) and 76px from 900px (actions at the end of the body row, a one-line label). Both heights are written as the fixed padding and row gap in px plus the text part in em of the tray's `--t-body`, so text-only zoom in Safari or Firefox grows the tray with its text and nothing is clipped. The bar sits 8px from the screen edges below 900px and 12px from 900px. A new list item without its name blocks Publish with that list's Missing name line in the tray, and the name field takes focus (`missingName()` in `publish.ts`). Preview shows the visitor layout with fills removed.

**Changes list.** The count is a button that opens the list of unpublished changes directly above it, at the bar's left edge, so the list appears where it was opened from (`edit/engine/changes-list.tsx`), at most half the window tall and scrolling inside itself, so the bar and the page under it do not move. One entry per change, newest first: the page and the field or row, then the published value struck through beside the draft value (a row shows each changed column; an added, removed or reordered item, a photo and a new area show one line). Pressing an entry closes the list and focuses the field when it is on this page, or opens its page. Escape returns focus to the count, and a press outside the bar closes the list.

**Lists.** The roster, the event ledger, the logo wall, the counted figures and the format cards each have an editor in `list-editors.tsx`, reached from the visitor component through `ListEditBranch` (`src/edit/list-draft.ts`), so a visitor downloads none of it. Every field of a row is inline and sized to the column's limit in the database. The Add tile is the last cell. A removed item stays with Will be removed until Publish. Preview shows each list as visitors will see it after Publish: hidden rows and rows marked Will be removed are left out, and a headshot, logo or card photo chosen and not yet published shows from the draft (`useDraftFile` in `src/edit/list-draft.ts`, which reads nothing while the engine is not loaded).

- **InlineSelect.** A native select in a Field, value centred, chevron in `--accent-ink` at rest, 16px on touch screens. Role and area on an executive; the built title is the role's short label, a comma and the area ("VP, Marketing"), or the role alone. The area list ends with Add an area, which turns into a text input in place and refuses a name that matches an existing area ignoring case.
- **InlineNumber.** The figure's number in a Field as wide as 99999 in the figure's font. Counter Roll is off in edit mode.
- **VisibilityChip.** A Chip in a toggle button, Visible or Hidden, `aria-pressed`, as wide as the longer word.
- **StateChip.** Unpublished (warn) or Will be removed (alert). Its slot is always reserved.
- **Grip.** Card 15's grip on a 36px disc at the item's corner. Under the pointer, and while held, the disc inverts to the accent fill with `--on-accent` ink, which reads on every ground. Drag by mouse or touch, or one place per arrow key, announced ("Moved Mei Chen to position 2 of 5"). Every list reorders through one implementation, `useReorder` with `ReorderList`, `ReorderItem` and `Grip` (dnd-kit): item positions are measured once when a drag starts, the other items slide aside while the held one follows the pointer, the order changes once on drop, and the page scrolls when the held item nears an edge. The held item lifts to `--sh-3` and neighbours move on `--d-move`, `--e-move`. Executives move within their role. Events have no grip: the ledger is ordered by date.
- **AddTile.** The empty photo-slot surface with a tertiary label, the size of an item, arriving with Clip Reveal when an add moves it along. It is the last cell of each list, except the event ledger, where it is the first row because the ledger runs newest first. At the list's cap (`LIMITS` in `src/lib/admin-config.ts`: 30 executives, 50 events, 20 partners, 6 figures, 12 format cards; rows marked Will be removed do not count) it stays in its place, disabled in the disabled button's colours (`.ed-add[aria-disabled='true']` in `edit.css`), and pressing it says why in the tray. The figures editor is one centred row that wraps, and its Add tile is as wide as a figure's number row, so three figures and the tile share one row at 1280.
- **Options.** A tertiary Button, the last control of every row. It shows the row in the tray and moves focus to the tray's first control (the link address, or Remove), which Tab from the row never reaches. Escape, Enter in the link address, or Tab past either end of the tray returns focus to it. Its name carries the row's name ("Options for Mei Chen, in the edit bar"), as every row field's does ("Name, Mei Chen").
- **Held order.** A row whose date (events) or role (executives) changes keeps its place while focus stays in its list or the tray, then moves once on the move row when focus leaves.
- **Leaving focus.** When a row leaves with focus in it or in its tray (Remove on an added row, or a removed row deleted by Publish), focus moves to the row that takes its place, or to the Add tile.

Settings is a tertiary gear with the accessible name Settings, the one icon-only button in the system, and opens `/admin/settings`, where Back to editing is the first control, at the top left. Exit and Sign out are tertiary buttons at the meta size, 24px tall. Exit leaves edit mode and keeps the session (`/admin` opens edit mode again without signing in); Sign out also ends the session. Below 900px only Exit shows in the bar, and Sign out is on the Settings page. Sign out leaves edit mode, ends the session and reloads the page (`src/edit/sign-out.ts`), so no edit code stays in memory; drafts stay in the browser. A link address the database would refuse is refused when the field is left: the address goes back to what it was and the tray says how to write one. A button's link takes `https://`, `http://`, a page path (`/` not followed by a second `/`), `#` or `mailto:`; a register link or a partner's site takes `https://` or `http://` only. One input does this for all three (`edit/engine/link-field.tsx`). In Safari on iOS and iPadOS, edit mode adds `maximum-scale=1` to the viewport tag so focusing a field under 16px does not zoom the page (`edit/engine/ios-zoom.ts`); Safari still allows pinch zoom with it. Other iOS browsers and in-app browsers can honour it and lose pinch zoom, so they never get it, and neither do other platforms.

**Settings page.** `/admin/settings`, opened from the bar. Admin accounts (email, last sign-in, Remove on every row but the owner's, pending invites with Withdraw, one invite field), roles (role, short label, team page heading; Edit, Add a role, Delete when unused) and areas (Rename, Add an area, Delete when unused; a name that matches another ignoring case is refused). Built from card 15's list rows: a `--raised` list of `--sunken` rows at `--r-md`, each the name, one meta line and its actions. Each action writes when pressed. A confirmation, a rename or an invite replaces its own row; there are no dialogs. The route shows the sign-in flow until the visitor is an admin at aal2, then imports the page with a dynamic import, so its reads and writes are in a chunk visitors never download. Never indexed.
