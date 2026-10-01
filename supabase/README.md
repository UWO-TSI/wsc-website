# Western Sales Club Content Management System

## Overview

The __Supabase__ backend powers the **Western Sales Club (WSC) website** as a small, secure **content management system**. It provides:

- **Database**: Events, sponsors, executive team, gallery content, executive roles, headline statistics, and every editable string on the public site, with visibility controls so only approved items appear.
- **Authentication**: Google OAuth for admin sign-in, plus a mandatory TOTP second factor. The public site does not require login.
- **Admin model**: Access is controlled by an **allowlist** that admins manage themselves. Membership is granted by invite and **expires automatically after ten months**. One permanent **owner** row cannot be removed through the app.
- **Storage**: Public buckets for headshots, sponsor logos, event images, gallery photos, and editable site imagery. Files are referenced by object name in the DB; URLs are built at runtime.

The frontend is treated as **untrusted**. All enforcement (who can read what, who can write) happens **server-side** in Supabase via **SQL grants**, **Row Level Security (RLS)**, and the **hardened `is_admin()`** function. No sensitive keys or admin logic live in the client.

---

## Database Structure

### Tables

| Table | Purpose | Visibility column |
|------|---------|--------------------|
| **events** | Upcoming and past club events | `published` (boolean) |
| **sponsors** | Sponsor entries | `active` (boolean) |
| **executives** | Executive team members | `visible` (boolean) |
| **gallery_photos** | About-page gallery | `visible` (boolean) |
| **exec_groups** | Executive role tiers (President, VP, …) | `visible` (defaults **true**) |
| **site_stats** | Headline figures on the home page | `visible` (boolean) |
| **site_content** | Every editable string on the site | *none, see below* |

Access-control tables (never public):

| Table | Purpose |
|------|---------|
| **admins** | Allowlist, with `expires_at`, `is_owner` |
| **admin_invites** | Pending invites keyed by email |
| **admin_audit** | Append-only log of admin changes |

- **Visibility columns** default to `false` (safe-by-default)
  - New or draft rows are hidden from the public until an admin flips the flag.
  - **Two documented exceptions.** `exec_groups.visible` defaults to `true`, because a hidden role silently drops its members from the team page, which reads as data loss rather than a draft. `site_content` has no visibility column at all, because hiding a page title would render a blank page; its rows are public by definition.
- **`site_content` keys are structural.** They are owned by the code and mirrored in `src/lib/site-content-defaults.ts`. Admins are granted `SELECT, UPDATE` only: they change wording, they cannot create or delete keys. A missing key falls back to the compiled-in default, so an outage never blanks the site.
- **`executives.group` is a foreign key** to `exec_groups(slug)`, `ON UPDATE CASCADE ON DELETE RESTRICT`. It used to be a `CHECK` constraint, which meant adding a role required a migration. Renaming a role slug now follows through to its members, and a role with members cannot be deleted.
- **Asset columns** (`image_path`, `logo_path`, `headshot_path`) store only the **storage object name** (e.g. `a1b2c3d4.webp`), not full URLs
  - Public URLs are built with `getPublicUrl(bucket, name)` at runtime.
- **Triggers** keep `updated_at` in sync on `events`, `sponsors`, and `executives`.

### Storage buckets

Five **public** buckets (readable by anyone via CDN URL):

- **headshots**: Executive headshots  
- **sponsor-logos**: Sponsor logos  
- **event-images**: Event banner/promo images  
- **gallery**: About-page gallery photos  
- **site-images**: Editable hero and section backgrounds  

Write access to each bucket is restricted by storage RLS to admins **with a verified second factor** (see Security).

### Migrations

Migrations in `supabase/migrations/` are applied in order:

1. `20260213000001_schema.sql`: Table definitions  
2. `20260213000002_security.sql`: `is_admin()`, RLS, GRANT/REVOKE  
3. `20260213000003_storage_policies.sql`: Buckets and storage policies  
4. `20260213000004_anon_readonly_content_tables.sql`: Anon read-only lock  
5. `20260213000005_revoke_anon_extra_privileges.sql`: Strip anon of REFERENCES/TRIGGER/TRUNCATE  
6. `20260929000001_site_content.sql`: `site_content`, `site_stats`, `site-images` bucket  
7. `20260929000002_site_content_seed.sql`: Seed every editable string with today's copy  
8. `20260929000003_exec_groups.sql`: Role lookup table, drops the `CHECK` on `executives.group`  
9. `20260929000004_admin_lifecycle.sql`: Ten-month TTL, owner row, invites, audit, self-service roster  
10. `20260929000005_admin_mfa_aal2.sql`: Require a verified second factor for every admin write  

