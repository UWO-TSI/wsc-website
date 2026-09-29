"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { curtain } from "@/lib/motion";

/*
  The Curtain. A fixed --inverse panel at --layer-curtain with the wordmark
  and a 2px progress rail that fills over 900ms, then the panel exits
  translateY(-101%) over --d-arrive on --e-exit.

  Under reduced motion it does not render at all: onLoadComplete fires
  immediately and the panel never paints.

  design-system/motion.md → Curtain.
*/

const RAIL_FILL_MS = 900;

interface PreloaderProps {
  onLoadComplete: () => void;
}

export default function Preloader({ onLoadComplete }: PreloaderProps) {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduced) {
      onLoadComplete();
      return;
    }
    const timer = setTimeout(onLoadComplete, RAIL_FILL_MS);
    return () => clearTimeout(timer);
  }, [reduced, onLoadComplete]);

  if (reduced) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[var(--layer-curtain)] grid place-items-center bg-inverse text-on-inverse"
      variants={curtain}
      initial="show"
      animate="show"
      exit="exit"
    >
      <span className="font-display text-[15px] font-black uppercase tracking-[0.22em]">
        WSC
      </span>
      <span
        className="absolute bottom-[26px] left-[26px] right-[26px] h-[2px] overflow-hidden rounded-pill"
        style={{ background: "color-mix(in srgb, var(--on-inverse) 18%, transparent)" }}
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
