# Motion

Every sequence in here is running live in `floor.html`. Watch it there first; this file is the spec, not the demo.

## The thesis

Sales motion arrives and stops. Everything moves fast out of the gate and comes to a dead stop, which is what `--e-enter` describes. Nothing eases in slowly, nothing overshoots, nothing loops, with two exceptions: `--e-snap` on the theme toggle knob, and `--e-drift` on the marquee.

Three laws:

1. **Legible at rest.** Every section is readable before its reveal runs. Nothing is parked at `opacity: 0` waiting on an observer, because a viewer who lands mid-page, a crawler, or a reduced-motion viewer must see a finished page.
2. **One orchestrated moment per page.** The hero gets the sequence. Everything below gets a single move on arrival and nothing more.
3. **Motion carries meaning or it does not ship.** A reveal says a section has begun. A slab clipping in says where a boundary is, which matters more here than anywhere because there are no lines. A row expanding says it is interactive.

## The budget

| Situation | Duration | Easing |
| --- | --- | --- |
| Press, cursor snap | `--d-tap` 90ms | `--e-enter` |
| Hover fill, colour shift, icon nudge | `--d-hover` 180ms | `--e-enter` |
| Something changes size or position | `--d-move` 320ms | `--e-move` |
| Type or a slab clears a mask | `--d-arrive` 620ms | `--e-enter` |
| A full entrance, end to end | `--d-seq` 1100ms cap | mixed |
| Anything leaving | `--d-move` | `--e-exit` |
| Marquee, progress fill | `--d-drift` 48s | `--e-drift` |

Stagger is 60ms between lines, 40ms between words, 35ms between menu items. More than five staggered elements is too many.

Animate `transform` and `opacity` only. `clip-path` is allowed on the mask reveals because it is the point of them. Never animate `width`, `height`, `top` or `left` — with one documented exception, the mobile nav panel, which animates a JS-measured `height` because `height: auto` is not interpolable.

## The twelve sequences

### 1. Line Mask Reveal

The signature. Each visual line is wrapped in an `overflow: hidden` block; the inner span goes from `translateY(112%)` to `0`.

```jsx
const container = { show: { transition: { staggerChildren: 0.06 } } };
const line = { hidden: { y: "112%" }, show: { y: 0, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } } };
```

Framer Motion, not GSAP. Lines are an authored array, never one string left to wrap. The mask wrapper needs `padding-bottom: 0.06em` and a matching negative margin or descenders clip.

### 2. Word Cascade

Hero subtitle only. Words move from `translateY(0.35em)` and `opacity: 0` to rest, 40ms apart, `--d-move`, `--e-enter`. Never on a title, never on body copy.

### 3. Slab Clip

Replaces the fade-up every other site uses, and in a system with no lines it is what announces a boundary.

```css
clip-path: inset(0 0 100% 0 round var(--r-xl));  /* to */  inset(0 0 0 0 round var(--r-xl));
```

The `round` value must appear in **both** keyframes or the corner pops square mid-animation.

### 4. Fill Sweep

The borderless replacement for an underline. `--accent-veil` sweeps across a chip or row from `scaleX(0)`, `transform-origin: left`, `--d-hover`. On a filter or nav pill the active indicator is a `--r-pill` `--accent` block that slides with Framer Motion's `layoutId`, `--d-move`, `--e-move`. Colour is never the only cue; the label also changes weight.

### 5. Counter Roll

Counts zero to value over `--d-seq`, `--e-enter`, starting at 70 percent visible. `tabular-nums` is mandatory or the row reflows every frame. The suffix does not animate.

### 6. Magnetic Pull

Buttons and the custom cursor. Up to 6px toward the pointer at `--d-tap`, released over `--d-move`. Behind `@media (hover: hover) and (pointer: fine)`. Never on touch, never on a form field.

### 7. Marquee Drift

