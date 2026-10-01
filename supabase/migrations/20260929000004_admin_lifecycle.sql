-- ================================================================
-- 20260929000004_admin_lifecycle.sql: Self-service admins + 10mo TTL
-- ================================================================
-- Goal: any admin can add or remove another admin from the dashboard,
-- every non-owner admin expires automatically after ten months, and
-- exactly one permanent owner row cannot be removed through the app.
--
-- WHY INVITES EXIST:
--   admins.user_id is a FK to auth.users(id). There is no auth.users
--   row until the person has signed in with Google at least once, so
--   an admin cannot be added by email directly. Instead an invite is
--   written keyed by email, and claim_admin_invite() converts it into
--   an admins row the first time that person signs in.
--
-- WRITE PATHS INTO public.admins (there are exactly two):
--   1. claim_admin_invite() : SECURITY DEFINER, the only INSERT/UPDATE
--   2. DELETE via RLS       : admins removing a non-owner
--   `authenticated` is granted NO INSERT and NO UPDATE on admins, so
--   expiry cannot be extended by writing to the table directly. The
--   only way the clock moves is a fresh invite, claimed on sign-in.
--
-- ACCEPTED TRADEOFF:
--   Before this migration, public.admins was REVOKE ALL + RLS with no
--   policies, i.e. completely invisible to the API. Self-service user
--   management requires admins to read the list, so any admin can now
--   see every admin's email. This is intentional. supabase/README.md
--   is updated in the same change to stop claiming otherwise.
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- 1. EXTEND public.admins
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_owner    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.admins.expires_at IS 'Access dies at this moment. NULL + is_owner=false means no access (fail closed).';
COMMENT ON COLUMN public.admins.is_owner   IS 'Exactly one row. Never expires, cannot be deleted through the API.';

-- Exactly one owner, enforced by the database rather than by trust.
CREATE UNIQUE INDEX IF NOT EXISTS admins_single_owner_idx
  ON public.admins ((true)) WHERE is_owner;


-- ────────────────────────────────────────────────────────────────
-- Backfill existing admins
-- ────────────────────────────────────────────────────────────────
-- Everyone gets ten months from now. Then one row is promoted to
-- owner: preferring the site maintainer's email, falling back to the
-- earliest-added admin. A NOTICE says which, because getting this
-- wrong means the wrong person is permanent.
--
-- >>> VERIFY THE OWNER AFTER RUNNING:
-- >>>   SELECT user_id, email, is_owner, expires_at FROM public.admins;
-- ────────────────────────────────────────────────────────────────
UPDATE public.admins
  SET expires_at = now() + interval '10 months'
  WHERE expires_at IS NULL;

DO $$
DECLARE
  v_owner UUID;
  v_email TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.admins WHERE is_owner) THEN
    RAISE NOTICE 'Owner already set, leaving it alone.';
    RETURN;
  END IF;

  SELECT user_id, email INTO v_owner, v_email
  FROM public.admins
  WHERE lower(email) = 'thomasllamzon@gmail.com'
  LIMIT 1;

  IF v_owner IS NULL THEN
    SELECT user_id, email INTO v_owner, v_email
    FROM public.admins
    ORDER BY added_at NULLS LAST
    LIMIT 1;
    RAISE NOTICE 'No maintainer email match. Falling back to earliest admin: %', coalesce(v_email, '(none)');
  END IF;

  IF v_owner IS NULL THEN
    RAISE NOTICE 'No admins exist yet. Set is_owner manually after the first sign-in.';
    RETURN;
  END IF;

  UPDATE public.admins
    SET is_owner = true, expires_at = NULL
    WHERE user_id = v_owner;

  RAISE NOTICE 'Owner set to % (%). Verify this is correct.', coalesce(v_email, '(no email)'), v_owner;
END $$;


-- ════════════════════════════════════════════════════════════════
-- 2. ADMIN INVITES
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,                  -- always stored lowercase
  note        TEXT,                           -- e.g. 'VP Marketing 2026-27'
  invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,           -- invite itself expires in 14 days
  used_at     TIMESTAMPTZ,
  used_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- At most one live invite per email. Lets an admin re-invite someone
-- whose earlier invite already expired or was used.
CREATE UNIQUE INDEX IF NOT EXISTS admin_invites_one_live_idx
  ON public.admin_invites (email) WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_invites_email_idx ON public.admin_invites (email);

-- Server-side normalisation. The client cannot choose the invite
-- window, who it claims to be from, or pre-mark an invite as used.
CREATE OR REPLACE FUNCTION public.admin_invites_normalise()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));

  IF NEW.email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Not a valid email address: %', NEW.email;
  END IF;

  NEW.invited_by := auth.uid();
  NEW.created_at := now();
  NEW.expires_at := now() + interval '14 days';
  NEW.used_at    := NULL;
  NEW.used_by    := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_invites_normalise_trg
  BEFORE INSERT ON public.admin_invites
  FOR EACH ROW EXECUTE FUNCTION public.admin_invites_normalise();


