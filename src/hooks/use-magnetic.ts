'use client';

import { useEffect, useRef } from 'react';
import { MAGNET_RANGE, MAGNET_RANGE_Y, MAGNET_PULL_TAU, MAGNET_RELEASE_TAU } from '@/lib/motion';

/**
 * Sequence 6: Magnetic Pull. Up to MAGNET_RANGE px toward the pointer,
 * eased by one requestAnimationFrame loop rather than a CSS transition.
 *
 * Why a loop: retargeting a 90ms transition on every pointermove restarts
 * its curve 120 times a second, which reads as stutter. Here the offset
 * chases its target with frame-rate independent exponential smoothing, so
 * a new pointer position only changes where it is heading, never its speed.
 *
 * The button's centre is measured once on entry, with the current offset
 * subtracted. Measuring on every move includes the pull itself, so the
 * button chases its own displacement and oscillates.
 *
 * Writes the `translate` property, not `transform`, so the press scale on
 * `transform` keeps working and its CSS transition never fights the loop.
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

    let cx = 0;
    let cy = 0;
    let halfW = 1;
    let halfH = 1;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let tau = MAGNET_PULL_TAU;
    let frame = 0;
    let last = 0;

    /* Soft response: steep near the centre, flattening toward the edge, so
       the pull never hits a hard stop as the pointer crosses the button. */
    const soft = (n: number) => Math.tanh(n * 1.4) / Math.tanh(1.4);
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      const k = 1 - Math.exp(-dt / tau);
      x += (tx - x) * k;
      y += (ty - y) * k;

      if (Math.abs(tx - x) < 0.01 && Math.abs(ty - y) < 0.01) {
        x = tx;
        y = ty;
        frame = 0;
        last = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
      el.style.translate = x === 0 && y === 0 ? '' : `${x.toFixed(2)}px ${y.toFixed(2)}px`;
    };

    const run = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const enter = () => {
      const rect = el.getBoundingClientRect();
      halfW = rect.width / 2;
      halfH = rect.height / 2;
      cx = rect.left + halfW - x;
      cy = rect.top + halfH - y;
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      tau = MAGNET_PULL_TAU;
      tx = soft(clamp((event.clientX - cx) / halfW)) * MAGNET_RANGE;
      ty = soft(clamp((event.clientY - cy) / halfH)) * MAGNET_RANGE_Y;
      run();
    };

    const release = () => {
      tau = MAGNET_RELEASE_TAU;
      tx = 0;
      ty = 0;
      run();
    };

    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);

    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', release);
      el.removeEventListener('pointercancel', release);
      cancelAnimationFrame(frame);
      el.style.translate = '';
    };
  }, [enabled]);

  return ref;
}
