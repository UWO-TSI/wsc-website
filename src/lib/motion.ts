import type { Transition, Variants } from 'framer-motion';

/*
  WSC Floor motion. The spec is design-system/motion.md; the demos are running
  in design-system/floor.html. Read the budget below before animating anything.

  Division of labour:
  - The scroll-triggered reveal sequences (Line Mask, Word Cascade, Slab Clip,
    Clip Reveal) are CSS keyframes gated on [data-run], driven by
    src/lib/reveal.tsx. That is what keeps a section legible at rest.
  - Framer Motion owns what CSS cannot do: the nav indicator's layoutId, the
    AnimatePresence exits (preloader, lightbox, mobile panel), and the hero,
    which mounts after the preloader and so has no at-rest concern.
  - GSAP owns exactly one thing, Scroll Scrub on the story section, and loads
    only on that route.

  Everything uses E.enter unless it is leaving. Nothing floats, nothing
  bounces, nothing loops except the marquee.
*/

type CubicBezier = [number, number, number, number];

/** The four curves. E.snap is the only overshoot in the system. */
export const E = {
  enter: [0.16, 1, 0.3, 1] as CubicBezier,
  exit: [0.5, 0, 0.9, 0.2] as CubicBezier,
  move: [0.65, 0, 0.35, 1] as CubicBezier,
  snap: [0.22, 1.2, 0.36, 1] as CubicBezier,
} as const;

/** The budget, in seconds, matching the ms tokens in globals.css. */
export const D = {
  /** Press, cursor snap. */
  tap: 0.09,
  /** Hover fill, colour shift, icon nudge. */
  hover: 0.18,
  /** Something changes size or position. Also every exit. */
  move: 0.32,
  /** Type or a slab clears a mask. */
  arrive: 0.62,
  /** A full entrance, end to end. Hard cap. */
  seq: 1.1,
  /** The marquee. The one ambient loop. */
  drift: 48,
} as const;

/** More than five staggered elements is too many. */
export const STAGGER = {
  line: 0.06,
  word: 0.04,
  item: 0.035,
} as const;

/** Anything leaving: D.move on E.exit. */
export const exitTransition: Transition = { duration: D.move, ease: E.exit };

/* ── Sequence 1, Line Mask Reveal ──
   Each visual line is wrapped in an overflow:hidden block (.ln) and the inner
   span rises from 112%. Lines are an authored array, never one string left to
   wrap. Use these only where the component already mounts client-side; for
   anything scroll-triggered use .ln with useReveal(). */

export const lineContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.line } },
};

export const lineMask: Variants = {
  hidden: { y: '112%' },
  show: { y: 0, transition: { duration: D.arrive, ease: E.enter } },
};

/* ── Sequence 2, Word Cascade ──
   Hero subtitle only. Never on a title, never on body copy. */

export const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.word, delayChildren: 0.18 } },
};

export const wordVariant: Variants = {
  hidden: { opacity: 0, y: '0.35em' },
  show: { opacity: 1, y: 0, transition: { duration: D.move, ease: E.enter } },
};

/* ── Sequence 3, Slab Clip ──
   Replaces the fade-up every other site uses. The `round` value must appear in
   both keyframes or the corner pops square mid-animation. */

export function slabClip(radius = 'var(--r-xl)'): Variants {
  return {
    hidden: { clipPath: `inset(0 0 100% 0 round ${radius})` },
    show: {
      clipPath: `inset(0 0 0 0 round ${radius})`,
      transition: { duration: D.arrive, ease: E.enter },
    },
  };
}

/* ── Sequence 4, Fill Sweep ──
   The borderless replacement for an underline. On a nav or filter pill the
   active indicator is a --r-pill --accent block that slides on layoutId with
   this transition. Colour is never the only cue: the label also changes
   weight. */

export const indicatorTransition: Transition = { duration: D.move, ease: E.move };

export const fillSweep: Variants = {
  rest: { scaleX: 0 },
  active: { scaleX: 1, transition: { duration: D.hover, ease: E.enter } },
};

/* ── Sequence 9, Clip Reveal ──
   Frame and content arrive at different rates. Cells stagger 60ms in reading
   order. */

export function clipReveal(radius = 'var(--r-md)'): Variants {
  return {
    hidden: { clipPath: `inset(0 0 100% 0 round ${radius})` },
    show: {
      clipPath: `inset(0 0 0 0 round ${radius})`,
      transition: { duration: D.arrive, ease: E.enter },
    },
  };
}

export const clipInner: Variants = {
  hidden: { scale: 1.06 },
  show: { scale: 1, transition: { duration: D.arrive, ease: E.enter } },
};

/* ── Sequence 12, Nav Expand ──
   The panel animates a JS-measured height because height:auto is not
   interpolable. This is the one documented exception to transform-and-opacity
   only. The radius goes from the literal half-closed-height to --r-xl, never
   from --r-pill: 999px re-clamps to half the width as the box grows and
   bulges it into a stadium. */

export const NAV_CLOSED_RADIUS = 25;

export const navPanelTransition: Transition = { duration: D.move, ease: E.move };

export const navItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: D.move, ease: E.enter, delay: 0.07 + i * STAGGER.item },
  }),
  exit: { opacity: 0, y: 10, transition: exitTransition },
};

/* ── Curtain, the preloader exit ── */

export const curtain: Variants = {
  show: { y: 0 },
  exit: { y: '-101%', transition: { duration: D.arrive, ease: E.exit } },
};

/* ── Magnetic Pull, sequence 6 ──
   Up to 6px toward the pointer, behind (hover: hover) and (pointer: fine).
   Never on touch, never on a form field. */

export const MAGNET_RANGE = 6;

/**
 * A single move on arrival, for components that are already inside an
 * AnimatePresence tree and cannot use the CSS [data-run] path.
 */
export const arrive: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: D.arrive, ease: E.enter } },
};

export const arriveContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.line } },
};
