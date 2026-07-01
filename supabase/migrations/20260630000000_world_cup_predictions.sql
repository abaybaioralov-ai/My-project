create table if not exists public.world_cup_predictions (
  id text primary key,
  match_time timestamptz not null,
  stage text not null,
  venue text not null,
  home_name text not null,
  home_code text not null,
  away_name text not null,
  away_code text not null,
  home_win numeric(5,2) not null check (home_win >= 0 and home_win <= 100),
  draw numeric(5,2) not null check (draw >= 0 and draw <= 100),
  away_win numeric(5,2) not null check (away_win >= 0 and away_win <= 100),
  predicted_score text not null,
  consensus_pick text not null,
  confidence integer not null check (confidence >= 0 and confidence <= 100),
  ai_summary text not null,
  model_breakdown jsonb not null default '[]'::jsonb,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  updated_at timestamptz not null default now()
);

alter table public.world_cup_predictions enable row level security;

drop policy if exists "public can read world cup predictions" on public.world_cup_predictions;
create policy "public can read world cup predictions"
  on public.world_cup_predictions for select
  using (true);

alter table public.world_cup_predictions replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.world_cup_predictions;
exception
  when duplicate_object then null;
end $$;

insert into public.world_cup_predictions (
  id,
  match_time,
  stage,
  venue,
  home_name,
  home_code,
  away_name,
  away_code,
  home_win,
  draw,
  away_win,
  predicted_score,
  consensus_pick,
  confidence,
  ai_summary,
  model_breakdown,
  status
) values
  (
    'usa-eng-2026-07-01',
    '2026-07-01T20:00:00Z',
    'Group B',
    'New York/New Jersey',
    'USA',
    'USA',
    'England',
    'ENG',
    24.80,
    22.40,
    52.80,
    '1-2',
    'ENG',
    63,
    'England is favored by squad depth and defensive stability, while USA keeps upset value from host-region lift and tempo.',
    '[{"model":"GPT-5","pick":"ENG","score":"1-2","confidence":64},{"model":"Claude","pick":"ENG","score":"1-1","confidence":56},{"model":"Gemini","pick":"ENG","score":"2-3","confidence":61},{"model":"DeepSeek","pick":"USA","score":"2-1","confidence":42}]',
    'upcoming'
  ),
  (
    'bra-sen-2026-07-01',
    '2026-07-01T23:00:00Z',
    'Group B',
    'Dallas',
    'Brazil',
    'BRA',
    'Senegal',
    'SEN',
    61.90,
    18.70,
    19.40,
    '2-1',
    'BRA',
    69,
    'Brazil leads the consensus through chance creation and attacking ceiling, but Senegal rates as a live counterattacking threat.',
    '[{"model":"GPT-5","pick":"BRA","score":"2-1","confidence":69},{"model":"Claude","pick":"BRA","score":"1-0","confidence":62},{"model":"Gemini","pick":"BRA","score":"3-1","confidence":72},{"model":"DeepSeek","pick":"BRA","score":"2-2","confidence":51}]',
    'upcoming'
  ),
  (
    'esp-uru-2026-07-02',
    '2026-07-02T19:00:00Z',
    'Group C',
    'Miami',
    'Spain',
    'ESP',
    'Uruguay',
    'URU',
    45.30,
    25.60,
    29.10,
    '1-1',
    'ESP',
    55,
    'Spain owns more possession control in the model, but Uruguay compresses the gap with defensive rating and tournament edge.',
    '[{"model":"GPT-5","pick":"ESP","score":"1-1","confidence":48},{"model":"Claude","pick":"DRAW","score":"1-1","confidence":38},{"model":"Gemini","pick":"ESP","score":"2-1","confidence":55},{"model":"DeepSeek","pick":"URU","score":"1-2","confidence":41}]',
    'upcoming'
  ),
  (
    'por-mar-2026-07-02',
    '2026-07-02T22:00:00Z',
    'Group C',
    'Atlanta',
    'Portugal',
    'POR',
    'Morocco',
    'MAR',
    48.20,
    24.10,
    27.70,
    '2-1',
    'POR',
    57,
    'Portugal has the higher attacking projection, while Morocco keeps the match tight with the best defensive underdog profile.',
    '[{"model":"GPT-5","pick":"POR","score":"2-1","confidence":57},{"model":"Claude","pick":"DRAW","score":"1-1","confidence":39},{"model":"Gemini","pick":"POR","score":"2-0","confidence":61},{"model":"DeepSeek","pick":"MAR","score":"0-1","confidence":36}]',
    'upcoming'
  )
on conflict (id) do update set
  match_time = excluded.match_time,
  stage = excluded.stage,
  venue = excluded.venue,
  home_name = excluded.home_name,
  home_code = excluded.home_code,
  away_name = excluded.away_name,
  away_code = excluded.away_code,
  home_win = excluded.home_win,
  draw = excluded.draw,
  away_win = excluded.away_win,
  predicted_score = excluded.predicted_score,
  consensus_pick = excluded.consensus_pick,
  confidence = excluded.confidence,
  ai_summary = excluded.ai_summary,
  model_breakdown = excluded.model_breakdown,
  status = excluded.status,
  updated_at = now();
