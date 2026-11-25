# Redesign spec

The approved spec for three changes: the WSC Floor design system update, the public site's sales
layout, and edit mode, which replaces the admin dashboard. `reference.html` in this folder is the
same spec as a page, with a working edit-mode demo and the texture code. Open it in a browser
before building. `plan.md` is the build plan.

## 1. Design system (WSC Floor)

### One theme
- Showroom only: white and velvet. The dark theme (Afterhours, near-black and gold) is removed.
- Remove the dark blocks in `design-system/tokens.css` and `src/app/globals.css`, the theme toggle,
  `src/providers/theme-provider.tsx`, `src/lib/theme.ts`, the toggle in `nav.tsx` and
  `admin-dashboard.tsx`, and the blocking theme script in `src/app/layout.tsx`.
- Set `color-scheme: light` on `:root` so form controls and scrollbars stay light on a device in
  dark mode.
- Floor rule 2 becomes "the accent is velvet". Rule 5 ("both themes ship together") is removed.
- Theme Wipe (sequence 11) is retired. Floor has eleven sequences.
- `--gold` stays as a fixed mark for sponsor tiers. `--logo-ground` stays near-black.

### Layout
- A section is a container that spans the full viewport width with no side gap.
- Corners follow the existing proportional rule: `--r-xl` at full width.
- Containers that meet sit 2px apart. The old 24px gap between slabs and the side gutter around
  them are removed; content inside a container keeps the gutter as padding.
- Rounded shapes stay for photos, fields, buttons and chips.
- Slab Clip keeps its motion.

### Alignment
- Selling sections are centred: hero, section heads, closing bands. The order is eyebrow, bold
  Archivo title, at most three lines of copy, then the buttons.
- Reading content stays left-aligned: long paragraphs, the event ledger.

### Signature texture
The "Production texture: Lit velvet" section of `reference.html` is the approved texture, and
every textured container in `reference.html` uses it. There is no flat or untextured variant of a
velvet or velvet-black container. Port its code
(`.lit-velvet`, `.lit-black`, `.billboard`, `.dots`, `--tex-dot`, `--tex-pitch`, `drawWaves`,
`RIBBONS`, `SPREAD`, `rnd`); do not retype its numbers into a second table.

- **Grounds, lit.** Each textured container is lit from one point. Lit velvet is mostly `--accent`
  with `--inverse` at the far side; lit velvet black is mostly `--inverse` with `--accent` where
  the light falls. The light sits where the container's ribbon starts, so the gradient follows the
  ribbon's direction. Only these two grounds get the texture. No other gradients on the site.
- **Dot matrix.** A regular grid of dots in the ground's text colour at `--dot-strength` (0.16),
  brightest under the light and fading away from it, like an LED billboard.
- **Grain.** Fine and coarse fractal noise together under the dot matrix, so no surface reads flat.
- **One unit.** Every mark shares one size and one spacing: a dot is `--tex-dot` (1.6px) across, a
  ribbon line is `--tex-dot` thick, and both repeat every `--tex-pitch` (7px). The ribbon's line
  count follows from its width divided by the pitch.
- **Ribbon.** Parallel lines offset from one cubic Bézier. Lines are faint at the ribbon's edges
  and strongest at its centre, with a small fixed variation per line. Lines never cross: the gaps
  stretch and squeeze through one smooth field shared by every line, so the ribbon tightens and
  widens while every line flows with its neighbours. Its width changes along its length through
  two sines of different lengths. Drawn once per size; the same band always draws the same way.
- **Five shapes:** sweep (bottom edge to right edge; closing band), rise (left edge to top edge;
  statement slab), arc (one crest that swells in the middle; stats band), waist (wide, narrow,
  wide; page heads), pair (two ribbons, one following the other; wide, short bands).
- **Grain moves.** The grain shifts position six times a second (`grain-shift`, `steps(6)`), on
  every textured container, in edit mode too. It is the second exception to Floor's no-loop rule,
  beside Marquee Drift. Under `prefers-reduced-motion: reduce` it stops; that is the only case in
  which it is still. The ribbon and the dot matrix never move.
- **Ribbon lines are solid**, `--tex-dot` thick.
- The texture is approved by eye, not by tests. The design system build shows the rendered
  catalogue for sign-off before the front-end starts using it.

### Other Floor additions
- `--inverse-tile`: `--on-inverse` at 7 percent, for tiles inside an inverse slab.
- Focus ring on inverse and accent slabs uses the slab's text colour, since `--focus` is velvet.
- On inverse and accent slabs the primary button uses the page fill (secondary variant).
- The nav pill gets a primary button, Apply to join, at every width.
- Every new component gets a card in `design-system/floor.html` in the same change. Edit mode
  components go in a new card 16, beside card 15 (Editor).

## 2. Public site: sales layout

- One action, Apply to join (`home.cta.button_label`, `home.cta.button_href`). It appears in the
  nav, the hero, the About section and a closing band on every page.
- The second action is See events.
- Home order: nav; centred hero (eyebrow, headline, subtitle, Apply to join and See events); the
  three counted figures from `site_stats`; partner logos on `--logo-ground`; About; events preview;
  closing band (velvet, sweep ribbon) that repeats the headline next to Apply to join.
- Event rows show a Register button when the event has a registration link (new column, section 4).
  Past events show no button.
- Every page ends with the closing band. Partners ends with "Become a partner", which opens the
  contact form.
- Copy stays in `site_content`. New strings are new keys with their limits.

## 3. Edit mode

### Access and flow
- `/admin` is the sign-in page only: Google, then the authenticator code, as today. On success the
  browser goes to `/` in edit mode. There is no dashboard.
- Edit code loads only after `is_admin()` returns true at the authenticator-code level. Anonymous
  visitors never download it. Edit mode pages are not indexed.
