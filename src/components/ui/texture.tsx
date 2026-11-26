'use client';

import { useEffect, useRef } from 'react';
import type { SlabTexture } from './slab';

/*
  Texture: the signature Lit velvet texture, ported from the "Production
  texture: Lit velvet" section of docs/redesign/reference.html. The numbers
  and the RIBBONS and SPREAD tables below are that file's, copied as they are.
  Change them there first, then here.

  Render it as the first child of a container that carries `.textured` and a
  lit ground (`.lit-velvet` or `.lit-black`). Slab does this when its
  `texture` prop is set; nothing else should. The styles are in globals.css
  under "Signature texture".

  Three layers: moving grain, the ribbon, the dot matrix. The grain and the
  dots are CSS and are on the server-rendered page. The ribbon is an SVG drawn
  on the client, absolutely positioned, so drawing it never moves anything.
  It redraws only when the container's size changes, and the same size always
  draws the same ribbon. The ribbon and the dots never move.
*/

type Point = [number, number];

interface Ribbon {
  /** Cubic Bezier control points as fractions of the container's width and height. */
  p: [Point, Point, Point, Point];
  /** Ribbon width as a fraction of the container's height. */
  amp: number;
  /** Ribbon width cap in px. */
  cap: number;
  spread: keyof typeof SPREAD;
}

