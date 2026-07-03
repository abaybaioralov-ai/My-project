import { supabase } from './supabase';
import type { WorldCupPrediction } from './worldCupPredictions';

export type InternetSource = {
  title: string;
  url: string;
};

export type InternetContext = {
  text: string;
  sources: InternetSource[];
};

export async function loadInternetContext(prediction: WorldCupPrediction) {
  const { data, error } = await supabase.functions.invoke<InternetContext>('internet-context', {
    body: {
      homeName: prediction.homeName,
      awayName: prediction.awayName,
      matchTime: prediction.matchTime,
      venue: prediction.venue,
      aiPick: prediction.consensusPick,
      predictedScore: prediction.predictedScore,
    },
  });

  if (error || !data?.text) {
    throw error ?? new Error('No internet context returned.');
  }

  return data;
}
