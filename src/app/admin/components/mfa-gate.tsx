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
        // The name the authenticator app lists the code under. Without it
        // Supabase uses the site URL's host, which on localhost is an IP.
        issuer: 'Western Sales Club',
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

  /*
    Same shell as the sign-in screen: a raised slab on --page. Spaced with
    gap, never margins: the type classes reset margin outside a layer, so an
    mb-* on a title or body block never applies.
  */
  const shell = (title: string | null, inner: React.ReactNode) => (
    <div className="min-h-screen bg-page flex items-center justify-center px-6 py-16">
      <Slab tone="raised" as="div" className="w-full max-w-md text-center flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <p className="label text-accent-ink">Two-factor authentication</p>
          {title && <h1 className="title-sm text-ink">{title}</h1>}
        </div>
        {inner}
        <Button variant="tertiary" onClick={onSignOut}>
          Sign out
        </Button>
      </Slab>
    </div>
  );

  if (mode === 'loading') {
    return shell(
      null,
      <div className="flex flex-col items-center gap-4 py-8">
        <span className="spin" role="status" aria-label="Loading" />
        <p className="label text-ink-muted">Preparing</p>
      </div>
    );
  }

  if (mode === 'error') {
    return shell(
      null,
      <div className="flex flex-col items-center gap-6">
        <p className="body-sm text-alert">{message}</p>
        <Button
          onClick={() => {
            initialised.current = false;
            setMode('loading');
            setMessage(null);
            initialise();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const codeInput = (
    <form onSubmit={handleVerify} className="w-full text-left flex flex-col gap-3">
      <label htmlFor="totp-code" className="label block">
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

      {message && <p className="body-sm text-alert">{message}</p>}

      <Button type="submit" disabled={busy || code.length < 6} className="mt-3 w-full">
        {busy ? 'Verifying' : 'Verify'}
      </Button>
    </form>
  );

  if (mode === 'challenge') {
    return shell(
      'Enter your code',
      <>
        <div className="flex flex-col items-center gap-3">
          <p className="body-sm text-ink-muted measure">
            Open your authenticator app and enter the current code for Western Sales Club.
          </p>
          {/* Apple Passwords tucks its codes away well enough that people
              assume they never set one up. */}
          {/* Running text at the label size: an aside, quieter than the body. */}
          <p className="font-text text-[length:var(--t-label)] leading-normal text-ink-faint measure">
            Saved it in Apple Passwords? Open the Passwords app &rarr; Codes on iOS 18 or
            later, or Settings &rarr; Passwords &rarr; Western Sales Club on iOS 17.
          </p>
        </div>
        {codeInput}
      </>
    );
  }

  return shell(
    'Set up two-factor',
    <>
      <p className="body-sm text-ink-muted measure">
        Scan this with Google Authenticator, Microsoft Authenticator, 1Password, or Apple
        Passwords. Then enter the 6-digit code it shows.
      </p>

      {qrCode && (
        <>
          {/* Supabase returns the QR as an inline SVG data URI, which
              next/image cannot optimise. The white ground is required for
              a scanner in the dark theme. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Two-factor setup QR code" className="h-48 w-48 rounded-sm bg-white p-3" />
        </>
      )}

      {secret && (
        <details className="w-full text-left">
          <summary className="label cursor-pointer text-ink-muted hover:text-accent-ink transition-colors duration-[var(--d-hover)] ease-enter">
            Cannot scan? Enter a code manually
          </summary>
          <p className="mt-2 break-all rounded-sm bg-page px-[15px] py-[13px] font-data text-ink">
            {secret}
          </p>
        </details>
      )}

      {codeInput}

      <p className="meta text-ink-faint measure">
        Keep this in an app you will still have next term. If you lose the device, the site
        owner has to remove the factor for you.
      </p>
    </>
  );
}
