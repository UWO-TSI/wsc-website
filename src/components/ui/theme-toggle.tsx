'use client';

import { useRef } from 'react';
import { useTheme } from '@/providers/theme-provider';

/**
 * Showroom / Afterhours switch. Lives in the nav bar at every breakpoint,
 * outside the mobile panel, so it is reachable without opening the menu.
 *
 * Sequence 11, Theme Wipe. The knob itself is the system's only overshoot.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
      onClick={() => toggleTheme(ref.current)}
      className={`tt ${className}`.trim()}
      data-cursor="hover"
    >
      <span className="knob" aria-hidden="true" />
    </button>
  );
}
