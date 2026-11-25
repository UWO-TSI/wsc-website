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

/**
 * Samples for a wrapped field's reserve: the value's own words and the
 * fallback sentence, each started at each of its first words. A wrapped
 * value's row count depends on its word lengths and on where its words fall
 * at the row ends, so one arrangement can come up a row short for another
 * value of the same length: at 1280 a 60-character page title measured
 * three rows from its published words and needed four for other words. The
 * caller keeps the tallest.
 */
export function samples(base: string, length: number, most = 8): string[] {
  const rotations = (text: string) => {
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    return Array.from({ length: Math.min(words.length, most) }, (_, i) =>
      sample([...words.slice(i), ...words.slice(0, i)].join(' '), length)
    );
  };
  return [...(base.trim() ? rotations(base) : []), ...rotations(FALLBACK_SAMPLE)];
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

const px = (v: string) => parseFloat(v) || 0;
const sidesX = (cs: CSSStyleDeclaration) =>
  px(cs.paddingLeft) + px(cs.paddingRight) + px(cs.borderLeftWidth) + px(cs.borderRightWidth);

/**
 * The width `field` may take. The column is the nearest block ancestor
 * whose width stays the same when the field is collapsed to zero width;
 * the result is its content width less the padding, borders and margins of
 * the boxes between them (the field's own `.ed` shell excepted: callers
 * take SHELL_X off). An ancestor sized by its content, such as a centred
 * flex item, is as wide as the field inside it, so it cannot be the
 * column: measured against it, the hero greeting kept its 487px desktop
 * width after the window went to 375px and the page scrolled sideways.
 * A skipped ancestor's max-width still caps the result.
 *
 * Collapsing a field and reading its ancestors costs two forced layouts.
 * Inside a measure pass (runPass: a resize, or the fonts arriving) every
 * field measured before is collapsed, read and restored together, once,
 * and each field's call returns its width from that batch. A field
 * measured outside a pass (on mount) is measured alone, and joins the
 * batch from then on.
 */
export function columnWidth(field: HTMLElement): number {
  columnFields.add(field);
  const hit = batch?.get(field);
  if (hit !== undefined) return hit;
  return columnWidths([field]).get(field)!;
}

/** Every field columnWidth has measured, so a pass can batch them. */
const columnFields = new Set<HTMLElement>();
/** The widths of the current pass, or null outside one. */
let batch: Map<HTMLElement, number> | null = null;

function columnWidths(fields: HTMLElement[]): Map<HTMLElement, number> {
  const chains = fields.map((field) => {
    const chain: HTMLElement[] = [];
    for (let node = field.parentElement; node && node !== document.body; node = node.parentElement) chain.push(node);
    return chain;
  });
  /* Read every width, collapse every field, read again, then restore every
     field: two layouts for the whole batch. */
  const before = chains.map((chain) => chain.map((n) => n.getBoundingClientRect().width));
  const widths = fields.map((field) => field.style.width);
  fields.forEach((field) => (field.style.width = '0px'));
  const after = chains.map((chain) => chain.map((n) => n.getBoundingClientRect().width));
  fields.forEach((field, i) => (field.style.width = widths[i]));

  const result = new Map<HTMLElement, number>();
  fields.forEach((field, f) => result.set(field, columnOf(chains[f], before[f], after[f])));
  return result;
}

function columnOf(chain: HTMLElement[], before: number[], after: number[]): number {
  let between = 0;
  let cap = Infinity;
  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    const cs = getComputedStyle(node);
    if (cs.display === 'contents' || (i === 0 && node.classList.contains('ed'))) continue;
    const inline = cs.display.startsWith('inline');
    if (!inline && Math.abs(after[i] - before[i]) < 0.5) {
      return Math.min(node.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight) - between, cap);
    }
    /* Only a length: a percentage max-width is relative to the parent,
       which the walk reaches next anyway. */
    if (!inline && cs.maxWidth.endsWith('px')) {
      const inner = px(cs.maxWidth) - (cs.boxSizing === 'border-box' ? sidesX(cs) : 0);
      cap = Math.min(cap, inner - between);
    }
    between += sidesX(cs) + px(cs.marginLeft) + px(cs.marginRight);
  }
  return Math.min(document.documentElement.clientWidth - between, cap);
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

/** Runs `fns` as one measure pass, every field's column read in one batch. */
function runPass(fns: (() => void)[]) {
  if (fns.length === 0) return;
  for (const field of columnFields) if (!field.isConnected) columnFields.delete(field);
  batch = columnWidths([...columnFields]);
  try {
    fns.forEach((fn) => fn());
  } finally {
    batch = null;
  }
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
