# WSC Floor

The design and motion system for westernsalesclub.ca. Named after the sales floor.

**Open `design-system/floor.html` in a browser before writing any UI.** It is the visual source of truth: palette in both themes, type specimens, corners, elevation, easing curves and duration bars that run, all twelve motion sequences playing in place, and a live card per site component. Reading this file is not a substitute for looking at that one.

Published copy: https://claude.ai/artifact/FVj2N5CmLvssoHdBkFiG15

| File | What it is |
| --- | --- |
| `floor.html` | The live reference. Open it, do not import it. |
| `tokens.css` | What the app consumes. Replaces the `@theme` block in `src/app/globals.css`. |
| `motion.md` | The twelve named sequences, with the code for each. |
| `components.md` | The component inventory and the rules per component. |

## The five rules

1. **There are no borders.** Not on a section, a row, an input, or an image. Things are divided by a change in surface tone, by the gap between them, and by shadow. The only exception is `--focus`, an outline offset away from the element, which is never removed.
2. **The accent flips with the theme.** Showroom is white with deep velvet purple. Afterhours is near-black with gold. Components reference `--accent`, `--accent-ink` and `--on-accent`, never a literal purple or gold, so the whole site changes character with one toggle. `--velvet` and `--gold` are the two fixed marks: the Western affiliation lockup and sponsor tiers, which must read the same in both themes.
3. **Four type roles, nothing between them.** Title, subtitle, body, label. Every title is Archivo, all caps. A page of medium-sized headings is the failure mode this system exists to prevent.
4. **Motion arrives and stops.** Everything uses `--e-enter` unless it is leaving. Nothing floats, nothing bounces, nothing loops except the marquee. One overshoot in the entire system: `--e-snap`, on the theme toggle knob.
5. **Both themes ship together.** Every component is checked in both before it is done.

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

- Text on `--page`, `--raised` and `--sunken` is `--ink`; secondary is `--ink-muted`. `--ink-faint` sits near 3.4:1 and is for 24px-and-up marks, disabled labels and index numerals only, never running copy.
- On `--inverse` use `--on-inverse`. On `--accent` use `--on-accent`. Neither ever appears on the page ground.
- The accent as a **shape** is `--accent`. The accent as a **word** is `--accent-ink`. Swapping them is the most common way this palette gets broken: in Afterhours, raw gold on black is fine as a fill and unreadable as text.
- Status is `--ok`, `--warn`, `--alert`, each always shipped with a word. In Showroom `--ok` and `--alert` sit at nearly the same lightness, so hue alone never carries the meaning.

## Corners

Proportional, not decorative. Take the element's shorter side, divide by twelve, snap to the nearest step: chip `--r-xs`, input `--r-sm`, row `--r-md`, content slab `--r-lg`, full-width slab `--r-xl`. Never mix two steps on one element.

Two overrides: anything you can press is `--r-pill`, and avatars and the cursor are `--r-disc`. That is how a pressable thing announces itself in a system with no borders.

**Never animate from `--r-pill` to a fixed radius on a box that changes size.** 999px re-clamps to half the shorter side as the box grows, which bulges it into a stadium mid-transition. Use the literal half-height instead. The mobile nav does this: `25px` closed, `--r-xl` open.

## Elevation

Four levels. Shadows create the layers, since nothing has a border.

| Level | Use |
| --- | --- |
| flat | Recessed bands: `--sunken` sections, the footer. |
| `--sh-1` | Slabs, tiles, chips, inputs. |
| `--sh-2` | Primary button, hovered directory row, the nav pill. |
| `--sh-3` | Dialogs, the expanded nav, a pressed CTA. |

## Layout

A page is a stack of slabs on `--page`, each inset by the page gutter, `--r-xl` corners, separated by 24px of visible page ground. That gap plus the tone change is the divider.

Adjacent slabs never share a tone. `--inverse` and `--accent` never touch, and there is one of them per page. Not every section is a slab: the hero and at least one section per page sit bare on `--page`, which is what stops the stack reading as a list of cards.

## Extending the system

When you need something that is not in here:

1. **Look first.** Open `floor.html`. Most new components are an existing one re-composed.
2. **Spend tokens only.** Every colour, radius, shadow, duration and easing comes from `tokens.css`. No new hex, no new number.
3. **Reuse a sequence.** Pick from the twelve in `motion.md`. A thirteenth is a design decision, not an implementation detail.
4. **Add it back.** Ship the component and its card in `floor.html` in the same change. If it is not in `floor.html`, it does not exist.

Do not invent a colour, add a border to separate anything, write a one-off animation, or ship a component without its card.

## Adopting this in the app

`tokens.css` is written for Tailwind v4's CSS-first `@theme`, which is where `src/app/globals.css` already keeps its tokens, so this is a replacement of the token block and not a framework change. The `@theme inline` form is required: every value is a `var()` reference, and that indirection is what makes one class name resolve to velvet in Showroom and gold in Afterhours.

Theme is stamped on `<html>` as `data-theme`. Read it from `localStorage` in a blocking inline script in the document head, before hydration, falling back to `prefers-color-scheme`. Without that script the page flashes the wrong theme on every load.
