'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import { enterEditMode } from '@/edit/edit-mode';
import { signOutAndReload } from '@/edit/sign-out';
import { useAdminAuth } from '@/providers/admin-auth-provider';
import { SETTINGS_COPY as C } from './copy';
import Accounts from './accounts';
import Titles from './titles';

/*
  The Settings page: admin accounts, roles and areas. A separate page,
  because none of it appears on the public site, so it has no edit bar and
  no Publish: each action writes when it is pressed.

  Loaded by SettingsGate with a dynamic import, only after is_admin() is
  true at aal2, so this file and everything it imports (every Settings
  write) is in a chunk that no visitor downloads.
*/

export default function SettingsPanel() {
  const router = useRouter();
  const { user } = useAdminAuth();

  return (
    <div className="min-h-screen bg-page px-[var(--gut)] pb-20 pt-[clamp(2.5rem,6vw,4.5rem)]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="flex min-w-0 flex-col gap-3">
            <p className="label text-accent-ink">{C.eyebrow}</p>
            <h1 className="title text-ink">{C.title}</h1>
            <p className="body-sm text-ink-muted measure">{C.intro}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                enterEditMode();
                router.push('/');
              }}
            >
              {C.backToEditing}
            </Button>
            <Button variant="tertiary" onClick={() => signOutAndReload('/')}>
              {C.signOut}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-10 min-[860px]:grid-cols-2 min-[860px]:gap-8">
          <Accounts me={user} />
          <div className="flex min-w-0 flex-col gap-10">
            <Titles />
          </div>
        </div>
      </div>
    </div>
  );
}
