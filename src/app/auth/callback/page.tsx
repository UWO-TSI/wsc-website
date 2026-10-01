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
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if a session already exists (e.g. implicit flow, already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/admin');
        return;
      }

      // For PKCE: wait for the code exchange to complete
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s) {
          subscription.unsubscribe();
          router.replace('/admin');
        }
      });

      // Fallback: if nothing fires in 8s, send to /admin anyway
      // (AdminAuthProvider will handle the state correctly there)
      const fallback = setTimeout(() => {
        subscription.unsubscribe();
        router.replace('/admin');
      }, 8000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(fallback);
      };
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-4">
      <span className="spin" role="status" aria-label="Signing in" />
      <p className="label text-ink-muted">Signing in</p>
    </div>
  );
}
