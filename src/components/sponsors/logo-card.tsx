'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Sponsor } from '@/types/database';
import { getPublicUrl } from '@/lib/supabase/storage';
import { easing } from '@/lib/motion';

interface LogoCardProps {
  sponsor: Sponsor;
}

// ─── Shared easing — editorial consistency across all elements ───────────────
const EASE = easing.easeOutQuart;

// ─── Logo: dims at a measured pace, initiates the hover gesture ─────────────
const logoVariants = {
  rest:    { opacity: 1 },
  hovered: { opacity: 0.15 },
};

// ─── Overlay container: pure opacity fade, no y movement ────────────────────
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.32, ease: EASE, delay: 0.04 } },
  exit:    { opacity: 0, transition: { duration: 0.22, ease: EASE } },
};

// ─── Name: slides up slightly — 8px is emergence, not drama ─────────────────
const nameVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE, delay: 0.06 } },
  exit:    { opacity: 0, y: 8, transition: { duration: 0.20, ease: EASE } },
};

// ─── Divider: draws from center outward, GPU-safe scaleX ────────────────────
const dividerVariants = {
  hidden:  { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.22, ease: EASE, delay: 0.14 } },
  exit:    { scaleX: 0, opacity: 0, transition: { duration: 0.16, ease: EASE } },
};

// ─── Description: arrives last, quietest entrance ───────────────────────────
const descVariants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE, delay: 0.20 } },
  exit:    { opacity: 0, y: 6, transition: { duration: 0.18, ease: EASE } },
};

export default function LogoCard({ sponsor }: LogoCardProps) {
  const [hovered, setHovered] = useState(false);
  const logoUrl = getPublicUrl('sponsor-logos', sponsor.logo_path ?? null);

  const hoverProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    'data-cursor': sponsor.link ? 'view' : 'hover',
  };

  const content = (
    <div
      className="relative flex aspect-[3/2] items-center justify-center overflow-hidden p-[var(--space-4)] sm:p-[var(--space-8)]"
      style={{
        border: '1px solid',
        borderColor: hovered ? 'var(--color-border-gold)' : 'var(--color-border)',
        transition: 'border-color 0.4s ease',
      }}
    >
      {/* Logo — normalized, responsive: scales with card on mobile, fixed on desktop */}
      {logoUrl && (
        <motion.div
          className="relative z-0 flex w-full items-center justify-center"
          variants={logoVariants}
          animate={hovered ? 'hovered' : 'rest'}
          transition={{ duration: 0.38, ease: EASE }}
        >
          <div className="relative h-[clamp(56px,18vw,92px)] w-full max-w-[90%] sm:h-[92px] sm:max-w-[240px]">
            <Image
              src={logoUrl}
              alt={`${sponsor.name} logo`}
              fill
              className="object-contain object-center"
              unoptimized={false}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 240px"
            />
          </div>
        </motion.div>
      )}

      {/* Overlay — absolute inset, centered, never causes layout shift */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="sponsor-overlay"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[var(--space-4)]"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Sponsor name */}
            <motion.p
              className="text-center font-body text-[length:var(--text-body)] font-medium uppercase tracking-[0.08em] text-[var(--color-text-primary)]"
              variants={nameVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {sponsor.name}
            </motion.p>

            {/* Gold hairline divider + description — only when description exists */}
            {sponsor.description && (
              <>
                <motion.div
                  className="my-[0.625rem] h-px w-8 bg-[var(--color-gold)]"
                  variants={dividerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin: 'center' }}
                />
                <motion.p
                  className="text-center font-mono text-[length:var(--text-mono-sm)] text-[var(--color-text-primary)]"
                  variants={descVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {sponsor.description}
                </motion.p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (sponsor.link) {
    return (
      <a
        href={sponsor.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        {...hoverProps}
      >
        {content}
      </a>
    );
  }

  return <div className="block" {...hoverProps}>{content}</div>;
}
