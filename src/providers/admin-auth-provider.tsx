'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';

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
 * AdminAuthProvider: 3-phase gate for /admin routes.
 *
 * Phases: checking_auth → checking_admin → authorized | denied
 *
 * Only a neutral spinner is shown during the loading phases. No dashboard
 * skeleton or content hints are rendered before is_admin() confirms
 * authorization.
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
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="spin" role="status" aria-label="Loading" />
          <p className="label text-ink-muted">
            {state === 'checking_auth' ? 'Checking session' : 'Verifying access'}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-6">
        <Slab tone="raised" as="div" className="max-w-md text-center flex flex-col items-center">
          <p className="label text-accent-ink mb-6">Admin portal</p>
          <h1 className="title-sm text-ink mb-4">Western Sales Club</h1>
          <p className="body text-ink-muted mb-10 measure">
            Sign in with the authorized Google account to access the content management dashboard.
          </p>
          <Button onClick={signIn} className="mb-6">
            Sign in with Google
          </Button>
          <Button variant="tertiary" href="/">
            Back to site
          </Button>
        </Slab>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
