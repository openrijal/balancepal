# Balance Pal - AI Agent Guidelines

This document provides context and guidelines for AI agents (Gemini, Claude, GPT, etc.) working on this project.

## Project Overview

**App Name**: Balance Pal  
**Tagline**: "Your pal for balancing expenses"  
**Purpose**: A full-stack expense splitting application for web, iOS, and Android.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 5 (SSR mode) |
| UI Components | Vue 3 (Composition API) |
| State Management | Pinia |
| Styling | TailwindCSS v4 |
| Language | TypeScript (strict mode) |
| Backend | Supabase (Auth, Database, Storage, Real-time) |
| Database | PostgreSQL (via Supabase) |
| Mobile | Capacitor 6+ |
| Forms | VeeValidate + Zod |
| Icons | Lucide Vue |
| Dates | date-fns |

## Architecture

### Astro + Vue Strategy

| Use Astro (.astro) for | Use Vue (.vue) for |
|------------------------|---------------------|
| Static layouts | All forms |
| Non-interactive cards | Interactive modals |
| SEO-critical pages | Data tables |
| Wrapper/composition | Real-time components |
| Headers, footers | State-heavy UIs |

### Vue Hydration Directives

```astro
<!-- Critical interactive (auth forms) -->
<LoginForm client:load />

<!-- Secondary features -->
<NotificationBell client:idle />

<!-- Below-fold content -->
<ActivityFeed client:visible />

<!-- Never SSR -->
<CameraCapture client:only="vue" />
```

## Project Structure

```
balancepal/
├── src/
│   ├── app.ts              # Vue entry (Pinia setup)
│   ├── components/
│   │   ├── auth/           # Vue islands
│   │   ├── groups/         # Mix Astro + Vue
│   │   ├── expenses/       # Mostly Vue
│   │   ├── balances/       # Mix
│   │   ├── ui/             # Shared components
│   │   └── layout/         # Mostly Astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── AppLayout.astro
│   ├── lib/
│   │   └── supabase.ts     # Supabase client
│   ├── pages/              # Astro pages (SSR)
│   ├── services/           # API service layer
│   ├── stores/             # Pinia stores
│   ├── types/              # TypeScript definitions
│   └── utils/              # Pure functions
├── supabase/
│   └── migrations/         # SQL migrations
├── public/                 # Static assets
└── capacitor.config.ts     # Mobile config
```

## Color Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Teal | `#009799` | `--color-teal`, `--color-primary-500` | Primary actions |
| Cream | `#e0d6a9` | `--color-cream` | Backgrounds, accents |
| Terracotta | `#a8846b` | `--color-terracotta` | Warm accents |
| Peach | `#f1c0a9` | `--color-peach` | Highlights |
| Off-white | `#e3d9d2` | `--color-offwhite` | Light backgrounds |

## Key Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro + Vue + Tailwind config |
| `src/app.ts` | Pinia initialization for Vue |
| `src/lib/supabase.ts` | Supabase client (server & browser) |
| `src/types/index.ts` | Application TypeScript types |
| `src/types/database.ts` | Supabase database types |
| `src/styles/global.css` | TailwindCSS v4 theme |

## Environment Variables

Required in `.env`:
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
PUBLIC_APP_URL=http://localhost:4321
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `groups` | Expense groups |
| `group_members` | Membership + roles |
| `expenses` | Expense records |
| `expense_splits` | How expenses are split |
| `receipts` | Receipt images |
| `settlements` | Payment records |
| `notifications` | User notifications |
| `invitations` | Group invitations |

## Development Commands

```bash
# Development
npm run dev           # Start dev server (port 4321)

# Build & Test
npm run build         # Production build
npm run preview       # Preview production build

# Mobile (after Capacitor setup)
npm run sync          # Sync to native projects
npx cap open ios      # Open Xcode
npx cap open android  # Open Android Studio
```

## Coding Conventions

### TypeScript
- Use strict mode, no `any`
- Define types in `src/types/`
- Use Zod for runtime validation

### Vue Components
- Use Composition API with `<script setup lang="ts">`
- Props with TypeScript interfaces
- Emit events with typed definitions
- Use Pinia stores for shared state

### Astro Pages
- Always import from `BaseLayout.astro` or `AppLayout.astro`
- Use frontmatter for data fetching
- Pass data to Vue islands via props

### CSS/Tailwind
- Use theme colors (e.g., `bg-teal`, `text-cream`)
- Use component classes from `global.css` (`.btn`, `.card`, `.input`)
- Mobile-first responsive design

### Supabase
- Use typed client from `src/lib/supabase.ts`
- Server-side: use `supabase` export
- Client-side: use `createBrowserClient()`
- Always handle errors and loading states

## Mobile-First Priority

This is a **mobile-first** application. Design decisions should prioritize:
1. Touch-friendly UI (44px+ tap targets)
2. Bottom navigation for mobile
3. Safe area insets (notch, home indicator)
4. Offline-capable architecture
5. Camera/photo library integration for receipts

## Security Checklist

- ✅ Row Level Security (RLS) on all tables
- ✅ File upload validation (type, size)
- ✅ Input sanitization (XSS prevention)
- ✅ HTTPS only in production
- ✅ Secure token storage

## Current Phase

**Phase 1: Foundation** - Setting up project infrastructure, database schema, and base components.

See `LEARNINGS.gemini.md` for task history and lessons learned.
