import { supabase } from './supabase';

export type ModelBreakdown = {
  model: string;
  pick: string;
  score: string;
  confidence: number;
};

export type WorldCupPrediction = {
  id: string;
  matchTime: string;
  stage: string;
  venue: string;
  homeName: string;
  homeCode: string;
  awayName: string;
  awayCode: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedScore: string;
  consensusPick: string;
  confidence: number;
  aiSummary: string;
  modelBreakdown: ModelBreakdown[];
  status: 'upcoming' | 'live' | 'finished';
  sourceName: string;
  sourceUrl: string | null;
  sourceUpdatedAt: string | null;
  updatedAt: string;
};

type PredictionRow = {
  id: string;
  match_time: string;
  stage: string;
  venue: string;
  home_name: string;
  home_code: string;
  away_name: string;
  away_code: string;
  home_win: number | string;
  draw: number | string;
  away_win: number | string;
  predicted_score: string;
  consensus_pick: string;
  confidence: number;
  ai_summary: string;
  model_breakdown: ModelBreakdown[];
  status: 'upcoming' | 'live' | 'finished';
  source_name: string;
  source_url: string | null;
  source_updated_at: string | null;
  updated_at: string;
};

function toPrediction(row: PredictionRow): WorldCupPrediction {
  return {
    id: row.id,
    matchTime: row.match_time,
    stage: row.stage,
    venue: row.venue,
    homeName: row.home_name,
    homeCode: row.home_code,
    awayName: row.away_name,
    awayCode: row.away_code,
    homeWin: Number(row.home_win),
    draw: Number(row.draw),
    awayWin: Number(row.away_win),
    predictedScore: row.predicted_score,
    consensusPick: row.consensus_pick,
    confidence: row.confidence,
    aiSummary: row.ai_summary,
    modelBreakdown: row.model_breakdown ?? [],
    status: row.status,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceUpdatedAt: row.source_updated_at,
    updatedAt: row.updated_at,
  };
}

export async function loadUpcomingPredictions() {
  const { data, error } = await supabase
    .from('world_cup_predictions')
    .select('*')
    .in('status', ['upcoming', 'live'])
    .order('match_time', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as PredictionRow[]).map(toPrediction);
}

export function subscribeToPredictions(onChange: () => void) {
  const channel = supabase
    .channel('world-cup-predictions-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'world_cup_predictions' },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
