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
