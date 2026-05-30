# Axion Labs — Phase 3 Design Spec: Auth + Accounts + Plan Gating

**Date:** 2026-05-30
**Status:** Approved for planning
**Depends on:** Phase 1 (foundation, i18n, routing, `/login` + `/dashboard` stubs) and Phase 2 (lab catalog + sim registry to gate).

---

## 1. Goal

Add real user accounts to Axion Labs: sign in with **Google or email/password**, a **profile + subscription plan** stored in Supabase Postgres (with RLS), **favorite simulations** per user, and **plan gating** on the lab (Free opens the first 3 sims; Standard/Premium/Admin open all). Because a Supabase project cannot be provisioned in this build session, ship a **real Supabase integration plus a localStorage demo fallback** so the app is fully usable today and goes live the moment credentials + the migration are added.

### Decisions (locked)
- **Backend:** real `@supabase/supabase-js` integration, wired via `.env`; a `demoClient` (localStorage) takes over when `VITE_SUPABASE_URL` is unset, so the app is clickable with no backend.
- **Auth methods:** Google OAuth + email/password.
- **Data + gating:** `profiles` (incl. plan) + `favorites`; Free/anonymous can open the **first 3 built sims**, Standard/Premium/Admin open all.
- **Upgrade:** **demo plan-switch** — instantly updates the plan in the DB, clearly labeled "demo, no charge". Real payments are a later sub-project.

---

## 2. Architecture

**One `AuthProvider` (React context) over a pluggable `AuthClient` interface, with two implementations** (`supabaseClient`, `demoClient`). A factory selects the implementation at startup based on env presence. App code only ever uses the context, so it is backend-agnostic and testable by injecting the demo client.

```
.env.example                          # VITE_SUPABASE_URL=, VITE_SUPABASE_ANON_KEY=
supabase/
├─ migrations/0001_init.sql           # profiles + favorites tables, RLS, signup trigger
└─ SETUP.md                           # create project, enable Google, run migration, paste .env
src/auth/
├─ types.ts                           # Plan, Profile, Favorite, AuthUser, AuthClient, AuthChangeHandler
├─ client.ts                          # getAuthClient(); export isDemo (env-based)
├─ supabaseClient.ts                  # real impl (createClient, detectSessionInUrl)
├─ demoClient.ts                      # localStorage impl
├─ AuthProvider.tsx                   # context: { user, profile, favorites, loading, isDemo, + methods }
├─ useAuth.ts                         # hook -> context
├─ gating.ts                          # FREE_SIM_LIMIT, canAccessSim(plan, simId) — locked = !canAccessSim
└─ RequireAuth.tsx                    # route guard -> redirect /login?from=...
src/routes/
├─ LoginPage.tsx                      # /login: Google + email/password (sign-in/sign-up), demo banner
└─ DashboardPage.tsx                  # /dashboard (guarded): profile, plan + demo switch, favorites, sign out
src/components/
├─ FavoriteButton.tsx                 # star toggle (cards + detail)
├─ PlanBadge.tsx                      # plan pill
└─ layout/AccountMenu.tsx             # avatar dropdown in Navbar when signed in
src/i18n/locales/{mn,en,zh}/auth.json # new 'auth' namespace
```

Modified: `Navbar.tsx` (account menu vs Sign-In CTAs), `LabCatalog.tsx` (lock + FavoriteButton), `SimDetailPage.tsx` (upgrade wall + FavoriteButton), `Pricing.tsx` (Choose plan → demo switch / login), `App.tsx` (real `/login` + `/dashboard` routes, wrap tree in `AuthProvider`), `main.tsx` (mount `AuthProvider`), `keyparity.test.ts` (+`auth`).

### 2.1 `AuthClient` interface (`types.ts`)
```ts
export type Plan = 'free' | 'standard' | 'premium' | 'admin'
export interface AuthUser { id: string; email: string | null }
export interface Profile { id: string; displayName: string; avatarUrl: string | null; locale: string; plan: Plan; trialEndsAt: string | null }
export interface Favorite { simId: string; createdAt: string }
export type AuthChangeHandler = (user: AuthUser | null) => void

export interface AuthClient {
  getSession(): Promise<AuthUser | null>
  onAuthChange(cb: AuthChangeHandler): () => void        // returns unsubscribe
  signInWithGoogle(): Promise<void>
  signInWithPassword(email: string, password: string): Promise<void>
  signUp(email: string, password: string, displayName: string): Promise<void>
  signOut(): Promise<void>
  getProfile(userId: string): Promise<Profile>
  updateProfile(patch: Partial<Pick<Profile, 'displayName' | 'locale'>>): Promise<Profile>
  setPlan(plan: Plan): Promise<Profile>                  // demo plan-switch
  listFavorites(): Promise<Favorite[]>
  toggleFavorite(simId: string): Promise<Favorite[]>     // returns the new list
}
```

### 2.2 Client selection (`client.ts`)
`isDemo = !import.meta.env.VITE_SUPABASE_URL`. `getAuthClient()` returns `demoClient` when `isDemo`, else `supabaseClient`. A single module-level singleton.

### 2.3 Provider data flow (`AuthProvider.tsx`)
On mount: `getSession()` → if a user exists, load `getProfile` + `listFavorites`; subscribe via `onAuthChange` (reload profile/favorites on sign-in, clear on sign-out). Exposes `{ user, profile, favorites, loading, isDemo, signInWithGoogle, signInWithPassword, signUp, signOut, updateProfile, setPlan, toggleFavorite }`. Favorites + profile are kept in context state and updated optimistically by the mutation methods.

