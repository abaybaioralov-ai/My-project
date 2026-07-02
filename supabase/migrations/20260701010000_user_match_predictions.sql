create table if not exists public.user_match_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  match_id text not null references public.world_cup_predictions (id) on delete cascade,
  predicted_score text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.user_match_predictions enable row level security;

drop policy if exists "read own match predictions" on public.user_match_predictions;
create policy "read own match predictions"
  on public.user_match_predictions for select
  using (auth.uid() = user_id);

drop policy if exists "insert own match predictions" on public.user_match_predictions;
create policy "insert own match predictions"
  on public.user_match_predictions for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own match predictions" on public.user_match_predictions;
create policy "update own match predictions"
  on public.user_match_predictions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own match predictions" on public.user_match_predictions;
create policy "delete own match predictions"
  on public.user_match_predictions for delete
  using (auth.uid() = user_id);
