# QX-Scraper — Frontend

Next.js 14 (App Router) web UI for the QX-Scraper platform. It has two
halves:

- **Public job feed** — searchable, filterable list of scraped jobs and a
  detail view with the full description and an "Apply / View source" link.
- **Admin area** (super-admin login) — create/edit *search configs* with
  AI auto-fill, enable/disable them, trigger runs manually, and watch run
  history with live stats.

The UI is mobile-first but fully responsive (tablet + desktop layouts with a
sidebar) and ships with a **dark mode** that respects the system preference.

- Talks to the [Go backend](../backend/README.md) (`http://localhost:8080` by default)
- No database of its own — 100% API-driven, no server-side data fetching

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Pages & routing](#pages--routing)
- [UI: dark mode](#ui-dark-mode)
- [UI: responsive layout](#ui-responsive-layout)
- [API integration & auth](#api-integration--auth)
- [Production build](#production-build)
- [Troubleshooting](#troubleshooting)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js **14.2** (App Router) |
| Language | TypeScript 5.5 (strict `tsc` config) |
| Styling | Tailwind CSS **3.4** (class-based dark mode, CSS-variable theme tokens) |
| State | React hooks only — no state library |
| Extras | [`i18n-iso-countries`](https://www.npmjs.com/package/i18n-iso-countries) for the full-world country picker |

## Prerequisites

- **Node.js 18.17+** (Next 14 requirement)
- **The backend running** — see [backend README](../backend/README.md#quick-start).
  All pages fetch from it at runtime; the app is useless without it.

## Quick start

```powershell
cd frontend
npm install

# Point the app at the backend (defaults to http://localhost:8080)
Copy-Item .env.example .env.local   # or edit .env.local if it already exists

npm run dev
# ➜ http://localhost:3000
```

`npm run dev` hot-reloads — refresh the browser after edits. Keep the backend
running on `:8080` (or update `.env.local` to wherever it lives).

## Configuration

`.env.local` (not committed) — a single variable:

```dotenv
# Base URL of the Go backend (backend listens on :8080 by default)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | no | `http://localhost:8080` | Backend base URL. Must be reachable from the **browser** |

> `NEXT_PUBLIC_*` values are inlined at build time — set them before
> `next build` for production.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (http://localhost:3000) |
| `npm run build` | Production build to `.next/` |
| `npm run start` | Serve the production build |
| `npm run lint` | `next lint` (interactive ESLint setup on first run) |
| `npx tsc --noEmit` | Type-check without emitting (CI-friendly) |

## Project structure

```
frontend/
├── app/
│   ├── layout.tsx               # root layout: sidebar shell + dark-mode bootstrap script
│   ├── globals.css              # theme tokens (light/dark) + glass/neumorphic components
│   ├── login/page.tsx           # unified sign-in (whole app is private)
│   ├── page.tsx                 # job feed (search, filters, grid) — requires login
│   ├── jobs/[id]/page.tsx       # job detail (sticky summary + description)
│   └── admin/
│       ├── login/page.tsx       # legacy redirect → /login
│       ├── page.tsx             # dashboard: configs grid + recent runs (managers)
│       ├── users/page.tsx       # user management (super admin only)
│       ├── profile/page.tsx     # own account: email/name + password change
│       └── configs/
│           ├── new/page.tsx     # create a search config
│           └── [id]/edit/page.tsx
├── components/
│   ├── BottomNav.tsx            # floating mobile nav pill (hidden on desktop)
│   ├── Sidebar.tsx              # fixed desktop sidebar (lg+), permission-aware items
│   ├── ThemeToggle.tsx          # light/dark switch
│   ├── ConfigForm.tsx           # shared create/edit form (+ AI auto-fill, country picker)
│   ├── JobCard.tsx              # feed card
│   ├── JobSkeleton.tsx          # loading shimmer
│   └── icons.tsx                # inline SVG icon set
├── lib/
│   ├── api.ts                   # typed fetch client (adds Bearer token to all calls)
│   └── format.ts                # timeAgo / labelize / work-mode tint helpers
└── tailwind.config.ts           # CSS-variable palette, neumorphic shadows, animations
```

## Pages & routing

Everything sits behind the login — visiting any route without a token
redirects to `/login` (and expired tokens are kicked back there too).

| Route | Access | Description |
|---|---|---|
| `/login` | — | Email/password sign-in; stores JWT (`qx_token`) + account (`qx_admin`) in `localStorage` |
| `/` | any user | Job feed — debounced search, work-mode/employment filter chips, paginated "Load more" |
| `/jobs/[id]` | any user | Full job: meta card + description; Apply link opens `application_url` (or `source_url`) |
| `/admin` | `can_manage_configs` | Dashboard: search-config cards (status dot, keywords, Run now / Enable / Delete) + recent runs |
| `/admin/configs/new` | `can_manage_configs` | Create a config — "Auto-fill with AI" fills keywords, excludes, locations, lookback, cron from a job type |
| `/admin/configs/[id]/edit` | `can_manage_configs` | Edit an existing config (same form) |
| `/admin/users` | super admin | Create users by email (backend generates + emails the password), toggle config access, reset passwords, delete |
| `/admin/profile` | any user | Change own name/email and password (use after logging in with a generated password) |

**Permission gating:** the cached account (`getStoredAdmin()`) drives UI
visibility — the Admin gauge/nav item and config controls only render for
`can_manage_configs` users; the Users page/entry only for `super_admin`.
View-only users see just the feed and their account page. Server-side the
same rules are enforced per request (fresh DB check), so a revoked user is
blocked on their next API call regardless of the UI.

## UI: dark mode

Implementation is class-based with zero flash:

- **Tokens:** every palette color is a CSS variable (`--c-base`, `--c-ink`,
  `--c-muted`, `--c-accent`, …) consumed by Tailwind as
  `rgb(var(--c-x) / <alpha-value>)`, so alpha utilities (`bg-accent/15`) work
  in both themes. Neumorphic shadows (`--neu-raised`, `--neu-inset`, …) are
  variables too, so raised/inset cards re-tint on dark surfaces.
- **Switching:** `.dark` on `<html>`. An inline bootstrap script in
  `app/layout.tsx` applies it **before first paint** from
  `localStorage("qx_theme")`, falling back to `prefers-color-scheme` — no
  white flash, no layout shift.
- **Toggle:** `ThemeToggle` (moon ⇄ sun) sits in the feed header, job detail,
  admin header, and the desktop sidebar. The visible icon is pure CSS
  (`dark:hidden` / `hidden dark:flex`) so there is no hydration mismatch.
- Components (`.glass`, `.glass-chip`, `.btn-ghost`) carry `dark:` variants:
  white milk in light mode → smoked glass (`white/6`) on a `#0f1118` canvas.

To change the palette, edit the `:root` / `.dark` blocks in
`app/globals.css` — nothing else needs touching.

## UI: responsive layout

Mobile-first, one breakpoint ladder:

| Width | Layout |
|---|---|
| `< sm` (640) | Single-column feed, **floating bottom-nav pill**, stacked config cards, wrapping action buttons |
| `≥ sm` | Feed becomes a **2-column card grid** |
| `≥ md` (768) | Wider containers (`max-w-4xl`), admin config cards in a **2-column grid**, full email chip |
| `≥ lg` (1024) | **Fixed glass sidebar** (Jobs / Admin / dark-mode switch) appears, bottom nav hides, content offset by `lg:pl-64`; job detail becomes **sticky summary + scrolling description** |
| `≥ xl` (1280) | Feed grows to a **3-column grid** (`max-w-6xl`) |

Grid cards use `min-w-0` + `truncate` so long titles/companies ellipsize
instead of stretching cards; button rows wrap on very narrow phones instead
of overflowing.

## API integration & auth

All requests go through `lib/api.ts` (`API_BASE` from `NEXT_PUBLIC_API_URL`):

- **Public:** only `POST /api/auth/login` and `GET /health` — the job feed,
  sources and every admin endpoint require a Bearer token
- **Auth:** `POST /api/auth/login` → JWT stored in `localStorage("qx_token")`
  plus the account JSON in `localStorage("qx_admin")` (drives permission
  gating); `GET /api/auth/me` refreshes both
- **Any user:** `GET /api/jobs`, `GET /api/jobs/{id}`, `GET /api/sources`,
  `PUT /api/admin/profile` (own email/name), `PUT /api/admin/profile/password`
- **Managers** (`can_manage_configs`): CRUD on `/api/admin/search-configs…`,
  `…/run`, `…/enable`, `…/disable`, run history, and `…/enrich` (AI profile)
- **Super admin:** `…/api/admin/users` — create (backend generates + emails
  the password), edit, permission toggle, reset password, delete

Behavior: any `401 / unauthorized` response clears the session and redirects
to `/login`; every page also checks for a token on mount. Fetches use
`cache: "no-store"`; the feed aborts superseded requests when filters change
quickly.

Backend CORS is open, so no proxying is needed — the browser calls `:8080`
directly.

## Production build

```powershell
npm run build
npm run start        # serves on http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` **before** building so the inlined base URL points
at your deployed backend (the backend must allow the frontend's origin — its
CORS is currently wide open).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Feed shows "Couldn't load jobs" | Backend not running / wrong URL — check `NEXT_PUBLIC_API_URL` and `curl http://localhost:8080/health` |
| Login fails immediately | Backend seeded admin differs from what you're typing — see [super-admin seeding](../backend/README.md#super-admin-seeding) |
| Kicked back to login after a while | JWT expired (24 h) — log in again |
| No sources in the config form | Backend has no Apify actors registered — see [scraping sources](../backend/README.md#scraping-sources-apify) |
| AI auto-fill does nothing / errors | Backend has no `OPENROUTER_API_KEY`, or see backend logs |
| Theme resets on another device | Stored per-browser in `localStorage`; first visit uses the OS preference |
