'use client';

import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import RevealImage from '@/components/ui/reveal-image';

/*
  CTABand: sequence 3, Slab Clip. The page's one loud slab: --accent, the
  only place --accent and --page ever touch on this page. A primary Button on
  an --accent slab takes onAccent, because it has nowhere to go otherwise.

  The photo is the point of the section: someone deciding whether to join
  should see who they would be joining. It takes the narrower column, because
  the ask is the copy and the button.
*/
export default function CTASection() {
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
            eyebrow="Join"
            index="05"
            id="cta-heading"
            title={['Apply to join']}
          />

          <p className="subtitle measure">
            Membership is sold through the Western USC store.
          </p>

          <Button
            href="https://westernusc.store/product/western-sales-club/"
            target="_blank"
            rel="noopener noreferrer"
            onAccent
            arrow
          >
            Apply to join
          </Button>
        </div>

        <RevealImage
          src="/imagery/sales-comp-2.avif"
          alt="Western Sales Club members together at a club event"
          sizes="(max-width: 1024px) 100vw, 520px"
          className="aspect-[4/3] w-full rounded-md"
        />
      </div>
    </Slab>
  );
}
