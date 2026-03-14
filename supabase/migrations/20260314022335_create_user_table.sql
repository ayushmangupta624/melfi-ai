create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  fname           text not null,
  lname           text not null,
  email           text not null unique,
  bio             text,
  timezone        text not null default 'UTC',
  phone           text,
  call_time_pref  time,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: read own"   on public.users for select using (auth.uid() = id);
create policy "users: update own" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function set_updated_at();