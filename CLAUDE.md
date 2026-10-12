# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Type check only
npx tsc --noEmit

# Lint
npm run lint
```

The app root is `/home/muhammad/projects/real-estate-project/frontend`. Always run commands from this directory.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind v4** — no `tailwind.config.js`. All custom tokens are defined in `@theme {}` blocks inside `app/globals.css`. Custom `--color-*` variables become `.bg-*`/`.text-*`/`.border-*` utilities automatically.
- **lucide-react v1.52** — brand icons (Instagram, Twitter, Facebook, LinkedIn) do **not** exist in this version.

## Architecture

```
app/
  layout.tsx              ← Root layout; wraps with ThemeProvider + AuthProvider
  globals.css             ← All Tailwind theme tokens (MD3 color system)
  (public)/               ← Public-facing pages (no auth guard)
  (auth)/                 ← Login, register, forgot-password
  (dashboard)/
    layout.tsx            ← Auth guard + sidebar spacer (compact-aware)
    admin/                ← Admin-only dashboard pages
    agent/                ← Agent-only dashboard pages
    profile/              ← Shared profile page

components/
  dashboard/
    Sidebar.tsx           ← Desktop + mobile sidebars; reads useTheme().prefs.compact
    DashboardHeader.tsx   ← Top bar with mobile menu trigger
    AppearancePanel.tsx   ← Shared theme-customisation UI (used by both admin and agent)
    ...other shared cards

contexts/
  AuthContext.tsx         ← useAuth() → { user, isAdmin, logout, … }
  ThemeContext.tsx        ← useTheme() → { prefs, setAccent, setSurface, setCompact, reset }

lib/
  api.ts                  ← All API calls (Axios wrapper); each domain has its own *Api object
  api-types.ts            ← TypeScript types for all API responses
```

## Design system

Colors follow the **Material Design 3** token naming convention. The key accent is `--color-secondary` (amber gold `#904d00` by default). Use `text-secondary`, `bg-secondary`, `border-secondary` etc. to pick up the user's chosen theme.

Fonts: `font-display` = Geist (headings), `font-sans` = Inter (body).

## Theme customisation

`ThemeContext` stores user preferences (`accent`, `surface`, `compact`) in `localStorage` under the key `rms-theme-v1`. On mount it overrides CSS custom properties on `document.documentElement`. Because Tailwind v4 utilities resolve to `var(--color-*)` at runtime, all theme-aware utilities update without any re-render.

- **Admin** — appearance settings are the second tab at `/admin/settings`
- **Agent** — appearance settings are at `/agent/settings`

## Route conventions

- `params` in dynamic pages → use `useParams()` in client components (Next.js 16 style)
- `notFound()` → import from `next/navigation`; capture variables before async closures to avoid TS narrowing loss

## Backend

Laravel REST API. All endpoints live in `lib/api.ts`. Auth uses Bearer tokens stored via `AuthContext`. Backend has 41 routes covering: properties, agents, clients, leads, deals, notifications, settings, profile, and stats.
