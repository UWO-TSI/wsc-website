"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { indicatorTransition, navItem, navPanelTransition } from "@/lib/motion";
import { EditableButton } from "@/edit";

/*
  Nav: one component, two modes, never two menus.

  Desktop, 1024 and up: a floating pill with the links inline and a sliding
  --accent indicator on layoutId. No hamburger.

  Mobile: the same pill, hamburger on the right, growing downward into a
  panel: sequence 12, Nav Expand. There is no drawer and no scrim.

  The one action, Apply to join, is a primary button in the pill from 640
  up. Below 640 the pill holds the shark and the hamburger only, and Apply
  to join is the first item of the panel, so a long label can never push
  the hamburger out of the pill. Both copies read home.cta.*, the same keys
  as the hero, About and the closing band.

  Focus: closing the panel with focus inside it (Escape, choosing an item,
  a route change) returns focus to the hamburger. Focus moving out of the
  nav closes the panel, the same as a press outside it: the panel is a
  disclosure over the page, not a modal, so it does not trap Tab. The edit
  bar counts as inside, so an admin can move from the Apply field to its
  link address in the tray without the panel closing.

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

/* The edit bar renders in a portal outside the nav; its tray edits the nav's fields. */
function inEditBar(node: EventTarget | null) {
  return node instanceof Element && node.closest(".ed-bar") !== null;
}

/*
  The club shark, filled with currentColor through a mask so the one white
  asset reads correctly on the white page ground. See .mark-mask in
  globals.css.
*/
function Glyph() {
  return (
    <span
      aria-hidden="true"
      className="mark-mask h-[26px] w-[26px] text-ink"
      style={{
        WebkitMaskImage: 'url("/logos/wsc-shark.png")',
        maskImage: 'url("/logos/wsc-shark.png")',
      }}
    />
  );
}

export default function Nav() {
  const pathname = usePathname();
  const panelId = useId();
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Escape closes the panel. Escape in the edit bar's tray belongs to the tray.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !inEditBar(e.target)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // A pointerdown outside the pill collapses it. There is no scrim to catch this.
  // Focus leaving the nav collapses it too, so Tab never reaches the page
  // under an open panel.
  useEffect(() => {
    const nav = navRef.current;
    if (!open || !nav) return;
    const outside = (target: EventTarget | null) =>
      target instanceof Node && !nav.contains(target) && !inEditBar(target);
    const onPointerDown = (e: PointerEvent) => {
      if (outside(e.target)) close();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (outside(e.relatedTarget)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    nav.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      nav.removeEventListener("focusout", onFocusOut);
    };
  }, [open, close]);

  // The closed panel is inert, so focus left inside it would drop to the
  // page. Move it to the hamburger first, before the browser repaints.
  useLayoutEffect(() => {
    if (!open && panelRef.current?.contains(document.activeElement)) {
      buttonRef.current?.focus();
    }
  }, [open]);

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
      {/* A floating pill up to 1024, then a full-width bar across the page. */}
      <nav ref={navRef} className="w-full max-w-3xl lg:max-w-none">
        <div
          className={`navshell overflow-hidden ${open ? "is-open" : ""}`}
          style={{
            background: PILL_BACKGROUND,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: open ? "var(--sh-3)" : "var(--sh-2)",
          }}
        >
          <div className="flex min-h-[50px] items-center gap-2 py-[7px] pl-[14px] pr-[7px] lg:min-h-[58px] lg:pl-6 lg:pr-3">
            <Link
              href="/"
              aria-label="Western Sales Club, home"
              className="mr-auto flex min-w-0 items-center gap-[9px] no-underline"
              data-cursor="hover"
            >
              <Glyph />
              <span className="hidden truncate font-display sm:inline text-[12px] font-black uppercase tracking-[0.07em] text-ink">
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

            {/* From 640 up. Below 640 it is the first item of the panel. */}
            <div className="ml-1 hidden flex-none sm:block lg:ml-3">
              <EditableButton
                labelKey="home.cta.button_label"
                hrefKey="home.cta.button_href"
              />
            </div>

            {/* Hamburger, hidden at 1024 and up. Cross-fades to an X. */}
            <button
              ref={buttonRef}
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
            inert={!open}
          >
            <div ref={panelRef} className="flex flex-col gap-1 px-[10px] pb-[14px] pt-1">
              <motion.div
                custom={0}
                variants={navItem}
                initial="hidden"
                animate={open ? "show" : "hidden"}
                className="pb-1 sm:hidden"
              >
                <EditableButton
                  labelKey="home.cta.button_label"
                  hrefKey="home.cta.button_href"
                  className="w-full"
                />
              </motion.div>
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
