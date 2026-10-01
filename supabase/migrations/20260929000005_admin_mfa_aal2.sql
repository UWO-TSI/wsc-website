-- ================================================================
-- 20260929000005_admin_mfa_aal2.sql: Require TOTP 2FA for admin writes
-- ================================================================
-- Supabase Auth issues a JWT carrying an `aal` claim (Authenticator
-- Assurance Level). A password/OAuth-only session is aal1. After the
-- user passes a TOTP challenge the session becomes aal2. Enforcing
-- aal2 in RLS means the DATABASE refuses the write, not the UI, so a
-- stolen aal1 token is useless for editing anything.
--
-- TOTP is RFC 6238: Supabase stores a per-user secret in
-- auth.mfa_factors, the authenticator app computes codes offline from
-- that same secret. No third-party service, no SMS, no email.
--
-- TWO FUNCTIONS, DELIBERATELY SEPARATE:
--   is_admin()     : "are you on the allowlist and unexpired?"
--                     Identity only. Stays aal1-callable, because the
--                     enrollment screen needs it: a new admin must be
--                     recognised BEFORE they can enrol a factor.
--   is_admin_mfa() : is_admin() AND the session reached aal2.
--                     Gates every write, and every read of admin-only
--                     tables.
--
-- ROLLBACK, if enrollment turns out to be too much friction for the
-- club: redefine one function and enforcement disappears everywhere,
-- no policy churn.
--
--   CREATE OR REPLACE FUNCTION public.is_admin_mfa()
--   RETURNS BOOLEAN LANGUAGE sql STABLE SET search_path = public
--   AS $fn$ SELECT public.is_admin(); $fn$;
--
-- NOTE ON ROLLOUT: after this runs, existing admins cannot edit
-- anything until they enrol an authenticator. That is the point, but
-- do it when someone is around to help, not the night before an event.
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- THE GATE
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin_mfa()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.is_admin()
     AND coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

COMMENT ON FUNCTION public.is_admin_mfa() IS
  'Admin AND second factor verified this session. Gates all admin writes. Redefine as SELECT public.is_admin() to disable 2FA enforcement.';

REVOKE EXECUTE ON FUNCTION public.is_admin_mfa() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin_mfa() TO authenticated, anon;


-- ════════════════════════════════════════════════════════════════
-- CONTENT TABLES: swap is_admin() for is_admin_mfa()
-- ════════════════════════════════════════════════════════════════
-- Public SELECT policies are untouched. The site stays readable by
-- anyone with no session at all, which is the whole point of a
-- public website.

DROP POLICY IF EXISTS "Admin full access to events"         ON public.events;
CREATE POLICY "Admin full access to events"
  ON public.events FOR ALL
  USING (public.is_admin_mfa()) WITH CHECK (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admin full access to sponsors"       ON public.sponsors;
CREATE POLICY "Admin full access to sponsors"
  ON public.sponsors FOR ALL
  USING (public.is_admin_mfa()) WITH CHECK (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admin full access to executives"     ON public.executives;
CREATE POLICY "Admin full access to executives"
  ON public.executives FOR ALL
  USING (public.is_admin_mfa()) WITH CHECK (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admin full access to gallery photos" ON public.gallery_photos;
CREATE POLICY "Admin full access to gallery photos"
  ON public.gallery_photos FOR ALL
  USING (public.is_admin_mfa()) WITH CHECK (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admin can update site content"       ON public.site_content;
CREATE POLICY "Admin can update site content"
  ON public.site_content FOR UPDATE
  USING (public.is_admin_mfa()) WITH CHECK (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admin full access to site stats"     ON public.site_stats;
CREATE POLICY "Admin full access to site stats"
  ON public.site_stats FOR ALL
  USING (public.is_admin_mfa()) WITH CHECK (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admin full access to exec groups"    ON public.exec_groups;
CREATE POLICY "Admin full access to exec groups"
  ON public.exec_groups FOR ALL
  USING (public.is_admin_mfa()) WITH CHECK (public.is_admin_mfa());


-- ════════════════════════════════════════════════════════════════
-- ADMIN MANAGEMENT TABLES: aal2 to read as well as write
-- ════════════════════════════════════════════════════════════════
-- Reading the roster exposes every admin's email, so it gets the same
-- bar as writing. claim_admin_invite() is unaffected: it is SECURITY
-- DEFINER and bypasses RLS, so a brand-new admin can still claim an
-- invite at aal1 and then be sent to the enrollment screen.

DROP POLICY IF EXISTS "Admins can read the roster"             ON public.admins;
CREATE POLICY "Admins can read the roster"
  ON public.admins FOR SELECT
  USING (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admins can remove a non-owner admin"    ON public.admins;
CREATE POLICY "Admins can remove a non-owner admin"
  ON public.admins FOR DELETE
  USING (public.is_admin_mfa() AND is_owner = false);

DROP POLICY IF EXISTS "Admins can read invites"                ON public.admin_invites;
CREATE POLICY "Admins can read invites"
  ON public.admin_invites FOR SELECT
  USING (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admins can invite someone other than themselves" ON public.admin_invites;
CREATE POLICY "Admins can invite someone other than themselves"
  ON public.admin_invites FOR INSERT
  WITH CHECK (
    public.is_admin_mfa()
    AND lower(btrim(email)) <> lower(coalesce(auth.email(), ''))
  );

DROP POLICY IF EXISTS "Admins can revoke invites"              ON public.admin_invites;
CREATE POLICY "Admins can revoke invites"
  ON public.admin_invites FOR DELETE
  USING (public.is_admin_mfa());

DROP POLICY IF EXISTS "Admins can read the audit log"          ON public.admin_audit;
CREATE POLICY "Admins can read the audit log"
  ON public.admin_audit FOR SELECT
  USING (public.is_admin_mfa());


-- ════════════════════════════════════════════════════════════════
-- STORAGE: admin write policies across all five buckets
-- ════════════════════════════════════════════════════════════════
-- Looped rather than written out 15 times, so a bucket can never end
-- up with a mismatched bucket_id through a copy-paste slip.
-- Public read policies are left alone.

DO $$
DECLARE b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['headshots', 'sponsor-logos', 'event-images', 'gallery', 'site-images']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || ': admin upload');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || ': admin update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || ': admin delete');

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND public.is_admin_mfa())',
      b || ': admin upload', b);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND public.is_admin_mfa())',
      b || ': admin update', b);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND public.is_admin_mfa())',
      b || ': admin delete', b);
  END LOOP;
END $$;
