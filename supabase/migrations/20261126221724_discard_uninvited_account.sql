-- ================================================================
-- 20261126221724_discard_uninvited_account.sql: no accounts left by uninvited sign-ins
-- ================================================================
-- Sign-ups are on, because an invite is claimed after the person's
-- first Google sign-in creates their account. So anyone with a Google
-- account who signs in at /admin gets an auth.users row, even without
-- an invite. The site signs them out, but the row used to stay.
--
-- discard_uninvited_account() deletes the CALLER's own account, and
-- only when it has no admins row and no live invite for its email. The
-- sign-in flow calls it after is_admin() answers false, then signs out.
-- It takes no arguments, so it can never delete another account.
--
-- The delete cascades to auth.identities, auth.sessions and
-- auth.mfa_factors. The person can sign in again later; if an admin has
-- invited them by then, the new account claims the invite as usual.
-- ================================================================

CREATE OR REPLACE FUNCTION public.discard_uninvited_account()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_email TEXT := lower(auth.email());
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.admins AS a WHERE a.user_id = v_uid) THEN
    RETURN false;
  END IF;

  IF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.admin_invites AS i
    WHERE i.email = v_email
      AND i.used_at IS NULL
      AND i.expires_at > now()
  ) THEN
    RETURN false;
  END IF;

  DELETE FROM auth.users WHERE id = v_uid;
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.discard_uninvited_account() IS
  'Deletes the caller''s own auth.users account when it is not an admin and has no live invite. Returns whether it deleted.';

ALTER FUNCTION public.discard_uninvited_account() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.discard_uninvited_account() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.discard_uninvited_account() TO authenticated;
