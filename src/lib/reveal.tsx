'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * useLayoutEffect does nothing on the server and React says so loudly, so the
 * before-paint work falls back to useEffect there. Nothing that needs to beat
 * the first paint runs during SSR anyway.
 */
export const useBeforePaint =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/*
  One shared IntersectionObserver per threshold, not one per element
  (design-system/motion.md, Performance).

  Callers get a ref. On mount the hook stamps data-run="off" on the element
  before the browser paints, and flips it to "on" when the element arrives.
  The server-rendered HTML carries no data-run at all, which is the point:
  law 1 says a crawler, a no-JS request and a viewer landing mid-page all see
  a finished, legible page. The pending state is something JS opts into, not
  the default.
*/

type Trigger = () => void;

const observers = new Map<number, IntersectionObserver>();
const triggers = new WeakMap<Element, Trigger>();

function observerFor(threshold: number): IntersectionObserver {
  let observer = observers.get(threshold);
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        triggers.get(entry.target)?.();
        triggers.delete(entry.target);
        self.unobserve(entry.target);
      }
    },
    { threshold, rootMargin: '0px 0px -8% 0px' }
  );

  observers.set(threshold, observer);
  return observer;
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface RevealOptions {
  /** Fraction of the element that must be visible. Counter Roll wants 0.7. */
  threshold?: number;
  /** Skip the observer and run as soon as the element mounts. The hero does this. */
  immediate?: boolean;
  /** Pass false to leave the element at rest, e.g. while the preloader is up. */
  enabled?: boolean;
}

/**
 * Attach to the wrapper that owns a sequence. The sequence CSS lives in
 * globals.css keyed off `[data-run]`.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.15,
  immediate = false,
  enabled = true,
}: RevealOptions = {}) {
  const ref = useRef<T>(null);

  /*
    Before paint, not after: this must land before the first paint or the
    element shows at rest and then snaps back to hidden.
  */
  useBeforePaint(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (reducedMotion()) return;
    if (!el.hasAttribute('data-run')) el.setAttribute('data-run', 'off');
  }, [enabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    if (reducedMotion()) {
      el.removeAttribute('data-run');
      return;
    }

    const run = () => {
      el.style.willChange = 'transform';
      el.setAttribute('data-run', 'on');
    };

    /* will-change is a promise to the compositor, not a decoration: drop it
       the moment the sequence is over. */
    const settle = () => {
      el.style.willChange = '';
    };
    el.addEventListener('animationend', settle);

    if (immediate) {
      const frame = requestAnimationFrame(run);
      return () => {
        cancelAnimationFrame(frame);
        el.removeEventListener('animationend', settle);
      };
    }

    const observer = observerFor(threshold);
    triggers.set(el, run);
    observer.observe(el);

    return () => {
      triggers.delete(el);
      observer.unobserve(el);
      el.removeEventListener('animationend', settle);
    };
  }, [enabled, immediate, threshold]);

  return ref;
}

/**
 * Split a string into Word Cascade spans. Each carries its index as --i, which
 * is what the 40ms stagger reads.
 */
export function cascade(text: string) {
  /*
    The separating space is a text node BETWEEN the spans, not inside them.
    Each span is display:inline-block so it can be transformed, and a leading
    space inside an inline-block is trimmed rather than rendered, which ran
    every word together.
  */
  return text.split(' ').flatMap((word, i) => {
    const span = (
      <span key={`${word}-${i}`} style={{ '--i': i } as React.CSSProperties}>
        {word}
      </span>
    );
    /* A bare string, not an element: a separator <span> would itself match
       `.cascade > span`, become inline-block, and trim the very space it is
       there to provide. */
    return i === 0 ? [span] : [' ', span];
  });
}
