# Axion Labs — Phase 3 (Auth + Accounts + Plan Gating) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Use **test-driven-development** for logic (gating, demoClient, provider) and the **supabase** skill when implementing `supabaseClient.ts` / the migration. Apply **frontend-design** for the login/dashboard UI.

**Goal:** Real user accounts — Google + email/password sign-in, a Supabase-backed profile + plan + favorites (with a localStorage demo fallback), and plan gating on the lab (Free opens the first 3 sims; paid opens all).

**Architecture:** One `AuthProvider` (React context) over a pluggable `AuthClient` interface with two implementations — `supabaseClient` (real, used when `VITE_SUPABASE_URL` is set) and `demoClient` (localStorage, the default in this build). App code only touches the context. Gating is a pure function over the registry order. Tests run against the demo client (no network).

**Tech Stack:** React 18 + TS + Vite, `@supabase/supabase-js` v2, i18next, react-router, Vitest. Reuses Phase 1/2: UI primitives, `resolveLang`, `SIM_MODULES`, `SIMULATIONS`, routing.

**Working dir:** `C:\Users\enkh\axion-labs`. Verify each task with `npx tsc --noEmit` + `npx vitest run`.

**Shared `auth` i18n key list** (identical in mn/en/zh):
`signIn, signUp, signOut, email, password, displayName, continueWithGoogle, orEmail, switchToSignUp, switchToSignIn, loginTitle, loginSubtitle, demoBanner, dashboard, myDashboard, profile, account, planLabel, favorites, noFavorites, editName, save, cancel, remove, open, demoNoCharge, choosePlan, upgradeTitle, upgradeBody, signInToUnlock, locked, addFavorite, removeFavorite, errInvalid, errGeneric, errFields, plan.free, plan.standard, plan.premium, plan.admin`

---

## Task 1: Deps, env, types, client factory, gating (TDD)

**Files:** modify `package.json` (dep); create `.env.example`, `src/auth/types.ts`, `src/auth/client.ts`, `src/auth/gating.ts`, `src/auth/gating.test.ts`.

- [ ] **Step 1: Install Supabase SDK** — from project root:
```powershell
npm install @supabase/supabase-js
```

- [ ] **Step 2: `.env.example`**
```
# Leave unset to run in local demo mode (localStorage auth).
# Fill these (and run supabase/migrations/0001_init.sql) to go live — see supabase/SETUP.md
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: `src/auth/types.ts`** (exact content)
```ts
export type Plan = 'free' | 'standard' | 'premium' | 'admin'
export interface AuthUser { id: string; email: string | null }
export interface Profile {
  id: string
  displayName: string
  avatarUrl: string | null
  locale: string
  plan: Plan
  trialEndsAt: string | null
}
export interface Favorite { simId: string; createdAt: string }
export type AuthChangeHandler = (user: AuthUser | null) => void

