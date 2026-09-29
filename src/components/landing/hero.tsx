'use client';

import Button from '@/components/ui/button';
import { usePreloader } from '@/providers/preloader-provider';
import { useReveal, cascade } from '@/lib/reveal';

/*
  KineticHeadline: the one orchestrated moment on the page. Sequence 1, Line
  Mask Reveal, on the title; sequence 2, Word Cascade, on the subtitle.

  Lines are an authored array, never one string left to wrap. The hero holds
  its reveal until the Curtain lifts: design-system/adoption.md, "The
  preloader handoff".
*/
/* Titles are Archivo all caps by the type role, so these carry the words and
   not the casing. The org name at hero scale is the homepage's title, which is
   also what floor.html's own hero card demonstrates. */
const TITLE_LINES = ['Western', 'Sales', 'Club'];

export default function Hero() {
  const { complete } = usePreloader();
  const ref = useReveal<HTMLElement>({ immediate: true, enabled: complete });

  return (
    <section
      ref={ref}
      className="flex min-h-[calc(100svh-2px)] flex-col justify-center gap-8 px-[var(--gut)] py-24"
    >
      <h1 className="title-hero">
        {TITLE_LINES.map((line) => (
          <span key={line} className="ln">
            <i>{line}</i>
          </span>
        ))}
      </h1>

      <p className="subtitle cascade measure">
        {cascade('A student-run sales organization at Western University.')}
      </p>

      <div>
        <Button
          href="https://westernusc.store/product/western-sales-club/"
          target="_blank"
          rel="noopener noreferrer"
          arrow
        >
          Apply to join
        </Button>
      </div>
    </section>
  );
}
