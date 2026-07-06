const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = 'gemini-2.5-flash';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Source = {
  title: string;
  url: string;
};

function extractSources(data: unknown): Source[] {
  const response = data as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{
          web?: {
            title?: string;
            uri?: string;
          };
        }>;
      };
    }>;
  };

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();

  return chunks
    .map((chunk) => chunk.web)
    .filter((web): web is { title?: string; uri: string } => Boolean(web?.uri))
    .filter((web) => {
      if (seen.has(web.uri)) return false;
      seen.add(web.uri);
      return true;
    })
    .slice(0, 5)
    .map((web) => ({
      title: web.title || 'Source',
      url: web.uri,
    }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY secret.');
    }

    const { homeName, awayName, matchTime, venue, aiPick, predictedScore, currentDate } = await req.json();

    if (!homeName || !awayName) {
      throw new Error('homeName and awayName are required.');
    }

    const prompt = [
      `Use current internet information and Google Search grounding.`,
      `Current date: ${currentDate ?? new Date().toISOString()}`,
      `Match: ${homeName} vs ${awayName}`,
      `Kickoff: ${matchTime ?? 'unknown'}`,
      `Venue: ${venue ?? 'unknown'}`,
      `Existing AI pick: ${aiPick ?? 'unknown'}`,
      `Projected score: ${predictedScore ?? 'unknown'}`,
      '',
      'Write for a football fan deciding whether to trust the prediction.',
      'Focus on real, source-supported information only.',
      'Very important:',
      '- Do not treat predicted fixtures, simulated brackets, or AI-generated match pages as real official results.',
      '- Do not use ScoreGPT, prediction pages, simulator pages, or bracket generators as proof of official fixtures, results, injuries, or lineups.',
      '- Prediction pages may only be described as prediction sources, not verified match facts.',
      '- For official fixture/result claims, prefer FIFA, confederation, federation, league, club/team, or reputable sports news sources.',
      '- Do not claim a team already won/drew/lost a future match unless a reliable source confirms the final result.',
      '- If the specific fixture, player availability, or lineup is not verifiable, say it is not verified.',
      '- Separate verified facts from inference.',
      'Check these areas when available:',
      '- Recent team form and last meaningful matches',
      '- Important players for both teams',
      '- Confirmed or widely reported injuries, suspensions, and absences',
      '- Likely tactical strengths, weak spots, and matchup edges',
      '- Tournament motivation and travel/venue factors',
      'Return short sections:',
      '1. Fresh context',
      '2. Key players and availability',
      '3. What favors the AI pick',
      '4. What could change the pick',
      '5. Decision note',
      'If reliable player/team news is unavailable, say that clearly.',
      'Start the answer with "Fixture verification:" and say whether the specific match is verified, prediction-only, or unverified.',
      'Do not invent injuries, lineups, odds, or live facts if sources do not support them.',
    ].join('\n');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
        }),
      },
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!res.ok || !text) {
      throw new Error(data?.error?.message || 'No grounded answer.');
    }

    return new Response(JSON.stringify({
      text,
      sources: extractSources(data),
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
