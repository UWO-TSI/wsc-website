'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import { EditableButton, EditableImage } from '@/edit';

/*
  About: a centred head (eyebrow, title, the body copy, then Apply to join
  and the link to the About page), over a three-frame photo strip.

  The strip rather than one full-width photo: blown up to the slab width a
  single shot was upscaled past its own resolution and went soft; at a third
  of the width each frame is displayed at or below its native size.

  Clip Reveal, sequence 9: each cell unclips while its photo settles from
  1.06, staggered 60ms in reading order by `index`.

  The counted figures moved to directly under the hero (StatsRow).
*/
const PHOTO_SLOTS = ['home.about.image1', 'home.about.image2', 'home.about.image3'] as const;

export default function AboutSection() {
  return (
    <Slab tone="raised" aria-labelledby="about-heading">
      <div className="flex flex-col gap-10 py-[clamp(1rem,4vw,2.5rem)]">
        <CentredHead
          id="about-heading"
          eyebrowKey="home.about.eyebrow"
          titleKeys={['home.about.title_line1', 'home.about.title_line2']}
          bodyKey="home.about.body"
        >
          <EditableButton labelKey="home.cta.button_label" hrefKey="home.cta.button_href" arrow />
          <EditableButton
            labelKey="home.about.link_label"
            hrefKey="home.about.link_href"
            variant="tertiary"
            arrow
          />
        </CentredHead>

        <ul className="m-0 mx-auto grid w-full max-w-[1100px] list-none grid-cols-3 gap-2 p-0 sm:gap-3">
          {PHOTO_SLOTS.map((slot, i) => (
            <li key={slot} className="m-0">
              <EditableImage
                slot={slot}
                sizes="(max-width: 700px) 33vw, 360px"
                className="aspect-[4/3] w-full rounded-md"
                index={i}
              />
            </li>
          ))}
        </ul>
      </div>
    </Slab>
  );
}
