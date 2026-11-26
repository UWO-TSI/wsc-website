import { expect } from '@playwright/test';
import { installBoxes, type Diff } from './boxes';
import { settle, test } from './harness';

/*
  Proves the measuring can fail: a box that moves, grows or leaves the page
  after marking is reported, and a movement that comes back before the step
  ends is still caught by the per-frame watch.
*/
test('the measuring reports a moved, resized or replaced box', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await settle(page);
  await page.evaluate(installBoxes);
  const call = <R>(name: string) =>
    page.evaluate(
      (n) => (window as unknown as { __stab: Record<string, () => unknown> }).__stab[n](),
      name
    ) as Promise<R>;

  await call('mark');
  expect(await call<Diff[]>('compare'), 'nothing moved yet').toEqual([]);

  /* Something that grows above the sections pushes every one of them down. */
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'canary-spacer';
    spacer.style.height = '12px';
    document.querySelector('main')?.prepend(spacer);
  });
  const pushed = await call<Diff[]>('compare');
  expect(pushed.some((d) => d.group === 'section' && d.dy === 12), 'a pushed section is reported').toBe(true);
  expect(pushed.length, 'its followers are reported as moved').toBeGreaterThan(1);
  await page.evaluate(() => document.getElementById('canary-spacer')?.remove());
  expect(await call<Diff[]>('compare'), 'restored').toEqual([]);

  /* A box that grows is reported with its size change. */
  await page.evaluate(() => {
    const bar = document.querySelector('.ed-bar') as HTMLElement;
    bar.style.minHeight = `${bar.getBoundingClientRect().height + 10}px`;
  });
  const grown = await call<Diff[]>('compare');
  expect(grown.some((d) => d.group === 'edit bar' && d.dh !== 0), 'the grown bar is reported').toBe(true);
  await page.evaluate(() => {
    (document.querySelector('.ed-bar') as HTMLElement).style.minHeight = '';
  });
  expect(await call<Diff[]>('compare'), 'restored').toEqual([]);

  /* A movement that comes back inside one step is seen by the watch. */
  await call('watch');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const el = document.querySelector('.ed') as HTMLElement;
        el.style.transform = 'translateX(9px)';
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            el.style.transform = '';
            resolve();
          })
        );
      })
  );
  await page.waitForTimeout(100);
  const seen = await call<Diff[]>('harvest');
  expect(seen.some((d) => d.group === 'field shell' && (d.dx !== 0 || d.dw !== 0))).toBe(true);
  expect(await call<Diff[]>('compare'), 'and gone again').toEqual([]);

  /* A replaced element counts as a change. */
  await page.evaluate(() => document.querySelector('.ed')?.remove());
  expect((await call<Diff[]>('compare')).some((d) => d.detached)).toBe(true);
});
