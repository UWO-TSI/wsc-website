'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminAuthProvider from '@/providers/admin-auth-provider';
import { enterEditMode } from '@/edit/edit-mode';

/*
  /admin is the sign-in page only: Google, then the authenticator code.
  Once both pass, the browser goes to the home page in edit mode. There is
  no dashboard.

  enterEditMode() only sets the flag that asks EditGate to check. The gate
  still requires aal2 and is_admin() before it imports the engine.
*/

function OpenEditMode() {
  const router = useRouter();

  useEffect(() => {
    enterEditMode();
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-4">
      <span className="spin" role="status" aria-label="Opening the site" />
      <p className="label text-ink-muted">Opening the site</p>
    </div>
  );
}

export default function SignIn() {
  return (
    <AdminAuthProvider>
      <OpenEditMode />
    </AdminAuthProvider>
  );
}
