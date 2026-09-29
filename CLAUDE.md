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

## Design System — read before ANY UI work

The site is being rebuilt on **WSC Floor**, which lives in `design-system/`.

| File | What |
| ---- | ---- |
| `design-system/floor.html` | The live visual reference. **Open it in a browser first.** Palette in both themes, type, corners, elevation, all twelve motion sequences running, a card per component. |
| `design-system/README.md` | The five rules, colour, type, corners, elevation, layout, and the protocol for extending the system. |
| `design-system/tokens.css` | What the app consumes. Replaces the `@theme` block in `src/app/globals.css`. |
| `design-system/motion.md` | The twelve named motion sequences with code. |
| `design-system/components.md` | Component inventory, mapped to the files in `src/components/`. |
| `design-system/adoption.md` | **Start here for code.** What the app already provides: token utilities, the primitives in `src/components/ui/`, how to run a sequence, and the data decisions taken during adoption. |

**Never design a component freehand.** When something you need is not in the system: compose it from existing components, spend only existing tokens, reuse one of the twelve sequences, then add its card to `floor.html` in the same change. Do not invent a colour, a radius, a duration, or a one-off animation. Do not add a border to separate anything.

Headline rules: no borders anywhere (the focus ring is the only outline), the accent flips with the theme (velvet in Showroom, gold in Afterhours), four type roles only, every title is Archivo all-caps, and motion arrives and stops.

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 — CSS-first `@theme` in `globals.css`, **no `tailwind.config.js`** |
| Animation | Framer Motion + GSAP + ScrollTrigger + Lenis |
| Primitives | Radix UI (NavigationMenu, Dialog, Tooltip) |
| Backend | Supabase |
| Contact | EmailJS (`service_qwpe0fl` / `template_lt8anmn`) |

---

## Design Language

WSC Floor. The full rules are in `design-system/README.md`; this is the enforceable summary.

- **Two themes, shipped together.** Showroom is white with a deep velvet accent, Afterhours is
  near-black with gold. The accent flips with the theme, so components reference `--accent`,
  `--accent-ink` and `--on-accent`, never a literal purple or gold. `--velvet` and `--gold` are
  the two fixed marks: the Western affiliation lockup and sponsor tiers.
- **There are no borders.** Things are divided by a change in surface tone, by the gap between
  them, and by shadow. The focus ring is the only outline and is never removed.
- **Four type roles, nothing between them.** Title, subtitle, body, label. Every title is
  Archivo, all caps. A page of medium-sized headings is the failure mode this system prevents.
- **Slabs are the divider.** A page is a stack of slabs on `--page`, inset by the page gutter,
  separated by 24px of visible page ground. Adjacent slabs never share a tone, one loud slab
  per page, and the hero plus at least one section per page sit bare.
- **Motion arrives and stops.** Twelve named sequences, no thirteenth. Everything uses
  `--e-enter` unless it is leaving. Nothing floats, bounces or loops except the marquee.
- **Legible at rest.** Nothing is parked at `opacity: 0` waiting on an observer.

| Role | Face | Job |
| ---- | ---- | --- |
| `--f-display` | Archivo 800 to 900 | Every title, always uppercase |
| `--f-text` | Instrument Sans | Running copy and UI labels |
| `--f-data` | Geist Mono | Dates, counts, field labels, eyebrows |

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
