'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { useEditMode } from '@/edit/edit-mode';

/**
 * Whether the Curtain has lifted.
 *
 * Motion law 2: one orchestrated moment per page, and it belongs to the hero.
 * The hero's sequence has to start as the curtain leaves rather than play
 * underneath it, so the hero reads `complete` and holds its reveal until then.
 * Everything below the fold ignores this and uses the observer as usual.
 *
 * On any route without a preloader, `complete` is true from the first render.
 * In edit mode it is true too, so the preloader never shows while editing.
 * Edit mode marks it complete for the rest of the visit: edit mode can load
 * before the curtain's timer fires, the curtain then unmounts with its timer,
 * and without the mark the first switch to Preview would play the curtain.
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
  const { editing } = useEditMode();
  // Derived during render rather than in an effect: react-hooks/set-state-in-effect.
  if (editing && !complete) setComplete(true);

  return (
    <PreloaderContext.Provider value={{ complete: complete || editing, markComplete }}>
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  return useContext(PreloaderContext);
}
