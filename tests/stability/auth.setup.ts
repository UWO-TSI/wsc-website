import { mkdirSync } from 'node:fs';
import { test as setup } from '@playwright/test';
import { credentials } from './guard';
import { msLeft, totp } from './totp';
import { PAGES } from './pages';

const STATE = 'tests/.auth/state.json';

/*
  Signs in once through the local development form at /admin, enters the
  authenticator code, and saves the browser storage for the tests. Errors
  are rethrown without Playwright's call log, which would echo the values
  typed into the form.
*/
setup('sign in as the local test admin', async ({ page, request }) => {
  setup.setTimeout(240_000);
  const { email, password, secret } = credentials();
  let step = 'start';
  try {
    mkdirSync('tests/.auth', { recursive: true });

    step = 'warm up pages';
    for (const p of PAGES) await request.get(p, { timeout: 120_000 }).catch(() => undefined);

    step = 'open /admin';
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.locator('input[type=email]').waitFor({ timeout: 60_000 });

    step = 'password';
    await page.locator('input[type=email]').fill(email);
    await page.locator('input[type=password]').fill(password);
    await page.getByRole('button', { name: 'Sign in locally' }).click();

    step = 'code field';
    await page.locator('#totp-code').waitFor({ timeout: 30_000 });

    for (let attempt = 0; attempt < 2; attempt++) {
      step = 'code';
      if (msLeft() < 4000) await page.waitForTimeout(msLeft() + 500);
      await page.locator('#totp-code').fill(totp(secret));
      await page.getByRole('button', { name: 'Verify' }).click();
      const entered = await page
        .locator('.ed-bar')
        .waitFor({ timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
      if (entered) break;
      if (attempt === 1) throw new Error('edit bar did not appear after the code');
      await page.waitForTimeout(msLeft() + 500);
    }

    step = 'save state';
    await page.context().storageState({ path: STATE });
  } catch {
    throw new Error(`Sign-in setup failed at step: ${step}. Check the local stack, the dev server and the test admin.`);
  }
});
