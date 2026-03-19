# CLAUDE.md — Western Sales Club Website

## Project

**Western Sales Club (WSC)** — student-run sales org at Western University.

- **Live site**: westernsalesclub.ca
- **Repo**: https://github.com/UWO-TSI/wsc-website
- **Deployment**: Vercel + GoDaddy domain
- **Affiliation**: TSI (Tech for Social Impact)

**Pages**: Home, About, Executive Team, Events, Partners (Sponsors), Contact, Terms, Privacy Policy
**Protected**: `/admin` — content management dashboard, Google OAuth only

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |r
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 — CSS-first `@theme` in `globals.css`, **no `tailwind.config.js`** |
| Animation | Framer Motion + GSAP + ScrollTrigger + Lenis |
| Primitives | Radix UI (NavigationMenu, Dialog, Tooltip) |
| Backend | Supabase |
| Contact | EmailJS (`service_qwpe0fl` / `template_lt8anmn`) |

---

## Design Language

- **Dark luxury, agency-meets-academic** — editorial, not startup
- **No cards or containers** — free-flowing, open, full-width layouts
- **Motion is earned** — purposeful only, never decorative
- **Minimal text** — big bold titles, short copy
- **Fully responsive** — every breakpoint, every device

| Token | Value |
| ----- | ----- |
| Gold | `#D4A843` → `var(--color-gold)` |
| Display font | Cormorant Garamond |
| Body font | DM Sans |
| Label/date font | DM Mono |

---

## Supabase — Critical Rules

### Storage Buckets

| Bucket | Purpose | DB Column |
| ------ | ------- | --------- |
| `headshots` | Executive portraits | `executives.headshot_path` |
| `sponsor-logos` | Sponsor logos | `sponsors.logo_path` |
| `gallery` | Gallery photos | `gallery_photos.image_path` |

### Tables

| Table | Visibility column |
| ----- | ----------------- |
| `events` | `published` |
| `sponsors` | `active` |
| `executives` | `visible` |
| `gallery_photos` | `visible` |

### Hard Rules

1. **Never touch `supabase/`** — production migrations, RLS, security policies
2. **Object names only in DB** — always call `getPublicUrl(bucket, objectName)` at runtime, never store full URLs
3. **`deleteContentItem` is storage-first** — delete storage file before DB row; 3-retry on DB delete. Do not change order.
4. **All Supabase queries are client-side** — keep `'use client'`, do not move to Server Components
5. **`is_admin()` RPC is the only admin check** — never replace with JWT claims or localStorage
6. **RLS stays enabled** — do not disable or bypass
7. **Anon key only in frontend** — never expose service role key client-side

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
```

---

## Skills

| Skill | When to use |
| ----- | ----------- |
| `/frontend-design` | Building or significantly modifying any UI component or page |
| `/responsive` | After any component is built; anytime layout/nav/grid work is done |
| `/animate` | Adding micro-interactions, scroll reveals, hover states |
| `/motion` | Working with Framer Motion or GSAP directly |
| `/audit` | Comprehensive accessibility, performance, responsive audit |
| `/polish` | Final alignment, spacing, and consistency pass |
| `/harden` | Error handling, empty states, edge cases (missing images, network failures) |
| `/optimize` | Bundle size, image loading, render perf — target Lighthouse 90+ |
| `/critique` | UX critique on a completed page |
