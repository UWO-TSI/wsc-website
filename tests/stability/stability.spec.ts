import { expect } from '@playwright/test';
import { PAGES, WIDTHS } from './pages';
import { runStability, saveResult, summarize, test } from './harness';

/*
  Every public page, in edit mode, at three widths: nothing that persists
  moves or resizes while fields are focused, filled to their maximum length,
  hovered and blurred. The page never scrolls sideways.
*/
for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} at ${width}px`, async ({ page }, info) => {
      const result = await runStability(page, path, width, info.project.name);
      saveResult(info.project.name, path, width, result);
      expect(result.marked.total, 'persistent elements were marked').toBeGreaterThan(10);
      expect(result.fields, 'the page has editable fields').toBeGreaterThan(0);
      expect(result.failures.length, summarize(result.failures)).toBe(0);
    });
  }
}

/*
  Label-only buttons: the label is a field inside a button that has no link
  address of its own. The events page Register button (a list row's own
  link) and the contact form's submit button, at every width.
*/
const LABEL_ONLY: Array<{ path: string; key: string }> = [
  { path: '/events', key: 'events.ledger.register_label' },
  { path: '/contact-us', key: 'contact.form.submit_label' },
];

for (const { path, key } of LABEL_ONLY) {
  for (const width of WIDTHS) {
    test(`label-only button ${key} at ${width}px`, async ({ page }, info) => {
      const result = await runStability(page, path, width, info.project.name, { only: [key] });
      saveResult(info.project.name, `${path}-${key}`, width, result);
      expect(result.typed, `a visible "${key}" field was found and filled`).toBeGreaterThan(0);
      expect(result.failures.length, summarize(result.failures)).toBe(0);
    });
  }
}
