'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import Button from '@/components/ui/button';

/*
  CardRow: a row of large cards that scrolls sideways. The cards keep their
  size and the row scrolls instead of wrapping. It opens at its start: the
  first card sits one gutter (--gut) in from the viewport's left edge at
  every width, and the row runs to the viewport's right edge, so only the
  next card is cut off and shows there is more to scroll to. Cards snap by
  their left edge to that same line.

  Previous and Next under the row scroll one card for mouse users; each is
  disabled at its end, and both are hidden while every card fits. The row
  itself is focusable, so arrow keys scroll it, and touch and trackpads
  scroll it directly. Under reduced motion the buttons jump instead of
  gliding.

  Each child is an <li> with CARD_ROW_ITEM. `count` is the number of
  children: when it changes, the row measures its ends again.
  The caller owns `listRef`, so the edit mode editor's reorder can read the
  row's children.

  design-system/components.md, FormatCard and CardRow.
*/

/* The card width, 280px below 700px, and the snap point. */
export const CARD_ROW_ITEM = 'm-0 flex-none snap-start w-[clamp(280px,40vw,460px)]';

/* The edge padding and the snap padding are the page gutter, so the first
   card starts one gutter from the viewport's left edge. */
const EDGE = 'px-[var(--gut)] scroll-px-[var(--gut)]';

export default function CardRow({
  label,
  count,
  listRef,
  children,
}: {
  /** The row's accessible name, e.g. "Event formats". */
  label: string;
  count: number;
  listRef: RefObject<HTMLUListElement | null>;
  children: ReactNode;
}) {
  const rowRef = listRef;
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setAtStart(row.scrollLeft <= 1);
    setAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 1);
  }, [rowRef]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    row.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      row.removeEventListener('scroll', measure);
    };
  }, [measure, rowRef, count]);

  const step = (direction: 1 | -1) => {
    const row = rowRef.current;
    const card = row?.querySelector('li');
    if (!row || !card) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* One card plus the gap between cards. */
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <>
      <ul
        ref={rowRef}
        tabIndex={0}
        aria-label={label}
        className={`m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto no-scrollbar overscroll-x-contain p-0 pb-2 focus-visible:outline-offset-[-2px] ${EDGE}`}
      >
        {children}
      </ul>

      {!(atStart && atEnd) && (
        <div className="flex justify-center gap-3 px-[var(--gut)]">
          <Button variant="secondary" onClick={() => step(-1)} disabled={atStart} aria-label="Previous card">
            <Chevron direction="left" />
          </Button>
          <Button variant="secondary" onClick={() => step(1)} disabled={atEnd} aria-label="Next card">
            <Chevron direction="right" />
          </Button>
        </div>
      )}
    </>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
