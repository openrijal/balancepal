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
| Component Library | **shadcn-vue** (new-york style) |
| State Management | Pinia |
| Styling | TailwindCSS v4 |
| Language | TypeScript (strict mode) |
| Backend | Supabase (Auth, Database, Storage, Real-time) |
| Database | PostgreSQL (via Supabase) |
| **ORM** | **Drizzle ORM** (schema + migrations) |
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
│   │   ├── providers/      # Vue Dependency Providers
│   │   └── layout/         # Mostly Astro
│   ├── composables/        # Vue Composables (useSupabase, useAuth)
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema definitions
│   │   ├── index.ts        # Drizzle client
│   │   └── migrations/     # Drizzle migration files
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── AppLayout.astro
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client (auth only)
│   │   └── supabase-browser.ts # SSR-compatible Browser client
│   ├── pages/              # Astro pages (SSR)
│   ├── services/           # API service layer
│   ├── stores/             # Pinia stores
│   ├── types/              # TypeScript definitions
│   └── utils/              # Pure functions
├── drizzle.config.ts       # Drizzle configuration
├── public/                 # Static assets
└── capacitor.config.ts     # Mobile config
```

## Color Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Sage | `#b3c992` | `--color-sage`, `--color-primary-400` | Primary actions, logo |
| Sky | `#98bfdc` | `--color-sky` | Calm accents |
| Mint | `#adebd7` | `--color-mint` | Fresh backgrounds |
| Rose | `#f0b1e1` | `--color-rose` | Soft highlights |
| Lavender | `#baace2` | `--color-lavender` | Gentle accents |

## Key Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro + Vue + Tailwind config |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `src/app.ts` | Pinia initialization for Vue |
| `src/db/schema.ts` | Database schema (Drizzle) |
| `src/db/index.ts` | Drizzle client instance |
| `src/components/providers/AppProvider.vue` | Root provider for Dependency Injection |
| `src/lib/supabase-browser.ts` | SSR-compatible Supabase browser client |
| `src/styles/global.css` | TailwindCSS v4 theme |

## Environment Variables

Required in `.env`:
```bash
# Supabase (Auth, Storage, Realtime)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Database (Drizzle ORM)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# App
PUBLIC_APP_URL=http://localhost:4321
```

> Get `DATABASE_URL` from Supabase: **Settings → Database → Connection String → URI**

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

# Database (Drizzle ORM)
npm run db:generate   # Generate migrations from schema
npm run db:migrate    # Apply migrations to database
npm run db:push       # Push schema directly (dev only)
npm run db:studio     # Open Drizzle Studio GUI

# Mobile (after Capacitor setup)
npm run sync          # Sync to native projects
npx cap open ios      # Open Xcode
npx cap open android  # Open Android Studio
```

## Coding Conventions

### TypeScript
- Use strict mode, no `any`. **Explicit Rule**: Do NOT use the `any` type. All variables and functions must be strictly typed.
- **Injection Keys**: Use strictly typed injection keys for Vue `provide`/`inject` patterns.
- **Provide/Inject**: Use the Provide/Inject pattern for global dependencies (Supabase, Auth) instead of prop drilling or global singletons.
- **Supabase**: Use `@supabase/ssr` for cookie-based authentication.
- Define types in `src/types/`
- Use Zod for runtime validation

### Vue Components
- Use Composition API with `<script setup lang="ts">`
- Props with TypeScript interfaces
- Emit events with typed definitions
- Use Pinia stores for shared state
- Use `useSupabase()` and `useAuth()` composables

### Astro Pages
- Always import from `BaseLayout.astro` or `AppLayout.astro`
- Use frontmatter for data fetching
- Pass data to Vue islands via props

### CSS/Tailwind
- Use theme colors (e.g., `bg-teal`, `text-cream`)
- Use component classes from `global.css` (`.btn`, `.card`, `.input`)
- Mobile-first responsive design

### Supabase & Database
- **Auth/Storage/Realtime**: Use Supabase client from `src/lib/supabase.ts`
- **Database queries**: Use Drizzle from `src/db/index.ts`
- **Schema changes**: Modify `src/db/schema.ts`, then run `npm run db:generate`
- **Migrations**: Apply with `npm run db:migrate`
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

**Phase 3: Group Management & Features** - Implementing core functional flows: Groups, Members, and Expenses.
- [x] Group Management (Create, List, Details)
- [x] Member Management (Invite, Roles)
- [ ] Expense Tracking (Create, Split, List)

**Phase 2: Authentication & Core Architecture** - Completed
- [x] Refactor Auth to SSR (Cookie-based)
- [x] Implement DI (Provide/Inject) Infrastructure
- [x] Migrate to Strict Types (No `any`)

**Phase 1: Project Integration & Setup** - Completed
- [x] Initial Project Setup
- [x] Database Schema & ORM Setup
- [x] Basic UI Components
