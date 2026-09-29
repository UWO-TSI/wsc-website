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
/*
  Two scales inside one h1, both existing type roles and nothing between them.

  "Welcome to" takes `.title`, the same role the landing page section heads
  use, so it reads as a lead-in. The name itself takes `.title-hero` on three
  lines. On a wide viewport that is 3.25rem against 9rem, which is what makes
  the name land rather than the greeting.

  The size class goes on the `.ln` wrapper, not the inner span: the mask is an
  overflow-hidden block whose height and its 0.06em descender allowance are
  both computed from the wrapper's own font size. Putting the scale on the
  inner span would leave the greeting masked by a hero-sized line box.

  Titles are Archivo all caps by the type role, so these carry the words and
  not the casing.
*/
const TITLE_LINES = [
  { text: 'Welcome to', scale: 'title' },
  { text: 'Western’s', scale: 'title-hero' },
  { text: 'Sales', scale: 'title-hero' },
  { text: 'Community', scale: 'title-hero' },
] as const;

export default function Hero() {
  const { complete } = usePreloader();
  const ref = useReveal<HTMLElement>({ immediate: true, enabled: complete });

  return (
    <section
      ref={ref}
      className="flex min-h-[calc(100svh-2px)] flex-col justify-center gap-8 px-[var(--gut)] py-24"
    >
      {/* The h1 carries no scale of its own: each masked line sets its own. */}
      <h1 className="m-0">
        {TITLE_LINES.map((line) => (
          <span key={line.text} className={`ln ${line.scale}`}>
            <i>{line.text}</i>
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
