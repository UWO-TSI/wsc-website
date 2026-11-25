-- ================================================================
-- 20261124000003_admin_access_no_expiry.sql: admin access is permanent
-- ================================================================
-- Admin access no longer ends after ten months. It lasts until another
-- admin removes the person from the Admins tab.
--
-- Unchanged by this migration:
--   - Unclaimed invites in admin_invites still expire 14 days after
--     they are created (admin_invites_normalise sets that).
--   - Google sign-in, the authenticator-code requirement
--     (is_admin_mfa(): is_admin() AND aal2), RLS, and is_admin() as
--     the only admin check.
--   - No INSERT or UPDATE grant on public.admins. claim_admin_invite()
--     is still the only write path into the table.
--
-- ORDER MATTERS:
--   1. Replace is_admin() and claim_admin_invite() first. Their SQL
--      bodies are not tracked as dependencies, so dropping the column
--      while they still name it would break sign-in at runtime.
--   2. Delete non-owner rows whose access has already ended. Without
--      this step, dropping the column would give those people access
--      again. After this migration the set of people who can sign in
--      is the same as before it.
--   3. Drop admins.expires_at.
-- ================================================================


-- ----------------------------------------------------------------
-- 1a. is_admin(): on the allowlist, nothing more
-- ----------------------------------------------------------------
-- Same contract as before: no parameters, boolean only, SECURITY
-- DEFINER, search_path pinned to public, owned by postgres.
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
  );
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;


-- ----------------------------------------------------------------
-- 1b. claim_admin_invite(): no expiry to set
-- ----------------------------------------------------------------
-- Same flow: find the caller's live invite by their own email claim,
-- add or refresh the admins row (never the owner row), mark the invite
-- used, write an audit entry.
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

  INSERT INTO public.admins (user_id, email, note, invited_by, is_owner)
  VALUES (v_uid, v_email, v_inv.note, v_inv.invited_by, false)
  ON CONFLICT (user_id) DO UPDATE
    SET email      = EXCLUDED.email,
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


-- ----------------------------------------------------------------
-- 2. Remove rows whose access had already ended
-- ----------------------------------------------------------------
-- The old is_admin() refused a non-owner whose expires_at was NULL or
-- in the past. Those rows are deleted so the people they name do not
-- get access back. The admins_audit_del trigger records each one as
-- 'removed'. To give someone access again, invite them.
DO $$
DECLARE v_count INT;
BEGIN
  DELETE FROM public.admins
  WHERE is_owner = false
    AND (expires_at IS NULL OR expires_at <= now());
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Removed % admin row(s) whose access had already ended.', v_count;
END $$;


-- ----------------------------------------------------------------
-- 3. Drop the column
-- ----------------------------------------------------------------
ALTER TABLE public.admins
  DROP COLUMN IF EXISTS expires_at;

COMMENT ON COLUMN public.admins.is_owner IS
  'Exactly one row. Cannot be deleted through the API.';
