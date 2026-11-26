-- ================================================================
-- 20261126220541_admin_remove_account.sql: Remove deletes the account
-- ================================================================
-- Before this migration, removing an admin deleted their public.admins
-- row and nothing else. Their auth.users account stayed, with its
-- verified TOTP factor. A later invite was claimed onto that same
-- account, so the person was asked for a code from an authenticator
-- they may no longer have, and only the Supabase dashboard could clear
-- it.
--
-- 1. remove_admin(user_id) deletes the auth.users account. The delete
--    cascades to public.admins (admins_user_id_fkey), auth.mfa_factors,
--    auth.sessions and auth.identities, so the person loses access, their
--    factor and their sessions at once. A new invite starts from the QR
--    code. The existing admins_audit_del trigger records 'removed' with
--    the caller as actor.
--
-- 2. The DELETE policy and grant on public.admins are dropped, so
--    remove_admin() is the only way to remove an admin through the API.
--    Deleting only the row would bring back the old behaviour.
--
-- 3. admin_last_sign_ins() also returns has_two_factor: whether the
--    account has a verified TOTP factor. The Admins tab uses it to mark
--    someone who claimed an invite but has not finished setup.
--
-- Both functions are SECURITY DEFINER with an empty search_path, owned
-- by postgres, and callable only by authenticated users. Each raises
-- unless the caller is an admin at aal2.
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- 1. remove_admin(): delete the person's account
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.remove_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN
  IF NOT coalesce(public.is_admin_mfa(), false) THEN
    RAISE EXCEPTION 'Only an admin with a verified second factor can remove an admin'
      USING ERRCODE = '42501';
  END IF;

  -- Only someone on the allowlist can be removed here, so this function
  -- can never delete an account that is not an admin's.
  SELECT a.is_owner INTO v_is_owner
  FROM public.admins AS a
  WHERE a.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No admin has that user id'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_is_owner THEN
    RAISE EXCEPTION 'The owner account cannot be removed'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.remove_admin(UUID) IS
  'Deletes a non-owner admin''s auth.users account (cascades to admins, MFA factors, sessions). Raises unless the caller is an admin at aal2.';

ALTER FUNCTION public.remove_admin(UUID) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.remove_admin(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.remove_admin(UUID) TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- 2. No direct DELETE on public.admins
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins can remove a non-owner admin" ON public.admins;
REVOKE DELETE ON public.admins FROM authenticated;


-- ════════════════════════════════════════════════════════════════
-- 3. admin_last_sign_ins(): add has_two_factor
-- ════════════════════════════════════════════════════════════════
-- The return type changes, so the function is dropped and created
-- again. Same checks and grants as 20261124000004_admin_last_sign_in.sql.

DROP FUNCTION IF EXISTS public.admin_last_sign_ins();

CREATE FUNCTION public.admin_last_sign_ins()
RETURNS TABLE (user_id UUID, email TEXT, last_sign_in_at TIMESTAMPTZ, has_two_factor BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  IF NOT coalesce(public.is_admin_mfa(), false) THEN
    RAISE EXCEPTION 'Only an admin with a verified second factor can read sign-in times'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT
      a.user_id,
      a.email,
      u.last_sign_in_at,
      EXISTS (
        SELECT 1 FROM auth.mfa_factors AS f
        WHERE f.user_id = a.user_id
          AND f.factor_type = 'totp'
          AND f.status = 'verified'
      )
    FROM public.admins AS a
    LEFT JOIN auth.users AS u ON u.id = a.user_id
    ORDER BY a.added_at NULLS LAST;
END;
$$;

COMMENT ON FUNCTION public.admin_last_sign_ins() IS
  'Each admin''s email, auth.users.last_sign_in_at, and whether they have a verified TOTP factor. Raises unless the caller is an admin at aal2.';

ALTER FUNCTION public.admin_last_sign_ins() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_last_sign_ins() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_last_sign_ins() TO authenticated;