---

## Security

Security is designed in **three layers**. Even if one layer is misconfigured, the others limit damage. The frontend never receives the service role key; only the anon key is used, and it is constrained by these layers.

### Principles

- **Server-side enforcement**: Grants and RLS define what each role can do. The client cannot bypass them.
- **Least privilege**: Anonymous users can only read rows that are explicitly visible (`published` / `active` / `visible`). They have no INSERT/UPDATE/DELETE on __ANY__ table.
- **Second factor required to write**: Every admin write policy is gated on `is_admin_mfa()`, which requires the session to have reached `aal2` by passing a TOTP challenge. An OAuth-only session can read the public site and nothing else.
- **Time-limited access**: Non-owner admins expire ten months after their invite is claimed. Expiry is evaluated inside `is_admin()` on every request, so there is no cleanup job to forget to run.
- **No admin data in the client**: Admin status is not stored in localStorage or cookies. The app calls the `is_admin()` RPC and reacts to the boolean.

**Changed in September 2026.** The allowlist used to be completely invisible to the API (`REVOKE ALL` plus RLS with no policies). Self-service user management requires admins to read and modify the roster, so `public.admins` is now readable by any admin at `aal2`, and every admin can see every other admin's email. This was a deliberate trade for letting the club manage its own turnover without a developer. The compensating controls are: no `INSERT` or `UPDATE` grant on the table at all, a protected owner row, mandatory 2FA, and an append-only audit log.

### Layer 1: SQL GRANT / REVOKE

| Table | `anon` | `authenticated` |
|------|--------|-----------------|
| Content tables (`events`, `sponsors`, `executives`, `gallery_photos`, `site_stats`, `exec_groups`) | SELECT only | SELECT, INSERT, UPDATE, DELETE |
| `site_content` | SELECT only | SELECT, **UPDATE only** |
| `admins` | REVOKE ALL | **SELECT, DELETE only** |
| `admin_invites` | REVOKE ALL | SELECT, INSERT, DELETE |
| `admin_audit` | REVOKE ALL | SELECT only |

Three grants here are doing real work, not decoration:

- **No INSERT or UPDATE on `admins`.** The only write path in is `claim_admin_invite()`, a SECURITY DEFINER function. An admin therefore cannot extend anyone's expiry, or their own, by writing to the table. The clock only moves when a fresh invite is claimed.
- **No INSERT or DELETE on `site_content`.** Admins edit wording; they cannot delete a key and blank a section of the site.
- **No INSERT, UPDATE or DELETE on `admin_audit`.** It is written only from inside SECURITY DEFINER triggers, which bypass RLS. The log cannot be doctored through the API.

At the SQL level, unauthenticated clients cannot write anything. Authenticated clients can issue writes, but those are then filtered by RLS (Layer 2), which additionally requires a verified second factor.

### Layer 2: Row Level Security (RLS)

- **Content tables**: RLS is enabled. Each has:
  - A **public SELECT** policy filtered by the visibility column (`published`, `active`, or `visible`). `site_content` uses `USING (true)` instead, since its rows are the page copy itself.
  - An **admin FOR ALL** policy gated by `public.is_admin_mfa()` (both `USING` and `WITH CHECK`).
- **Allowlist**: SELECT and DELETE policies, both gated by `is_admin_mfa()`. The DELETE policy additionally requires `is_owner = false`, so the owner row cannot be removed through the API by anyone, including the owner. Removing it takes the SQL editor and the service role.
- **Invites**: SELECT, INSERT and DELETE gated by `is_admin_mfa()`. The INSERT policy also requires `lower(email) <> lower(auth.email())`: **self-invitation is blocked**, so nobody can renew their own ten months. Renewal has to come from another admin, which is what makes the limit mean anything. The owner never expires, so this can never lock the club out entirely.
- **Audit log**: SELECT only. Writes happen inside SECURITY DEFINER functions owned by `postgres`, which bypass RLS.

Anonymous users see only visible rows. Admins see the same, and can change rows only once their session has passed a TOTP challenge.

### Layer 3: Application guards

