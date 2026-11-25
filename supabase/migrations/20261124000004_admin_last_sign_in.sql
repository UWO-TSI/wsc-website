-- ================================================================
-- 20261124000004_admin_last_sign_in.sql: when each admin last signed in
-- ================================================================
-- auth.users is not exposed to the API, so the Admins tab cannot read
-- last_sign_in_at directly. This function returns one row per admin:
-- the user id, the email already shown in the roster, and the time
-- Supabase Auth last recorded a sign-in for that user.
--
-- Read-only, and only for an admin who has passed the second-factor
-- challenge. That is the same bar as reading public.admins itself
-- (migration 5), since the result carries every admin's email.
--
-- SECURITY DEFINER so it can read auth.users. search_path is empty,
-- so every name below is schema-qualified and nothing can be shadowed
-- by an object in another schema.
-- ================================================================

CREATE OR REPLACE FUNCTION public.admin_last_sign_ins()
RETURNS TABLE (user_id UUID, email TEXT, last_sign_in_at TIMESTAMPTZ)
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
    SELECT a.user_id, a.email, u.last_sign_in_at
    FROM public.admins AS a
    LEFT JOIN auth.users AS u ON u.id = a.user_id
    ORDER BY a.added_at NULLS LAST;
END;
$$;

COMMENT ON FUNCTION public.admin_last_sign_ins() IS
  'Each admin''s email and auth.users.last_sign_in_at. Raises unless the caller is an admin at aal2.';

ALTER FUNCTION public.admin_last_sign_ins() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_last_sign_ins() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_last_sign_ins() TO authenticated;
