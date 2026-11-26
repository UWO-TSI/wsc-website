"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { curtain } from "@/lib/motion";

/*
  The Curtain. A fixed panel at --layer-curtain carrying the club shark and a
  2px progress rail that fills over 900ms, then the panel exits
  translateY(-101%) over --d-arrive on --e-exit.

  The ground is --logo-ground, the constant near-black used behind every
  supplied mark.

  Under reduced motion it never paints: onLoadComplete fires on mount and
  the panel is display:none from the first byte (motion-reduce:hidden).
  The media query is read in CSS for the paint and in the effect for the
  handoff, never during render: the server cannot know the preference, so
  the server and the first client render emit the same markup and there is
  no hydration mismatch. Reading it in a useState initializer used to make
  the client return null while the server HTML kept the curtain up.

  design-system/motion.md → Curtain.
*/

const RAIL_FILL_MS = 900;

interface PreloaderProps {
  onLoadComplete: () => void;
}

export default function Preloader({ onLoadComplete }: PreloaderProps) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onLoadComplete();
      return;
    }
    const timer = setTimeout(onLoadComplete, RAIL_FILL_MS);
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[var(--layer-curtain)] grid place-items-center bg-logo-ground text-on-logo-ground motion-reduce:hidden"
      variants={curtain}
      initial="show"
      animate="show"
      exit="exit"
    >
      <span
        aria-hidden="true"
        className="mark-mask h-16 w-16"
        style={{
          WebkitMaskImage: 'url("/logos/wsc-shark.png")',
          maskImage: 'url("/logos/wsc-shark.png")',
        }}
      />
      <span
        className="absolute bottom-[26px] left-[26px] right-[26px] h-[2px] overflow-hidden rounded-pill"
        style={{ background: "color-mix(in srgb, var(--on-logo-ground) 18%, transparent)" }}
      >
        <motion.i
          className="block h-full rounded-pill bg-accent"
          style={{ fontStyle: "normal" }}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: RAIL_FILL_MS / 1000, ease: "linear" }}
        />
      </span>
    </motion.div>
  );
}
