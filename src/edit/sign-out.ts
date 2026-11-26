import { supabase } from '@/lib/supabase/client';
import { leaveEditMode } from '@/edit/edit-mode';

/**
 * Leaves edit mode, ends the session and loads `to` fresh, so no edit or
 * Settings code stays in memory. Drafts stay in this browser's IndexedDB
 * and come back on the next sign-in.
 *
 * Imported by the edit bar and the Settings page only, so it ships in
 * their chunks and never in a visitor's bundle.
 */
export async function signOutAndReload(to?: string) {
  leaveEditMode();
  /*
    signOut() returns an error, and keeps the stored session, when the
    logout request fails (offline, 5xx). The local scope always removes the
    stored session, so the reload never starts signed in.
  */
  const { error } = await supabase.auth.signOut().catch((e: unknown) => ({ error: e }));
  if (error) await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  if (to) window.location.assign(to);
  else window.location.reload();
}
