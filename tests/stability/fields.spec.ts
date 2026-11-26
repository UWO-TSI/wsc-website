import { expect, type Page } from '@playwright/test';
import { test } from './harness';

/*
  Field sizes and positions against Preview.

  A heading field takes the full title width, empty or not; a paragraph
  field takes its column; and a page-copy field's text starts where the
  same text starts in Preview. Nothing is typed except into one heading,
  which is put back, and drafts never leave the browser.
*/

async function open(page: Page, path: string, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('.ed-bar').waitFor({ timeout: 90_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
}

const preview = async (page: Page, on: boolean) => {
  await page.locator('.ed-seg button', { hasText: on ? 'Preview' : 'Edit' }).click();
  await page.waitForTimeout(600);
};

/** The width a title may take: its own max-width or its parent's content width. */
const titleRoom = (sel: string) => (page: Page) =>
  page.locator(sel).first().evaluate((h) => {
    const parent = h.parentElement!;
    const pcs = getComputedStyle(parent);
    const column = parent.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
    return Math.min(parseFloat(getComputedStyle(h).maxWidth) || Infinity, column);
  });

for (const path of ['/executive-team', '/contact-us', '/events']) {
  test(`the page-head title field takes the full title width on ${path}`, async ({ page }) => {
    await open(page, path);
    const room = await titleRoom('h1.measure-title')(page);
    const field = page.locator('h1.measure-title textarea.ed-in');
    const w = await field.evaluate((el) => el.getBoundingClientRect().width);
    expect(w, 'the heading field is as wide as the title may be').toBeGreaterThan(room - 2);
  });
}

test('an emptied heading keeps the full title width', async ({ page }) => {
  await open(page, '/');
  const field = page.locator('#results-heading textarea.ed-in');
  await field.scrollIntoViewIfNeeded();
  const original = await field.inputValue();
  const room = await titleRoom('#results-heading')(page);
  await field.focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  const w = await field.evaluate((el) => el.getBoundingClientRect().width);
  expect(w, 'the empty heading field keeps its width').toBeGreaterThan(room - 2);
  await page.keyboard.insertText(original);
  await field.evaluate((el) => (el as HTMLElement).blur());
});

test('the contact page subtitle field takes the width Preview gives the paragraph', async ({ page }) => {
  await open(page, '/contact-us');
  const p = page.locator('[data-ed-field="contact.header.body"]').locator('xpath=..');
  const edit = await page.locator('[data-ed-field="contact.header.body"] textarea').evaluate((el) => el.getBoundingClientRect().width);
  await preview(page, true);
  const view = await p.evaluate((el) => el.getBoundingClientRect().width);
  await preview(page, false);
  expect(edit, 'the field is at least as wide as the paragraph in Preview').toBeGreaterThan(view - 2);
});

test('the audience headings start where Preview starts them', async ({ page }) => {
  await open(page, '/');
  const heading = page.locator('#students-heading');
  await heading.scrollIntoViewIfNeeded();
  const textLeft = () =>
    heading.evaluate((h) => {
      const ta = h.querySelector('textarea');
      if (ta) {
        const cs = getComputedStyle(ta);
        return ta.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
      }
      const range = document.createRange();
      range.selectNodeContents(h);
      return range.getBoundingClientRect().left;
    });
  const edit = await textLeft();
  await preview(page, true);
  const view = await textLeft();
  await preview(page, false);
  expect(Math.abs(edit - view), 'the heading text keeps its left edge in edit mode').toBeLessThan(1.5);
});
