'use client';

import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { easing } from '@/lib/motion';
import type { Event } from '@/types/database';

interface TimelineEventProps {
  event: Event;
  index: number;
  isActive: boolean;
  nodeRefMobile: (el: HTMLDivElement | null) => void;
  nodeRefDesktop: (el: HTMLDivElement | null) => void;
}

const viewportConfig = { once: true, margin: '-100px' as const };

// Shared node style — hollow when inactive, solid when line reaches node
const nodeBaseStyle: React.CSSProperties = {
  transition: [
    'background-color 350ms cubic-bezier(0.16, 1, 0.3, 1)',
    'box-shadow 350ms cubic-bezier(0.16, 1, 0.3, 1)',
    'border-color 350ms cubic-bezier(0.16, 1, 0.3, 1)',
  ].join(', '),
};

const nodeActiveStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-gold)',
  borderColor: 'var(--color-gold)',
  boxShadow: [
    '0 0 0 4px rgba(255, 204, 0, 0.01)',
    '0 0 14px 4px rgb(232, 170, 20)',
    '0 0 28px 8px rgba(212, 168, 67, 0.2)',
  ].join(', '),
};

export default function TimelineEvent({ event, index, isActive, nodeRefMobile, nodeRefDesktop }: TimelineEventProps) {
  const parsedDate = parseISO(event.date);
  const dateMonthDay = format(parsedDate, 'MMM d').toUpperCase();
  const dateYear = format(parsedDate, 'yyyy');

  const nodeDotStyle: React.CSSProperties = isActive
    ? { ...nodeBaseStyle, ...nodeActiveStyle }
    : nodeBaseStyle;

  return (
    <div className="relative py-[var(--space-8)] md:py-[var(--space-12)]">
      {/* ---- Mobile layout (< 768px): single column to the right of left-edge line ---- */}
      <div className="block md:hidden pl-12">
        {/* Node — positioned on the line */}
        <motion.div
          className="absolute left-8 top-[var(--space-8)] -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: easing.easeOutExpo }}
          viewport={viewportConfig}
        >
          <div
            ref={nodeRefMobile}
            className="size-5 rounded-full border-2 border-[var(--color-gold)] bg-[var(--color-bg-base)]"
            style={nodeDotStyle}
          />
        </motion.div>

        {/* Content stacked */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: easing.easeOutExpo }}
          viewport={viewportConfig}
        >
          {/* Date — month day / year on 2 lines */}
          <time
            dateTime={event.date}
            className="mb-2 block font-mono text-[length:var(--text-mono-lg)] font-medium leading-tight text-[var(--color-gold)]"
          >
            <span className="block">{dateMonthDay}</span>
            <span className="block">{dateYear}</span>
          </time>

          {/* Title */}
          <h3 className="mb-3 font-display text-[clamp(1.5rem,4vw,2.5rem)] font-semibold leading-[1.1] text-[var(--color-text-primary)]">
            {event.title}
          </h3>

          {/* Location */}
          {event.location && (
            <p className="mb-2 font-mono text-[length:var(--text-mono)] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              {event.location}
            </p>
          )}

          {/* Description */}
          {event.description && (
            <p className="max-w-[480px] font-body text-[length:var(--text-body)] leading-[1.7] text-[var(--color-text-secondary)]">
              {event.description}
            </p>
          )}
        </motion.div>
      </div>

      {/* ---- Desktop layout (>= 768px): three-column flanking center line ---- */}
      <div className="hidden md:flex items-start">
        {/* Left column — Event title (45%) */}
        <motion.div
          className="flex w-[45%] justify-end pr-[var(--space-8)]"
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: easing.easeOutExpo }}
          viewport={viewportConfig}
        >
          <h3 className="max-w-[480px] text-right font-display text-[length:var(--text-display)] leading-[1.1] text-[var(--color-text-primary)]">
            {event.title}
          </h3>
        </motion.div>

        {/* Center — Node + Date (10%) */}
        <motion.div
          className="flex w-[10%] flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: easing.easeOutExpo }}
          viewport={viewportConfig}
        >
          <div className="flex flex-col items-center justify-center gap-2 rounded-full border border-[var(--color-border-gold)]/50 w-[6.5rem] h-[6.5rem] shrink-0">
            {/* Desktop node dot — glow driven by isActive */}
            <div
              ref={nodeRefDesktop}
              className="size-5 rounded-full border-2 border-[var(--color-gold)] bg-[var(--color-bg-base)]"
              style={nodeDotStyle}
            />
            <time
              dateTime={event.date}
              className="text-center font-mono text-[length:var(--text-mono-lg)] font-medium leading-tight text-[var(--color-gold)]"
            >
              <span className="block">{dateMonthDay}</span>
              <span className="block">{dateYear}</span>
            </time>
          </div>
        </motion.div>

        {/* Right column — Location + Description (45%) */}
        <motion.div
          className="w-[45%] pl-[var(--space-8)]"
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: easing.easeOutExpo, delay: 0.1 }}
          viewport={viewportConfig}
        >
          <div className="max-w-[480px] text-left">
            {event.location && (
              <p className="mb-2 font-mono text-[length:var(--text-mono)] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                {event.location}
              </p>
            )}
            {event.description && (
              <p className="font-body text-[length:var(--text-body)] leading-[1.7] text-[var(--color-text-secondary)]">
                {event.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