- **AdminAuthProvider** runs three checks in order: `claim_admin_invite()`, then `is_admin()`, then the session's assurance level. No admin UI renders until all three pass.
- The claim has to come first, because a first-time admin is not on the allowlist until their invite is converted into an `admins` row.
- Non-admin Google accounts are signed out when they hit the admin area, so the UI does not suggest privileges the backend would deny anyway.
- A recognised admin without a verified second factor is sent to the enrollment screen rather than the dashboard.

These guards are defense-in-depth only; Layers 1 and 2 remain the enforcement.

### Two-factor authentication

Google OAuth already means Google performs the authentication, so an admin with 2FA on their Google account is already signing in with 2FA. What the app cannot do is *verify* that they turned it on. So the second factor is enforced here instead.

- **TOTP, RFC 6238.** Supabase generates a random per-user secret, stored in `auth.mfa_factors`, and returns it as an `otpauth://` QR code. The authenticator app derives a 6-digit code from that secret plus the current 30-second window, entirely offline.
- **No third-party service, no SMS, no email.** Any standard app works: Google Authenticator, Microsoft Authenticator, 1Password, Apple Passwords. TOTP is included in Supabase Auth at no extra cost; phone MFA is the paid add-on and is not used.
- **Enforced in the database, not the UI.** Passing a challenge raises the session to `aal2`, which lands in the JWT as the `aal` claim. Every admin policy calls `is_admin_mfa()`, which checks that claim. A stolen `aal1` token cannot write anything.
- **Recovery.** Supabase's TOTP has no built-in backup codes. If someone loses their phone, the owner removes the factor from the Supabase dashboard (Authentication → Users → the user → remove their MFA factor) and they enrol again on next sign-in.

**To turn enforcement off** if enrollment proves too much friction, redefine one function. No policy churn, no migration rewrite:

```sql
CREATE OR REPLACE FUNCTION public.is_admin_mfa()
RETURNS BOOLEAN LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT public.is_admin(); $$;
```

### The `is_admin()` and `is_admin_mfa()` RPCs

Two functions, deliberately separate.

**`is_admin()`**: identity and expiry only:

- **Exposed as RPC** so the frontend can call it (e.g. from `AdminAuthProvider`).
- **Returns only a boolean**: whether the caller is on the allowlist and not expired. No rows, column values, or error details. No parameters, since parameters could be used to probe the table.
- **Answerable at `aal1` on purpose.** A new admin who has not enrolled a factor yet still has to be recognised in order to reach the enrollment screen. Gating this on `aal2` would deadlock the flow.
- **Implemented securely:**
  - `SECURITY DEFINER`: runs with the owner's privileges so it can read `public.admins`.
  - `SET search_path = public`: avoids schema injection.
  - Explicit `public.admins` and `auth.uid()`: exact comparison by UUID.
  - Owned by `postgres`; `REVOKE EXECUTE FROM PUBLIC`; `GRANT EXECUTE TO authenticated, anon` (anon needs it so RLS evaluation returns false rather than throwing).
  - Expiry: `is_owner OR (expires_at IS NOT NULL AND expires_at > now())`. **Fails closed**: a non-owner with a NULL `expires_at` gets nothing.

**`is_admin_mfa()`**: `is_admin()` AND `auth.jwt() ->> 'aal' = 'aal2'`. This is the one every write policy uses.

**`claim_admin_invite()`**: the only write path into `public.admins`:

- SECURITY DEFINER, VOLATILE, no parameters. It reads `auth.email()` and only ever acts on the caller's own verified email claim, so the invite list cannot be probed.
- Finds a live unused invite for that email, inserts or refreshes the `admins` row with a ten-month expiry, marks the invite used, and writes an audit entry.
- The `ON CONFLICT DO UPDATE` carries `WHERE admins.is_owner = false`, so claiming an invite can never overwrite the owner row.
- Returns a boolean: whether the caller gained or renewed access.

### Storage

- Buckets are **public read** so the site can show images via CDN URLs without signed URLs.
- **Write (INSERT/UPDATE/DELETE)** on `storage.objects` is gated by policies that require `bucket_id = '<name>'` and `public.is_admin_mfa()`.
- Object names in the DB are opaque (e.g. UUID-based). Avoid storing original filenames or user identifiers in object paths. Deleted files may linger in CDN caches briefly; that is accepted for this use case.

### Rules (do not break)

