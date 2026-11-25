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
  await supabase.auth.signOut().catch(() => {});
  if (to) window.location.assign(to);
  else window.location.reload();
}