Track translates `-50%` over `--d-drift`, `--e-drift`, infinite, contents duplicated exactly once. On scroll it picks up a `skewX` up to 4 degrees proportional to scroll velocity, returning over `--d-move`. The one ambient loop. Pauses on hover, on `focus-within`, and on `visibilitychange`.

### 8. Scroll Scrub

Once per page at most, on the story section. Pins at `--layer-sticky`, one property scrubs against progress. GSAP ScrollTrigger, `scrub: 0.6`. The only place motion is tied to scroll position rather than triggered by it. Disabled below 1024px. GSAP loads only on routes that use this.

### 9. Clip Reveal

Images and gallery. `clip-path: inset(0 0 100% 0 round var(--r-md))` to `inset(0 0 0 0 round var(--r-md))`, with the image starting at `scale(1.06)` and settling to `1` over the same duration, so frame and content arrive at different rates. Cells stagger 60ms in reading order.

### 10. Row Expand

Directory and event rows. Block padding grows, the name shifts right, `--raised` fill and `--sh-2` come in, the avatar clips from the right. `--d-move`, `--e-move`. The row is one link, so keyboard focus produces the identical state.

### 11. Theme Wipe

A circle expands from the toggle's own centre to cover the viewport, revealing the new theme underneath.

```js
const r = el.getBoundingClientRect();
const x = r.left + r.width / 2, y = r.top + r.height / 2;
const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
const t = document.startViewTransition(applyTheme);
await t.ready;
document.documentElement.animate(
  { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
  { duration: 620, easing: "cubic-bezier(0.16,1,0.3,1)", pseudoElement: "::view-transition-new(root)" }
);
```

Because the accent hue flips as well as the ground, this is the most visible interaction on the site. Unsupported browsers get an instant swap with a `--d-hover` cross-fade on colour only.

### 12. Nav Expand

The mobile pill grows into a panel. Not a drawer, not a second menu — the same element.

- `height` on the panel from `0` to the measured `scrollHeight`, `--d-move`, `--e-move`. JS-measured because `auto` is not interpolable.
- `border-radius` from `25px` (half the closed height, a true pill) to `--r-xl`. **Never from `--r-pill`**: 999px re-clamps to half the width as the box grows and bulges it into a stadium.
- Items stagger in 35ms apart, `--d-move`, `--e-enter`.
- The hamburger cross-fades to an X: two stacked `<g>` groups, opacity plus a `0.8` scale over `--d-move`. No rotation.
- Collapses on the X, on selecting an item, on Escape, and on a `pointerdown` outside the pill.

## Reduced motion

Honoured per sequence, never a blanket `animation: none`, which would leave masked content invisible.

| Sequence | Reduced behaviour |
| --- | --- |
| Line Mask Reveal, Word Cascade, Clip Reveal | Final state immediately. |
| Slab Clip | Rendered at full height. |
| Fill Sweep | Fill appears instantly, indicator jumps. |
| Counter Roll | Final value immediately. |
| Magnetic Pull | Off. Hover is colour and weight only. |
| Marquee Drift | Stops and reflows to a static wrapped grid. |
| Scroll Scrub | Pin released, becomes a vertical stack. |
| Row Expand | Padding and offset drop, fill still applies. |
| Theme Wipe | Instant swap, no circle. |
| Nav Expand | Panel opens with no transition. |
| Curtain | Does not render. |

Lenis smooth scrolling is disabled entirely under reduced motion.

## Performance

- `will-change: transform` added on mount, removed when the animation completes.
- One shared IntersectionObserver for all reveal targets, not one per element.
- GSAP only on the routes that use Scroll Scrub. Framer Motion covers everything else.
- `clip-path` with `round` is more expensive than a plain inset; at most four Slab Clips per page.

## Banned

Fade-up on every block. Parallax backgrounds. Text that types itself. Anything that floats or pulses at rest. Visible spring wobble outside `--e-snap`. Hover effects that move a neighbour. Anything longer than `--d-seq`. Scroll-jacking, which is different from Scroll Scrub: the page always responds to a normal scroll gesture at a normal rate.
