'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import { normalizeFor, validateField } from '@/lib/normalize';
import { signOutAndReload } from '@/edit/sign-out';
import type { AdminRow } from '@/types/database';
import { SETTINGS_COPY as C, signedInWhen } from './copy';
import {
  failureOf,
  inviteAdmin,
  loadAccounts,
  removeAdmin,
  withdrawInvite,
  type Failure,
} from './data';
import {
  RowField,
  RowMessage,
  SaveCancel,
  SettingsFormRow,
  SettingsRow,
  SettingsSection,
  SMALL,
} from './settings-list';
import { LoadState, rowsSkeleton, useSettingsData } from './load-state';

/*
  Admin accounts: every admin with their last sign-in, Remove for every
  row but the owner's, pending invites with Withdraw, and one invite row.

  The owner row has no Remove, and the delete query also filters on
  is_owner = false. The database enforces the same rule on its own: the
  admins DELETE policy requires is_owner = false
  (20260929000005_admin_mfa_aal2.sql), so a crafted request cannot remove
  the owner either.
*/

const EMAIL_MAX = 254;
const DAY = 86_400_000;

type RowNote = { key: string; tone: 'ok' | 'alert'; text: string };

export default function Accounts({ me }: { me: { id: string; email: string } }) {
  const { data, at, error: loadError, reload: load } = useSettingsData(loadAccounts);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<RowNote | null>(null);
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const failText = (f: Failure, refused: string) =>
    f === 'expired' ? C.expired : f === 'refused' ? refused : C.writeFailed;

  const remove = async (admin: AdminRow) => {
    const label = admin.email || admin.user_id;
    setBusy(admin.user_id);
    setNote(null);
    try {
      await removeAdmin(admin.user_id);
      if (admin.user_id === me.id) {
        await signOutAndReload('/');
        return;
      }
      setConfirm(null);
      await load();
    } catch (e) {
      setNote({ key: admin.user_id, tone: 'alert', text: failText(failureOf(e), C.removeFailed(label)) });
    }
    setBusy(null);
  };

  const withdraw = async (id: string) => {
    setBusy(id);
    setNote(null);
    try {
      await withdrawInvite(id);
      await load();
    } catch (e) {
      setNote({ key: id, tone: 'alert', text: failText(failureOf(e), C.writeFailed) });
    }
    setBusy(null);
  };

  /* Checked on submit only. The trigger on admin_invites checks the shape
     again and lowercases it; RLS refuses the caller's own address. */
  const invite = async () => {
    const target = normalizeFor('email', email);
    const problem = !target
      ? C.inviteEmpty
      : validateField({ label: 'Email', format: 'email', maxLength: EMAIL_MAX }, target) ??
        (target === me.email.toLowerCase()
          ? C.inviteSelf
          : data?.admins.some((a) => a.email?.toLowerCase() === target)
            ? C.inviteAdmin(target)
            : data?.invites.some((i) => i.email === target)
              ? C.inviteWaiting(target)
              : null);
    setNote(null);
    setInviteError(problem);
    if (problem) return;
    setBusy('invite');
    try {
      await inviteAdmin(target);
      setEmail('');
      setNote({ key: 'invite', tone: 'ok', text: C.invited(target) });
      await load();
    } catch (e) {
      /* The own-address case is caught above, before the request, so a
         refusal here is about the session, not the address. */
      const f = failureOf(e);
      setInviteError(
        f === 'conflict' ? C.inviteWaiting(target) : failText(f, C.inviteRefused)
      );
    }
    setBusy(null);
  };

  const noteFor = (key: string) =>
    note?.key === key ? <RowMessage tone={note.tone}>{note.text}</RowMessage> : undefined;

  return (
    <SettingsSection id="settings-accounts" title={C.accounts} note={C.accountsNote}>
      <LoadState
        loading={!data && !loadError}
        error={loadError ? C.loadFailed(C.accounts) : null}
        expired={loadError === 'expired'}
        onRetry={load}
        skeleton={rowsSkeleton(3)}
      >
        {data?.admins.map((admin) => {
          const self = admin.user_id === me.id;
          const label = admin.email || admin.user_id;
          if (confirm === admin.user_id) {
            return (
              <SettingsFormRow key={admin.user_id} onSubmit={() => remove(admin)} message={noteFor(admin.user_id)}>
                <p className="body-sm text-ink">{self ? C.confirmRemoveSelf : C.confirmRemove(label)}</p>
                <span className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className={SMALL}
                    onClick={() => setConfirm(null)}
                    disabled={busy === admin.user_id}
                  >
                    {C.keep}
                  </Button>
                  <Button type="submit" className={SMALL} disabled={busy === admin.user_id}>
                    {busy === admin.user_id ? C.removing : C.remove}
                  </Button>
                </span>
              </SettingsFormRow>
            );
          }
          const seen = data.lastSignIn?.[admin.user_id];
          return (
            <SettingsRow
              key={admin.user_id}
              name={
                <>
                  {label}
                  {self && <span className="text-ink-faint"> · {C.you}</span>}
                </>
              }
              detail={
                <>
                  {!data.lastSignIn
                    ? C.signInUnknown
                    : seen
                      ? C.signedIn(signedInWhen(seen, at))
                      : C.neverSignedIn}
                  {/* Claimed the invite but has not entered a first code. */}
                  {data.twoFactor?.[admin.user_id] === false && ` · ${C.setupUnfinished}`}
                </>
              }
              actions={
                admin.is_owner ? (
                  <Chip>{C.owner}</Chip>
                ) : (
                  <Button
                    variant="tertiary"
                    className={`${SMALL} !text-alert`}
                    onClick={() => {
                      setNote(null);
                      setConfirm(admin.user_id);
                    }}
                    aria-label={`${C.remove} ${label}`}
                  >
                    {C.remove}
                  </Button>
                )
              }
              message={noteFor(admin.user_id)}
            />
          );
        })}

        {data?.invites.map((inv) => (
          <SettingsRow
            key={inv.id}
            name={inv.email}
            detail={C.invitedRow(Math.ceil((new Date(inv.expires_at).getTime() - at) / DAY))}
            actions={
              <Button
                variant="tertiary"
                className={SMALL}
                onClick={() => withdraw(inv.id)}
                disabled={busy === inv.id}
                aria-label={`${C.withdraw} ${inv.email}`}
              >
                {C.withdraw}
              </Button>
            }
            message={noteFor(inv.id)}
          />
        ))}

        {data && (
          <SettingsFormRow onSubmit={invite} message={noteFor('invite')}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <RowField
                id="settings-invite"
                label={C.inviteLabel}
                type="email"
                value={email}
                maxLength={EMAIL_MAX}
                onChange={(v) => {
                  setEmail(v);
                  if (inviteError) setInviteError(null);
                }}
                error={inviteError}
              />
              <SaveCancel busy={busy === 'invite'} saveLabel={C.invite} busyLabel={C.inviting} />
            </div>
            <p className="meta text-ink-muted">{C.inviteHelp}</p>
          </SettingsFormRow>
        )}
      </LoadState>
    </SettingsSection>
  );
}
