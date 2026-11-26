import { supabase } from '@/lib/supabase/client';
import { classifyError } from '@/lib/error-utils';
import type { AdminInvite, AdminLastSignIn, AdminRow, ExecArea, ExecGroup } from '@/types/database';

/*
  Every read and write the Settings page makes. Each one goes through the
  anon key and the signed-in user's session, so RLS decides what happens:

    admins         SELECT at aal2. No INSERT, UPDATE or DELETE grant
                   exists: a person joins by claiming an invite and leaves
                   through remove_admin() below.
    admin_invites  SELECT, INSERT, DELETE at aal2; INSERT refuses the
                   caller's own email, and a trigger lowercases the email,
                   checks its shape and sets the 14-day expiry.
    exec_groups,
    exec_areas     full access at aal2 (is_admin_mfa()).
    executives     read here only, to count who uses each role and area.

  Plus two functions that raise unless the caller is an admin at aal2:
  admin_last_sign_ins(), and remove_admin(), which deletes a non-owner
  admin's whole account (20261126220541_admin_remove_account.sql).
*/

export type Failure = 'expired' | 'conflict' | 'in-use' | 'refused' | 'network';

export class SettingsError extends Error {
  constructor(public kind: Failure) {
    super(kind);
  }
}

function fail(error: { message?: string; code?: string } | null): never {
  const code = error && 'code' in error ? error.code : undefined;
  if (code === '23505') throw new SettingsError('conflict');
  if (code === '23503') throw new SettingsError('in-use');
  const category = classifyError(error as Error)?.category;
  if (category === 'auth') throw new SettingsError('expired');
  if (category === 'forbidden' || code === '42501') throw new SettingsError('refused');
  throw new SettingsError('network');
}

export function failureOf(e: unknown): Failure {
  return e instanceof SettingsError ? e.kind : 'network';
}

/* ── Admin accounts ── */

export interface Accounts {
  admins: AdminRow[];
  /** user_id to last sign-in. Null when the function failed. */
  lastSignIn: Record<string, string | null> | null;
  /** user_id to whether two-factor setup is finished. Null when the function failed. */
  twoFactor: Record<string, boolean> | null;
  invites: AdminInvite[];
}

export async function loadAccounts(): Promise<Accounts> {
  const [admins, signIns, invites] = await Promise.all([
    supabase
      .from('admins')
      .select('user_id, email, note, added_at, is_owner, invited_by')
      .order('added_at', { ascending: true }),
    supabase.rpc('admin_last_sign_ins'),
    supabase
      .from('admin_invites')
      .select('*')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true }),
  ]);
  if (admins.error) fail(admins.error);
  if (invites.error) fail(invites.error);
  return {
    admins: (admins.data ?? []) as AdminRow[],
    lastSignIn: signIns.error
      ? null
      : Object.fromEntries(
          ((signIns.data ?? []) as AdminLastSignIn[]).map((r) => [r.user_id, r.last_sign_in_at])
        ),
    twoFactor: signIns.error
      ? null
      : Object.fromEntries(
          ((signIns.data ?? []) as AdminLastSignIn[]).map((r) => [r.user_id, r.has_two_factor])
        ),
    invites: (invites.data ?? []) as AdminInvite[],
  };
}

/**
 * Removes one admin by deleting their account, which also deletes their
 * two-factor setup and ends their sessions. A new invite starts them from
 * the QR code. The function refuses the owner.
 */
export async function removeAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_admin', { p_user_id: userId });
  if (error) fail(error);
}

/** The email must already be validated and lowercased. */
export async function inviteAdmin(email: string): Promise<void> {
  const { error } = await supabase.from('admin_invites').insert({ email });
  if (error) fail(error);
}

export async function withdrawInvite(id: string): Promise<void> {
  oneRow(await supabase.from('admin_invites').delete().eq('id', id).select('id'));
}

/* ── Roles and areas ── */

export interface Titles {
  roles: ExecGroup[];
  areas: ExecArea[];
  /** Executives per role slug and per area id, hidden ones included. */
  roleUse: Record<string, number>;
  areaUse: Record<string, number>;
}

export async function loadTitles(): Promise<Titles> {
  const [roles, areas, execs] = await Promise.all([
    supabase
      .from('exec_groups')
      .select('id, slug, label, singular_label, short_label, visible, display_order')
      .order('display_order', { ascending: true }),
    supabase
      .from('exec_areas')
      .select('id, name, display_order')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('executives').select('group, area_id'),
  ]);
  if (roles.error) fail(roles.error);
  if (areas.error) fail(areas.error);
  if (execs.error) fail(execs.error);
  const roleUse: Record<string, number> = {};
  const areaUse: Record<string, number> = {};
  for (const e of (execs.data ?? []) as Array<{ group: string; area_id: string | null }>) {
    roleUse[e.group] = (roleUse[e.group] ?? 0) + 1;
    if (e.area_id) areaUse[e.area_id] = (areaUse[e.area_id] ?? 0) + 1;
  }
  return {
    roles: (roles.data ?? []) as ExecGroup[],
    areas: (areas.data ?? []) as ExecArea[],
    roleUse,
    areaUse,
  };
}

export interface RoleFields {
  singular_label: string;
  short_label: string;
  label: string;
}

/* RLS filters a refused UPDATE or DELETE out without an error, so every
   write asks for the row back and treats zero rows as refused. */
function oneRow(r: { data: unknown[] | null; error: { message?: string; code?: string } | null }) {
  if (r.error) fail(r.error);
  if (!r.data?.length) throw new SettingsError('refused');
}

export async function saveRole(id: string | null, fields: RoleFields, order: number): Promise<void> {
  oneRow(
    id
      ? await supabase.from('exec_groups').update(fields).eq('id', id).select('id')
      : await supabase.from('exec_groups').insert({ ...fields, display_order: order }).select('id')
  );
}

export async function deleteRole(id: string): Promise<void> {
  oneRow(await supabase.from('exec_groups').delete().eq('id', id).select('id'));
}

export async function saveArea(id: string | null, name: string, order: number): Promise<void> {
  oneRow(
    id
      ? await supabase.from('exec_areas').update({ name }).eq('id', id).select('id')
      : await supabase.from('exec_areas').insert({ name, display_order: order }).select('id')
  );
}

export async function deleteArea(id: string): Promise<void> {
  oneRow(await supabase.from('exec_areas').delete().eq('id', id).select('id'));
}
