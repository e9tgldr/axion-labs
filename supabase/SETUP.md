# Going live with Supabase

Axion Labs runs in **demo mode** (localStorage auth) until you add Supabase credentials.
Follow these steps to switch to real accounts.

## 1. Create a project
- Go to <https://supabase.com/dashboard> → **New project**. Pick a region and a strong DB password.

## 2. Run the migration
- Dashboard → **SQL Editor** → paste the contents of `supabase/migrations/0001_init.sql` → **Run**.
  This creates the `profiles` and `favorites` tables, RLS policies, and the signup trigger.
- (CLI alternative: `supabase link --project-ref <ref>` then `supabase db push`.)

## 3. Enable auth providers
Dashboard → **Authentication → Providers**:
- **Email** — enable. (For passwordless or to skip confirmation during testing, adjust "Confirm email" under Auth settings.)
- **Google** — enable, then paste a Google OAuth **Client ID** and **Client secret**
  (create them at <https://console.cloud.google.com/apis/credentials>).
  - In the Google console, add this **Authorized redirect URI**:
    `https://<your-project-ref>.supabase.co/auth/v1/callback`
  - Dashboard → **Authentication → URL Configuration**: set **Site URL** to your app origin
    (e.g. `http://localhost:5173` for local dev) and add it to **Redirect URLs**.
    The app requests a redirect back to `<origin>/dashboard` after Google sign-in.

## 4. Add credentials to `.env`
Copy `.env.example` to `.env` and fill in (Dashboard → **Project Settings → API**):
```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon / publishable key>
```
> Use the **publishable** key if your project shows the new key format (`sb_publishable_…`);
> otherwise the legacy **anon** key works. Never put the **service_role** / secret key in the
> frontend — `VITE_`-prefixed vars are shipped to the browser.

## 5. Run
```
npm run dev
```
With `VITE_SUPABASE_URL` set, the app uses real Supabase auth automatically (the demo
fallback only activates when it is unset). Sign in with Google or email/password; your
profile and favorites are stored per-user under RLS.

## 6. Verify (recommended)
- Sign up, then in the Dashboard → **Table editor** confirm a `profiles` row was auto-created.
- Dashboard → **Advisors** → run the **Security** and **Performance** advisors; resolve any findings.

## Security note — plan changes
The current `profiles` UPDATE policy lets a signed-in user change their own `plan`. That is
intentional for the **demo plan-switch** (no payments yet). When you add real billing, move
plan mutation server-side (a `security definer` RPC or a payment webhook using the service-role
key) and stop allowing clients to write `plan` directly.

---

# Phase 4 — AI Tutor

The tutor runs in **demo mode** (a deterministic, trilingual mock — no network, no key) until
you deploy the Edge Function and set `VITE_SUPABASE_URL`. Follow these steps to switch to the
live, streaming Claude-backed tutor.

## 1. Run the tutor migration
- Dashboard → **SQL Editor** → paste the contents of `supabase/migrations/0002_tutor.sql` → **Run**.
  This creates the `conversations`, `messages`, and `tutor_usage` tables, their RLS policies, and
  the `bump_tutor_usage` RPC (the atomic per-user-per-day usage counter).
- (CLI alternative: `supabase db push`.)

## 2. Deploy the Edge Function
```
supabase functions deploy tutor-chat
```

## 3. Set the function secrets
```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
> **Never** put the key in a `VITE_*` variable — `VITE_`-prefixed vars are bundled into the
> browser build. The key lives only in the Edge Function's server-side secrets.

Optional secrets:
- `TUTOR_MODEL` — Claude model id (defaults to `claude-haiku-4-5`).
- `RATE_LIMIT_PER_MIN` — per-user requests per minute (defaults to `10`).
- `TUTOR_DISABLED` — set to any truthy value as a **global spend kill-switch**; the function
  rejects all requests while it is set.

## 4. Confirm JWT verification
`supabase/config.toml` must keep `verify_jwt = true` for the function so every request carries a
valid user session:
```
[functions.tutor-chat]
verify_jwt = true
```

## 5. Run
The SPA **auto-switches** to the live tutor once `VITE_SUPABASE_URL` is set (see the Phase-3
steps above) **and** the function is deployed. Until both are in place it falls back to the
demo/mock tutor — no configuration toggle needed.

## Security & limitations
- **Daily message cap is server-side.** The cap is enforced from `tutor_usage`, incremented
  atomically via the `bump_tutor_usage` RPC, so a client cannot bypass it. **But** `plan` is
  currently user-writable (the Phase-3 demo plan-switch — see the note above), so the
  "unlimited for paid plans" tier is **not** a real trust boundary until billing moves `plan`
  server-side (same caveat as Phase 3). "Unlimited" here means **no daily *message* cap** — it
  never means **no *spend* cap**: the per-minute rate limit plus the pinned model and
  `max_tokens` bound spend regardless of plan, and `TUTOR_DISABLED` is the hard global stop.
- **Messages are insertable only by the service role.** Clients have **SELECT-only** RLS on
  `messages` and `tutor_usage`; the Edge Function writes both the user and assistant turns (and
  the usage counter) with the service-role key. A signed-in user can read only their own rows.

### Deploy-time checklist (can't be tested without a live project)
These need a verification pass against your deployed project — they aren't covered by the local
test gates:
- **(a) Per-conversation attribution.** The Edge Function attaches persisted message turns to the
  user's **most-recent** conversation, because the proxy request body carries no
  `conversation_id`. If you need strict per-conversation attribution, add `conversation_id` to
  the proxy contract (client → function body) and have the function write against it.
- **(b) User-id extraction.** The function reads the user id from `getClaims().sub` with a
  `getUser()` fallback. Verify this against the `@supabase/supabase-js` minor version actually
  deployed in your function.
- **(c) CORS origin.** `Access-Control-Allow-Origin` is `*` for development. Tighten it to your
  SPA origin in production.