-- ════════════════════════════════════════════════════════════════
-- 3. AUDIT LOG (append-only)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_audit (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id  UUID,
  actor_email    TEXT,
  action         TEXT NOT NULL,   -- invited | invite_revoked | invite_claimed | removed
  target_email   TEXT,
  detail         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_audit IS 'Append-only. No UPDATE or DELETE grant to any API role.';

CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON public.admin_audit (created_at DESC);

-- SECURITY DEFINER so the log is written even though `authenticated`
-- has no INSERT grant on the table.
CREATE OR REPLACE FUNCTION public.admin_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF TG_TABLE_NAME = 'admin_invites' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit (actor_user_id, actor_email, action, target_email, detail)
    VALUES (auth.uid(), lower(auth.email()), 'invited', NEW.email, NEW.note);
    RETURN NEW;

  ELSIF TG_TABLE_NAME = 'admin_invites' AND TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_audit (actor_user_id, actor_email, action, target_email)
    VALUES (auth.uid(), lower(auth.email()), 'invite_revoked', OLD.email);
    RETURN OLD;

  ELSIF TG_TABLE_NAME = 'admins' AND TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_audit (actor_user_id, actor_email, action, target_email)
    VALUES (auth.uid(), lower(auth.email()), 'removed', OLD.email);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

ALTER FUNCTION public.admin_audit_log() OWNER TO postgres;

CREATE TRIGGER admin_invites_audit_ins
  AFTER INSERT ON public.admin_invites
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_log();

CREATE TRIGGER admin_invites_audit_del
  AFTER DELETE ON public.admin_invites
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_log();

CREATE TRIGGER admins_audit_del
  AFTER DELETE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_log();


-- ════════════════════════════════════════════════════════════════
-- 4. is_admin(): now TTL-aware
-- ════════════════════════════════════════════════════════════════
-- Same contract as before: no parameters, boolean only, SECURITY
-- DEFINER, pinned search_path. Only the WHERE clause changes.
-- Fails closed: a non-owner with NULL expires_at gets nothing.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
      AND (is_owner OR (expires_at IS NOT NULL AND expires_at > now()))
  );
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;


-- ════════════════════════════════════════════════════════════════
-- 5. claim_admin_invite(): the only write path into admins
-- ════════════════════════════════════════════════════════════════
-- Called by AdminAuthProvider immediately after sign-in, before
-- is_admin(). No parameters, so the invite list cannot be probed;
-- it only ever acts on the caller's own verified email claim.
-- Returns whether the caller gained or renewed access.

CREATE OR REPLACE FUNCTION public.claim_admin_invite()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_email TEXT := lower(auth.email());
  v_inv   public.admin_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR v_email IS NULL OR v_email = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_inv
  FROM public.admin_invites
  WHERE email = v_email
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.admins (user_id, email, note, invited_by, expires_at, is_owner)
  VALUES (v_uid, v_email, v_inv.note, v_inv.invited_by, now() + interval '10 months', false)
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = now() + interval '10 months',
        email      = EXCLUDED.email,
        invited_by = EXCLUDED.invited_by
    WHERE public.admins.is_owner = false;   -- never touch the owner row

  UPDATE public.admin_invites
    SET used_at = now(), used_by = v_uid
    WHERE id = v_inv.id;

  INSERT INTO public.admin_audit (actor_user_id, actor_email, action, target_email)
  VALUES (v_uid, v_email, 'invite_claimed', v_email);

  RETURN true;
END;
$$;

ALTER FUNCTION public.claim_admin_invite() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.claim_admin_invite() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.claim_admin_invite() TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- 6. GRANTS
-- ════════════════════════════════════════════════════════════════

-- admins: read the roster, remove a non-owner. NO INSERT, NO UPDATE.
REVOKE ALL ON public.admins FROM anon, authenticated;
GRANT  SELECT, DELETE ON public.admins TO authenticated;

-- admin_invites: create and revoke. No UPDATE (used_at is set by the
-- SECURITY DEFINER claim function only).
REVOKE ALL ON public.admin_invites FROM anon, authenticated;
GRANT  SELECT, INSERT, DELETE ON public.admin_invites TO authenticated;

-- admin_audit: readable by admins, append-only via trigger.
REVOKE ALL ON public.admin_audit FROM anon, authenticated;
GRANT  SELECT ON public.admin_audit TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════

-- ── admins ─────────────────────────────────────────────────────
-- RLS is already enabled from 002; it had no policies. Add two.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read the roster"
  ON public.admins FOR SELECT
  USING (public.is_admin());

-- The owner row is not deletable through the API by anyone, including
-- the owner. Removing it takes the SQL editor and the service role.
CREATE POLICY "Admins can remove a non-owner admin"
  ON public.admins FOR DELETE
  USING (public.is_admin() AND is_owner = false);

-- ── admin_invites ──────────────────────────────────────────────
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read invites"
  ON public.admin_invites FOR SELECT
  USING (public.is_admin());

-- Self-invite is blocked on purpose. Renewal has to come from another
-- admin, otherwise the ten-month limit is decorative. The owner never
-- expires, so the club can never be fully locked out by this.
CREATE POLICY "Admins can invite someone other than themselves"
  ON public.admin_invites FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND lower(btrim(email)) <> lower(coalesce(auth.email(), ''))
  );

CREATE POLICY "Admins can revoke invites"
  ON public.admin_invites FOR DELETE
  USING (public.is_admin());

-- ── admin_audit ────────────────────────────────────────────────
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read the audit log"
  ON public.admin_audit FOR SELECT
  USING (public.is_admin());
-- No INSERT/UPDATE/DELETE policy: writes happen only inside
-- SECURITY DEFINER functions owned by postgres, which bypass RLS.
