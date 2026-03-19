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
  const lineWrapperRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ mobile: HTMLDivElement | null; desktop: HTMLDivElement | null }[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const total = events.length;

  const setNodeRef = useCallback(
    (el: HTMLDivElement | null, index: number, layout: 'mobile' | 'desktop') => {
      if (!nodeRefs.current[index]) nodeRefs.current[index] = { mobile: null, desktop: null };
      nodeRefs.current[index][layout] = el;
    },
    []
  );

  useEffect(() => {
    if (!containerRef.current || !lineWrapperRef.current || !tipRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(lineWrapperRef.current, { scaleY: 1 });
      gsap.set(tipRef.current, { top: '100%', opacity: 0 });
      setActiveIndex(total - 1);
      return;
    }

    const ctx = gsap.context(() => {
      const lineWrapper = lineWrapperRef.current!;
      const tipEl = tipRef.current!;

      const updateTipAndNodes = (progress: number) => {
        // Tip position — outside scaled wrapper so it stays a perfect circle
        const tipY = lineWrapper.offsetHeight * progress;
        gsap.set(tipEl, { top: tipY, opacity: progress > 0.001 ? 1 : 0 });

        // Node activation: line tip must overlap the actual node dot (not row center)
        const containerRect = containerRef.current!.getBoundingClientRect();
        const lineTipY = containerRect.top + lineWrapper.offsetHeight * progress;
        const activationOffset = 36; // px — nodes activate slightly before line reaches them

        let newActiveIndex = -1;
        for (let i = 0; i < total; i++) {
          const refs = nodeRefs.current[i];
          if (!refs) continue;

          const mobileRect = refs.mobile?.getBoundingClientRect();
          const nodeEl = mobileRect && mobileRect.height > 0 ? refs.mobile! : refs.desktop;
          if (!nodeEl) continue;

          const nodeRect = nodeEl.getBoundingClientRect();
          if (nodeRect.height === 0) continue;
          const nodeCenterY = nodeRect.top + nodeRect.height / 2;

          if (lineTipY >= nodeCenterY - activationOffset) {
            newActiveIndex = i;
          }
        }
        setActiveIndex(newActiveIndex);
      };

      gsap.fromTo(
        lineWrapper,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 0.3,
            onUpdate: (self) => updateTipAndNodes(self.progress),
            onRefresh: (self) => updateTipAndNodes(self.progress),
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [events, total]);

  return (
    <div ref={containerRef} className="relative mx-auto max-w-[1400px] px-[clamp(1.5rem,5vw,6rem)]">
      {/* Line wrapper: scaleY grows the line; tip glow is fixed to bottom = always at line tip */}
      <div
        ref={lineWrapperRef}
        className="
          absolute top-0 bottom-0 origin-top
          left-8 md:left-1/2
          w-[2.5px] -translate-x-1/2
          flex flex-col
        "
      >
        {/* Line bar — solid, no scroll-based change */}
        <div
          className="flex-1 min-h-0 w-full bg-[var(--color-border-gold)] opacity-60"
        />
      </div>

      {/* Glowing tip — outside scaled wrapper so it stays a perfect circle at all scroll positions */}
      <div
        ref={tipRef}
        className="absolute left-8 md:left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--color-gold)',
          boxShadow: [
            '0 0 0 2px rgba(212, 168, 67, 0.6)',
            '0 0 12px 4px rgba(212, 168, 67, 0.4)',
            '0 0 24px 10px rgba(212, 168, 67, 0.15)',
          ].join(', '),
          top: 0,
          opacity: 0,
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
            nodeRefMobile={(el) => setNodeRef(el, index, 'mobile')}
            nodeRefDesktop={(el) => setNodeRef(el, index, 'desktop')}
          />
        ))}
      </div>
    </div>
  );
}