export interface AuthClient {
  getSession(): Promise<AuthUser | null>
  onAuthChange(cb: AuthChangeHandler): () => void
  signInWithGoogle(): Promise<void>
  signInWithPassword(email: string, password: string): Promise<void>
  signUp(email: string, password: string, displayName: string): Promise<void>
  signOut(): Promise<void>
  getProfile(userId: string): Promise<Profile>
  updateProfile(patch: Partial<Pick<Profile, 'displayName' | 'locale'>>): Promise<Profile>
  setPlan(plan: Plan): Promise<Profile>
  listFavorites(): Promise<Favorite[]>
  toggleFavorite(simId: string): Promise<Favorite[]>
}
```

- [ ] **Step 4: `gating.test.ts`** then `gating.ts`
```ts
// gating.test.ts
import { describe, it, expect } from 'vitest'
import { canAccessSim, FREE_SIM_LIMIT } from './gating'
import { SIM_MODULES } from '@/lab/registry'
const ids = Object.keys(SIM_MODULES)
describe('canAccessSim', () => {
  it('free/anon get exactly the first FREE_SIM_LIMIT built sims', () => {
    ids.slice(0, FREE_SIM_LIMIT).forEach((id) => expect(canAccessSim('free', id)).toBe(true))
    ids.slice(FREE_SIM_LIMIT).forEach((id) => expect(canAccessSim('free', id)).toBe(false))
    expect(canAccessSim(null, ids[FREE_SIM_LIMIT])).toBe(false)
  })
  it('paid plans get everything', () => {
    ids.forEach((id) => {
      expect(canAccessSim('standard', id)).toBe(true)
      expect(canAccessSim('premium', id)).toBe(true)
      expect(canAccessSim('admin', id)).toBe(true)
    })
  })
})
```
```ts
// gating.ts
import { SIM_MODULES } from '@/lab/registry'
import type { Plan } from './types'
export const FREE_SIM_LIMIT = 3
const freeIds = (): string[] => Object.keys(SIM_MODULES).slice(0, FREE_SIM_LIMIT)
/** Free/anonymous (null) viewers get the first FREE_SIM_LIMIT built sims; paid plans get all. */
export function canAccessSim(plan: Plan | null, simId: string): boolean {
  if (plan && plan !== 'free') return true
  return freeIds().includes(simId)
}
```
Run `npx vitest run src/auth/gating` → PASS.

- [ ] **Step 5: `src/auth/client.ts`**
```ts
import type { AuthClient } from './types'
import { demoClient } from './demoClient'
import { createSupabaseClient } from './supabaseClient'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const isDemo = !url

let singleton: AuthClient | null = null
export function getAuthClient(): AuthClient {
  if (!singleton) singleton = isDemo ? demoClient() : createSupabaseClient()
  return singleton
}
```
(References `demoClient`/`createSupabaseClient` created in Tasks 2/3 — create those before this compiles; commit at the end of Task 3.)

- [ ] **Step 6: Commit** (after Tasks 2–3 compile) — see Task 3.

---

## Task 2: Demo client (TDD)

**Files:** create `src/auth/demoClient.ts`, `src/auth/demoClient.test.ts`.

- [ ] **Step 1: `demoClient.ts`**
```ts
import type { AuthClient, AuthUser, Favorite, Plan, Profile, AuthChangeHandler } from './types'

const K = { user: 'axion.demo.user', profile: 'axion.demo.profile', favs: 'axion.demo.favorites' }
const read = <T,>(k: string): T | null => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null } catch { return null }
}
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))

