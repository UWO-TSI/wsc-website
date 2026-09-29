'use client';

import { useEffect, useRef, useState } from 'react';

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

const PANELS: Panel[] = [
  {
    title: 'What we do',
    body: [
      'Western Sales Club runs workshops, cold-call practice, and case competitions for students who want direct experience in sales.',
      'Members work live projects with local companies and pitch in front of judges drawn from industry.',
    ],
  },
  {
    title: 'How we run',
    body: [
      'Weekly sessions are run by the exec team and cover prospecting, discovery calls, objection handling, and closing.',
      'Sponsors and alumni mentor members through the year and sit on competition panels.',
    ],
  },
];

function Panel({ panel }: { panel: Panel }) {
  return (
    <div>
      <h2 className="title">{panel.title}</h2>
      {panel.body.map((paragraph) => (
        <p
          key={paragraph}
          className="body measure"
          style={{ marginTop: '1rem', color: 'var(--ink-muted)' }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function StorySection() {
  const [scrubEnabled, setScrubEnabled] = useState(false);
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

      const context = gsap.context(() => {
        gsap.to(track, {
          xPercent: -50,
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

      cleanup = () => context.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [scrubEnabled]);

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
    <div ref={wrapperRef} style={{ height: '200vh' }}>
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
        <div ref={trackRef} style={{ display: 'flex', width: '200%', willChange: 'transform' }}>
          {PANELS.map((panel) => (
            <div
              key={panel.title}
              style={{ width: '50%', flex: 'none', paddingInline: 'clamp(1.5rem, 6vw, 6rem)' }}
            >
              <Panel panel={panel} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
