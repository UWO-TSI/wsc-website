'use client';

import { useMemo, useState } from 'react';
import { format, formatDistanceToNowStrict, isPast } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { useSupabaseMutation } from '@/lib/supabase/hooks/use-supabase-mutation';
import { useAdminAuth } from '@/providers/admin-auth-provider';
import type { AdminRow, AdminInvite, AdminAuditEntry } from '@/types/database';
import { FIELD_WELL } from '@/components/contact/field';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';

const ACTION_LABELS: Record<AdminAuditEntry['action'], string> = {
  invited: 'invited',
  invite_revoked: 'revoked the invite for',
  invite_claimed: 'joined as',
  removed: 'removed',
};

export default function AdminUsers() {
  const { user } = useAdminAuth();

  const {
    data: admins,
    loading: adminsLoading,
    error: adminsError,
    refetch: refetchAdmins,
  } = useSupabaseQuery<AdminRow>('admins', { orderBy: 'added_at', ascending: true });

  const {
    data: invites,
    loading: invitesLoading,
    refetch: refetchInvites,
  } = useSupabaseQuery<AdminInvite>('admin_invites', {
    orderBy: 'created_at',
    ascending: false,
  });

  const { data: audit, refetch: refetchAudit } = useSupabaseQuery<AdminAuditEntry>(
    'admin_audit',
    { orderBy: 'created_at', ascending: false }
  );

  const { mutate, loading: mutating, error: mutError, reset } = useSupabaseMutation();

  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [removeTarget, setRemoveTarget] = useState<AdminRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pendingInvites = useMemo(
    () => invites.filter((i) => !i.used_at && !isPast(new Date(i.expires_at))),
    [invites]
  );

  const refreshAll = () => {
    refetchAdmins();
    refetchInvites();
    refetchAudit();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) return;

    // Also enforced by an RLS WITH CHECK, but saying so here is kinder
    // than a generic permission error.
    if (target === user.email.toLowerCase()) {
      setNotice('You cannot invite yourself. Ask another admin to extend your access.');
      return;
    }

    setNotice(null);
    try {
      await mutate(async () => {
        const { error } = await supabase
          .from('admin_invites')
          .insert({ email: target, note: note.trim() || null });
        if (error) throw error;
      });
      setEmail('');
      setNote('');
      setNotice(`Invite created for ${target}. It is valid for 14 days.`);
      refreshAll();
    } catch {
      // Surfaced through mutError.
    }
  };

  const handleRevoke = async (invite: AdminInvite) => {
    setNotice(null);
    try {
      await mutate(async () => {
        const { error } = await supabase.from('admin_invites').delete().eq('id', invite.id);
        if (error) throw error;
      });
      refreshAll();
    } catch {
      // Surfaced through mutError.
    }
  };

  const handleRemove = async (admin: AdminRow) => {
    setNotice(null);
    try {
      await mutate(async () => {
        const { error } = await supabase.from('admins').delete().eq('user_id', admin.user_id);
        if (error) throw error;
      });
      setRemoveTarget(null);
      refreshAll();
    } catch {
      // Surfaced through mutError.
    }
  };

  const th = 'label px-3 pb-2';

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div>
        <h2 className="title-sm text-ink">Admins</h2>
        <p className="meta text-ink-faint mt-1">
          Anyone here can invite or remove anyone else. Access lasts ten months and then
          expires on its own.
        </p>
      </div>

      {mutError && <p className="body-sm text-alert">{mutError.message}</p>}
      {notice && (
        <div>
          <Chip status="ok">{notice}</Chip>
        </div>
      )}

      {/* Invite form */}
      <Slab tone="raised">
        <form onSubmit={handleInvite}>
          <h3 className="label text-accent-ink mb-5">Invite someone</h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="label mb-2 block" htmlFor="invite-email">
                Google account email *
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@uwo.ca"
                className={FIELD_WELL}
              />
            </div>
            <div className="flex-1">
              <label className="label mb-2 block" htmlFor="invite-note">
                Note
              </label>
              <input
                id="invite-note"
                type="text"
                maxLength={80}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. VP Marketing 2026-27"
                className={FIELD_WELL}
              />
            </div>
          </div>

          <p className="meta text-ink-faint mt-3">
            They get access the first time they sign in with that exact Google account, and
            set up two-factor on the way in. Nothing is emailed, so tell them to go to the
            admin page and sign in.
          </p>

          <Button type="submit" disabled={mutating || !email.trim()} className="mt-5">
            {mutating ? 'Working' : 'Create invite'}
          </Button>
        </form>
      </Slab>

      {/* Pending invites */}
      {(pendingInvites.length > 0 || invitesLoading) && (
        <Slab tone="raised">
          <h3 className="label text-accent-ink mb-5">Pending invites</h3>

          {pendingInvites.length === 0 ? (
            <p className="body-sm text-ink-faint">None waiting.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className={th}>Email</th>
                    <th className={th}>Note</th>
                    <th className={th}>Expires</th>
                    <th className={`${th} w-24`} />
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((invite) => (
                    <tr key={invite.id} className="bg-sunken">
                      <td className="px-3 py-3 rounded-l-md body-sm text-ink">{invite.email}</td>
                      <td className="px-3 py-3 body-sm text-ink-muted">{invite.note || 'None'}</td>
                      <td className="px-3 py-3 meta">
                        in {formatDistanceToNowStrict(new Date(invite.expires_at))}
                      </td>
                      <td className="px-3 py-3 rounded-r-md">
                        <Button
                          variant="tertiary"
                          className="!px-3 !py-1.5"
                          onClick={() => handleRevoke(invite)}
                          disabled={mutating}
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Slab>
      )}

      {/* Current admins */}
      <Slab tone="raised">
        <h3 className="label text-accent-ink mb-5">Current admins</h3>

        <AsyncStateWrapper
          loading={adminsLoading}
          error={adminsError}
          data={admins}
          onRetry={refetchAdmins}
          emptyMessage="No admins found."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className={th}>Email</th>
                  <th className={th}>Note</th>
                  <th className={th}>Access ends</th>
                  <th className={`${th} w-24`} />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin.user_id === user.id;
                  return (
                    <tr key={admin.user_id} className="bg-sunken">
                      <td className="px-3 py-3 rounded-l-md body-sm text-ink">
                        {admin.email || 'Unknown'}
                        {isSelf && <span className="meta text-ink-faint"> (you)</span>}
                      </td>
                      <td className="px-3 py-3 body-sm text-ink-muted">{admin.note || 'None'}</td>
                      <td className="px-3 py-3">
                        {admin.is_owner ? (
                          <Chip status="ok">Never, site owner</Chip>
                        ) : admin.expires_at ? (
                          <span className="meta">
                            {format(new Date(admin.expires_at), 'd MMM yyyy')} (
                            {formatDistanceToNowStrict(new Date(admin.expires_at))} left)
                          </span>
                        ) : (
                          <Chip status="alert">Expired</Chip>
                        )}
                      </td>
                      <td className="px-3 py-3 rounded-r-md">
                        {admin.is_owner ? (
                          <span
                            className="meta text-ink-faint"
                            title="The owner row is protected by the database and cannot be removed here."
                          >
                            Protected
                          </span>
                        ) : (
                          <Button
                            variant="tertiary"
                            className="!px-3 !py-1.5"
                            onClick={() => setRemoveTarget(admin)}
                            disabled={mutating}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncStateWrapper>
      </Slab>

      {/* Audit trail */}
      {audit.length > 0 && (
        <Slab tone="raised">
          <h3 className="label text-accent-ink mb-5">Recent activity</h3>
          <ul className="flex flex-col gap-2">
            {audit.slice(0, 20).map((entry) => (
              <li key={entry.id} className="body-sm text-ink-muted">
                <span className="meta">{format(new Date(entry.created_at), 'd MMM, HH:mm')}</span>{' '}
                <span className="text-ink">{entry.actor_email || 'someone'}</span>{' '}
                {ACTION_LABELS[entry.action] ?? entry.action}{' '}
                <span className="text-ink">{entry.target_email || 'unknown'}</span>
              </li>
            ))}
          </ul>
        </Slab>
      )}

      {/* Remove confirmation */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] p-4"
          onClick={() => setRemoveTarget(null)}
        >
          <div
            className="bg-raised shadow-3 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="label text-alert mb-4">Remove admin</h3>
            <p className="body text-ink mb-6">
              Remove <strong>{removeTarget.email || 'this admin'}</strong>?{' '}
              {removeTarget.user_id === user.id
                ? 'This is your own account. You will lose access immediately and will need another admin to invite you back.'
                : 'They lose access immediately. Another invite can bring them back.'}
            </p>
            {mutError && <p className="body-sm text-alert mb-4">{mutError.message}</p>}
            <div className="flex gap-3">
              <Button onClick={() => handleRemove(removeTarget)} disabled={mutating}>
                {mutating ? 'Removing' : 'Remove'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setRemoveTarget(null);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
