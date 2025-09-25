-- Create alerts table to store inbound alerts from n8n and display in app
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  external_id text unique,
  symbol text, -- e.g., INFY, SBIN
  title text, -- short title or summary heading
  summary text, -- short summary shown on list
  full_summary text, -- detailed description for alert details page
  action text check (action in ('buy','trim','hold')) default 'hold', -- recommendation for CTA
  priority text check (priority in ('high','medium','low')) default 'medium',
  confidence text check (confidence in ('high','medium','low')) default 'medium',
  last_price numeric, -- numeric price at time of alert
  change_pct numeric, -- percent change at time of alert (e.g., 2.4 for +2.4%)
  link text, -- optional deep link
  source text, -- e.g., 'n8n'
  category text, -- e.g., 'prices','news','signal'
  payload jsonb, -- additional arbitrary fields
  lifecycle_status text check (lifecycle_status in ('new','read','archived')) default 'new',
  read_at timestamptz,
  archived_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists alerts_user_created_idx on public.alerts(user_id, created_at desc);
create index if not exists alerts_status_idx on public.alerts(lifecycle_status);
create index if not exists alerts_symbol_idx on public.alerts(symbol);

-- Enable Row Level Security
alter table public.alerts enable row level security;

-- Policies
-- Read: user can read their own alerts or global alerts (user_id is null)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'alerts' and policyname = 'alerts_select_own_or_global'
  ) then
    create policy "alerts_select_own_or_global" on public.alerts
      for select using (auth.uid() = user_id or user_id is null);
  end if;
end$$;

-- Update: user can update lifecycle fields of their own alerts
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'alerts' and policyname = 'alerts_update_own'
  ) then
    create policy "alerts_update_own" on public.alerts
      for update using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

-- Optional: prevent arbitrary inserts by clients (only service role inserts, which bypasses RLS)
-- No explicit insert policy created; service role bypasses RLS by design.

-- Realtime publication (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alerts'
  ) then
    alter publication supabase_realtime add table public.alerts;
  end if;
end$$;
