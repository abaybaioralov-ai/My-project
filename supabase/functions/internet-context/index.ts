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

    const { homeName, awayName, matchTime, venue, aiPick, predictedScore } = await req.json();

    if (!homeName || !awayName) {
      throw new Error('homeName and awayName are required.');
    }

    const prompt = [
      `Use current internet information and Google Search grounding.`,
      `Match: ${homeName} vs ${awayName}`,
      `Kickoff: ${matchTime ?? 'unknown'}`,
      `Venue: ${venue ?? 'unknown'}`,
      `Existing AI pick: ${aiPick ?? 'unknown'}`,
      `Projected score: ${predictedScore ?? 'unknown'}`,
      '',
      'Write for a football fan deciding whether to trust the prediction.',
      'Return short sections:',
      '1. Fresh context',
      '2. What favors the AI pick',
      '3. What could change the pick',
      '4. Decision note',
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
