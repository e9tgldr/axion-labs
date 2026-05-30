create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text,
  sim_id text,
  grade int,
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "own conversations read"  on public.conversations for select using (auth.uid() = user_id);
create policy "own conversations insert" on public.conversations for insert with check (auth.uid() = user_id);
create policy "own conversations delete" on public.conversations for delete using (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "own messages read" on public.messages for select using (auth.uid() = user_id);
-- No client INSERT policy: the Edge Function writes both turns with the service role.

create table public.tutor_usage (
  user_id uuid not null references auth.users on delete cascade,
  usage_date date not null,
  count int not null default 0,
  tokens int not null default 0,
  primary key (user_id, usage_date)
);
alter table public.tutor_usage enable row level security;
create policy "own usage read" on public.tutor_usage for select using (auth.uid() = user_id);
-- No client write policy: only the service role mutates usage.

-- Atomic per-user-per-day usage increment, called by the tutor-chat Edge Function
-- (service role). SECURITY: execute is restricted to service_role so an
-- authenticated user cannot inflate another user's counter.
create function public.bump_tutor_usage(p_user_id uuid, p_usage_date date)
returns int language sql as $$
  insert into public.tutor_usage (user_id, usage_date, count)
  values (p_user_id, p_usage_date, 1)
  on conflict (user_id, usage_date)
  do update set count = public.tutor_usage.count + 1
  returning count;
$$;
revoke execute on function public.bump_tutor_usage(uuid, date) from public;
grant execute on function public.bump_tutor_usage(uuid, date) to service_role;
