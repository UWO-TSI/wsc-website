'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FIELD_WELL } from '@/components/contact/field';
import Button from '@/components/ui/button';

/*
  Email and password sign-in for LOCAL DEVELOPMENT ONLY.

  The local stack (`supabase start`) has no Google OAuth client, so the
  dashboard could not be reached on localhost at all. This renders only when
  both are true:

    - NODE_ENV is development, which Next inlines at build time, so a
      production bundle compiles the whole branch away; and
    - the Supabase URL is the local stack on 127.0.0.1:54321.

  It adds no privilege: the account still has to be on the admins allowlist,
  and still has to pass TOTP before the database accepts a write.
*/
export const LOCAL_DEV =
  process.env.NODE_ENV === 'development' &&
  /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');

export default function DevSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!LOCAL_DEV) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-8 w-full text-left flex flex-col gap-3">
      <p className="label text-warn">Local development sign-in</p>
      <input
        type="email"
        aria-label="Email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={FIELD_WELL}
      />
      <input
        type="password"
        aria-label="Password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={FIELD_WELL}
      />
      {error && <p className="body-sm text-alert">{error}</p>}
      <Button type="submit" variant="secondary" disabled={busy || !email || !password}>
        {busy ? 'Signing in' : 'Sign in locally'}
      </Button>
    </form>
  );
}
