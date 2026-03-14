-- ── Enums ──────────────────────────────────────────────────────────────────

create type call_status as enum('scheduled','in_progress','completed','missed','failed');

create type therapeutic_technique as enum(
  'reflective_listening',
  'cognitive_reframing',
  'socratic_questioning',
  'somatic_grounding',
  'motivational_interviewing',
  'psychoeducation'
);

create type sentiment_label as enum('positive','neutral','negative','mixed');

-- ── Calls ──────────────────────────────────────────────────────────────────

create table public.calls (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  status             call_status not null default 'scheduled',
  scheduled_at       timestamptz not null,
  started_at         timestamptz,
  ended_at           timestamptz,
  duration_seconds   int generated always as (
                       extract(epoch from (ended_at - started_at))::int
                     ) stored,
  vapi_call_id       text unique,
  mood_score         numeric(3,1) check(mood_score between 1 and 10),
  primary_technique  therapeutic_technique,
  session_label      text,
  sentiment_variance numeric(5,4),
  picked_up          boolean not null default false,
  created_at         timestamptz not null default now()
);

create index calls_user_id_scheduled_at_idx on public.calls(user_id, scheduled_at desc);

-- ── Call turns ─────────────────────────────────────────────────────────────

create table public.call_turns (
  id              uuid primary key default gen_random_uuid(),
  call_id         uuid not null references public.calls(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  role            text not null check(role in ('user','assistant')),
  content         text not null,
  sentiment       sentiment_label,
  sentiment_score numeric(4,3) check(sentiment_score between -1 and 1),
  technique_used  therapeutic_technique,
  turn_index      int not null,
  spoken_at       timestamptz not null default now()
);

create index call_turns_call_id_idx on public.call_turns(call_id, turn_index asc);

-- ── Reward signals ─────────────────────────────────────────────────────────

create table public.reward_signals (
  id               uuid primary key default gen_random_uuid(),
  call_id          uuid not null unique references public.calls(id) on delete cascade,
  user_id          uuid not null references public.users(id) on delete cascade,
  rating           int check(rating between 1 and 10),
  duration_ratio   numeric(4,3),
  pickup_next_day  boolean,
  combined_reward  numeric(5,4),
  created_at       timestamptz not null default now()
);

-- ── Memory chunks ──────────────────────────────────────────────────────────

create extension if not exists vector;

create table public.memory_chunks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  call_id     uuid references public.calls(id) on delete set null,
  content     text not null,
  embedding   vector(1536) not null,
  themes      text[],
  entities    text[],
  created_at  timestamptz not null default now()
);

create index memory_chunks_embedding_idx on public.memory_chunks
  using hnsw (embedding vector_cosine_ops);
create index memory_chunks_user_id_idx on public.memory_chunks(user_id);

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.calls                enable row level security;
alter table public.call_turns           enable row level security;
alter table public.reward_signals       enable row level security;
alter table public.memory_chunks        enable row level security;

create policy "calls: read own"   on public.calls for select using (auth.uid() = user_id);
create policy "calls: insert own" on public.calls for insert with check (auth.uid() = user_id);
create policy "calls: update own" on public.calls for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "turns: read own"   on public.call_turns for select using (auth.uid() = user_id);
create policy "turns: insert own" on public.call_turns for insert with check (auth.uid() = user_id);

create policy "rewards: read own"   on public.reward_signals for select using (auth.uid() = user_id);
create policy "rewards: insert own" on public.reward_signals for insert with check (auth.uid() = user_id);
create policy "rewards: update own" on public.reward_signals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "memory: read own"   on public.memory_chunks for select using (auth.uid() = user_id);
create policy "memory: insert own" on public.memory_chunks for insert with check (auth.uid() = user_id);
create policy "memory: delete own" on public.memory_chunks for delete using (auth.uid() = user_id);