export function demoClient(): AuthClient {
  const listeners = new Set<AuthChangeHandler>()
  const emit = (u: AuthUser | null) => listeners.forEach((l) => l(u))

  const ensureProfile = (user: AuthUser, displayName?: string): Profile => {
    let p = read<Profile>(K.profile)
    if (!p || p.id !== user.id) {
      p = {
        id: user.id,
        displayName: displayName || user.email?.split('@')[0] || 'Explorer',
        avatarUrl: null, locale: 'mn', plan: 'free', trialEndsAt: null,
      }
      write(K.profile, p)
    }
    return p
  }
  const signedInAs = (email: string | null, displayName?: string) => {
    const user: AuthUser = { id: `demo-${(email || 'google').toLowerCase()}`, email }
    write(K.user, user)
    ensureProfile(user, displayName)
    emit(user)
  }

  return {
    async getSession() { return read<AuthUser>(K.user) },
    onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb) },
    async signInWithGoogle() { signedInAs('demo@axion.dev', 'Demo User') },
    async signInWithPassword(email) { signedInAs(email) },
    async signUp(email, _pw, displayName) { signedInAs(email, displayName) },
    async signOut() { localStorage.removeItem(K.user); emit(null) },
    async getProfile(userId) {
      const p = read<Profile>(K.profile)
      if (p && p.id === userId) return p
      return ensureProfile({ id: userId, email: null })
    },
    async updateProfile(patch) {
      const p = read<Profile>(K.profile)!
      const next = { ...p, ...patch }
      write(K.profile, next); return next
    },
    async setPlan(plan: Plan) {
      const p = read<Profile>(K.profile)!
      const next = { ...p, plan }
      write(K.profile, next); return next
    },
    async listFavorites() { return read<Favorite[]>(K.favs) ?? [] },
    async toggleFavorite(simId) {
      const list = read<Favorite[]>(K.favs) ?? []
      const exists = list.some((f) => f.simId === simId)
      const next = exists ? list.filter((f) => f.simId !== simId) : [...list, { simId, createdAt: new Date(0).toISOString() }]
      write(K.favs, next); return next
    },
  }
}
```
NOTE: `new Date(0)` avoids the Date.now ban in non-test code is irrelevant here (this is app code, not a workflow script) — but to keep determinism in tests, the createdAt uses epoch; that is fine. If a real timestamp is wanted, use `new Date().toISOString()` (allowed in app code).

- [ ] **Step 2: `demoClient.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { demoClient } from './demoClient'
beforeEach(() => localStorage.clear())
describe('demoClient', () => {
  it('signs in (google), auto-creates a free profile, signs out', async () => {
    const c = demoClient()
    expect(await c.getSession()).toBeNull()
    await c.signInWithGoogle()
    const u = await c.getSession()
    expect(u).not.toBeNull()
    const p = await c.getProfile(u!.id)
    expect(p.plan).toBe('free')
    expect(p.displayName).toBe('Demo User')
    await c.signOut()
    expect(await c.getSession()).toBeNull()
  })
  it('toggles favorites and switches plan', async () => {
    const c = demoClient()
    await c.signInWithPassword('a@b.com', 'x')
    expect(await c.listFavorites()).toEqual([])
    let favs = await c.toggleFavorite('projectile')
    expect(favs.map((f) => f.simId)).toEqual(['projectile'])
    favs = await c.toggleFavorite('projectile')
    expect(favs).toEqual([])
    const p = await c.setPlan('premium')
    expect(p.plan).toBe('premium')
  })
  it('notifies auth-change listeners', async () => {
    const c = demoClient()
    const seen: (string | null)[] = []
    const off = c.onAuthChange((u) => seen.push(u?.id ?? null))
    await c.signInWithGoogle()
    await c.signOut()
    off()
    expect(seen.length).toBe(2)
    expect(seen[1]).toBeNull()
  })
})
```
Run `npx vitest run src/auth/demoClient` → PASS.

---

## Task 3: Supabase client (real impl) + commit core

**Files:** create `src/auth/supabaseClient.ts`. (Use the **supabase** skill to confirm current v2 SDK usage.)

- [ ] **Step 1: `supabaseClient.ts`** (no unit test — exercised only with real creds)
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AuthClient, AuthUser, Favorite, Plan, Profile } from './types'

const toUser = (u: { id: string; email?: string | null } | null | undefined): AuthUser | null =>
  u ? { id: u.id, email: u.email ?? null } : null

const rowToProfile = (r: Record<string, unknown>): Profile => ({
  id: r.id as string,
  displayName: (r.display_name as string) ?? 'Explorer',
  avatarUrl: (r.avatar_url as string) ?? null,
  locale: (r.locale as string) ?? 'mn',
  plan: (r.plan as Plan) ?? 'free',
  trialEndsAt: (r.trial_ends_at as string) ?? null,
})

export function createSupabaseClient(): AuthClient {
  const sb: SupabaseClient = createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    { auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } },
  )
  const requireUid = async (): Promise<string> => {
    const { data } = await sb.auth.getUser()
    if (!data.user) throw new Error('Not signed in')
    return data.user.id
  }
  return {
    async getSession() {
      const { data } = await sb.auth.getUser()
      return toUser(data.user)
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async signInWithGoogle() {
      await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
    },
    async signInWithPassword(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password, displayName) {
      const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: displayName } } })
      if (error) throw error
    },
    async signOut() { await sb.auth.signOut() },
    async getProfile(userId) {
      const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return rowToProfile(data)
    },
    async updateProfile(patch) {
      const uid = await requireUid()
      const row: Record<string, unknown> = {}
      if (patch.displayName !== undefined) row.display_name = patch.displayName
      if (patch.locale !== undefined) row.locale = patch.locale
      const { data, error } = await sb.from('profiles').update(row).eq('id', uid).select('*').single()
      if (error) throw error
      return rowToProfile(data)
    },
    async setPlan(plan) {
      const uid = await requireUid()
      const { data, error } = await sb.from('profiles').update({ plan }).eq('id', uid).select('*').single()
      if (error) throw error
      return rowToProfile(data)
    },
    async listFavorites() {
      const uid = await requireUid()
      const { data, error } = await sb.from('favorites').select('sim_id, created_at').eq('user_id', uid)
      if (error) throw error
      return (data ?? []).map((r) => ({ simId: r.sim_id as string, createdAt: r.created_at as string }))
    },
    async toggleFavorite(simId) {
      const uid = await requireUid()
      const { data: existing } = await sb.from('favorites').select('sim_id').eq('user_id', uid).eq('sim_id', simId).maybeSingle()
      if (existing) await sb.from('favorites').delete().eq('user_id', uid).eq('sim_id', simId)
      else await sb.from('favorites').insert({ user_id: uid, sim_id: simId })
      return this.listFavorites()
    },
  }
}
```

