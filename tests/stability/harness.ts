import { mkdirSync, writeFileSync } from 'node:fs';
import { test as base, expect, type Page } from '@playwright/test';
import { SITE_CONTENT } from '../../src/lib/site-content-defaults';
import { installBoxes, type Diff, type MarkSummary } from './boxes';

/*
  The stability run for one page at one width.

  Rule under test: in edit mode focusing, hovering and blurring never move
  or resize anything that persists, and a field that is typed in and then
  put back leaves every box where it was. A field is the size of the text
  it holds, so typing itself may resize the field and move what follows
  it; while it is full the page may not scroll sideways. Persistent
  elements are marked once the page has settled (boxes.ts). Each field is
  focused, hovered and blurred, and after each of those steps every marked
  box is compared with its record (tolerance 0.5px), both once the step
  has settled and on every frame while it ran. Then the field is filled to
  its maximum length and put back, and every box is compared once the
  restore has settled. The tray's content may change; its outer box may
  not.

  Nothing is published. Drafts are discarded at the end of the page, and a
  route guard refuses any write to the database or to storage.
*/

export type Step = 'focus' | 'type' | 'hover' | 'blur' | 'restore';

export interface Failure {
  page: string;
  width: number;
  browser: string;
  field: string;
  step: Step | 'page' | 'discard';
  /** settled: still different after the step. transient: moved during it and came back. */
  phase: 'settled' | 'transient' | 'scroll-width' | 'error' | 'residual';
  diffs: Diff[];
  detail?: string;
}

interface Candidate {
  i: number;
  kind: 'text' | 'control';
  field: string;
  tag: string;
  type: string;
  maxLength: number;
  numeric: boolean;
  lines: boolean;
  name: string;
}

const CANDIDATES =
  '.ed-in, .ed-sel select, .ed-photo-btn, .ed-row-photo, .ed-btn-link, .ed-vis, .ed-add';

/** A guard that records any write and aborts it. */
export const test = base.extend<{ writes: string[] }>({
  writes: [
    async ({ context }, use) => {
      const writes: string[] = [];
      await context.route(/(127\.0\.0\.1|localhost):54321|\.supabase\.(co|in)/, (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (/\.supabase\.(co|in)$/.test(url.hostname)) {
          writes.push(`remote ${req.method()} ${url.hostname}`);
          return route.abort();
        }
        const readOnly = ['GET', 'HEAD', 'OPTIONS'].includes(req.method());
        const allowed =
          readOnly || url.pathname.startsWith('/rest/v1/rpc/') || url.pathname.startsWith('/auth/v1/');
        if (!allowed) {
          writes.push(`${req.method()} ${url.pathname}`);
          return route.abort();
        }
        return route.continue();
      });
      await use(writes);
      expect(writes, 'the suite must never write to the database or storage').toEqual([]);
    },
    { auto: true },
  ],
});

/** Wide and narrow glyphs, with spaces so paragraphs wrap like prose. */
export function mixed(n: number): string {
  const words = ['WWWWWWW', 'iii', 'MMMM', 'l.l.', 'mmm', 'Wiw', 'ij', 'OOOOO', 'fl'];
  let out = '';
  for (let w = 0; out.length < n; w++) out += (out ? ' ' : '') + words[w % words.length];
  return out.slice(0, n).replace(/ $/, 'x');
}

const frames = (page: Page, n = 3) =>
  page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        const tick = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => tick(left - 1)));
        tick(count);
      }),
    n
  );

