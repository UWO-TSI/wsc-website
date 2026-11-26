'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';

/**
 * Dedicated OAuth callback page.
 *
 * After Google auth, Supabase redirects here with either:
 *   - PKCE:     /auth/callback?code=xxx   (Supabase JS auto-exchanges the code)
 *   - Implicit: /auth/callback#access_token=xxx (Supabase JS processes the hash)
 *   - Failure:  /auth/callback?error=...&error_code=... (also repeated in the hash)
 *
 * Once the session is confirmed, we redirect to /admin. On a failure the
 * page stays and says what happened. Sending the browser to /admin would
 * show the sign-in card again with no reason, which reads as a loop.
 *
 * The listener and the 8s fallback are set up synchronously, so the
 * effect's cleanup always reaches them: leaving the page, or the first of
 * the three paths to finish, stops the other two. Only one redirect ever
 * fires, and none fires after the page has unmounted.
 */

/*
  Messages for the error codes Supabase Auth sends back. The page shows only
  these fixed strings and the code itself, never error_description from the
  URL: anyone can build a link with any description, and the page would show
  that text on the club's domain.
*/
const MESSAGES: Record<string, string> = {
  signup_disabled:
    'This Google account is not set up for the site yet. Ask an admin to invite this exact address, then sign in again.',
};
const FALLBACK_MESSAGE =
  'Google did not complete the sign-in, and nothing on the site changed. Try again. If it happens again, send the site owner the code below.';

/** The error code from the query or the hash, or null when there is none. */
function readError(): string | null {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  if (!query.has('error') && !hash.has('error')) return null;
  const code = query.get('error_code') ?? hash.get('error_code') ?? query.get('error') ?? hash.get('error') ?? '';
  // Codes are short snake_case words. Anything else is not shown.
  return /^[a-z_]{1,48}$/.test(code) ? code : 'unknown';
}

/* The URL does not change while this page is open, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

export default function AuthCallbackPage() {
  const router = useRouter();
  // Read from the URL on the client; the server render has no URL and shows the spinner.
  const errorCode = useSyncExternalStore(noSubscription, readError, () => null);

  useEffect(() => {
    if (errorCode) return;

    let done = false;

    // Fallback: if nothing fires in 8s, send to /admin anyway
    // (AdminAuthProvider will handle the state correctly there).
    const fallback = setTimeout(finish, 8000);

    // Supabase calls this listener asynchronously, never during this call,
    // so `subscription` is assigned before finish() can run.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      // For PKCE: the code exchange has completed.
      if (s) finish();
    });

    function finish() {
      if (done) return;
      done = true;
      subscription.unsubscribe();
      clearTimeout(fallback);
      router.replace('/admin');
    }

    // A session may already exist (implicit flow, already processed).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish();
    });

    return () => {
      done = true;
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [router, errorCode]);

  if (errorCode) {
    // The same shell as the sign-in card in AdminAuthProvider.
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-6">
        <Slab tone="raised" as="div" className="max-w-md text-center flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <p className="label text-accent-ink">Western Sales Club</p>
            <h1 className="title-sm text-ink">Sign-in did not finish</h1>
          </div>
          <div className="flex flex-col items-center gap-3">
            <p className="body-sm text-ink-muted measure">{MESSAGES[errorCode] ?? FALLBACK_MESSAGE}</p>
            <p className="meta text-ink-faint">Code: {errorCode}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button href="/admin">Try again</Button>
            <Button variant="tertiary" href="/">
              Back to site
            </Button>
          </div>
        </Slab>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-4">
      <span className="spin" role="status" aria-label="Signing in" />
      <p className="label text-ink-muted">Signing in</p>
    </div>
  );
}
