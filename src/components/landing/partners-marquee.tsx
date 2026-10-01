'use client';

import { useEffect, useRef, useState } from 'react';
import RevealImage from '@/components/ui/reveal-image';

import type { Sponsor } from '@/types/database';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import Skeleton from '@/components/ui/skeleton';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useSiteContent } from '@/providers/site-content-provider';

/*
  Partners marquee: sequence 7, Marquee Drift. The one ambient loop in the
  system.

  Structure borrowed from the ReactBits LogoLoop, reduced to the parts that
  actually matter here:

  - Enough copies to overflow the viewport, counted from the real rendered
    width rather than hardcoded at two. With a handful of sponsors two copies
    can be narrower than the screen, and the loop then shows a visible gap on
    every pass. This was the actual bug behind the track looking wrong.
  - A constant px/sec speed, so the marquee travels at the same rate whether
    the club has three partners or thirty. The duration is derived from one
    group's width instead of being a flat 48s.
  - An edge fade, so the track dissolves at the boundary instead of being cut
    by an invisible line, which is the right move in a system with no borders.
  - A small scale on hover for the logo under the pointer.

  Dropped from the earlier version: the scroll-velocity skew. motion.md does
  specify it, but in practice it read as a rendering glitch rather than as
  momentum, and motion law 3 says a move either carries meaning or it does not
  ship. Recorded as a deliberate deviation.

  The whole section sits on --logo-ground with light ink: the sponsor marks are
  supplied artwork, mostly light-on-transparent, and they need a dark ground.
  The logos themselves sit directly on it with no tile behind them.

  Pauses on hover, on focus-within, and on visibilitychange. Under reduced
  motion the loop stops and the track reflows to a static wrapped row.
*/

/** Pixels per second. Slow enough to read a mark as it passes. */
const SPEED = 40;

interface PartnersMarqueeProps {
  sponsors: Sponsor[];
  loading: boolean;
}

export default function PartnersMarquee({ sponsors, loading }: PartnersMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [duration, setDuration] = useState(48);
  const [hidden, setHidden] = useState(false);
  const { text } = useSiteContent();

  const active = sponsors.filter((sponsor) => sponsor.active);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const group = groupRef.current;
    if (!viewport || !group) return;

    /*
      Measured only from the ResizeObserver callback, never synchronously in
      the effect body: the observer fires once on observe with the initial
      size, so this still lands on the first frame without a setState during
      the effect.
    */
    const observer = new ResizeObserver(() => {
      const groupWidth = group.getBoundingClientRect().width;
      if (!groupWidth) return;

      const viewportWidth = viewport.getBoundingClientRect().width;
      /* One spare copy beyond what fills the viewport, so the seam is always
         off screen at the moment the animation wraps. */
      setCopies(Math.max(2, Math.ceil(viewportWidth / groupWidth) + 1));
      setDuration(Math.max(12, groupWidth / SPEED));
    });

    observer.observe(viewport);
    observer.observe(group);
    return () => observer.disconnect();
  }, [active.length]);

  /*
    Only bail once we know there is nothing to show. Returning null while the
    query is still in flight meant the section did not exist, and then the page
    grew by a whole band the moment the sponsors landed, shoving everything
    below it down. Loading renders the slab and a row of skeleton tiles at the
    real size instead.
  */
  if (!loading && active.length === 0) return null;

  return (
    <Slab tone="logo" className="mx-[var(--gut)]" aria-labelledby="partners-heading">
      <div className="flex flex-col gap-8">
        <SectionHead
          eyebrow={text('home.partners.eyebrow')}
          index="03"
          id="partners-heading"
          title={[text('home.partners.title_line1')]}
        />

        {loading ? (
          <div className="mq" role="status" aria-busy="true" aria-label="Loading partners">
            <div className="mq-group">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} index={i} className="h-12 w-36 rounded-md sm:h-14 sm:w-44" />
              ))}
            </div>
          </div>
        ) : (
          /* No role and no label: the section is already labelled by its
             heading, the first group carries the real names, and every
             duplicate is aria-hidden. role="marquee" would make this a live
             region and have it announced on every pass for no benefit. */
          <div ref={viewportRef} className="mq">
            <div
              className={`mq-track ${hidden ? 'is-paused' : ''}`}
              style={
                {
                  '--mq-copies': copies,
                  '--mq-duration': `${duration}s`,
                } as React.CSSProperties
              }
            >
              {Array.from({ length: copies }, (_, copy) => (
                <div
                  key={copy}
                  ref={copy === 0 ? groupRef : undefined}
                  className="mq-group"
                  aria-hidden={copy > 0}
                >
                  {active.map((sponsor) => {
                    const logoUrl = getPublicUrl('sponsor-logos', sponsor.logo_path);

                    return (
                      <div key={`${copy}-${sponsor.id}`} className="mq-item h-12 w-36 sm:h-14 sm:w-44">
                        {logoUrl ? (
                          <RevealImage
                            src={logoUrl}
                            alt={sponsor.name}
                            sizes="176px"
                            className="h-full w-full"
                            fit="contain"
                            sequence="fade"
                          />
                        ) : (
                          /* Never redraw a sponsor's mark. With no file, their
                             name set in the display face stands in for it. */
                          <span className="text-center font-display text-base font-bold uppercase leading-tight sm:text-lg">
                            {sponsor.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Button href="/sponsors" variant="tertiary" arrow>
            {text('home.partners.link_label')}
          </Button>
        </div>
      </div>
    </Slab>
  );
}
