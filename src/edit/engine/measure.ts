/*
  Reserved sizes: a field is as large as its longest allowed value at the
  current width, measured in the field's own font, and never changes while
  someone types. Fields measure when they mount, when the fonts finish
  loading, and when the window is resized. Nothing else re-measures.
*/

let box: HTMLDivElement | null = null;

function measureBox(): HTMLDivElement {
  if (!box) {
    box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.className = 'ed-measure';
    document.body.appendChild(box);
  }
  return box;
}

function copyFont(from: HTMLElement, to: HTMLElement, fontSize?: string) {
  const cs = getComputedStyle(from);
  /* Longhands, not cs.font: Chrome returns an empty font shorthand when a
     value it cannot express is set (tabular-nums on .meta and the counted
     figures), which measured those fields in the default font. */
  to.style.fontFamily = cs.fontFamily;
  to.style.fontSize = fontSize ?? cs.fontSize;
  to.style.fontWeight = cs.fontWeight;
  to.style.fontStyle = cs.fontStyle;
  to.style.fontStretch = cs.fontStretch;
  to.style.fontVariantNumeric = cs.fontVariantNumeric;
  to.style.letterSpacing = cs.letterSpacing;
  to.style.wordSpacing = cs.wordSpacing;
  to.style.textTransform = cs.textTransform;
  to.style.lineHeight = cs.lineHeight;
  to.style.fontFeatureSettings = cs.fontFeatureSettings;
}

export function lineHeightOf(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const lh = parseFloat(cs.lineHeight);
  return Number.isNaN(lh) ? parseFloat(cs.fontSize) * 1.2 : lh;
}

const FALLBACK_SAMPLE = 'Western Sales Club runs workshops and events';

/**
 * A string of exactly `length` characters made from the published value,
 * so the reserve is measured in realistic words rather than in one glyph.
 */
export function sample(base: string, length: number): string {
  const words = base.trim() ? base.replace(/\s+/g, ' ').trim() : FALLBACK_SAMPLE;
  let s = words;
  while (s.length < length) s += ` ${words}`;
  return s.slice(0, length);
}

/** Width of one line of text in the font of `el`, without wrapping. */
export function textWidth(el: HTMLElement, text: string, fontSize?: string): number {
  const m = measureBox();
  copyFont(el, m, fontSize);
  m.style.whiteSpace = 'pre';
  m.style.width = 'auto';
  m.textContent = text;
  return m.scrollWidth;
}

/** Height of `text` wrapped at `width`, in the font of `el`. */
export function textHeight(el: HTMLElement, text: string, width: number): number {
  const m = measureBox();
  copyFont(el, m);
  m.style.whiteSpace = 'pre-wrap';
  m.style.width = `${width}px`;
  m.textContent = text;
  return Math.max(m.scrollHeight, lineHeightOf(el));
}

/** Content width of the nearest ancestor that is not inline. */
export function columnWidth(el: HTMLElement): number {
  let node: HTMLElement | null = el.parentElement;
  while (node && getComputedStyle(node).display.startsWith('inline')) node = node.parentElement;
  if (!node) return window.innerWidth;
  const cs = getComputedStyle(node);
  return node.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

/*
  "This line wraps on phones." The check sets the line in the heading's own
  type role as it resolves on a 375px screen, against that screen's column:
  375px minus the 16px page gutter on each side (--gut below 700px). Slabs
  span the full width and pad their content by the same gutter, so the
  column is the same inside a slab and on the bare page. The value is
  copied from globals.css.
*/
const PHONE = 375;
const PHONE_GUTTER = 16;
const ROLES = ['title-hero', 'title', 'title-sm'];

function phoneFontSize(el: HTMLElement): string | undefined {
  const holder = el.closest('.title-hero, .title, .title-sm');
  const role = holder && ROLES.find((r) => holder.classList.contains(r));
  if (!role) return undefined;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--t-${role}`).trim();
  if (!raw) return undefined;
  return raw.replace(/(-?[\d.]+)vw/g, (_, n: string) => `${(parseFloat(n) * PHONE) / 100}px`);
}

export function wrapsOnPhones(el: HTMLElement, line: string): boolean {
  if (!line) return false;
  const column = PHONE - 2 * PHONE_GUTTER;
  return textWidth(el, line, phoneFontSize(el)) > column;
}

/* One debounced resize listener and one fonts-ready callback for every field. */
const measurers = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

function onResize() {
  clearTimeout(timer);
  timer = setTimeout(() => measurers.forEach((fn) => fn()), 120);
}

export function onRemeasure(fn: () => void): () => void {
  if (measurers.size === 0) window.addEventListener('resize', onResize);
  measurers.add(fn);
  document.fonts?.ready.then(() => {
    if (measurers.has(fn)) fn();
  });
  return () => {
    measurers.delete(fn);
    if (measurers.size === 0) window.removeEventListener('resize', onResize);
  };
}
