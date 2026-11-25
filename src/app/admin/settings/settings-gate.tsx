'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import Button from '@/components/ui/button';
import AdminAuthProvider from '@/providers/admin-auth-provider';
import { adminAtAal2 } from '@/edit/edit-gate';
import { SETTINGS_COPY as C } from './copy';

/*
  /admin/settings for everyone: the sign-in flow first, the Settings page
  only for an admin at aal2.

  AdminAuthProvider shows Google sign-in to an anonymous visitor, signs a
  non-admin out, and sends an admin at aal1 to the authenticator code. Its
  children render only after all of that passes. The loader below then runs
  the same check EditGate runs (aal2, then is_admin()) and only then
  imports the panel, so the Settings reads and writes are in a separate
  chunk that this page does not reference. RLS still decides every write.
*/

type Panel = ComponentType;

function SettingsLoader() {
  const [Panel, setPanel] = useState<Panel | null>(null);
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const userId = await adminAtAal2().catch(() => null);
      if (!live) return;
      if (!userId) return setRefused(true);
      const { default: SettingsPanel } = await import('./settings-panel');
      if (live) setPanel(() => SettingsPanel);
    })();
    return () => {
      live = false;
    };
  }, []);

  if (Panel) return <Panel />;

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-4 px-6 text-center">
      {refused ? (
        <>
          <p role="alert" className="body-sm text-ink-muted measure">
            {C.checkFailed}
          </p>
          <Button variant="secondary" href="/admin">
            {C.signInAgain}
          </Button>
        </>
      ) : (
        <>
          <span className="spin" role="status" aria-label={C.loading} />
          <p className="label text-ink-muted">{C.loading}</p>
        </>
      )}
    </div>
  );
}

export default function SettingsGate() {
  return (
    <AdminAuthProvider>
      <SettingsLoader />
    </AdminAuthProvider>
  );
}
