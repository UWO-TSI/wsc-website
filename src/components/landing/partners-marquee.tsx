'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import type { Sponsor } from '@/types/database';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import { getPublicUrl } from '@/lib/supabase/storage';

/*
  Partners marquee: sequence 7, Marquee Drift. The track loops on --d-drift,
  linear, contents duplicated exactly once. It picks up a skew proportional to
  scroll velocity, returning over --d-move. It pauses on hover and on
  focus-within (both in CSS) and on visibilitychange (the .is-paused flag).

  Reduced motion stops the loop and drops the duplicate copy so the track
  reflows to a single static wrapped row.

  The sequence's CSS is part of the system and lives in globals.css alongside
  the other sequences: .mq, .mq-vp, .mq-track, .mq-group.
*/
interface PartnersMarqueeProps {
  sponsors: Sponsor[];
  loading: boolean;
}

export default function PartnersMarquee({ sponsors, loading }: PartnersMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const decay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hidden, setHidden] = useState(false);

  const active = sponsors.filter((sponsor) => sponsor.active);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    lastY.current = window.scrollY;
    lastT.current = performance.now();

    const onScroll = () => {
      const el = viewportRef.current;
      if (!el) return;

      const y = window.scrollY;
      const t = performance.now();
      const dt = Math.max(1, t - lastT.current);
      const velocity = (y - lastY.current) / dt;
      lastY.current = y;
      lastT.current = t;

      const skew = Math.max(-4, Math.min(4, velocity * 12));
      el.style.setProperty('--mq-skew', `${skew}deg`);

      if (decay.current) clearTimeout(decay.current);
      decay.current = setTimeout(() => el.style.setProperty('--mq-skew', '0deg'), 80);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (decay.current) clearTimeout(decay.current);
    };
  }, []);

  if (loading || active.length === 0) return null;

  return (
    <Slab tone="sunken" className="mx-[var(--gut)]" aria-labelledby="partners-heading">
      <div className="flex flex-col gap-8">
        <SectionHead
          eyebrow="Partners"
          index="03"
          id="partners-heading"
          title={['Who we work with']}
        />

        <div className="mq">
          <div ref={viewportRef} className={`mq-vp ${hidden ? 'is-paused' : ''}`}>
            <div className="mq-track">
              {[0, 1].map((copy) => (
                <div key={copy} className="mq-group" aria-hidden={copy === 1}>
                  {active.map((sponsor) => {
                    const logoUrl = getPublicUrl('sponsor-logos', sponsor.logo_path);
                    /*
                      Same constant dark ground as the partners page: these are
                      supplied marks, mostly light-on-transparent, and they
                      wash out on the Showroom ground.
                    */
                    return (
                      <div
                        key={`${copy}-${sponsor.id}`}
                        className="relative flex h-16 w-36 shrink-0 items-center justify-center overflow-hidden rounded-md bg-logo-ground p-3 shadow-1 sm:h-20 sm:w-48"
                      >
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={sponsor.name}
                            fill
                            sizes="192px"
                            className="object-contain p-3"
                          />
                        ) : (
                          <span className="text-center font-display text-base font-bold uppercase text-on-logo-ground sm:text-lg">
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
        </div>

        <div>
          <Button href="/sponsors" variant="tertiary" arrow>
            See all partners
          </Button>
        </div>
      </div>

    </Slab>
  );
}
