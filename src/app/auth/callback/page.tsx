'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

/**
 * Dedicated OAuth callback page.
 *
 * After Google auth, Supabase redirects here with either:
 *   - PKCE:     /auth/callback?code=xxx   (Supabase JS auto-exchanges the code)
 *   - Implicit: /auth/callback#access_token=xxx (Supabase JS processes the hash)
 *
 * Once the session is confirmed, we redirect to /admin.
 *
 * The listener and the 8s fallback are set up synchronously, so the
 * effect's cleanup always reaches them: leaving the page, or the first of
 * the three paths to finish, stops the other two. Only one redirect ever
 * fires, and none fires after the page has unmounted.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
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
  }, [router]);

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-4">
      <span className="spin" role="status" aria-label="Signing in" />
      <p className="label text-ink-muted">Signing in</p>
    </div>
  );
}
