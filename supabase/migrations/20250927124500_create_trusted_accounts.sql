-- Trusted Twitter accounts allowlist
create table if not exists public.trusted_accounts (
  handle text primary key,              -- e.g., HDFCBank_Cares (no @)
  twitter_user_id text,
  display_name text,
  symbols text[] not null default '{}', -- symbols this handle is trusted for
  notes text,
  created_at timestamptz not null default now()
);

alter table public.trusted_accounts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='trusted_accounts' and policyname='trusted_accounts_select_all_auth'
  ) then
    create policy "trusted_accounts_select_all_auth"
      on public.trusted_accounts for select
      using (auth.role() = 'authenticated');
  end if;
end$$;