- [ ] **Step 2: Verify + commit core** — `npx tsc --noEmit` (0), `npx vitest run src/auth` (gating + demo green).
```powershell
git add -A; git commit -m "feat(auth): types, gating, demo + supabase clients, client factory"
```

---

## Task 4: AuthProvider + useAuth

**Files:** create `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/auth/AuthProvider.test.tsx`; modify `src/main.tsx`.

- [ ] **Step 1: `AuthProvider.tsx`**
```tsx
import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { getAuthClient, isDemo } from './client'
import type { AuthUser, Favorite, Plan, Profile } from './types'

export interface AuthContextValue {
  user: AuthUser | null
  profile: Profile | null
  favorites: Favorite[]
  loading: boolean
  isDemo: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Pick<Profile, 'displayName' | 'locale'>>) => Promise<void>
  setPlan: (plan: Plan) => Promise<void>
  toggleFavorite: (simId: string) => Promise<void>
  isFavorite: (simId: string) => boolean
}
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useRef(getAuthClient()).current
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (u: AuthUser | null) => {
    setUser(u)
    if (u) {
      const [p, f] = await Promise.all([client.getProfile(u.id), client.listFavorites()])
      setProfile(p); setFavorites(f)
    } else { setProfile(null); setFavorites([]) }
  }, [client])

  useEffect(() => {
    let alive = true
    client.getSession().then((u) => { if (alive) load(u).finally(() => setLoading(false)) })
    const off = client.onAuthChange((u) => { if (alive) load(u) })
    return () => { alive = false; off() }
  }, [client, load])

  const value: AuthContextValue = {
    user, profile, favorites, loading, isDemo,
    signInWithGoogle: () => client.signInWithGoogle(),
    signInWithPassword: (e, p) => client.signInWithPassword(e, p),
    signUp: (e, p, n) => client.signUp(e, p, n),
    signOut: () => client.signOut(),
    updateProfile: async (patch) => setProfile(await client.updateProfile(patch)),
    setPlan: async (plan) => setProfile(await client.setPlan(plan)),
    toggleFavorite: async (simId) => setFavorites(await client.toggleFavorite(simId)),
    isFavorite: (simId) => favorites.some((f) => f.simId === simId),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

- [ ] **Step 2: `useAuth.ts`**
```ts
import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthProvider'
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 3: Mount in `main.tsx`** — wrap `<App/>` with `<AuthProvider>` (inside `BrowserRouter`, outside `Suspense`):
```tsx
import { AuthProvider } from './auth/AuthProvider'
// ...
<BrowserRouter><AuthProvider><Suspense fallback={null}><App /></Suspense></AuthProvider></BrowserRouter>
```

