import { expect, type Page } from '@playwright/test';
import { test } from './harness';

/*
  The keyboard routes into the edit bar's tray and back.

  Route 1, a list row: its Options button moves focus into the tray, and
  Escape returns to Options. Tab past the last tray control, or Shift+Tab
  before the first, returns to Options too.

  Route 2, a site button: the transparent link-address control after the
  label field moves focus to the tray's link field, and Escape or Enter
  there returns to the label field.

  Nothing is typed into the tray and Remove is never pressed.
*/

const inTray = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest('[data-ed-tray]'));

const activeLabel = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? `${el.tagName.toLowerCase()}|${el.getAttribute('aria-label') ?? el.textContent?.trim() ?? ''}` : '';
  });

async function open(page: Page, path: string) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('.ed-bar').waitFor({ timeout: 90_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
}

for (const path of ['/executive-team', '/sponsors', '/events']) {
  test(`list row Options reaches the tray and Escape returns on ${path}`, async ({ page }) => {
    await open(page, path);
    const options = page.locator('button[aria-label^="Options for"]').first();
    await expect(options, 'a list row with Options exists').toBeVisible({ timeout: 30_000 });
    const name = await options.getAttribute('aria-label');

    /* Reach Options from a field in the same row, by Tab. */
    const row = options.locator('xpath=ancestor::*[@data-key][1]');
    await row.locator('.ed-in').first().focus();
    let reached = false;
    for (let i = 0; i < 12 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached =
        (await page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? '')) ===
        name;
    }
    expect(reached, 'Tab from a row field reaches Options').toBe(true);

    await page.keyboard.press('Enter');
    await expect.poll(() => inTray(page), { message: 'Enter on Options moves focus into the tray' }).toBe(true);
    await page.keyboard.press('Escape');
    await expect
      .poll(() => activeLabel(page), { message: 'Escape returns to Options' })
      .toContain(`button|${name}`);

    /* Shift+Tab from the first tray control returns to Options. */
    await page.keyboard.press('Enter');
    await expect.poll(() => inTray(page)).toBe(true);
    await page.keyboard.press('Shift+Tab');
    await expect
      .poll(() => activeLabel(page), { message: 'Shift+Tab on the first tray control returns to Options' })
      .toContain(`button|${name}`);

    /* Tab past the last tray control returns to Options. */
    await page.keyboard.press('Enter');
    await expect.poll(() => inTray(page)).toBe(true);
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      if (!(await inTray(page))) break;
    }
    await expect
      .poll(() => activeLabel(page), { message: 'Tab past the last tray control returns to Options' })
      .toContain(`button|${name}`);

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  });
}

test('site button link-address control reaches the tray link field and Escape returns', async ({ page }) => {
  await open(page, '/');
  const shell = page.locator('.ed-btn:has(.ed-btn-link)').first();
  await expect(shell).toBeVisible({ timeout: 30_000 });
  const label = shell.locator('textarea.ed-in');
  const link = shell.locator('.ed-btn-link');

  await label.focus();
  await page.keyboard.press('Tab');
  await expect(link, 'Tab from the label field reaches the link-address control').toBeFocused();

  for (const leave of ['Escape', 'Enter']) {
    await page.keyboard.press('Enter');
    await expect
      .poll(() => inTray(page), { message: 'Enter on the link-address control moves focus into the tray' })
      .toBe(true);
    const tag = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.tagName.toLowerCase());
    expect(tag, 'the tray link field takes focus').toBe('input');
    await page.keyboard.press(leave);
    await expect
      .poll(() => label.evaluate((el) => el === document.activeElement), {
        message: `${leave} in the tray link field returns to the button's label field`,
      })
      .toBe(true);
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
  }

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
});
