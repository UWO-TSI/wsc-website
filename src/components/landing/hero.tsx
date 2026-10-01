'use client';

import Button from '@/components/ui/button';
import { usePreloader } from '@/providers/preloader-provider';
import { useReveal, cascade } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';
import { externalLinkProps } from '@/lib/link-utils';

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
  inner span would leave the greeting masked by a hero-sized line box. The
  second line carries a small top margin, in its own em, so the greeting
  sits a step above the name.

  Titles are Archivo all caps by the type role, so these carry the words and
  not the casing.

  The words are editable (site_content, home.hero.*); the scale per line is
  layout and stays here. A line left empty is dropped, and each line's
  ceiling (14 characters for a name line) is what stops an edit from
  wrapping a hero line onto a second row.
*/
const TITLE_LINES = [
  { key: 'home.hero.title_line1', scale: 'title' },
  { key: 'home.hero.title_line2', scale: 'title-hero' },
  { key: 'home.hero.title_line3', scale: 'title-hero' },
  { key: 'home.hero.title_line4', scale: 'title-hero' },
] as const;

export default function Hero() {
  const { complete } = usePreloader();
  const ref = useReveal<HTMLElement>({ immediate: true, enabled: complete });
  const { text } = useSiteContent();
  const href = text('home.hero.button_href');
  const lines = TITLE_LINES.map((line) => ({ ...line, text: text(line.key) })).filter(
    (line) => line.text
  );

  return (
    <section
      ref={ref}
      className="flex min-h-[calc(100svh-2px)] flex-col justify-center gap-8 px-[var(--gut)] py-24"
    >
      {/* The h1 carries no scale of its own: each masked line sets its own. */}
      <h1 className="m-0">
        {lines.map((line, i) => (
          <span key={line.key} className={`ln ${line.scale}${i === 1 ? ' mt-[0.22em]!' : ''}`}>
            <i>{line.text}</i>
          </span>
        ))}
      </h1>

      <p className="subtitle cascade measure">
        {cascade(text('home.hero.subtitle'))}
      </p>

      <div>
        <Button href={href} {...externalLinkProps(href)} arrow>
          {text('home.hero.button_label')}
        </Button>
      </div>
    </section>
  );
}
