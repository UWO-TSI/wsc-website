'use client';

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import {
  applyTheme,
  getServerTheme,
  readStampedTheme,
  subscribeTheme,
  type Theme,
} from '@/lib/theme';

interface ThemeContextValue {
  theme: Theme;
  /** `origin` is the element the wipe circle expands from, normally the toggle. */
  setTheme: (theme: Theme, origin?: Element | null) => void;
  toggleTheme: (origin?: Element | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /*
    data-theme on <html> is the source of truth, written by the blocking script
    before React exists and by the Theme Wipe from inside a view transition.
    Subscribing to it beats mirroring it in state: no effect, no second render
    pass, and nothing to get out of sync.
  */
  const theme = useSyncExternalStore(subscribeTheme, readStampedTheme, getServerTheme);

  const setTheme = useCallback((next: Theme, origin?: Element | null) => {
    applyTheme(next, origin);
  }, []);

  const toggleTheme = useCallback(
    (origin?: Element | null) => {
      applyTheme(theme === 'dark' ? 'light' : 'dark', origin);
    },
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
