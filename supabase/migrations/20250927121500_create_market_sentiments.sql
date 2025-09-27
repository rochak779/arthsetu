-- Create tables for Market Sentiments feature
-- Tweets and sentiments; primary key on tweet_id to avoid extension dependency
create table if not exists public.market_sentiments (
  tweet_id text primary key,
  symbol text not null,
  tweet_text text not null,
  tweet_created_at timestamptz not null,
  author_id text,
  lang text,
  retweet_count int,
  reply_count int,
  like_count int,
  quote_count int,
  possibly_sensitive boolean,
  sentiment_label text check (sentiment_label in ('positive','neutral','negative')) not null,
  sentiment_score numeric not null,
  model text not null default 'tabularisai/multilingual-sentiment-analysis',
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists market_sentiments_symbol_created_idx
  on public.market_sentiments(symbol, tweet_created_at desc);

-- Per-symbol state to fetch only new tweets
create table if not exists public.market_sentiment_state (
  symbol text primary key,
  since_id text,
  last_run_at timestamptz
);

-- Enable RLS and allow authenticated read
alter table public.market_sentiments enable row level security;
alter table public.market_sentiment_state enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='market_sentiments' and policyname='market_sentiments_select_all_auth'
  ) then
    create policy "market_sentiments_select_all_auth"
      on public.market_sentiments for select
      using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='market_sentiment_state' and policyname='market_sentiment_state_select_all_auth'
  ) then
    create policy "market_sentiment_state_select_all_auth"
      on public.market_sentiment_state for select
      using (auth.role() = 'authenticated');
  end if;
end$$;
