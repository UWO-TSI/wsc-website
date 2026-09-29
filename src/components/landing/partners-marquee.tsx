'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import type { Sponsor } from '@/types/database';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import { getPublicUrl } from '@/lib/supabase/storage';

/*
  Partners marquee — sequence 7, Marquee Drift. The track loops on --d-drift,
  linear, contents duplicated exactly once. It picks up a skew proportional to
  scroll velocity, returning over --d-move. It pauses on hover, on
  focus-within (CSS, in the scoped styles below) and on visibilitychange.

  Reduced motion stops the loop and drops the duplicate copy so the track
  reflows to a single static wrapped row.

  There is no marquee entry in globals.css yet (that file is off-limits to
  this stream), so the sequence's CSS lives scoped to this component.
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
          title={['WHO WE WORK', 'WITH']}
        />

        <div className="wsc-marquee overflow-hidden">
          <div
            ref={viewportRef}
            className={`wsc-marquee-vp ${hidden ? 'is-paused' : ''}`}
          >
            <div className="wsc-marquee-track">
              {[0, 1].map((copy) => (
                <div key={copy} className="wsc-marquee-group" aria-hidden={copy === 1}>
                  {active.map((sponsor) => {
                    const logoUrl = getPublicUrl('sponsor-logos', sponsor.logo_path);
                    return (
                      <div
                        key={`${copy}-${sponsor.id}`}
                        className="relative h-12 w-32 shrink-0 sm:h-16 sm:w-40"
                      >
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={sponsor.name}
                            fill
                            sizes="160px"
                            className="object-contain"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-center font-display text-base font-bold uppercase text-ink sm:text-lg">
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

      <style jsx global>{`
        .wsc-marquee-vp {
          transition: transform var(--d-move) var(--e-move);
          transform: skewX(var(--mq-skew, 0deg));
        }
        .wsc-marquee-track {
          display: flex;
          width: max-content;
          gap: clamp(2.5rem, 6vw, 5rem);
          animation: wsc-marquee-drift var(--d-drift) var(--e-drift) infinite;
        }
        .wsc-marquee-vp.is-paused .wsc-marquee-track,
        .wsc-marquee:hover .wsc-marquee-track,
        .wsc-marquee:focus-within .wsc-marquee-track {
          animation-play-state: paused;
        }
        .wsc-marquee-group {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          gap: clamp(2.5rem, 6vw, 5rem);
        }
        @keyframes wsc-marquee-drift {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wsc-marquee-track {
            animation: none;
            flex-wrap: wrap;
            width: 100%;
          }
          .wsc-marquee-vp {
            transition: none;
            transform: none;
          }
          .wsc-marquee-group[aria-hidden='true'] {
            display: none;
          }
        }
      `}</style>
    </Slab>
  );
}
