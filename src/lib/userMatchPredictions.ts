import { supabase } from './supabase';

export type UserMatchPrediction = {
  matchId: string;
  predictedScore: string;
  note: string;
  updatedAt: string;
};

type UserPredictionRow = {
  match_id: string;
  predicted_score: string;
  note: string | null;
  updated_at: string;
};

function toUserPrediction(row: UserPredictionRow): UserMatchPrediction {
  return {
    matchId: row.match_id,
    predictedScore: row.predicted_score,
    note: row.note ?? '',
    updatedAt: row.updated_at,
  };
}

export async function loadUserPrediction(matchId: string) {
  const { data, error } = await supabase
    .from('user_match_predictions')
    .select('match_id,predicted_score,note,updated_at')
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toUserPrediction(data as UserPredictionRow) : null;
}

export async function saveUserPrediction(matchId: string, predictedScore: string, note: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error('User is not signed in');
  }

  const { data, error } = await supabase
    .from('user_match_predictions')
    .upsert({
      user_id: userData.user.id,
      match_id: matchId,
      predicted_score: predictedScore,
      note: note.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,match_id' })
    .select('match_id,predicted_score,note,updated_at')
    .single();

  if (error) {
    throw error;
  }

  return toUserPrediction(data as UserPredictionRow);
}
