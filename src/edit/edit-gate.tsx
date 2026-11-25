'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { supabase } from '@/lib/supabase/client';
import { EDIT_FLAG_KEY, EDIT_REQUEST_EVENT } from '@/edit/edit-mode';

/*
  Loads the edit engine for an admin, and nothing for anyone else.

  Order, cheapest and most local first:
   1. The edit flag in localStorage. Without it nothing else runs, so a
      visitor costs one storage read.
   2. getSession(), which reads storage and makes no request. No session
      means no RPC.
   3. The assurance level, read from the session token: aal2 means the
      authenticator code was entered.
   4. is_admin(), the only admin check.
  Only then is the engine imported, so its code is in a separate chunk that
  a visitor never downloads. RLS still refuses every write that does not
  pass is_admin_mfa(); this gate decides what loads, never what is allowed.
*/

type Engine = ComponentType<{ userId: string }>;

async function adminUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return null;
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  return !error && isAdmin === true ? user.id : null;
}

export default function EditGate() {
  const [loaded, setLoaded] = useState<{ Engine: Engine; userId: string } | null>(null);

  useEffect(() => {
    let live = true;
    const check = async () => {
      let wanted = false;
      try {
        wanted = localStorage.getItem(EDIT_FLAG_KEY) === '1';
      } catch {}
      if (!wanted) return setLoaded(null);
      const userId = await adminUserId().catch(() => null);
      if (!userId || !live) return;
      const { default: Engine } = await import('@/edit/engine/edit-engine');
      if (live) setLoaded({ Engine, userId });
    };
    check();
    window.addEventListener(EDIT_REQUEST_EVENT, check);
    return () => {
      live = false;
      window.removeEventListener(EDIT_REQUEST_EVENT, check);
    };
  }, []);

  return loaded ? <loaded.Engine userId={loaded.userId} /> : null;
}
