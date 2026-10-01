'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FIELD_ERROR_RING, FIELD_WELL } from '@/components/contact/field';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';

type Mode = 'loading' | 'enroll' | 'challenge' | 'error';

interface MfaGateProps {
  onVerified: () => void;
  onSignOut: () => void;
}

/**
 * Second-factor gate for the admin dashboard.
 *
 * TOTP (RFC 6238): Supabase generates a random secret and hands back a
 * QR code encoding an `otpauth://` URI. The authenticator app stores
 * that secret and derives a 6-digit code from it plus the current
 * 30-second window, entirely offline. No SMS, no email, no third-party
 * service, and any standard app works: Google Authenticator, Microsoft
 * Authenticator, 1Password, Apple Passwords.
 *
 * Two modes:
 *   enroll:    no verified factor yet, so show the QR to scan.
 *   challenge: a factor exists, so just ask for the current code.
 *
 * Passing the challenge raises the session to aal2, which is what every
 * admin RLS policy requires. This screen is the front door; the lock is
 * in the database.
 */
export default function MfaGate({ onVerified, onSignOut }: MfaGateProps) {
  const [mode, setMode] = useState<Mode>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /** StrictMode double-invokes effects; enrolling twice creates a junk factor. */
  const initialised = useRef(false);

  const initialise = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verified = data?.totp?.find((f) => f.status === 'verified');
      if (verified) {
        setFactorId(verified.id);
        setMode('challenge');
        return;
      }

      // Clear abandoned enrollments first. An unverified factor from a
      // previous attempt blocks a fresh enroll on friendly-name reuse.
      for (const stale of data?.totp ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: stale.id });
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `WSC Admin ${new Date().toISOString().slice(0, 10)}`,
      });
      if (enrollError) throw enrollError;

      setFactorId(enrolled.id);
      setQrCode(enrolled.totp.qr_code);
      setSecret(enrolled.totp.secret);
      setMode('enroll');
    } catch (err) {
      setMessage((err as Error).message || 'Could not start two-factor setup.');
      setMode('error');
    }
  }, []);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    initialise();
  }, [initialise]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.trim().length < 6) return;

    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      if (error) throw error;
      onVerified();
    } catch (err) {
      setMessage(
        (err as Error).message ||
          'That code was not accepted. Codes rotate every 30 seconds, so try the current one.'
      );
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  /* Same shell as the sign-in screen: a raised slab on --page. */
  const shell = (inner: React.ReactNode) => (
    <div className="min-h-screen bg-page flex items-center justify-center px-6 py-16">
      <Slab tone="raised" as="div" className="w-full max-w-md text-center flex flex-col items-center">
        <p className="label text-accent-ink mb-6">Two-factor authentication</p>
        {inner}
        <Button variant="tertiary" onClick={onSignOut} className="mt-8">
          Sign out
        </Button>
      </Slab>
    </div>
  );

  if (mode === 'loading') {
    return shell(
      <div className="flex flex-col items-center gap-4 py-8">
        <span className="spin" role="status" aria-label="Loading" />
        <p className="label text-ink-muted">Preparing</p>
      </div>
    );
  }

  if (mode === 'error') {
    return shell(
      <>
        <p className="body-sm text-alert">{message}</p>
        <Button
          onClick={() => {
            initialised.current = false;
            setMode('loading');
            setMessage(null);
            initialise();
          }}
          className="mt-6"
        >
          Try again
        </Button>
      </>
    );
  }

  const codeInput = (
    <form onSubmit={handleVerify} className="mt-8 w-full text-left">
      <label htmlFor="totp-code" className="label mb-2 block">
        6-digit code
      </label>
      <input
        id="totp-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        value={code}
        autoFocus
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        aria-invalid={!!message}
        style={message ? FIELD_ERROR_RING : undefined}
        className={`${FIELD_WELL} text-center font-data tracking-[0.5em]`}
      />

      {message && <p className="body-sm text-alert mt-3">{message}</p>}

      <Button type="submit" disabled={busy || code.length < 6} className="mt-6 w-full">
        {busy ? 'Verifying' : 'Verify'}
      </Button>
    </form>
  );

  if (mode === 'challenge') {
    return shell(
      <>
        <h1 className="title-sm text-ink mb-4">Enter your code</h1>
        <p className="body text-ink-muted measure">
          Open your authenticator app and enter the current code for Western Sales Club.
        </p>
        {codeInput}
      </>
    );
  }

  return shell(
    <>
      <h1 className="title-sm text-ink mb-4">Set up two-factor</h1>
      <p className="body text-ink-muted measure">
        Scan this with Google Authenticator, Microsoft Authenticator, 1Password, or Apple
        Passwords. Then enter the 6-digit code it shows.
      </p>

      {qrCode && (
        <div className="mt-7 flex justify-center">
          {/* Supabase returns the QR as an inline SVG data URI, which
              next/image cannot optimise. The white ground is required for
              a scanner in the dark theme. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Two-factor setup QR code" className="h-48 w-48 rounded-sm bg-white p-3" />
        </div>
      )}

      {secret && (
        <details className="mt-5 w-full text-left">
          <summary className="label cursor-pointer text-ink-muted hover:text-accent-ink transition-colors duration-[var(--d-hover)] ease-enter">
            Cannot scan? Enter a code manually
          </summary>
          <p className="mt-2 break-all rounded-sm bg-page px-[15px] py-[13px] font-data text-ink">
            {secret}
          </p>
        </details>
      )}

      {codeInput}

      <p className="meta text-ink-faint mt-6">
        Keep this in an app you will still have next term. If you lose the device, the site
        owner has to remove the factor for you.
      </p>
    </>
  );
}
