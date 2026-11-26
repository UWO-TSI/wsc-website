'use client';

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

  A selling section, so it is centred: headline, subtitle, then
  one button per audience, Apply to join for students and Partner with us
  for companies. Apply to join reads home.cta.*, the same keys as the nav
  and the closing band, so one edit changes all of them.

  Two scales inside one h1, both existing type roles. The optional greeting
  takes `.title` and the headline lines take `.title-hero`. The scale goes on
  the `.ln` wrapper, not the inner span: the mask height and its descender
  allowance are computed from the wrapper's own font size. Each headline
  line's ceiling (14 characters) is what stops an edit from wrapping it onto
  a second row. A 14-character line can still wrap on a phone; the tray
  warns when it does.

  Line Mask Reveal staggers by `.ln:nth-child()`, so all four lines must be
  direct children of the h1 for the headline to rise at 60, 120 and 180ms after
  the greeting. The visitor branch renders the name lines itself for that
  reason; while editing the stagger is off, so the lines field takes their
  place, as the subtitle's does below. The field gets `.title-hero` from
  lineClassName, so the headline shows at its page size while editing. The
  h1 spans the column so that field takes the column's width, not the width
  of its own text.

  The hero is one full-bleed photo (home.hero.image1) that fills the first
  screen (at least 100svh), with the centred head over it, so the first
  screen shows the club at work. The brand strip follows directly below.
  The section is an inverse slab, so the head takes the inverse ink and the
  primary button takes the page fill. --inverse-veil sits over the photo at
  a fixed strength, which keeps every line of the head at AA over any photo;
  an empty slot shows the placeholder under the same veil. The photo counts
  as a photo, not as the page's inverse container, so Home's proof band
  stays inverse. It carries no ribbon, because the photo would cover it.

  The photo is a sibling of the head, not a child: the clip rules match any
  running ancestor, so inside the head it would unclip with the title
  whether its bytes had landed or not. It runs its own Clip Reveal, held
  under the Curtain like the title.
*/

const NAME_KEYS = ['home.hero.title_line2', 'home.hero.title_line3', 'home.hero.title_line4'] as const;

/* The step between the greeting and the name, in the name's own em. It is
   important because the title roles set margin: 0 outside any layer, which
   beats a utility. It is at least 12px, the two fields' fills (6px above
   and below each text box, edit.css), so in edit mode the greeting's fill
   and the name's fill never overlap; Preview and the visitor page use the
   same gap, so the name does not move between them. With no greeting
   there is no gap. */
const NAME_GAP = 'mt-[max(0.22em,12px)]!';

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
      overflowHidden
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-center pt-[clamp(7.5rem,14vw,11rem)]! pb-[var(--pad-section)]!"
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
        {/* The h1 carries no scale of its own: each masked line sets its own. */}
        <h1 id="hero-title" className="m-0 w-full">
          {/* While editing the greeting drops the Line Mask: its clip
              would cut the field's shell and focus ring. */}
          {editing ? (
            <span className="title block">
              <EditableText k="home.hero.title_line1" />
            </span>
          ) : (
            greeting && (
              <span className="ln title">
                <i>
                  <EditableText k="home.hero.title_line1" />
                </i>
              </span>
            )
          )}
          {editing ? (
            <EditableLines
              keys={[...NAME_KEYS]}
              as="span"
              className={`${NAME_GAP} block`}
              lineClassName="ln title-hero"
            />
          ) : (
            names.map((name, i) => (
              <span key={name.k} className={`ln title-hero ${i === 0 && greeting ? NAME_GAP : ''}`.trim()}>
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
            labelKey="home.hero.partner_label"
            hrefKey="home.hero.partner_href"
            variant="secondary"
          />
        </div>
      </div>
    </Slab>
  );
}
