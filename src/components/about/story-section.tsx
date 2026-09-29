'use client';

import { useEffect, useRef, useState } from 'react';
import { useLenis } from '@/providers/lenis-provider';

/*
  The one place in the site that gets Scroll Scrub (design-system/motion.md,
  sequence 8). GSAP is imported dynamically so it never enters the shared
  bundle: only this route pays for it.

  Below 1024px, and under reduced motion, the pin never runs and this reads
  as a plain vertical stack instead. That is also what a crawler or a viewer
  who lands mid-page gets before the media queries resolve, which keeps
  motion law 1: every section is legible at rest.
*/

interface Panel {
  title: string;
  body: string[];
}

/*
  Only what the club can point at. An earlier draft of this section described a
  session cadence, a curriculum, competition panels and judges drawn from
  industry, none of which is recorded anywhere in this repo. Saying less is the
  correct move: the design carries the weight, and an invented specific costs
  more credibility than a plain sentence saves.
*/
const PANELS: Panel[] = [
  {
    title: 'What we do',
    body: [
      'Western Sales Club runs workshops and events through the year for students who want experience in sales before they graduate.',
      'Members learn from people who do the work, not only from a reading list.',
    ],
  },
  {
    title: 'How we run',
    body: [
      'A student exec team runs the club: presidents, vice presidents, and assistant vice presidents.',
      'The roster is on the executive team page, and it turns over every year.',
    ],
  },
  {
    title: 'Who backs us',
    body: [
      'Industry partners support the club and connect members with people working in the field.',
      'They are listed on the partners page, and the club works with five of them.',
    ],
  },
  {
    title: 'How to join',
    body: [
      'Membership is sold through the Western USC store, and the club runs about ten events a year for its members.',
      'Questions go to sales.club@westernusc.ca.',
    ],
  },
];

/* One viewport of scroll per panel, so the pin covers a real distance rather
   than snapping through the whole track in half a screen. */
const PANEL_COUNT = PANELS.length;
const TRACK_TRAVEL = -(100 * (PANEL_COUNT - 1)) / PANEL_COUNT;

function Panel({ panel }: { panel: Panel }) {
  return (
    <div>
      <h2 className="title">{panel.title}</h2>
      {panel.body.map((paragraph) => (
        <p key={paragraph} className="body measure mt-4 text-ink-muted">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function StorySection() {
  const [scrubEnabled, setScrubEnabled] = useState(false);
  const lenis = useLenis();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setScrubEnabled(wide.matches && !still.matches);
    update();
    wide.addEventListener('change', update);
    still.addEventListener('change', update);
    return () => {
      wide.removeEventListener('change', update);
      still.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!scrubEnabled) return;

    const wrapper = wrapperRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!wrapper || !sticky || !track) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [gsapModule, scrollTriggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;

      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      /*
        Lenis owns the scroll position, so ScrollTrigger has to be told when it
        moves or the pin drifts behind the smooth scroll. This subscription
        lives here rather than in LenisProvider because the provider is mounted
        on every route and importing ScrollTrigger there would put GSAP in the
        shared bundle, which motion.md forbids.
      */
      lenis?.on('scroll', ScrollTrigger.update);

      const context = gsap.context(() => {
        gsap.to(track, {
          xPercent: TRACK_TRAVEL,
          ease: 'none',
          scrollTrigger: {
            trigger: wrapper,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            pin: sticky,
          },
        });
      }, wrapper);

      cleanup = () => {
        lenis?.off('scroll', ScrollTrigger.update);
        context.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [scrubEnabled, lenis]);

  if (!scrubEnabled) {
    return (
      <div className="stack">
        {PANELS.map((panel) => (
          <Panel key={panel.title} panel={panel} />
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ height: `${PANEL_COUNT * 100}vh` }}>
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          zIndex: 'var(--layer-sticky)',
        }}
      >
        <div
          ref={trackRef}
          style={{ display: 'flex', width: `${PANEL_COUNT * 100}%`, willChange: 'transform' }}
        >
          {PANELS.map((panel) => (
            <div
              key={panel.title}
              style={{
                width: `${100 / PANEL_COUNT}%`,
                flex: 'none',
                paddingInline: 'clamp(1.5rem, 6vw, 6rem)',
              }}
            >
              <Panel panel={panel} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
