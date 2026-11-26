import { expect, type Locator, type Page } from '@playwright/test';
import { test } from './harness';

/*
  Reorder by dragging the grip, on every list that has one, and the
  colours of a held item and the Add tile on a dark section.

  Each test drags one item onto its neighbour with the mouse, checks that
  the two swapped places and that the held item's text stayed readable
  on its fill while it was held, then discards the draft. Drafts live in
  the browser, so nothing is written to the database (the harness aborts
  and reports any write).
*/

async function open(page: Page, path: string) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('.ed-bar').waitFor({ timeout: 90_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
}

const keysOf = (list: Locator) =>
  list.evaluate((el) => [...el.querySelectorAll<HTMLElement>(':scope > [data-key]')].map((n) => n.dataset.key!));

async function discardAll(page: Page) {
  const discard = page.locator('.ed-discard button');
  if (await discard.isDisabled()) return;
  await discard.click();
  await page.locator('[data-ed-tray] button', { hasText: /^Discard \d+/ }).click();
  await expect(page.locator('.ed-count')).toBeDisabled();
}

const LISTS = [
  { path: '/executive-team', list: 'ul:has(> [data-key] .ed-grip)', sameGroup: true },
  { path: '/sponsors', list: 'div:has(> [data-key] .ed-grip)', sameGroup: false },
  { path: '/', list: '.slab-inv div:has(> [data-key] .ed-grip)', sameGroup: false },
];

for (const { path, list: listSel, sameGroup } of LISTS) {
  test(`dragging a grip swaps two items and the held item stays readable on ${path}`, async ({ page }) => {
    await open(page, path);
    const list = page.locator(listSel).first();
    await expect(list, 'a reorderable list is on the page').toBeVisible({ timeout: 30_000 });
    const before = await keysOf(list);
    expect(before.length, 'the list has two items to swap').toBeGreaterThanOrEqual(2);

    /* An executive moves only within their role: take the first two
       neighbours that share one. */
    let at = 0;
    if (sameGroup) {
      const groups = await list.evaluate((el) =>
        [...el.querySelectorAll<HTMLElement>(':scope > [data-key]')].map(
          (n) => n.querySelector<HTMLSelectElement>('[data-ed-field$=".group"] select')?.value ?? ''
        )
      );
      at = groups.findIndex((g, i) => i + 1 < groups.length && g === groups[i + 1]);
      expect(at, 'two neighbours share a role').toBeGreaterThanOrEqual(0);
    }
    const [a, b] = [before[at], before[at + 1]];
    const item = list.locator(`:scope > [data-key="${a}"]`);
    const grip = item.locator('.ed-grip');
    const target = list.locator(`:scope > [data-key="${b}"]`);
    await grip.scrollIntoViewIfNeeded();
    const g = (await grip.boundingBox())!;
    const t = (await target.boundingBox())!;

    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
    await page.mouse.down();
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 16 });
    await expect(item, 'the dragged item is held').toHaveClass(/ed-held/);
    const held = await item.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, ink: cs.color };
    });
    expect(held.bg, 'the held item is not filled with its own text colour').not.toBe(held.ink);
    await page.mouse.up();

    await expect
      .poll(() => keysOf(list), { message: 'the two items swapped places' })
      .toEqual(before.map((k) => (k === a ? b : k === b ? a : k)));
    await expect(item).not.toHaveClass(/ed-held/);

    await discardAll(page);
    await expect.poll(() => keysOf(list), { message: 'Discard restores the order' }).toEqual(before);
  });
}

test('the Add figure tile shows on the inverse section at rest and on hover', async ({ page }) => {
  await open(page, '/');
  const tile = page.locator('.slab-inv .ed-add').first();
  await tile.scrollIntoViewIfNeeded();
  const colours = () =>
    tile.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, ink: cs.color };
    });
  const rest = await colours();
  await tile.hover();
  await page.waitForTimeout(400);
  const hover = await colours();
  for (const [state, c] of [['rest', rest], ['hover', hover]] as const) {
    expect(c.bg, `the tile has a fill at ${state}`).not.toBe('rgba(0, 0, 0, 0)');
    expect(c.ink, `the tile's label is the inverse ink at ${state}`).toBe('rgb(241, 236, 246)');
  }
  expect(hover.bg, 'hover changes the fill').not.toBe(rest.bg);
});
