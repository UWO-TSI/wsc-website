'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';

type AdminState = 'checking_auth' | 'checking_admin' | 'authorized' | 'denied';

interface AdminAuthContextValue {
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

/**
 * AdminAuthProvider — 3-phase gate for /admin routes.
 *
 * Phases: checking_auth → checking_admin → authorized | denied
 *
 * Only a neutral spinner is shown during the loading phases —
 * no dashboard skeleton or content hints are rendered before
 * is_admin() confirms authorization.
 */
export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>('checking_auth');

  const verifyAdmin = useCallback(async (session: Session | null) => {
    if (!session) {
      setState('denied');
      return;
    }
    setState('checking_admin');
    try {
      const { data: isAdmin, error } = await supabase.rpc('is_admin');
      if (error || !isAdmin) {
        await supabase.auth.signOut();
        setState('denied');
      } else {
        setState('authorized');
      }
    } catch {
      await supabase.auth.signOut();
      setState('denied');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      verifyAdmin(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      verifyAdmin(session);
    });

    return () => subscription.unsubscribe();
  }, [verifyAdmin]);

  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState('denied');
  }, []);

  if (state === 'checking_auth' || state === 'checking_admin') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--color-text-muted)] font-mono text-xs tracking-[0.25em] uppercase">
            {state === 'checking_auth' ? 'Checking session' : 'Verifying access'}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[var(--color-gold)] text-xs tracking-[0.3em] uppercase mb-6">
          Admin Portal
        </p>
        <h1
          className="text-4xl text-[var(--color-text-primary)] mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Western Sales Club
        </h1>
        <p className="text-[var(--color-text-muted)] mb-10 max-w-sm text-sm leading-relaxed">
          Sign in with the authorized Google account to access the content management dashboard.
        </p>
        <button
          onClick={signIn}
          className="px-8 py-3 border border-[var(--color-border-gold)] text-[var(--color-gold)] font-mono text-xs tracking-[0.2em] uppercase hover:bg-[var(--color-gold)] hover:text-black transition-all duration-300 cursor-pointer"
        >
          Sign in with Google
        </button>
        <a
          href="/"
          className="mt-8 text-[var(--color-text-muted)] text-sm font-mono hover:text-[var(--color-gold)] transition-colors"
        >
          ← Back to site
        </a>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