- Publish model: draft, then Publish. Edits change the page in the editor's browser only (drafts in
  IndexedDB, chosen photos as blobs). Publish writes every change: uploads first, then rows, then
  deletes, storage first, as `deleteContentItem` already does. Discard drops every draft change.

### Rules
- Typing changes the text inside a field and never the size of the field. Each field is sized to
  its longest allowed value (`site_content.max_length`) at the current width: one-line fields by
  width, paragraphs and headings by height. Re-measured on resize only.
- The page reads as a form that is already filled in. Every field has a fill of the text colour at
  9 percent (the skeleton's mix), `--r-sm`, 8px by 12px padding, visible at rest. Hover changes only
  the cursor. The focus ring is drawn on the field's shell.
- A heading of two lines is one field. Enter starts line 2; a third line is refused. Line 1 and
  line 2 save to their two keys. Paragraphs refuse Enter.
- Every selector shows its chevron at rest.
- Every photo shows Replace photo, or Add photo when empty. Clicking opens the device's file
  picker. The chosen file replaces the photo in the same frame before Publish. The resolution check
  from today's uploader applies: a warning below the minimum, refused below half of it.
- Button labels are fields inside the button. The link address shows in the tray.
- No dialogs. Confirmations, Remove and adding an area happen in the tray.
- Preview mode shows the exact visitor layout with fills and reserved space removed. The section
  nearest the top of the screen stays at the same height.

### Motion in edit mode
- Allowed: reorder (card 15 move row, `--d-move`, `--e-move`), a new Add tile (Clip Reveal), removal
  on Publish only (leave on `--d-move`, `--e-exit`, then neighbours close on `--e-move`), and the
  Publish label changing in place.
- Off: Line Mask Reveal, Word Cascade, Slab Clip and Clip Reveal on scroll, Counter Roll, Row
  Expand, Magnetic Pull, Marquee Drift (static wrapped grid), the preloader.

### Components (card 16)
Field, InlineText, InlineHeading, InlineParagraph, InlineLabel, InlineSelect, InlineNumber,
PhotoSlot, VisibilityChip (Visible / Hidden toggle, `aria-pressed`), StateChip (Unpublished warn,
Will be removed alert, slot always reserved), Grip (drag by mouse or touch, arrow keys move one
place, announced), AddTile (last cell of every list), EditBar with Tray (fixed height; the tray is
the only region whose content changes), Settings page. Sizes and behaviour are in `reference.html`.

### Lists
- Executives, events, sponsors: every field inline, add through the Add tile, drag to reorder,
  hide with the chip, remove from the tray. A removed item stays in place with Will be removed until
  Publish.
- Executive title is built: role short label, comma, area ("VP, Marketing"); no area shows the role
  alone. Role and area are two selects. Area ends with "Add an area", which turns into a text input
  in place; a name that matches an existing area ignoring case is refused.

### Settings page
Admin accounts (email, last sign-in, Remove, invite by Google email; the owner row cannot be
removed), roles with short labels, areas (rename renames everywhere; an area in use cannot be
deleted).

### States and copy
| State | Copy |
|---|---|
| First sign-in | Every text and photo on the page is a field. Change it where it is. Nothing goes live until you press Publish. |
| Field focused | About · Body copy. 212 of 320 characters. |
| Heading focused | Line 1: 13 of 24. Line 2: 15 of 24. Enter starts line 2; leave it empty for one line. |
| Line too wide | This line wraps on phones. Shorten it to keep the heading on one line. |
| Pending | 3 unpublished changes. Publish 3 changes. |
| Confirm discard | Discard 3 unpublished changes? This cannot be undone. Keep editing / Discard 3 |
| Missing name | Add a name for the new executive before publishing. |
| Published | Published. Visitors see the changes now. (button reads Published for two seconds) |
| Partly failed | 2 changes did not publish and are still in your draft. Try again. |
| Offline | You are offline. Your changes are saved in this browser. Publish when you reconnect. |
| Sign-in expired | Your sign-in expired. Your changes are saved in this browser. Sign in again to publish them. |
| Draft from earlier | You have 3 unpublished changes from Tuesday. |
| Photo too small | This photo is 420px wide and will look soft here. Use one at least 840px wide. |
| Photo refused | This photo is 260px wide, too small for this spot. Use one at least 560px wide. |
| Duplicate area | Marketing already exists. Pick it from the list. |

## 4. Data changes

New migrations only; existing migrations are not edited.

1. **Roles and areas.** `exec_groups.short_label` (President, VP, AVP). New `exec_areas` (name,
   display order, unique on `lower(name)`). `executives.area_id` nullable, `ON DELETE RESTRICT`.
   The title is computed when shown and never stored. `executives.title` stays until a reviewed
   backfill maps each existing title to a role and area; a later migration drops it.
2. **Year of study.** Drop `executives.year_of_study`, its form field and the "Year N" suffix.
3. **Access never expires.** `is_admin()` stops checking `expires_at`; `claim_admin_invite()` stops
   setting it; the column is dropped. Unclaimed invites still expire after 14 days. Google sign-in,
   the authenticator code, RLS and `is_admin()` as the only admin check are unchanged.
4. **Last sign-in.** A read-only `SECURITY DEFINER` function, callable by admins only, returns each
   admin's `last_sign_in_at`.
5. **Event registration link.** `events.register_url`, nullable, same URL checks as other links.

## 5. Accessibility
- Fields are labelled from `site_content.label` plus the section ("About, heading").
- Tab order follows the page. Grips announce moves. The tray announces errors and publish results
  only. The visibility chip is a toggle button.
- On touch screens, selects use 16px so iOS does not zoom.
- WCAG 2.2 AA, reduced motion per sequence as in `design-system/motion.md`.
