'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore, createContext, useContext, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/*
  This provider is mounted on every route, so it must not import GSAP.

  motion.md is explicit that GSAP loads only on the routes that use Scroll
  Scrub, and a static `import { gsap }` here put the whole library plus
  ScrollTrigger into the shared bundle for every page. Lenis is driven by a
  plain requestAnimationFrame loop instead, and the one route that does use
  ScrollTrigger subscribes itself with useLenis(): see
  src/components/about/story-section.tsx.
*/

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

function getServerSnapshot() {
  return null;
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const listenersRef = useRef(new Set<() => void>());
  const pathname = usePathname();

  // The instance itself lives on a ref, since it is created and destroyed by
  // an effect rather than derived from props or state. useSyncExternalStore
  // is what lets the context value track it without reading `.current`
  // during render, which is not allowed outside effects and handlers.
  const subscribe = useCallback((onChange: () => void) => {
    listenersRef.current.add(onChange);
    return () => listenersRef.current.delete(onChange);
  }, []);
  const getSnapshot = useCallback(() => lenisRef.current, []);
  const lenis = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Scroll to top on route change: Lenis manages scroll, so we must reset it explicitly
  useEffect(() => {
    const current = lenisRef.current;
    if (current) {
      current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    // Prevent browser from restoring scroll position on navigation: we handle it ourselves
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Disable on touch devices and entirely under reduced motion.
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || reduced) return;

    const listeners = listenersRef.current;

    const instance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    lenisRef.current = instance;
    listeners.forEach((onChange) => onChange());

    // Native rAF passes milliseconds, which is what Lenis wants.
    let frame = requestAnimationFrame(function raf(time: number) {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
      lenisRef.current = null;
      listeners.forEach((onChange) => onChange());
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
