/*
  Text measurement for edit-mode fields. A field's width comes from the
  component's layout (CSS) or, for a field as wide as its text, from
  textWidth here; nothing reads the surrounding layout to guess a column.
  Heights are measured at the width the field was given. Fields measure
  when they mount, on every change to their text, when the fonts finish
  loading, and when the window is resized.
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

let areaBox: HTMLTextAreaElement | null = null;

/**
 * The height `el`, a field's textarea, needs to show `text` at its current
 * width without scrolling, padding included. Measured in a hidden textarea
 * with the same font, padding and wrapping, because a textarea's scroll
 * height is not a div's: Chrome counts the font's full ascent and descent
 * there, which on a tight title line-height is taller than the line box,
 * so a reserve taken from the line-height alone left a heading 2px short.
 */
export function fieldHeight(el: HTMLTextAreaElement, text: string): number {
  if (!areaBox) {
    areaBox = document.createElement('textarea');
    areaBox.setAttribute('aria-hidden', 'true');
    areaBox.tabIndex = -1;
    areaBox.className = 'ed-measure';
    document.body.appendChild(areaBox);
  }
  const m = areaBox;
  const cs = getComputedStyle(el);
  copyFont(el, m);
  m.style.boxSizing = 'border-box';
  m.style.border = '0';
  m.style.padding = `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`;
  m.style.whiteSpace = cs.whiteSpace;
  m.style.overflowWrap = cs.overflowWrap;
  m.style.wordBreak = cs.wordBreak;
  m.style.overflow = 'hidden';
  m.style.resize = 'none';
  m.style.minHeight = '0';
  m.style.width = `${el.getBoundingClientRect().width}px`;
  m.style.height = '0';
  m.value = text;
  return m.scrollHeight;
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

/* One debounced resize listener and one fonts-ready pass for every field. */
const measurers = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

/** Runs every field's measure once. */
function runPass(fns: (() => void)[]) {
  fns.forEach((fn) => fn());
}

function onResize() {
  clearTimeout(timer);
  timer = setTimeout(() => runPass([...measurers]), 120);
}

/* Fields that register in the same task wait for the fonts together and
   measure again in one pass. */
const afterFonts = new Set<() => void>();
let fontsPending = false;

function measureAfterFonts(fn: () => void) {
  if (!document.fonts) return;
  afterFonts.add(fn);
  if (fontsPending) return;
  fontsPending = true;
  document.fonts.ready.then(() => {
    fontsPending = false;
    const fns = [...afterFonts].filter((f) => measurers.has(f));
    afterFonts.clear();
    runPass(fns);
  });
}

export function onRemeasure(fn: () => void): () => void {
  if (measurers.size === 0) window.addEventListener('resize', onResize);
  measurers.add(fn);
  measureAfterFonts(fn);
  return () => {
    measurers.delete(fn);
    afterFonts.delete(fn);
    if (measurers.size === 0) window.removeEventListener('resize', onResize);
  };
}
