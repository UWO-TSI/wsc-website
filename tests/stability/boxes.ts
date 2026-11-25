/*
  In-page measuring. `installBoxes` runs inside the browser (page.evaluate),
  so it is self-contained: nothing outside the function body is visible to
  it. It defines window.__stab with four calls:

    mark()      record the box of every persistent element
    compare()   the elements whose box differs from the record
    watch(step) from now until harvest(), compare on every frame
    harvest()   the differences seen while watching, then stop

  Boxes are kept in document coordinates, so scrolling a field into view
  moves nothing. Elements inside a fixed ancestor (the nav, the edit bar)
  are kept in viewport coordinates. Sticky elements are compared by size
  only, because scrolling moves them by design.
*/

export interface Diff {
  /** Position in the marked list, document order. */
  i: number;
  /** What the element is, readable without opening the page. */
  label: string;
  /** Which group of persistent elements it was marked in. */
  group: string;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  /** The element left the document (React replaced it). */
  detached?: boolean;
}

export interface MarkSummary {
  total: number;
  groups: Record<string, number>;
}

export function installBoxes(): void {
  const TOL = 0.5;
  const GROUPS: Array<[string, string]> = [
    ['nav', 'header, nav'],
    ['edit bar', '.ed-bar, [data-ed-tray]'],
    ['section', 'main, section, footer'],
    ['field shell', '.ed'],
    ['button', 'button, a[class*="btn-"], [role="button"], .ed-btn, .ed-btn-face'],
    ['photo slot', '.ed-photo, .ed-row-photo, .ed-photo-btn'],
    ['list', 'ul:has(.ed-add), :has(> [data-key])'],
    ['list row', '[data-key], li:has(.ed-in, .ed-add, .ed-photo, .ed-row-photo, .ed-sel)'],
    ['add tile', '.ed-add'],
  ];

  interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
  }
  interface Rec {
    el: Element;
    group: string;
    label: string;
    mode: 'flow' | 'fixed' | 'sticky';
    box: Box;
  }

  const recs: Rec[] = [];
  const live = new Map<number, Diff>();
  let watching = false;
  let raf = 0;

  const modeOf = (el: Element): 'flow' | 'fixed' | 'sticky' => {
    let sticky = false;
    for (let e: Element | null = el; e; e = e.parentElement) {
      const p = getComputedStyle(e).position;
      if (p === 'fixed') return 'fixed';
      if (p === 'sticky') sticky = true;
    }
    return sticky ? 'sticky' : 'flow';
  };

  const boxOf = (el: Element, mode: Rec['mode']): Box => {
    const r = el.getBoundingClientRect();
    const sx = mode === 'flow' ? window.scrollX : 0;
    const sy = mode === 'flow' ? window.scrollY : 0;
    return { x: r.left + sx, y: r.top + sy, w: r.width, h: r.height };
  };

  const labelOf = (el: Element, n: number): string => {
    const h = el as HTMLElement;
    const field = h.getAttribute('data-ed-field') ?? h.closest('[data-ed-field]')?.getAttribute('data-ed-field');
    const aria = h.getAttribute('aria-label');
    const classes =
      typeof h.className === 'string'
        ? h.className
            .split(/\s+/)
            .filter((c) => /^(ed|btn)-?/.test(c))
            .slice(0, 3)
            .join('.')
        : '';
    let s = el.tagName.toLowerCase() + (h.id ? `#${h.id}` : '') + (classes ? `.${classes}` : '');
    if (field) s += `[field=${field}]`;
    else if (aria) s += `[aria="${aria.slice(0, 48)}"]`;
    else {
      const t = (h.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 28);
      if (t) s += `("${t}")`;
    }
    return `${s}#${n}`;
  };

  const compare = (): Diff[] => {
    const out: Diff[] = [];
    recs.forEach((r, i) => {
      if (!r.el.isConnected) {
        out.push({ i, label: r.label, group: r.group, dx: 0, dy: 0, dw: 0, dh: 0, detached: true });
        return;
      }
      const b = boxOf(r.el, r.mode);
      const dx = r.mode === 'sticky' ? 0 : b.x - r.box.x;
      const dy = r.mode === 'sticky' ? 0 : b.y - r.box.y;
      const dw = b.w - r.box.w;
      const dh = b.h - r.box.h;
      if (Math.abs(dx) > TOL || Math.abs(dy) > TOL || Math.abs(dw) > TOL || Math.abs(dh) > TOL) {
        const round = (n: number) => Math.round(n * 100) / 100;
        out.push({ i, label: r.label, group: r.group, dx: round(dx), dy: round(dy), dw: round(dw), dh: round(dh) });
      }
    });
    return out;
  };

  const frame = () => {
    if (!watching) return;
    for (const d of compare()) {
      const prev = live.get(d.i);
      const bigger = (a: Diff, b: Diff) =>
        Math.max(Math.abs(a.dx), Math.abs(a.dy), Math.abs(a.dw), Math.abs(a.dh)) >
        Math.max(Math.abs(b.dx), Math.abs(b.dy), Math.abs(b.dw), Math.abs(b.dh));
      if (!prev || bigger(d, prev)) live.set(d.i, d);
    }
    raf = requestAnimationFrame(frame);
  };

  const mark = () => {
    recs.length = 0;
    live.clear();
    const seen = new Set<Element>();
    const found: Array<{ el: Element; group: string }> = [];
    const tray = document.querySelector('[data-ed-tray]');
    for (const [group, selector] of GROUPS) {
      document.querySelectorAll(selector).forEach((el) => {
        if (seen.has(el)) return;
        if (el.closest('[data-ed-tray]') && el !== tray) return;
        if (el.closest('nextjs-portal')) return;
        if (el.getClientRects().length === 0) return;
        seen.add(el);
        found.push({ el, group });
      });
    }
    found.sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );
    found.forEach(({ el, group }, n) => {
      const mode = modeOf(el);
      recs.push({ el, group, label: labelOf(el, n), mode, box: boxOf(el, mode) });
    });
    const groups: Record<string, number> = {};
    recs.forEach((r) => (groups[r.group] = (groups[r.group] ?? 0) + 1));
    return { total: recs.length, groups };
  };

  const watch = () => {
    live.clear();
    watching = true;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  };

  const harvest = (): Diff[] => {
    watching = false;
    cancelAnimationFrame(raf);
    const out = [...live.values()].sort((a, b) => a.i - b.i);
    live.clear();
    return out;
  };

  (window as unknown as { __stab: unknown }).__stab = { mark, compare, watch, harvest };
}
