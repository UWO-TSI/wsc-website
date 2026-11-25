# WSC Floor

The design and motion system for westernsalesclub.ca. Named after the sales floor.

**Open `design-system/floor.html` in a browser before writing any UI.** It is the visual source of truth: the palette, type specimens, corners, elevation, easing curves and duration bars that run, all eleven motion sequences playing in place, the signature texture in all five shapes, and a live card per site component. Reading this file is not a substitute for looking at that one.

Published copy: https://claude.ai/artifact/FVj2N5CmLvssoHdBkFiG15

| File | What it is |
| --- | --- |
| `floor.html` | The live reference. Open it, do not import it. |
| `tokens.css` | What the app consumes. Replaces the `@theme` block in `src/app/globals.css`. |
| `motion.md` | The eleven named sequences, with the code for each. |
| `components.md` | The component inventory and the rules per component. |

## The four rules

1. **There are no borders.** Not on a section, a row, an input, or an image. Things are divided by a change in surface tone and by the gap between them. The only exception is `--focus`, an outline offset away from the element, which is never removed.
2. **The accent is velvet.** The site has one theme, Showroom: white with deep velvet purple. Components reference `--accent`, `--accent-ink` and `--on-accent`, never a literal purple. `--velvet` and `--gold` are the two fixed marks: the Western affiliation lockup and sponsor tiers.
3. **Four type roles, nothing between them.** Title, subtitle, body, label. Every title is Archivo, all caps. A page of medium-sized headings is the failure mode this system exists to prevent.
4. **Motion arrives and stops.** Everything uses `--e-enter` unless it is leaving. Nothing floats and nothing bounces. Two things loop: the marquee, and the grain on a textured container. `--e-snap` is the one overshoot curve; nothing spends it since the theme toggle was removed.

## Type

Three families, each with one job. Mixing the jobs is the fastest way to make this look like every other site.

| Family | Face | Job |
| --- | --- | --- |
| `--f-display` | Archivo 800 to 900 | Every title. Always uppercase. |
| `--f-text` | Instrument Sans | All running copy and UI labels. |
| `--f-data` | Geist Mono | Dates, counts, percentages, field labels, eyebrows. |