// Fixed pseudo-random number in 0..1 for a seed, so a band draws the same every time.
function rnd(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// How the ribbon's width changes along its length. Two sines of different
// lengths, so the change is never a perfect repeat.
const SPREAD = {
  breathe: (u: number) => 0.5 + 0.38 * Math.sin(Math.PI * 2 * u - 0.7) + 0.12 * Math.sin(Math.PI * 5.3 * u + 1.1),
  waist: (u: number) => 0.14 + 0.8 * Math.pow(Math.abs(2 * u - 1), 1.3) + 0.06 * Math.sin(Math.PI * 4.1 * u),
  swell: (u: number) => 0.22 + 0.7 * Math.pow(Math.sin(Math.PI * u), 1.6) + 0.08 * Math.sin(Math.PI * 4.7 * u + 0.6),
  even: (u: number) => 0.75 + 0.1 * Math.sin(Math.PI * 3.3 * u + 0.4),
};

// The band catalogue. Points are fractions of the band's width and height;
// values past 0 or 1 start or end the ribbon outside the band.
const RIBBONS: Record<SlabTexture, Ribbon[]> = {
  sweep: [{ p: [[0.16, 1.15], [0.44, 1.02], [0.7, 0.46], [1.06, 0.2]], amp: 0.62, cap: 340, spread: 'breathe' }],
  rise:  [{ p: [[-0.06, 0.9], [0.32, 0.98], [0.55, 0.12], [0.84, -0.15]], amp: 0.5, cap: 300, spread: 'breathe' }],
  arc:   [{ p: [[-0.06, 0.95], [0.26, 0.2], [0.62, 0.44], [1.06, 0.82]], amp: 0.5, cap: 300, spread: 'swell' }],
  waist: [{ p: [[-0.06, 0.25], [0.36, 1.15], [0.64, -0.15], [1.06, 0.75]], amp: 0.62, cap: 340, spread: 'waist' }],
  pair:  [
    { p: [[0.06, 1.15], [0.36, 1.0], [0.6, 0.5], [1.06, 0.34]], amp: 0.3, cap: 170, spread: 'breathe' },
    { p: [[0.34, 1.15], [0.62, 1.02], [0.82, 0.7], [1.06, 0.66]], amp: 0.2, cap: 110, spread: 'even' },
  ],
};

// The texture unit, read from the same CSS tokens the dot grid uses.
function readUnit() {
  const css = getComputedStyle(document.documentElement);
  return {
    TEX_DOT: parseFloat(css.getPropertyValue('--tex-dot')) || 1.6,
    TEX_PITCH: parseFloat(css.getPropertyValue('--tex-pitch')) || 7,
  };
}

/*
  Parallel lines offset from one cubic Bezier. The ribbon widens and narrows
  along its length; centre lines are stronger than edge lines. Ported from
  drawWaves in reference.html, with the dotted variant left out: production
  ribbon lines are solid.
*/
function drawWaves(svg: SVGSVGElement, shape: SlabTexture, W: number, H: number) {
  const { TEX_DOT, TEX_PITCH } = readUnit();
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  const ribbons = RIBBONS[shape] || RIBBONS.sweep;
  let out = '';
  const steps = Math.max(48, Math.round(W / 5));
  ribbons.forEach((rb) => {
    const P = rb.p.map((q) => [q[0] * W, q[1] * H]);
    const bz = (u: number, i: number) => {
      const a = 1 - u;
      return a * a * a * P[0][i] + 3 * a * a * u * P[1][i] + 3 * a * u * u * P[2][i] + u * u * u * P[3][i];
    };
    const dz = (u: number, i: number) => {
      const a = 1 - u;
      return 3 * a * a * (P[1][i] - P[0][i]) + 6 * a * u * (P[2][i] - P[1][i]) + 3 * u * u * (P[3][i] - P[2][i]);
    };
    // Same spacing at every size: the line count grows with the ribbon's
    // width, so lines are one texture pitch apart, matching the dot grid.
    const amp = Math.min(H * rb.amp, rb.cap);
    const N = Math.max(8, Math.round(amp / TEX_PITCH));
    const seed = rb.p[0][0] * 97 + rb.p[3][1] * 31 || 1;
    for (let k = 0; k < N; k++) {
      // Lines never cross. The gaps vary through one smooth field shared by
      // every line: a bunching that travels along the ribbon. The field only
      // ever stretches or squeezes the gaps (its slope across the ribbon
      // stays above zero), so neighbouring lines keep their order and flow
      // together. Opacity alone varies per line.
      const r1 = rnd(seed + k * 3.1);
      const t = k / (N - 1) - 0.5;
      let s = '';
      for (let j = 0; j <= steps; j++) {
        const u = j / steps;
        const x = bz(u, 0);
        const y = bz(u, 1);
        const dx = dz(u, 0);
        const dy = dz(u, 1);
        const len = Math.hypot(dx, dy) || 1;
        const g = t + 0.05 * Math.sin(Math.PI * 3 * t + Math.PI * 1.8 * u + seed);
        const off =
          g * amp * SPREAD[rb.spread](u) +
          amp * 0.05 * Math.sin(Math.PI * 2 * u * 1.2 + seed); // the whole ribbon undulates as one
        s += (j ? 'L' : 'M') + (x - (dy / len) * off).toFixed(1) + ' ' + (y + (dx / len) * off).toFixed(1) + ' ';
      }
      const op = (0.25 + 0.75 * Math.pow(1 - Math.abs(2 * t), 0.8)) * (0.8 + 0.2 * r1);
      out += '<path d="' + s + '" stroke-opacity="' + op.toFixed(2) + '"/>';
    }
  });
  // Every value in this markup is a number computed above; nothing comes from content.
  svg.innerHTML =
    '<g class="rib" fill="none" stroke="currentColor" stroke-width="' +
    TEX_DOT +
    '" stroke-linecap="round" stroke-linejoin="round" style="opacity:var(--wave-strength)">' +
    out +
    '</g>';
}

export default function Texture({ shape }: { shape: SlabTexture }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;

    let lastW = 0;
    let lastH = 0;
    let frame = 0;

    const draw = () => {
      frame = 0;
      const W = Math.round(wrap.clientWidth);
      const H = Math.round(wrap.clientHeight);
      if (!W || !H || (W === lastW && H === lastH)) return;
      lastW = W;
      lastH = H;
      drawWaves(svg, shape, W, H);
    };

    draw();
    const ro = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(draw);
    });
    ro.observe(wrap);
    return () => {
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [shape]);

  return (
    <span ref={wrapRef} className="texture" aria-hidden="true">
      <span className="billboard" />
      <svg ref={svgRef} className="waves" focusable="false" />
      <span className="dots" />
    </span>
  );
}