/** Wait until height, field count and image loading stop changing. */
export async function settle(page: Page) {
  await page.locator('.ed-bar').waitFor({ timeout: 90_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = Math.max(400, window.innerHeight / 2);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  let last = '';
  let same = 0;
  for (let i = 0; i < 60 && same < 5; i++) {
    const sig = await page.evaluate(
      () =>
        [
          document.documentElement.scrollHeight,
          document.querySelectorAll('.ed').length,
          document.querySelectorAll('li').length,
          [...document.images].filter((im) => !im.complete).length,
        ].join('/')
    );
    same = sig === last ? same + 1 : 0;
    last = sig;
    await page.waitForTimeout(250);
  }
  await frames(page, 4);
}

async function discard(page: Page): Promise<string | null> {
  const status = page.locator('.ed-status .meta');
  if (/No changes/i.test((await status.textContent()) ?? '')) return null;
  await page.locator('.ed-discard button').click();
  await page.locator('[data-ed-tray] button', { hasText: /^Discard \d+/ }).click();
  await expect(status).toHaveText(/No changes/i, { timeout: 10_000 }).catch(() => undefined);
  const left = ((await status.textContent()) ?? '').trim();
  return /No changes/i.test(left) ? null : left;
}

export interface RunOptions {
  /** Only fields whose data-ed-field is one of these keys. */
  only?: string[];
}

export interface RunResult {
  failures: Failure[];
  marked: MarkSummary;
  fields: number;
  typed: number;
}

export async function runStability(
  page: Page,
  path: string,
  width: number,
  browser: string,
  opts: RunOptions = {}
): Promise<RunResult> {
  const failures: Failure[] = [];
  const base = { page: path, width, browser };

  await page.setViewportSize({ width, height: 900 });
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await settle(page);
  await page.evaluate(installBoxes);

  const scrollWidth = async (field: string, step: Failure['step']) => {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw !== width) {
      failures.push({ ...base, field, step, phase: 'scroll-width', diffs: [], detail: `scrollWidth ${sw}, viewport ${width}` });
    }
  };
  await scrollWidth('(page)', 'page');


  const candidates = (await page.evaluate(
    ([selector, only]) => {
      const out: unknown[] = [];
      let n = 0;
      document.querySelectorAll(selector).forEach((node) => {
        const el = node as HTMLInputElement;
        const rects = el.getClientRects().length > 0;
        const hidden = getComputedStyle(el).visibility === 'hidden' || !!el.closest('[inert]');
        if (!rects || hidden) return;
        const shell = el.closest('[data-ed-field]');
        const field = shell?.getAttribute('data-ed-field') ?? '';
        if (only.length && !only.includes(field)) return;
        const isText =
          (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') &&
          el.classList.contains('ed-in') &&
          (el.tagName === 'TEXTAREA' || !el.type || el.type === 'text');
        el.setAttribute('data-stab-i', String(n));
        out.push({
          i: n,
          kind: isText ? 'text' : 'control',
          field,
          tag: el.tagName.toLowerCase(),
          type: el.type ?? '',
          maxLength: el.maxLength ?? -1,
          numeric: el.getAttribute('inputmode') === 'numeric',
          lines: el.classList.contains('ed-lines'),
          name: el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? '',
        });
        n++;
      });
      return out;
    },
    [CANDIDATES, opts.only ?? []] as const
  )) as Candidate[];

  const stab = <R>(name: 'mark' | 'compare' | 'watch' | 'harvest') =>
    page.evaluate(
      (n) => (window as unknown as { __stab: Record<string, () => unknown> }).__stab[n](),
      name
    ) as Promise<R>;
  const watch = () => stab<void>('watch');
  const marked = await stab<MarkSummary>('mark');
  const check = async (field: string, step: Step) => {
    await frames(page, 3);
    const live = await stab<Diff[]>('harvest');
    const settled = await stab<Diff[]>('compare');
    if (settled.length) failures.push({ ...base, field, step, phase: 'settled', diffs: settled });
    const settledIds = new Set(settled.map((d) => d.i));
    /* Typing and putting the text back resize the field on purpose, so
       only the settled result of a restore is checked. */
    const transient = step === 'restore' ? [] : live.filter((d) => !settledIds.has(d.i));
    if (transient.length) failures.push({ ...base, field, step, phase: 'transient', diffs: transient });
    await scrollWidth(field, step);
  };

  let typed = 0;
  try {
    for (const c of candidates) {
      const loc = page.locator(`[data-stab-i="${c.i}"]`);
      const label = `${c.field || c.name} (${c.tag}${c.type ? `:${c.type}` : ''})`;
      try {
        if (!(await loc.count())) continue;
        const original = c.kind === 'text' ? await loc.inputValue() : '';

        await watch();
        await loc.focus({ timeout: 10_000 });
        await check(label, 'focus');

        await watch();
        await loc.hover({ force: true, timeout: 10_000 });
        await check(label, 'hover');

        await watch();
        await loc.evaluate((el) => (el as HTMLElement).blur());
        await page.waitForTimeout(220);
        await check(label, 'blur');

        if (c.kind === 'text') {
          const keys = c.field.split(' ');
          const limits = c.lines
            ? keys.map((k) => SITE_CONTENT[k as keyof typeof SITE_CONTENT]?.max ?? 20)
            : [
                c.numeric
                  ? c.maxLength
                  : (SITE_CONTENT[c.field as keyof typeof SITE_CONTENT]?.max ??
                    (c.maxLength > 0 ? c.maxLength : 40)),
              ];
          await loc.focus();
          await page.keyboard.press('ControlOrMeta+a');
          for (let l = 0; l < limits.length; l++) {
            if (l > 0) await page.keyboard.press('Enter');
            await page.keyboard.type(c.numeric ? '9'.repeat(limits[l]) : mixed(limits[l]));
          }
          typed++;
          await frames(page, 3);
          await scrollWidth(label, 'type');
          /* Proves the field took the whole string: a field that refused
             part of it would make the check above weaker than it looks. */
          const expected = limits.reduce((n, m) => n + m, 0) + limits.length - 1;
          const got = (await loc.inputValue()).length;
          if (!c.numeric && got !== expected) {
            failures.push({
              ...base,
              field: label,
              step: 'type',
              phase: 'error',
              diffs: [],
              detail: `typed ${expected} characters, the field holds ${got}`,
            });
          }
        }

        if (c.kind === 'text') {
          await watch();
          await page.keyboard.press('ControlOrMeta+a');
          if (original) await page.keyboard.insertText(original);
          else await page.keyboard.press('Delete');
          await loc.evaluate((el) => (el as HTMLElement).blur());
          await page.mouse.move(0, 0);
          await page.waitForTimeout(220);
          await check(label, 'restore');
        } else {
          await page.mouse.move(0, 0);
        }
      } catch (e) {
        failures.push({
          ...base,
          field: label,
          step: 'page',
          phase: 'error',
          diffs: [],
          detail: String((e as Error).message ?? e).split('\n')[0].slice(0, 200),
        });
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur()).catch(() => undefined);
      }
    }
  } finally {
    const left = await discard(page).catch((e) => `discard failed: ${String((e as Error).message).split('\n')[0]}`);
    if (left) failures.push({ ...base, field: '(page)', step: 'discard', phase: 'residual', diffs: [], detail: `after Discard the bar reads "${left}"` });
  }

  await frames(page, 3);
  const end = await stab<Diff[]>('compare');
  if (end.length) failures.push({ ...base, field: '(page end)', step: 'discard', phase: 'settled', diffs: end });
  await scrollWidth('(page end)', 'discard');

  return { failures, marked, fields: candidates.length, typed };
}

/** One file per test, so partial runs and reruns never collide. */
export function saveResult(project: string, path: string, width: number, result: RunResult) {
  const dir = 'tests/.results';
  mkdirSync(dir, { recursive: true });
  const name = `${project}__${path === '/' ? 'home' : path.slice(1)}__${width}.json`;
  writeFileSync(`${dir}/${name}`, JSON.stringify(result));
}

export function summarize(failures: Failure[]): string {
  const lines = failures.slice(0, 12).map((f) => {
    const first = f.diffs[0];
    const where = first
      ? ` ${first.label} dx=${first.dx} dy=${first.dy} dw=${first.dw} dh=${first.dh}${f.diffs.length > 1 ? ` (+${f.diffs.length - 1} more)` : ''}`
      : f.detail
        ? ` ${f.detail}`
        : '';
    return `${f.page} @${f.width} ${f.browser} | ${f.field} | ${f.step} ${f.phase}${where}`;
  });
  return `${failures.length} failing checks\n${lines.join('\n')}`;
}
