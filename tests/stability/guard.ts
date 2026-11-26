/*
  The suite drives a real admin session through edit mode, so it only runs
  against the local Supabase stack. The check reads the URL the dev server
  was started with; nothing here reads or prints a credential.
*/

const LOCAL_STACK = /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/;

export const BASE_URL = process.env.STABILITY_BASE_URL ?? 'http://localhost:3003';

export function assertLocalStack(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!LOCAL_STACK.test(url)) {
    throw new Error(
      'Stability tests refused to run: NEXT_PUBLIC_SUPABASE_URL must point at the local Supabase stack ' +
        '(http://127.0.0.1:54321 or http://localhost:54321). Start the dev server and run the suite with that value set.'
    );
  }
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(BASE_URL)) {
    throw new Error('Stability tests refused to run: STABILITY_BASE_URL must be a localhost address.');
  }
}

export function credentials(): { email: string; password: string; secret: string } {
  const email = process.env.STABILITY_ADMIN_EMAIL;
  const password = process.env.STABILITY_ADMIN_PASSWORD;
  const secret = process.env.STABILITY_ADMIN_TOTP_SECRET;
  if (!email || !password || !secret) {
    throw new Error(
      'Set STABILITY_ADMIN_EMAIL, STABILITY_ADMIN_PASSWORD and STABILITY_ADMIN_TOTP_SECRET for a local-only admin account.'
    );
  }
  return { email, password, secret };
}