### 2.4 Gating (`gating.ts`)
```ts
import { SIM_MODULES } from '@/lab/registry'
export const FREE_SIM_LIMIT = 3
const orderedBuiltIds = (): string[] => Object.keys(SIM_MODULES)
/** Free/anonymous viewers get the first FREE_SIM_LIMIT built sims; paid plans get all. */
export function canAccessSim(plan: Plan | null, simId: string): boolean {
  if (plan && plan !== 'free') return true            // standard/premium/admin
  return orderedBuiltIds().slice(0, FREE_SIM_LIMIT).includes(simId)  // free or anon (null)
}
```
"First 3 built sims" follow `SIM_MODULES` insertion order: `projectile`, `double-pendulum`, `incline-friction` are free; `ohm-circuit`, `waves`, `lens-optics` require a paid plan. Coming-soon (unbuilt) sims are unaffected (already not openable).

---

## 3. Supabase schema + RLS (`supabase/migrations/0001_init.sql`)

```sql
-- profiles: one row per auth user
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Explorer',
  avatar_url text,
  locale text not null default 'mn',
  plan text not null default 'free' check (plan in ('free','standard','premium','admin')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- favorites: many per user
create table public.favorites (
  user_id uuid not null references auth.users on delete cascade,
  sim_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, sim_id)
);
alter table public.favorites enable row level security;
create policy "own favorites all" on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- auto-create a profile on signup
create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Security note (explicit):** the "own profile update" policy lets a user set their own `plan` — intentional for the no-payment **demo** plan-switch. When real payments are added (later sub-project), plan mutation must move server-side: drop `plan` from the user-updatable columns (e.g. a column-restricted policy or a `security definer` RPC) and set it only via a Stripe/QPay webhook using the service-role key. This is recorded here so the demo permissiveness is not mistaken for production-ready.

---

## 4. Demo client behavior (`demoClient.ts`)
Backed by localStorage keys `axion.demo.user`, `axion.demo.profile`, `axion.demo.favorites`. `signInWithGoogle()` creates a `Demo User` session instantly; `signUp`/`signInWithPassword` accept any credentials and persist a user keyed by email. `setPlan`/`toggleFavorite`/`updateProfile` mutate localStorage. `onAuthChange` fires on the same-tab via an internal listener set. This makes every authed flow exercisable with no backend.

---

## 5. UI behavior
- **Navbar:** signed-out → `Sign In` (ghost) + `Enter Laboratory` (gradient, → `/login`). Signed-in → `AccountMenu` (avatar/initial, `PlanBadge`, links to Dashboard, Sign out). A small **demo-mode** indicator shows when `isDemo`.
- **LoginPage:** `Continue with Google` button + an email/password form with sign-in / sign-up toggle; inline error text; a banner when `isDemo` ("Demo mode — no real account is created"). On success → redirect to `?from` or `/dashboard`.
- **DashboardPage** (guarded by `RequireAuth`): profile header (name editable, avatar/initial, email), a **Plan** card showing current plan + buttons to switch (demo) between free/standard/premium with a "demo — no charge" caption, a **Favorites** list (links to each sim, remove button), and **Sign out**.
- **LabCatalog:** built sims locked for the viewer's plan render a lock badge + are not links (clicking the lock routes to `/login` when anon or `/dashboard` to upgrade); a `FavoriteButton` appears on built cards.
- **SimDetailPage:** if `!canAccessSim(plan, id)` → an **Upgrade wall** (sign in / upgrade CTA) instead of the player; otherwise the player + a `FavoriteButton`.
- **Pricing (landing):** "Choose plan" → if signed in, demo-switch to that plan and toast/redirect to dashboard; else `/login`.

---

## 6. Testing
- **`gating.ts`** unit tests: `canAccessSim` for `null/free` (first 3 true, rest false) and `standard/premium/admin` (all true).
- **`demoClient.ts`** tests (localStorage mocked): sign-in creates a user + auto-profile; sign-out clears; `toggleFavorite` adds then removes; `setPlan` persists; `updateProfile` patches.
- **`AuthProvider`/`useAuth`** (demo client): initial state anon; after `signInWithGoogle` user + profile present; `signOut` clears.
- **`LoginPage`** renders Google button + email/password fields; **`DashboardPage`** redirects to `/login` when anon (via `RequireAuth`).
- **Lab gating:** `SimDetailPage` shows the upgrade wall for a free viewer on `ohm-circuit` and the player for a premium viewer; `LabCatalog` locks the 4th+ built sim for free.
- **`auth` key-parity** added to `keyparity.test.ts`.
- All tests use the **demo client** (no network). `tsc --noEmit`, `vitest run`, `vite build` pass; Playwright shots of `/login`, `/dashboard`, and a locked sim.

---

## 7. Success criteria
1. With no `.env`, the app runs in demo mode: sign in (Google or email), see a dashboard, favorite sims, switch plan, and watch lab gating change live.
2. With `.env` creds + the migration applied, the same flows run against real Supabase (Google OAuth + email/password, RLS-protected profile/favorites).
3. Free/anon opens exactly the first 3 built sims; paid plans open all; locked sims show an upgrade wall.
4. Trilingual throughout; `auth` key-parity passes.
5. `tsc`, tests, and build all green; `supabase/SETUP.md` documents go-live.
