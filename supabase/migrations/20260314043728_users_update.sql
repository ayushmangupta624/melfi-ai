create policy "users: insert own"
  on public.users for insert
  with check (auth.uid() = id);