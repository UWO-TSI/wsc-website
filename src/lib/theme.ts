/**
 * Theme: Showroom (light, velvet accent) and Afterhours (dark, gold accent).
 *
 * The accent flips with the theme, so this is the most visible interaction on
 * the site. Sequence 11, Theme Wipe, in design-system/motion.md.
 */

export const THEME_STORAGE_KEY = "wsc-theme";

export type Theme = "light" | "dark";

/** The value the blocking script in layout.tsx already stamped on <html>. */
export function readStampedTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function persist(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private window, blocked storage: the choice just does not survive a reload */
  }
}

const THEME_EVENT = "wsc-theme-change";

function stamp(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

/*
  The stamped attribute on <html> is the single source of truth, not React
  state: the blocking script in layout.tsx writes it before React exists, and
  the Theme Wipe writes it inside a view transition callback. So React reads it
  through useSyncExternalStore rather than mirroring it, which also keeps the
  provider free of a setState-in-effect.
*/

export function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

/** Server snapshot. Showroom is the default, and the script corrects it before paint. */
export function getServerTheme(): Theme {
  return "light";
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

/**
 * Sequence 11: Theme Wipe. A circle expands from the toggle's own centre to
 * cover the viewport, revealing the new theme underneath.
 *
 * `origin` is the toggle element. Unsupported browsers, and reduced-motion
 * viewers, get an instant swap.
 */
export function applyTheme(theme: Theme, origin?: Element | null) {
  persist(theme);

  const doc = document as ViewTransitionDocument;

  if (!origin || prefersReducedMotion() || typeof doc.startViewTransition !== "function") {
    stamp(theme);
    return;
  }

  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = doc.startViewTransition(() => stamp(theme));

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 620,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {
      /* the swap already happened inside the transition callback */
    });
}
