"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCursor } from "@/hooks/use-cursor";
import { D, E } from "@/lib/motion";

/*
  Cursor: sequence 6, Magnetic Pull's companion. Dot tracks exactly, ring
  lags behind on a lerp. Four states: default 38px, hover 46, view 62,
  text 12. The ring is one of only two strokes in the system, alongside the
  focus ring, so it is an inset box-shadow rather than a border.

  Pointer devices only: gated on (hover: hover) and (pointer: fine), and off
  under reduced motion.

  design-system/components.md → Cursor.
*/

const RING_LERP = { stiffness: 500, damping: 32, mass: 0.5 };

const RING_SIZE: Record<string, number> = {
  default: 38,
  hover: 46,
  view: 62,
  text: 12,
};

const sizeTransition = { duration: D.hover, ease: E.enter };

export function CustomCursor() {
  const { cursorState } = useCursor();
  const [enabled, setEnabled] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ringX = useSpring(mouseX, RING_LERP);
  const ringY = useSpring(mouseY, RING_LERP);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [enabled, mouseX, mouseY]);

  if (!enabled) return null;

  const dotHidden = cursorState === "hover" || cursorState === "view";
  const ringSize = RING_SIZE[cursorState] ?? RING_SIZE.default;

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 rounded-full bg-accent"
        style={{
          width: 7,
          height: 7,
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: "var(--layer-cursor)",
        }}
        animate={{ scale: dotHidden ? 0 : 1 }}
        transition={sizeTransition}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 flex items-center justify-center rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: "var(--layer-cursor)",
          boxShadow: "0 0 0 1.5px var(--accent) inset",
        }}
        animate={{ width: ringSize, height: ringSize }}
        transition={sizeTransition}
      >
        <motion.span
          className="font-data text-[10px] uppercase tracking-[0.15em]"
          style={{ color: "var(--accent-ink)" }}
          animate={{
            opacity: cursorState === "view" ? 1 : 0,
            scale: cursorState === "view" ? 1 : 0.8,
          }}
          transition={sizeTransition}
        >
          View
        </motion.span>
      </motion.div>
    </>
  );
}
