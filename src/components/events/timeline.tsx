'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TimelineEvent from './timeline-event';
import type { Event } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

interface TimelineProps {
  events: Event[];
}

export default function Timeline({ events }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const total = events.length;

  // Stable ref setter for node elements
  const setNodeRef = useCallback((el: HTMLDivElement | null, index: number) => {
    nodeRefs.current[index] = el;
  }, []);

  useEffect(() => {
    if (!containerRef.current || !lineRef.current || !tipRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Static: full line, all nodes active
      gsap.set(lineRef.current, { scaleY: 1 });
      gsap.set(tipRef.current, { opacity: 0 }); // hide tip glow in reduced motion
      setActiveIndex(total - 1);
      return;
    }

    const ctx = gsap.context(() => {
      const lineEl = lineRef.current!;
      const tipEl = tipRef.current!;

      gsap.fromTo(
        lineEl,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 0.3,
            onUpdate: (self) => {
              const progress = self.progress;

              // — Tip glow position —
              const lineHeight = lineEl.offsetHeight;
              const tipY = lineHeight * progress;
              gsap.set(tipEl, {
                top: tipY,
                opacity: progress > 0.01 && progress < 0.98 ? 1 : 0,
              });

              // — Node activation —
              if (total <= 1) {
                if (progress >= 0) setActiveIndex(0);
                return;
              }

              let newActiveIndex = -1;
              for (let i = 0; i < total; i++) {
                const threshold = i / (total - 1);
                // Small 0.02 lead so glow fires as line arrives
                if (progress >= threshold - 0.02) {
                  newActiveIndex = i;
                }
              }
              setActiveIndex(newActiveIndex);
            },
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [events, total]);

  return (
    <div ref={containerRef} className="relative mx-auto max-w-[1400px] px-[clamp(1.5rem,5vw,6rem)]">
      {/* Vertical center line — desktop: centered, mobile: left edge */}
      <div
        ref={lineRef}
        className="
          absolute top-0 bottom-0 origin-top
          left-4 md:left-1/2
          w-[2.5px] -translate-x-1/2
          bg-[var(--color-border-gold)]
          opacity-60
        "
      />

      {/* Tip glow — follows the leading edge of the line */}
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-4 md:left-1/2 z-10"
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'var(--color-gold)',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          boxShadow: [
            '0 0 0 1.5px rgba(212, 168, 67, 0.6)',
            '0 0 8px 3px rgba(212, 168, 67, 0.35)',
            '0 0 18px 8px rgba(212, 168, 67, 0.12)',
          ].join(', '),
        }}
      />

      {/* Event entries */}
      <div className="relative">
        {events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            index={index}
            isActive={index <= activeIndex}
            nodeRef={(el) => setNodeRef(el, index)}
          />
        ))}
      </div>
    </div>
  );
}
