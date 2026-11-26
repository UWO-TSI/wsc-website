'use client';

import { useRef, useState } from 'react';
import { useBeforePaint, useReveal } from '@/lib/reveal';
import { D } from '@/lib/motion';

/*
  StatFigure: sequence 5, Counter Roll.

  Counts zero to value over --d-seq on --e-enter, starting at 70 percent
  visible. tabular-nums is mandatory or the row reflows every frame. The suffix
  does not animate.

  Only real numbers. If the figure is not something the club could defend in a
  room, use a SectionHead instead. Four in a row at most.

  `size="hero"` sets the figure in Archivo 900 for the ProofBand on an
  inverse slab, where the figures are the section's content. The default is
  Instrument Sans 600 at 56px with tabular figures, for a row of figures
  beside other content.

  The hero size fits its cell, which is a size container: the figure is
  the title-hero scale, or the cell's width less FIT_RESERVE divided by the
  row's longest figure in em, whichever is smaller. Every figure in a row
  takes the size of the longest one (`fit`), so the figures of a row are
  one size, and no value the editor allows (99999 and a 2-character
  suffix) reaches its neighbour. FIT_RESERVE is the padding and gap of the editor's number
  and suffix fields, so the editor sets the same size in the same cell.
*/

/* --e-enter as a function, so the count decelerates the way everything else
   in the system does instead of running linear. */
function enterEase(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

interface StatFigureProps {
  value: number;
  label: string;
  /** Rendered in --accent-ink and never animated, e.g. "+" or "%". */
  suffix?: string;
  className?: string;
  size?: 'default' | 'hero';
  /** Hero only: the row's widest figure in em (rowEm). Defaults to this figure's own. */
  fit?: number;
}

/** The hero figure's type, without its size (heroFigureSize). The editor sets the same. */
export const HERO_FIGURE = 'font-display font-black leading-none tracking-[-0.02em] tabular-nums';

const FIGURE_SIZES = {
  default: 'font-text text-[clamp(2.4rem,7vw,56px)] font-semibold leading-none tracking-[-0.03em] tabular-nums',
  hero: HERO_FIGURE,
} as const;

/* Archivo 900's tabular digit and its plus are 0.67em wide (measured);
   any other suffix character is counted as 1em, the widest capital. An
   empty suffix counts as one plus, the width of the editor's empty suffix
   field. */
const DIGIT_EM = 0.68;
const WIDE_EM = 1;
const FIT_RESERVE = '60px';

/** How wide a figure is, in em of its own font. */
export function figureEm(value: number, suffix?: string | null): number {
  const marks = suffix ? [...suffix].reduce((sum, ch) => sum + (ch === '+' ? DIGIT_EM : WIDE_EM), 0) : DIGIT_EM;
  return String(Math.max(0, Math.round(value))).length * DIGIT_EM + marks;
}

/** The widest figure of a row, for `fit`. */
export function rowEm(stats: Array<{ value: number; suffix?: string | null }>): number {
  return Math.max(DIGIT_EM * 2, ...stats.map((s) => figureEm(s.value, s.suffix)));
}

/** The hero font size for a row whose widest figure is `em` wide. Needs a container cell (`@container`). */
export function heroFigureSize(em: number): string {
  return `min(clamp(3rem, 8vw, 6.5rem), calc((100cqi - ${FIT_RESERVE}) / ${em.toFixed(2)}))`;
}

export default function StatFigure({
  value,
  label,
  suffix,
  className = '',
  size = 'default',
  fit,
}: StatFigureProps) {
  const ref = useReveal<HTMLDivElement>({ threshold: 0.7 });
  const [shown, setShown] = useState(value);
  const frame = useRef(0);

  /* Before paint: the server rendered the real figure, which is what law 1
     requires, and the reset to zero has to land before anyone sees it. */
  useBeforePaint(() => {
    const el = ref.current;
    if (!el) return;

    /* No data-run means reduced motion or no observer: the final value is
       already what is on screen, which is the required reduced behaviour. */
    if (el.getAttribute('data-run') !== 'off') return;

    setShown(0);

    let start: number | null = null;
    const duration = D.seq * 1000;

    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(enterEase(t) * value));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    const observer = new MutationObserver(() => {
      if (el.getAttribute('data-run') === 'on') {
        observer.disconnect();
        frame.current = requestAnimationFrame(step);
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ['data-run'] });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [ref, value]);

  return (
    <div ref={ref} className={`flex flex-col ${size === 'hero' ? 'gap-3' : 'gap-1'} ${className}`.trim()}>
      <span
        className={`${FIGURE_SIZES[size]} max-w-full`}
        style={size === 'hero' ? { fontSize: heroFigureSize(fit ?? figureEm(value, suffix)) } : undefined}
      >
        {shown}
        {suffix && <span className="accent-mark">{suffix}</span>}
      </span>
      <span className="label max-w-full wrap-break-word">{label}</span>
    </div>
  );
}
