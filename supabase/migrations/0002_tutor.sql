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
