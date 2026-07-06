import type { WorldCupPrediction } from './worldCupPredictions';

type SportScoreMatch = {
  home?: string;
  away?: string;
  home_score?: number | null;
  away_score?: number | null;
  status?: string;
  status_text?: string;
  time?: string;
  competition?: string;
  url?: string;
};

type SportScoreEnvelope = {
  matches?: SportScoreMatch[];
  updated?: string;
};

const SPORT_SCORE_MATCHES_URL = 'https://sportscore.com/api/widget/matches/?sport=football&limit=50';
const SPORT_SCORE_HOME = 'https://sportscore.com';

function teamCode(name: string) {
  return name
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'TBD';
}

function isUsableRealMatch(match: SportScoreMatch) {
  if (!match.home || !match.away || !match.time) return false;

  const status = `${match.status ?? ''} ${match.status_text ?? ''}`.toLowerCase();
  if (status.includes('finish') || status.includes('cancel') || status.includes('postpon')) return false;

  const kickoff = new Date(match.time).getTime();
  return Number.isFinite(kickoff) && kickoff >= Date.now() - 2 * 60 * 60 * 1000;
}

function toPrediction(match: SportScoreMatch, updatedAt: string): WorldCupPrediction {
  const home = match.home ?? 'Home';
  const away = match.away ?? 'Away';
  const statusText = `${match.status ?? ''} ${match.status_text ?? ''}`.toLowerCase();
  const status = statusText.includes('live') || statusText.includes('inplay') ? 'live' : 'upcoming';
  const sourceUrl = match.url?.startsWith('http')
    ? match.url
    : match.url
      ? `${SPORT_SCORE_HOME}${match.url}`
      : SPORT_SCORE_HOME;

  return {
    id: `sportscore-${home}-${away}-${match.time}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    matchTime: match.time ?? updatedAt,
    stage: match.competition ?? 'Football',
    venue: 'SportScore live feed',
    homeName: home,
    homeCode: teamCode(home),
    awayName: away,
    awayCode: teamCode(away),
    homeWin: 33.4,
    draw: 33.3,
    awayWin: 33.3,
    predictedScore: 'AI needed',
    consensusPick: 'TBD',
    confidence: 0,
    aiSummary: 'Real fixture data from SportScore. Press Analyze match to generate an AI prediction from this live match context.',
    modelBreakdown: [],
    status,
    sourceName: 'SportScore real data',
    sourceUrl,
    sourceUpdatedAt: updatedAt,
    updatedAt,
  };
}

export async function loadSportScoreMatches() {
  const response = await fetch(SPORT_SCORE_MATCHES_URL);

  if (!response.ok) {
    throw new Error(`SportScore returned HTTP ${response.status}`);
  }

  const payload = await response.json() as SportScoreEnvelope;
  const matches = payload.matches ?? [];
  const updatedAt = payload.updated ?? new Date().toISOString();
  const predictions = matches.filter(isUsableRealMatch).map((match) => toPrediction(match, updatedAt));

  if (predictions.length === 0) {
    throw new Error('SportScore is working, but it returned no upcoming or live football matches right now.');
  }

  return predictions;
}
