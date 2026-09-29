'use client';

import Eyebrow from '@/components/ui/eyebrow';
import { useReveal } from '@/lib/reveal';

/*
  SectionHead — an eyebrow, a masked title and an optional line of meta.

  `title` is an authored array, one entry per visual line, never one string
  left to wrap: the Line Mask Reveal needs to know where the lines are. Two or
  three entries is the working range.

  Titles are Archivo all caps by the type role, so pass the words, not the
  casing. A page of medium-sized headings is the failure mode this system
  exists to prevent, so there is no size prop: this is the section title and
  the hero is the page title.
*/

interface SectionHeadProps {
  eyebrow?: string;
  index?: string;
  title: string[];
  meta?: string;
  id?: string;
  className?: string;
}

export default function SectionHead({
  eyebrow,
  index,
  title,
  meta,
  id,
  className = '',
}: SectionHeadProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={`flex flex-col gap-3 ${className}`.trim()}>
      {eyebrow && (
        <div className="flex flex-wrap items-baseline gap-3">
          <Eyebrow index={index}>{eyebrow}</Eyebrow>
          {meta && <span className="meta">{meta}</span>}
        </div>
      )}

      <h2 id={id} className="title">
        {title.map((line) => (
          <span key={line} className="ln">
            <i>{line}</i>
          </span>
        ))}
      </h2>

      {!eyebrow && meta && <span className="meta">{meta}</span>}
    </div>
  );
}
