'use client';

import { useEffect, useRef } from 'react';
import { MAGNET_RANGE } from '@/lib/motion';

/**
 * Sequence 6 — Magnetic Pull. Up to 6px toward the pointer, taken at --d-tap
 * and released over --d-move.
 *
 * Gated behind (hover: hover) and (pointer: fine): never on touch, where it
 * would fight the tap, and never on a form field.
 */
export function useMagnetic<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return;

    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      /* Normalise against the half-extent so the pull saturates at the edge
         rather than scaling with the button's size. */
      const x = Math.max(-1, Math.min(1, dx / (rect.width / 2))) * MAGNET_RANGE;
      const y = Math.max(-1, Math.min(1, dy / (rect.height / 2))) * MAGNET_RANGE;
      el.style.transitionDuration = 'var(--d-tap)';
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    };

    const release = () => {
      el.style.transitionDuration = 'var(--d-move)';
      el.style.transform = '';
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);

    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', release);
      el.removeEventListener('pointercancel', release);
      release();
    };
  }, [enabled]);

  return ref;
}
