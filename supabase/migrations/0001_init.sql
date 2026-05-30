-- Axion Labs — Phase 3 schema: profiles + favorites with RLS.
-- Run in the Supabase SQL editor (or via the CLI) on a fresh project.

-- ── profiles: one row per auth user ──────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Explorer',
  avatar_url text,
  locale text not null default 'mn',
  plan text not null default 'free' check (plan in ('free', 'standard', 'premium', 'admin')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile read"
  on public.profiles for select
  using (auth.uid() = id);

-- NOTE: this lets a user update their own `plan` — intentional for the no-payment
-- DEMO plan-switch. Before enabling real payments, remove `plan` from the columns a
-- user can change (column-restricted policy or a security-definer RPC) and set it
-- only from a Stripe/QPay webhook using the service-role key.
create policy "own profile update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── favorites: many rows per user ────────────────────────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references auth.users on delete cascade,
  sim_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, sim_id)
);

alter table public.favorites enable row level security;

create policy "own favorites all"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── auto-create a profile when a new auth user signs up ──────────────────────
-- security definer so it can insert into public.profiles; search_path pinned to ''
-- (advisor hardening) so every reference must be schema-qualified.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