- Service role key stays out of frontend code and frontend-visible env.
- RLS stays enabled on all tables.
- No INSERT/UPDATE/DELETE for `anon` on any table.
- `is_admin()`: no parameters, boolean only; keep SECURITY DEFINER and search_path unless reviewed.
- **Never grant INSERT or UPDATE on `public.admins`.** That grant is what stops an admin from extending their own expiry. The only write path is `claim_admin_invite()`.
- **Never drop the `is_owner = false` condition** from the admins DELETE policy, or the `admins_single_owner_idx` unique index.
- **Never grant INSERT/UPDATE/DELETE on `admin_audit`.** It stays append-only via triggers.
- **Never grant INSERT or DELETE on `site_content`.** Keys are structural and owned by the code.
- Admin status is not stored in localStorage or cookies.
- New tables: enable RLS and follow the "Adding a new table" steps below.

### Adding a new table

1. Create the table with a visibility column (e.g. `published BOOLEAN DEFAULT false`).
2. `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
3. Add a public SELECT policy filtered by the visibility column.
4. Add an admin FOR ALL policy using `public.is_admin_mfa()` (USING and WITH CHECK). Use `is_admin_mfa()`, not `is_admin()`: the latter is identity only and does not require a second factor.
5. `GRANT SELECT` to `anon`; `GRANT SELECT, INSERT, UPDATE, DELETE` to `authenticated`.
6. `REVOKE INSERT, UPDATE, DELETE` (and REFERENCES, TRIGGER, TRUNCATE if needed) from `anon`.
7. If the table has a `*_path` column for storage, add it to `supabase/scripts/cleanup-orphans.sql`.
8. Run `supabase/scripts/verify-security.sql`; all checks must pass.
9. Update the verify script's table lists (CHECK 1, 3, 7) to include the new table.

### Adding a new editable string

1. Add the key and its default to `SITE_CONTENT_DEFAULTS` in `src/lib/site-content-defaults.ts`.
2. Add a seed migration inserting the row with `ON CONFLICT (key) DO NOTHING`.
3. Use it in a component via `useSiteContent().text('your.key')`.

Admins cannot create keys, so step 2 is not optional: without the row, the site silently renders the compiled-in default and the field never appears in the dashboard.

### Admin management

**This is now self-service.** Any admin can add or remove any other admin from the dashboard's Admins tab. No SQL, no developer. Admins are still identified by **user_id** (UUID from `auth.users`); the email column is real data now (invites match on it) but authorization is still by UUID.

**How access works:**

1. An existing admin enters an email address in the Admins tab, which writes a row to `admin_invites` (valid 14 days).
2. Nothing is emailed. The inviter tells the person to go to `/admin` and sign in with that exact Google account.
3. On first sign-in, `claim_admin_invite()` converts the invite into an `admins` row with `expires_at = now() + 10 months`.
4. They enrol an authenticator app, and they are in.

**Rules the database enforces, not the UI:**

- **Ten months, always.** A trigger hard-sets `expires_at` and `is_owner = false` on insert, whatever the client sends.
- **No self-renewal.** The invite INSERT policy rejects an admin inviting their own address. Someone else has to extend you.
- **No renewal action at all.** An expiring admin is simply re-invited, which resets the clock through the normal flow.
- **The owner is permanent and undeletable through the app.** Exactly one owner exists, enforced by a unique partial index.

**Removing an admin:** the Admins tab, or `DELETE FROM public.admins WHERE user_id = '<uuid>'` in the SQL editor.

**Changing the owner** requires the SQL editor and the service role, by design:

```sql
BEGIN;
UPDATE public.admins SET is_owner = false, expires_at = now() + interval '10 months'
  WHERE is_owner;
UPDATE public.admins SET is_owner = true, expires_at = NULL
  WHERE user_id = '<new-owner-uuid>';
COMMIT;
```

Both statements must run in one transaction: the unique index allows only one owner at a time.

### Verification and maintenance

- **After schema or policy changes:** run `supabase/scripts/verify-security.sql`; all checks must pass.
- **Orphaned storage:** run `supabase/scripts/cleanup-orphans.sql` in dry-run first; review before deletes.
- **Periodically:** confirm RLS enabled on all tables, `.env` not in git, Realtime off if unused.

### Operational notes

- **ErrorBoundary** in the app catches render-time errors only. Supabase/async errors are handled in data hooks and `classifyError()`, not by the boundary.
- **Transferring project:** Dashboard → Settings → General → Transfer project.
- **Rotating the anon key:** Dashboard → Settings → API → Regenerate anon key; update `VITE_SUPABASE_ANON_KEY` and redeploy.
