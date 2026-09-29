"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ui/theme-toggle";
import {
  indicatorTransition,
  navItem,
  navPanelTransition,
  NAV_CLOSED_RADIUS,
} from "@/lib/motion";

/*
  Nav — one component, two modes, never two menus.

  Desktop, 1024 and up: a floating pill with the links inline and a sliding
  --accent indicator on layoutId. No hamburger.

  Mobile: the same pill, hamburger on the right, growing downward into a
  panel — sequence 12, Nav Expand. There is no drawer and no scrim.

  design-system/components.md → Nav. design-system/motion.md → sequence 12.
*/

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/executive-team", label: "Team" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Partners" },
  { href: "/contact-us", label: "Contact" },
] as const;

const PILL_BACKGROUND = "color-mix(in srgb, var(--page) 88%, transparent)";

function Glyph() {
  return (
    <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-accent font-display text-[10px] font-black text-on-accent">
      WSC
    </span>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const panelId = useId();
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);

  // Reset the mobile panel when the route changes, derived during render
  // rather than in an effect: react-hooks/set-state-in-effect.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setOpen(false);
  }

  const isActive = useCallback(
    (href: string) => pathname === href,
    [pathname]
  );

  const close = useCallback(() => setOpen(false), []);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next && panelRef.current) {
        setPanelHeight(panelRef.current.scrollHeight);
      }
      return next;
    });
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // A pointerdown outside the pill collapses it. There is no scrim to catch this.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  // Re-measure the panel while open, and drop it if the viewport crosses into
  // the desktop breakpoint, where the panel does not exist.
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (panelRef.current) setPanelHeight(panelRef.current.scrollHeight);
    };
    onResize();
    window.addEventListener("resize", onResize);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = (e: MediaQueryListEvent) => {
      if (e.matches) close();
    };
    desktop.addEventListener("change", onDesktop);
    return () => {
      window.removeEventListener("resize", onResize);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open, close]);

  return (
    <header className="fixed inset-x-0 top-0 z-[var(--layer-nav)] flex justify-center px-[var(--gut)] pt-3">
      <nav ref={navRef} className="w-full max-w-3xl">
        <div
          className="overflow-hidden transition-[border-radius,box-shadow] duration-[var(--d-move)] ease-move"
          style={{
            background: PILL_BACKGROUND,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: open ? "var(--r-xl)" : `${NAV_CLOSED_RADIUS}px`,
            boxShadow: open ? "var(--sh-3)" : "var(--sh-2)",
          }}
        >
          <div className="flex min-h-[50px] items-center gap-2 py-[7px] pl-[14px] pr-[7px]">
            <Link
              href="/"
              className="mr-auto flex min-w-0 items-center gap-[9px] no-underline"
              data-cursor="hover"
            >
              <Glyph />
              <span className="truncate font-display text-[12px] font-black uppercase tracking-[0.07em] text-ink">
                Western Sales Club
              </span>
            </Link>

            {/* Desktop links, 1024 and up. No hamburger at this breakpoint. */}
            <div className="relative hidden items-center gap-0.5 lg:flex">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    data-cursor="hover"
                    className="label relative z-10 whitespace-nowrap rounded-pill px-3 py-[9px] no-underline transition-colors duration-[var(--d-hover)] ease-enter"
                    style={{
                      color: active ? "var(--on-accent)" : undefined,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-0 -z-10 rounded-pill bg-accent shadow-1"
                        transition={indicatorTransition}
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <ThemeToggle />

            {/* Hamburger, hidden at 1024 and up. Cross-fades to an X. */}
            <button
              type="button"
              onClick={toggleOpen}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? "Close menu" : "Open menu"}
              data-cursor="hover"
              className="grid h-9 w-9 flex-none place-items-center rounded-pill transition-colors duration-[var(--d-hover)] ease-enter lg:hidden"
              style={{ background: open ? "var(--accent)" : "var(--sunken)" }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="h-[22px] w-[22px] overflow-visible"
              >
                <g
                  className="origin-center transition-[opacity,transform] duration-[var(--d-move)] ease-enter"
                  style={{
                    opacity: open ? 0 : 1,
                    transform: open ? "scale(0.8)" : "scale(1)",
                  }}
                >
                  <line
                    x1="4.5"
                    y1="7"
                    x2="19.5"
                    y2="7"
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ stroke: "var(--ink)" }}
                  />
                  <line
                    x1="4.5"
                    y1="12"
                    x2="19.5"
                    y2="12"
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ stroke: "var(--ink)" }}
                  />
                  <line
                    x1="4.5"
                    y1="17"
                    x2="19.5"
                    y2="17"
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ stroke: "var(--ink)" }}
                  />
                </g>
                <g
                  className="origin-center transition-[opacity,transform] duration-[var(--d-move)] ease-enter"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "scale(1)" : "scale(0.8)",
                  }}
                >
                  <line
                    x1="6.8"
                    y1="6.8"
                    x2="17.2"
                    y2="17.2"
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ stroke: "var(--on-accent)" }}
                  />
                  <line
                    x1="17.2"
                    y1="6.8"
                    x2="6.8"
                    y2="17.2"
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ stroke: "var(--on-accent)" }}
                  />
                </g>
              </svg>
            </button>
          </div>

          {/* Mobile panel. JS-measured height, the one documented exception
              to transform-and-opacity only. */}
          <motion.div
            id={panelId}
            className="overflow-hidden lg:hidden"
            animate={{ height: open ? panelHeight : 0 }}
            transition={navPanelTransition}
            aria-hidden={!open}
          >
            <div ref={panelRef} className="flex flex-col gap-1 px-[10px] pb-[14px] pt-1">
              {NAV_ITEMS.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    custom={i}
                    variants={navItem}
                    initial="hidden"
                    animate={open ? "show" : "hidden"}
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={close}
                      data-cursor="hover"
                      tabIndex={open ? 0 : -1}
                      className="flex items-center justify-between rounded-md px-3 py-[11px] font-display text-[17px] font-black uppercase tracking-[0.01em] no-underline transition-colors duration-[var(--d-hover)] ease-enter"
                      style={{
                        color: active ? "var(--on-accent)" : "var(--ink)",
                        background: active ? "var(--accent)" : "transparent",
                      }}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  );
}