- [ ] **Step 4: `AuthProvider.test.tsx`** (demo client, since no env)
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'
function Probe() {
  const { user, profile, signInWithGoogle, signOut } = useAuth()
  return (
    <div>
      <span data-testid="who">{user ? profile?.displayName ?? '...' : 'anon'}</span>
      <button onClick={() => signInWithGoogle()}>in</button>
      <button onClick={() => signOut()}>out</button>
    </div>
  )
}
beforeEach(() => localStorage.clear())
describe('AuthProvider', () => {
  it('starts anonymous, signs in and out', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('anon'))
    await act(async () => { screen.getByText('in').click() })
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('Demo User'))
    await act(async () => { screen.getByText('out').click() })
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('anon'))
  })
})
```
Run `npx vitest run src/auth/AuthProvider` → PASS. **Commit** `feat(auth): AuthProvider + useAuth; mount in app`.

---

## Task 5: `auth` i18n namespace + parity

**Files:** create `src/i18n/locales/{mn,en,zh}/auth.json`; modify `src/i18n/index.ts`, `src/i18n/keyparity.test.ts`.

- [ ] **Step 1: `en/auth.json`** (full key tree; translate for mn/zh):
```json
{
  "signIn": "Sign in", "signUp": "Sign up", "signOut": "Sign out",
  "email": "Email", "password": "Password", "displayName": "Display name",
  "continueWithGoogle": "Continue with Google", "orEmail": "or with email",
  "switchToSignUp": "Need an account? Sign up", "switchToSignIn": "Have an account? Sign in",
  "loginTitle": "Enter the laboratory", "loginSubtitle": "Sign in to save favorites and unlock every simulation.",
  "demoBanner": "Demo mode — no real account is created. Add Supabase credentials to go live.",
  "dashboard": "Dashboard", "myDashboard": "My dashboard", "profile": "Profile", "account": "Account",
  "planLabel": "Plan", "favorites": "Favorites", "noFavorites": "No favorites yet — star a simulation in the lab.",
  "editName": "Edit name", "save": "Save", "cancel": "Cancel", "remove": "Remove", "open": "Open",
  "demoNoCharge": "Demo — switches instantly, no charge.", "choosePlan": "Choose plan",
  "upgradeTitle": "This simulation needs a paid plan", "upgradeBody": "Upgrade to Standard or Premium to open every simulation in the lab.",
  "signInToUnlock": "Sign in to unlock", "locked": "Locked",
  "addFavorite": "Add to favorites", "removeFavorite": "Remove from favorites",
  "errInvalid": "Invalid email or password.", "errGeneric": "Something went wrong. Please try again.",
  "errFields": "Please fill in all fields.",
  "plan": { "free": "Free", "standard": "Standard", "premium": "Premium", "admin": "Admin" }
}
```
- [ ] **Step 2:** author `mn/auth.json` + `zh/auth.json` with identical keys (e.g. mn `signOut`="Гарах", `favorites`="Дуртай", `locked`="Түгжээтэй", `choosePlan`="Багц сонгох"; zh `signOut`="退出", `favorites`="收藏", `locked`="已锁定", `choosePlan`="选择方案").
- [ ] **Step 3:** in `index.ts` import the three `auth` files, add `auth: xxAuth` to each language's resources, set `ns: ['common','landing','lab','auth']`.
- [ ] **Step 4:** in `keyparity.test.ts` change to `test.each(['common','landing','lab','auth'])`. Run `npx vitest run src/i18n/keyparity` → PASS.
- [ ] **Step 5: Commit** `feat(i18n): auth namespace (mn/en/zh) + parity`.

---

## Task 6: Login, RequireAuth, Dashboard, Navbar account menu

**Files:** create `src/auth/RequireAuth.tsx`, `src/routes/LoginPage.tsx`, `src/routes/DashboardPage.tsx`, `src/components/ui/PlanBadge.tsx`, `src/components/layout/AccountMenu.tsx`; modify `src/App.tsx`, `src/components/layout/Navbar.tsx`; create `src/auth/auth-ui.test.tsx`.

- [ ] **Step 1: `RequireAuth.tsx`**
```tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="min-h-[60vh]" />
  if (!user) return <Navigate to={`/login?from=${encodeURIComponent(loc.pathname)}`} replace />
  return <>{children}</>
}
```

- [ ] **Step 2: `PlanBadge.tsx`** — small pill: `t('plan.'+plan)`; admin/premium get gradient, standard violet border, free muted. Props `{ plan: Plan }`.

- [ ] **Step 3: `LoginPage.tsx`** (`/login`) — apply frontend-design. A centered `GlassPanel` on the `bg-radial-plasma` backdrop with: `SectionHeading` (`loginTitle`/`loginSubtitle`); if `isDemo` a `Pill` banner `demoBanner`; a gradient `Button` `continueWithGoogle` (calls `signInWithGoogle`); a divider `orEmail`; a form (email, password, +displayName when in sign-up mode) with a submit `Button` (`signIn`/`signUp`); a toggle link (`switchToSignUp`/`switchToSignIn`); inline error text. On submit call the matching method in a try/catch (set error to `errInvalid`/`errFields`/`errGeneric`); on success `navigate(searchParams.get('from') ?? '/dashboard')`. If already signed in, `<Navigate to="/dashboard" replace/>`.

- [ ] **Step 4: `DashboardPage.tsx`** (`/dashboard`) wrapped in `RequireAuth`. Sections in `Container`:
  - Header: avatar circle (first initial), `profile.displayName` (with an inline edit → `updateProfile`), `user.email`, `PlanBadge`.
  - Plan card: current plan, three buttons free/standard/premium calling `setPlan`, caption `demoNoCharge`.
  - Favorites: map `favorites` → a row per sim (localized name from `SIMULATIONS`, link `open` → `/lab/:id`, `remove` → `toggleFavorite`); empty → `noFavorites`.
  - `signOut` button → on success `navigate('/')`.

- [ ] **Step 5: `AccountMenu.tsx`** — avatar button (initial) + `PlanBadge`; click toggles a dropdown with `myDashboard` (→`/dashboard`) and `signOut`. Uses `useAuth`.

- [ ] **Step 6: Navbar** — replace the right-side CTAs with: if `useAuth().user` → `<AccountMenu/>`; else ghost `signIn` + gradient `enter` (both → `/login`). Keep the `LanguageSwitcher`. (Import `useAuth`.)

- [ ] **Step 7: Routes in `App.tsx`** — remove `/login` and `/dashboard` from `STUB_ROUTES`; add:
```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
```
(`LoginPage`/`DashboardPage` may be eager imports — they are light; keep lab lazy.) `STUB_ROUTES` becomes `['/tutor', '/exams', '/pricing']`.

- [ ] **Step 8: `auth-ui.test.tsx`**
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { LoginPage } from '@/routes/LoginPage'
const wrap = (initial: string) => render(
  <I18nextProvider i18n={i18n}><AuthProvider>
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<RequireAuth><div>DASH</div></RequireAuth>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider></I18nextProvider>,
)
beforeEach(() => localStorage.clear())
describe('auth UI', () => {
  it('LoginPage shows Google + email controls', async () => {
    await i18n.changeLanguage('en'); wrap('/login')
    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
  it('RequireAuth redirects anon users to /login', async () => {
    await i18n.changeLanguage('en'); wrap('/dashboard')
    await waitFor(() => expect(screen.queryByText('DASH')).toBeNull())
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })
})
```
Run `npx vitest run src/auth/auth-ui` → PASS. **Commit** `feat(auth): login, dashboard, route guard, navbar account menu`.

