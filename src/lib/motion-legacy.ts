/**
 * DEPRECATED: the pre-Floor motion vocabulary.
 *
 * This file exists only so the tree keeps compiling while the redesign lands
 * one workstream at a time. Every importer of it is a component that has not
 * been migrated to WSC Floor yet, which makes `grep -rl motion-legacy src/`
 * the migration progress bar. When that returns nothing, delete this file.
 *
 * Do not import it into anything new. New work uses `@/lib/motion` and
 * `@/lib/reveal`.
 */

import type { Variants } from 'framer-motion';

type CubicBezier = [number, number, number, number];

export const easing = {
  easeOutExpo: [0.16, 1, 0.3, 1] as CubicBezier,
  easeOutQuart: [0.25, 1, 0.5, 1] as CubicBezier,
  easeInOutQuart: [0.76, 0, 0.24, 1] as CubicBezier,
  cursorSpring: { stiffness: 500, damping: 32, mass: 0.5 },
  staggerDefault: 0.08,
  staggerNav: 0.05,
} as const;

export const revealVariant: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easing.easeOutExpo },
  },
};

export const delayedRevealVariant: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easing.easeOutExpo, delay: 0.15 },
  },
};

export const exitVariant = {
  opacity: 0,
  y: -20,
  transition: { duration: 0.48, ease: easing.easeOutQuart },
};

export const containerVariant: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: easing.staggerDefault,
      delayChildren: 0.1,
    },
  },
};

export const viewportConfig = {
  once: true,
  margin: '-80px' as const,
};
