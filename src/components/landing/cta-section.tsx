'use client';

import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import RevealImage from '@/components/ui/reveal-image';
import { useSiteContent } from '@/providers/site-content-provider';
import { externalLinkProps } from '@/lib/link-utils';

/*
  CTABand: sequence 3, Slab Clip. The page's one loud slab: --accent, the
  only place --accent and --page ever touch on this page. A primary Button on
  an --accent slab takes onAccent, because it has nowhere to go otherwise.

  The photo is the point of the section: someone deciding whether to join
  should see who they would be joining. It takes the narrower column, because
  the ask is the copy and the button.
*/
export default function CTASection() {
  const { text, image } = useSiteContent();
  const href = text('home.cta.button_href');

  return (
    <Slab
      tone="accent"
      clip
      overflowHidden
      className="mx-[var(--gut)]"
      aria-labelledby="cta-heading"
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
        <div className="flex flex-col items-start gap-6">
          <SectionHead
            eyebrow={text('home.cta.eyebrow')}
            index="05"
            id="cta-heading"
            title={[text('home.cta.title_line1')]}
          />

          <p className="subtitle measure">{text('home.cta.subtitle')}</p>

          <Button href={href} {...externalLinkProps(href)} onAccent arrow>
            {text('home.cta.button_label')}
          </Button>
        </div>

        <RevealImage
          {...image('home.cta.image1')}
          sizes="(max-width: 1024px) 100vw, 520px"
          className="aspect-[4/3] w-full rounded-md"
        />
      </div>
    </Slab>
  );
}