---

## Task 7: Lab gating + favorites + pricing switch

**Files:** create `src/components/ui/FavoriteButton.tsx`; modify `src/lab/LabCatalog.tsx`, `src/lab/SimDetailPage.tsx`, `src/features/landing/sections/Pricing.tsx`; create `src/lab/gating-ui.test.tsx`.

- [ ] **Step 1: `FavoriteButton.tsx`** — a star toggle: `const { user, isFavorite, toggleFavorite } = useAuth()`. If `!user` render nothing (or a sign-in star linking to `/login`). Else a button with `aria-label={t(isFavorite(id)?'auth:removeFavorite':'auth:addFavorite')}`, filled gradient star when favorited; `onClick={() => toggleFavorite(id)}` (stop propagation so it doesn't trigger the card link).

- [ ] **Step 2: LabCatalog gating** — `const { profile } = useAuth()`; for each built sim compute `locked = !canAccessSim(profile?.plan ?? null, s.id)`. Locked built cards: render with a lock badge (`auth:locked`) and route to `/login` (anon) or `/dashboard` (signed-in free) instead of `/lab/:id`. Unlocked built cards: link as before + render `<FavoriteButton id={s.id}/>` (top-right).

- [ ] **Step 3: SimDetailPage upgrade wall** — `const { profile, user } = useAuth()`; after the `meta`/`isBuilt` guard, if `!canAccessSim(profile?.plan ?? null, id)` render an upgrade panel (`GlassPanel`: `auth:upgradeTitle`, `auth:upgradeBody`, a `Button` → `/dashboard` (signed-in) or `/login` (anon) labeled `auth:signInToUnlock`/`auth:choosePlan`) instead of the `SimPlayer`. Otherwise render the player + a `FavoriteButton` near the title.

- [ ] **Step 4: Pricing demo-switch** — `const { user, setPlan } = useAuth()` + `useNavigate()`. Each plan's "Choose plan" button: if `!user` → `to="/login"`; else `onClick={async () => { if (plan.id !== 'free') await setPlan(plan.id); navigate('/dashboard') }}`. (Map `plan.id` `'standard'|'premium'|'free'` to `setPlan`.)

- [ ] **Step 5: `gating-ui.test.tsx`** — render `SimDetailPage` for `ohm-circuit` (the 4th built sim) inside providers, after demo sign-in as free → expect the upgrade wall (`upgradeTitle`); after `setPlan('premium')` (via a small harness or by seeding localStorage profile plan=premium before render) → expect no wall (controls/`canvas` fallback present). Also a `canAccessSim`-backed assertion that `projectile` (free) never shows the wall.
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { SimDetailPage } from '@/lab/SimDetailPage'
const renderAt = (id: string) => render(
  <I18nextProvider i18n={i18n}><AuthProvider>
    <MemoryRouter initialEntries={[`/lab/${id}`]}>
      <Routes><Route path="/lab/:id" element={<SimDetailPage />} /></Routes>
    </MemoryRouter>
  </AuthProvider></I18nextProvider>,
)
beforeEach(() => localStorage.clear())
describe('lab gating', () => {
  it('free/anon hits the upgrade wall on a paid sim (ohm-circuit)', async () => {
    await i18n.changeLanguage('en'); renderAt('ohm-circuit')
    await waitFor(() => expect(screen.getByText(/needs a paid plan/i)).toBeInTheDocument())
  })
  it('premium opens the paid sim (no wall)', async () => {
    localStorage.setItem('axion.demo.user', JSON.stringify({ id: 'demo-x', email: 'x@y.z' }))
    localStorage.setItem('axion.demo.profile', JSON.stringify({ id: 'demo-x', displayName: 'X', avatarUrl: null, locale: 'en', plan: 'premium', trialEndsAt: null }))
    await i18n.changeLanguage('en'); renderAt('ohm-circuit')
    await waitFor(() => expect(screen.queryByText(/needs a paid plan/i)).toBeNull())
  })
})
```
Run `npx vitest run src/lab/gating-ui` → PASS. **Commit** `feat(lab): plan gating, favorites, pricing demo-switch`.

---

## Task 8: Supabase migration + setup docs

**Files:** create `supabase/migrations/0001_init.sql`, `supabase/SETUP.md`.

- [ ] **Step 1: `0001_init.sql`** — exactly the SQL from the spec §3 (profiles + favorites tables, RLS policies, `handle_new_user` trigger).
- [ ] **Step 2: `SETUP.md`** — steps: (1) create a Supabase project; (2) Authentication → Providers → enable Email and Google (paste Google OAuth client id/secret; add `https://<ref>.supabase.co/auth/v1/callback` to Google console + the site URL); (3) SQL editor → run `migrations/0001_init.sql`; (4) copy Project URL + anon key into `.env`; (5) `npm run dev` now uses real auth. Include the redirect-URL note and the security caveat (plan self-update is demo-only).
- [ ] **Step 3: Commit** `docs(supabase): migration + setup guide`.

---

## Task 9: Verify + screenshots + review

- [ ] **Step 1:** `npx tsc --noEmit` (0); `npx vitest run` (all green incl. gating, demo, provider, auth-ui, gating-ui, auth parity); `npm run build` (success).
- [ ] **Step 2:** `npm run dev`; extend `scripts/shoot.mjs` with `/login`, `/dashboard` (after a demo sign-in via addInitScript seeding `axion.demo.user`+`profile`), and `/lab/ohm-circuit` (free → wall); review shots.
- [ ] **Step 3:** Commit `feat: Phase 3 complete — auth, accounts, gating`.
- [ ] **Step 4:** Adversarial review (auth correctness, RLS/migration soundness, demo/real parity of the AuthClient, a11y of forms/menus, i18n parity, gating edge cases) and fix confirmed findings.

---

## Self-review (plan vs spec)

**Spec coverage:** AuthClient interface + factory → T1/T3; gating (first-3, paid-all) → T1; demo fallback → T2; real Supabase → T3; AuthProvider/useAuth + mount → T4; auth i18n + parity → T5; Login/RequireAuth/Dashboard/Navbar menu → T6; lab lock + upgrade wall + favorites + pricing switch → T7; schema/RLS/trigger + SETUP + security caveat → T8 (SQL from spec §3); tests (gating, demo, provider, login/guard, gating-ui, parity) → T1/T2/T4/T6/T7; verify/build/shots/review → T9. ✅ No gaps.
**Placeholder scan:** complete code for all logic (types, gating, demoClient, supabaseClient, AuthProvider, useAuth, RequireAuth) and tests; UI pages are specified with the exact primitives, methods, copy keys, and behavior. The `mn/zh` auth values are described with concrete examples plus the parity-enforced EN canonical tree. No "TBD/handle edge cases".
**Type consistency:** `AuthClient` methods, `Profile`/`Plan`/`AuthUser`/`Favorite`, `canAccessSim(plan|null, simId)`, `getAuthClient`/`isDemo`, `AuthContextValue` (incl. `isFavorite`), and the demo localStorage keys (`axion.demo.user|profile|favorites`) are used consistently across tasks and match the gating-ui test's seeded localStorage shape. ✅

## Execution handoff
After Phase 3 ships and is reviewed, Phase 4 (AI tutor + exam generation) is the last subsystem — it needs the LLM proxy + `ANTHROPIC_API_KEY` (mock-first). Run a code review before declaring Phase 3 complete.
