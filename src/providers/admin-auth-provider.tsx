'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';
import MfaGate from '@/app/admin/components/mfa-gate';
import DevSignIn from '@/app/admin/components/dev-sign-in';

type AdminState =
  | 'checking_auth'
  | 'checking_admin'
  | 'checking_mfa'
  | 'needs_mfa'
  | 'authorized'
  | 'denied';

interface AdminAuthContextValue {
  signOut: () => Promise<void>;
  /** The signed-in admin. Present whenever children are rendered. */
  user: { id: string; email: string };
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

/**
 * AdminAuthProvider: gate for /admin routes.
 *
 * Phases: checking_auth → checking_admin → checking_mfa → authorized,
 * with needs_mfa and denied as terminal branches.
 *
 * Three things happen in order after sign-in, and the order matters:
 *
 *  1. claim_admin_invite(): converts a pending email invite into an
 *     admins row. Has to run BEFORE is_admin(), because a first-time
 *     admin is not on the allowlist until their invite is claimed.
 *  2. is_admin(): identity and expiry only, deliberately answerable at
 *     aal1, because someone who has not enrolled a second factor yet
 *     still needs to be recognised in order to reach the enrollment
 *     screen.
 *  3. AAL check: everything that writes is gated on aal2 in RLS, so a
 *     session that has not passed a TOTP challenge gets the MFA gate
 *     instead of the dashboard. This is a UX shortcut, not the
 *     enforcement: the database refuses those writes regardless.
 *
 * Only a neutral spinner is shown during the loading phases, and no
 * dashboard content is rendered before all three checks pass.
 */
export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>('checking_auth');
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  /**
   * Sessions whose invite has already been claimed. onAuthStateChange
   * also fires on token refresh, and re-running the RPC every hour is
   * pointless work.
   */
  const claimedFor = useRef<Set<string>>(new Set());

  const evaluate = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setState('denied');
      return;
    }

    setUser({ id: session.user.id, email: session.user.email ?? '' });
    setState('checking_admin');

    try {
      // 1. Claim a pending invite, once per session.
      if (!claimedFor.current.has(session.user.id)) {
        claimedFor.current.add(session.user.id);
        const { error: claimError } = await supabase.rpc('claim_admin_invite');
        // A failed claim is not fatal: an already-provisioned admin has
        // nothing to claim, and is_admin() is the real answer either way.
        if (claimError) console.warn('Invite claim skipped:', claimError.message);
      }

      // 2. Allowlist and expiry.
      const { data: isAdmin, error } = await supabase.rpc('is_admin');
      if (error || !isAdmin) {
        await supabase.auth.signOut();
        setState('denied');
        return;
      }

      // 3. Second factor.
      setState('checking_mfa');
      const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        // Fail closed: if the assurance level cannot be read, send them
        // through the gate rather than showing a dashboard whose every
        // action the database would then reject.
        setState('needs_mfa');
        return;
      }

      setState(aal?.currentLevel === 'aal2' ? 'authorized' : 'needs_mfa');
    } catch {
      await supabase.auth.signOut();
      setState('denied');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      evaluate(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session);
    });

    return () => subscription.unsubscribe();
  }, [evaluate]);

  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  }, []);

  const signOut = useCallback(async () => {
    claimedFor.current.clear();
    await supabase.auth.signOut();
    setUser(null);
    setState('denied');
  }, []);

  if (state === 'checking_auth' || state === 'checking_admin' || state === 'checking_mfa') {
    const message =
      state === 'checking_auth'
        ? 'Checking session'
        : state === 'checking_admin'
          ? 'Verifying access'
          : 'Checking second factor';

    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="spin" role="status" aria-label="Loading" />
          <p className="label text-ink-muted">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'needs_mfa') {
    return <MfaGate onVerified={() => setState('authorized')} onSignOut={signOut} />;
  }

  if (state === 'denied' || !user) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-6">
        {/* Spaced with gap: the type classes reset margin outside a layer, so mb-* never applies. */}
        <Slab tone="raised" as="div" className="max-w-md text-center flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <p className="label text-accent-ink">Admin portal</p>
            <h1 className="title-sm text-ink">Western Sales Club</h1>
          </div>
          <p className="body-sm text-ink-muted measure">
            Sign in with an authorized Google account to access the content management
            dashboard. If someone invited you, sign in with the exact address they invited.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button onClick={signIn}>Sign in with Google</Button>
            <Button variant="tertiary" href="/">
              Back to site
            </Button>
          </div>
          <DevSignIn />
        </Slab>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ signOut, user }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
