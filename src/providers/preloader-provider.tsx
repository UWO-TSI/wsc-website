'use client';

import { createContext, useCallback, useContext, useState } from 'react';

/**
 * Whether the Curtain has lifted.
 *
 * Motion law 2: one orchestrated moment per page, and it belongs to the hero.
 * The hero's sequence has to start as the curtain leaves rather than play
 * underneath it, so the hero reads `complete` and holds its reveal until then.
 * Everything below the fold ignores this and uses the observer as usual.
 *
 * On any route without a preloader, `complete` is true from the first render.
 */
interface PreloaderContextValue {
  complete: boolean;
  markComplete: () => void;
}

const PreloaderContext = createContext<PreloaderContextValue>({
  complete: true,
  markComplete: () => {},
});

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const [complete, setComplete] = useState(false);
  const markComplete = useCallback(() => setComplete(true), []);

  return (
    <PreloaderContext.Provider value={{ complete, markComplete }}>
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  return useContext(PreloaderContext);
}
