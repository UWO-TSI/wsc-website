'use client';

import { useRef, useState } from 'react';
import { useBeforePaint, useReveal } from '@/lib/reveal';
import { D } from '@/lib/motion';

/*
  StatFigure — sequence 5, Counter Roll.

  Counts zero to value over --d-seq on --e-enter, starting at 70 percent
  visible. tabular-nums is mandatory or the row reflows every frame. The suffix
  does not animate.

  Only real numbers. If the figure is not something the club could defend in a
  room, use a SectionHead instead. Three in a row at most.
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
}

export default function StatFigure({ value, label, suffix, className = '' }: StatFigureProps) {
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
    <div ref={ref} className={`flex flex-col gap-1 ${className}`.trim()}>
      <span className="font-data text-[clamp(2.4rem,7vw,56px)] font-medium leading-none tracking-[-0.02em] tabular-nums">
        {shown}
        {suffix && <span className="text-accent-ink">{suffix}</span>}
      </span>
      <span className="label">{label}</span>
    </div>
  );
}
