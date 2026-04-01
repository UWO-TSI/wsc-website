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
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      <p className="text-[var(--color-text-muted)] font-mono text-xs tracking-[0.25em] uppercase">
        Signing in…
      </p>
    </div>
  );
}
