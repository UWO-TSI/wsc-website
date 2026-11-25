'use client';

import Eyebrow from '@/components/ui/eyebrow';
import Slab from '@/components/ui/slab';
import { EditableButton, EditableImage, EditableLines, EditableText, useEditMode } from '@/edit';
import { usePreloader } from '@/providers/preloader-provider';
import { useReveal, cascade } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';

/*
  KineticHeadline: the one orchestrated moment on the page. Sequence 1, Line
  Mask Reveal, on the title; sequence 2, Word Cascade, on the subtitle. It
  holds its reveal until the Curtain lifts: design-system/adoption.md, "The
  preloader handoff".

  A selling section, so it is centred: eyebrow, headline, subtitle, then
  Apply to join and See events. Apply to join reads home.cta.*, the same
  keys as the nav, About and the closing band, so one edit changes all four.

  Two scales inside one h1, both existing type roles. The greeting takes
  `.title` and the name takes `.title-hero`, so the name lands rather than
  the greeting. The scale goes on the `.ln` wrapper, not the inner span: the
  mask height and its descender allowance are computed from the wrapper's
  own font size. Each name line's ceiling (14 characters) is what stops an
  edit from wrapping it onto a second row.

  Line Mask Reveal staggers by `.ln:nth-child()`, so all four lines must be
  direct children of the h1 for the name to rise at 60, 120 and 180ms after
  the greeting. The visitor branch renders the name lines itself for that
  reason; while editing the stagger is off, so the lines field takes their
  place, as the subtitle's does below.

  The background is a photo slot (home.hero.image1) under the centred head,
  full bleed. The hero is an inverse slab with the waist ribbon, the page
  head's treatment, so the head takes the inverse ink and the primary button
  takes the page fill on its own. The photo covers the ribbon; an empty slot
  shows the placeholder over it. --inverse-veil sits over the photo at a fixed
  strength, which keeps every line of the head at AA over any photo.

  The photo is a sibling of the head, not a child: the clip rules match any
  running ancestor, so inside the head it would unclip with the title whether
  its bytes had landed or not. It runs its own Clip Reveal, held under the
  Curtain like the title.
*/

const NAME_KEYS = ['home.hero.title_line2', 'home.hero.title_line3', 'home.hero.title_line4'] as const;

export default function Hero() {
  const { complete } = usePreloader();
  const ref = useReveal<HTMLDivElement>({ immediate: true, enabled: complete });
  const { text } = useSiteContent();
  const { editing } = useEditMode();
  const greeting = text('home.hero.title_line1');
  const names = NAME_KEYS.map((k) => ({ k, value: text(k) })).filter((line) => line.value);

  return (
    <Slab
      tone="inverse"
      texture="waist"
      overflowHidden
      aria-labelledby="hero-title"
      className="relative pt-[clamp(7.5rem,14vw,11rem)]! pb-[var(--pad-section)]!"
    >
      <EditableImage
        slot="home.hero.image1"
        sizes="100vw"
        className="absolute! inset-0 rounded-[inherit]"
        hold={!complete}
        priority
        veil
      />

      <div ref={ref} className="relative flex flex-col items-center gap-7 text-center">
        <Eyebrow>
          <EditableText k="home.hero.eyebrow" />
        </Eyebrow>

        {/* The h1 carries no scale of its own: each masked line sets its own. */}
        <h1 id="hero-title" className="m-0">
          {(editing || greeting) && (
            <span className="ln title">
              <i>
                <EditableText k="home.hero.title_line1" />
              </i>
            </span>
          )}
          {editing ? (
            <EditableLines
              keys={[...NAME_KEYS]}
              as="span"
              className="mt-[0.22em] block"
              lineClassName="ln title-hero"
            />
          ) : (
            names.map((name, i) => (
              <span key={name.k} className={`ln title-hero ${i === 0 ? 'mt-[0.22em]' : ''}`.trim()}>
                <i>{name.value}</i>
              </span>
            ))
          )}
        </h1>

        {/*
          Word Cascade needs one span per word, which a field cannot be. While
          editing the cascade is off anyway, so the field takes its place.
        */}
        {editing ? (
          <EditableText k="home.hero.subtitle" as="p" className="subtitle measure" />
        ) : (
          <p className="subtitle cascade measure">{cascade(text('home.hero.subtitle'))}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <EditableButton labelKey="home.cta.button_label" hrefKey="home.cta.button_href" arrow />
          <EditableButton
            labelKey="home.hero.events_label"
            hrefKey="home.hero.events_href"
            variant="secondary"
          />
        </div>
      </div>
    </Slab>
  );
}
