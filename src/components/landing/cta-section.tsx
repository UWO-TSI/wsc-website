'use client';

import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';

/*
  CTABand — sequence 3, Slab Clip. The page's one loud slab: --accent, the
  only place --accent and --page ever touch on this page. A primary Button on
  an --accent slab takes onAccent, because it has nowhere to go otherwise.
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
      <div className="flex flex-col items-start gap-6">
        <SectionHead
          eyebrow="Join"
          index="05"
          id="cta-heading"
          title={['SELL FOR REAL', 'COMPANIES']}
        />

        <p className="subtitle measure">
          Apply now to train on live accounts, work the floor with a team, and
          compete for a spot at nationals.
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
    </Slab>
  );
}