Load from Google Fonts:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&family=Geist+Mono:wght@400..600&family=Instrument+Sans:wght@400..700&display=swap">
```

Running copy holds a 62 character measure. `.meta` and any figure set `tabular-nums`.

## Colour

- `color-scheme` is `light`, so form controls and scrollbars stay light on a device set to dark mode.
- Text on `--page`, `--raised` and `--sunken` is `--ink`; secondary is `--ink-muted`. `--ink-faint` is near 3.4:1 and is for 24px-and-up marks, disabled labels and index numerals only, never running copy.
- On `--inverse` use `--on-inverse`. On `--accent` use `--on-accent`. Neither ever appears on the page ground.
- A tile inside an inverse slab is `--inverse-tile`: `--on-inverse` at 7 percent.
- A photo with text set on it (the hero) takes `--inverse-veil`: `--inverse` at 75 percent over the photo. That strength keeps the slab's secondary ink (`--on-inverse` at 70 percent) at 4.7:1 over a pure white photo, so any photo passes AA.
- The accent as a **shape** is `--accent`. The accent as a **word** is `--accent-ink`. On a loud slab the word falls back to the slab's own ink (`.accent-mark`), because `--accent-ink` is the ground itself there.
- The focus ring is `--focus` (velvet). On an inverse, accent or logo slab it takes the slab's text colour, because velvet does not show on those grounds.
- `--logo-ground` is the constant near-black behind every supplied logo, with `--on-logo-ground` as its ink.
- Status is `--ok`, `--warn`, `--alert`, each always shipped with a word. `--ok` and `--alert` are at nearly the same lightness, so hue alone never carries the meaning.

## Corners

Proportional, not decorative. Take the element's shorter side, divide by twelve, snap to the nearest step: chip `--r-xs`, input `--r-sm`, row `--r-md`, content slab `--r-lg`, full-width container `--r-xl`. Never mix two steps on one element.

Two overrides: anything you can press is `--r-pill`, and avatars and the cursor are `--r-disc`. That is how a pressable thing announces itself in a system with no borders.

**Never animate from `--r-pill` to a fixed radius on a box that changes size.** 999px re-clamps to half the shorter side as the box grows, which bulges it into a stadium mid-transition. Use the literal half-height instead. The mobile nav does this: `25px` closed, `--r-xl` open.

## Elevation

Four levels. Shadows create the layers for things placed on a surface; the surfaces themselves are flat.

| Level | Use |
| --- | --- |
| flat | Every full-width container (slabs, textured bands), and the footer. A shadow would fill the 2px join. |
| `--sh-1` | Tiles, chips, inputs, a secondary button. |
| `--sh-2` | Primary button, hovered directory row, the nav pill. |
| `--sh-3` | Dialogs, the expanded nav, a pressed CTA. |

## Layout

A page is a stack of containers on `--page`. A section is a container that spans the full viewport width with no side gap and takes `--r-xl` corners. Containers that meet are 2px apart, and that 2px of page ground plus the tone change is the divider. There is no gutter around a container; the page gutter (`--gut`) is the container's inline padding, so its content keeps the inset.

Rounded shapes stay for the things inside a container: photos, fields, buttons and chips.

Adjacent containers never share a tone. `--inverse` and `--accent` never touch, and there is one of them per page. The page head (or the home hero) above the closing band is the one exception.

A container carries weight only where it marks a change of role. On the inner pages (About, Events, Executive team, Partners, Contact and the legal pages) the page head and the closing band are the containers. Every content section between them sits bare on `--page`, with no raised or sunken tint, and is separated from its neighbours by room: `--pad-section` above and below. Two content sections keep a ground: the contact form, because its fields are a group on a `--sunken` bed, and the Partners logo wall, because supplied logos are light marks that need `--logo-ground`. The home page keeps its slabs.

The hero is a full-width inverse container with a photo slot (`home.hero.image1`) as its background, under `--inverse-veil`. The footer takes `--pad-section` top and bottom, so it reads as a section.

A photo slot with no photo shows a placeholder at the slot's frame and aspect ratio: the skeleton surface, still, with no label. It runs the same reveal a photo would, so the layout and the motion read before photos exist. Visitors see it too.

## Alignment

- **Selling moments are centred:** the hero, page heads, closing bands, and a home section head whose section is one message and a link (About, Partners). The order is the eyebrow, the bold Archivo title, at most three lines of copy, then the buttons. Use `CentredHead`.
- **A section whose job is reading or scanning content is left-aligned, head included:** its eyebrow and title sit on the same left edge as the content below them. This covers the About story, the event ledger and the home events preview, the team roster, the contact form, the legal text and every long paragraph. Use `SectionHead`. A centred head over left-aligned content leaves the reader without one edge to return to.

## Signature texture

Lit velvet is the texture on every velvet and velvet black container. There is no flat variant of either. `Slab` draws it when `texture` is set, on the `inverse` and `accent` tones only.

- **Lit grounds.** Lit velvet is mostly `--accent` with `--inverse` at the far side; lit velvet black is mostly `--inverse` with `--accent` where the light falls. These are the only gradients on the site.
- **Dot matrix.** A grid of dots in the ground's text colour at `--dot-strength`, brightest under the light.
- **Grain.** Fine and coarse fractal noise together under the dot matrix. It moves six times a second and stops only under reduced motion.
- **One unit.** A dot is `--tex-dot` across, a ribbon line is `--tex-dot` thick and solid, and both repeat every `--tex-pitch`.
- **Ribbon.** Parallel lines offset from one curve, strongest at the centre, never crossing. Drawn once per size; the same band always draws the same way. It never moves.
- **Five shapes.** `sweep` for a closing band, `rise` for a statement slab, `arc` for a stats band, `waist` for a page head, `pair` for a wide, short band.

The numbers come from `docs/redesign/reference.html`. Change them there first.

## Extending the system

When you need something that is not in here:

1. **Look first.** Open `floor.html`. Most new components are an existing one re-composed.
2. **Spend tokens only.** Every colour, radius, shadow, duration and easing comes from `tokens.css`. No new hex, no new number.
3. **Reuse a sequence.** Pick from the eleven in `motion.md`. A new one is a design decision, not an implementation detail.
4. **Add it back.** Ship the component and its card in `floor.html` in the same change. If it is not in `floor.html`, it does not exist.

Do not invent a colour, add a border to separate anything, write a one-off animation, or ship a component without its card.

## Adopting this in the app

`tokens.css` is written for Tailwind v4's CSS-first `@theme`, which is where `src/app/globals.css` already keeps its tokens, so this is a replacement of the token block and not a framework change. The `@theme inline` form is required: every value is a `var()` reference, so each utility resolves to the runtime variable.
