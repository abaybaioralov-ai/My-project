import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react';
import stadiumImage from './assets/stadium-ai-world-cup.png';
import {
  loadUpcomingPredictions,
  subscribeToPredictions,
  type WorldCupPrediction,
} from './lib/worldCupPredictions';
import { supabase, supabaseAnonKey, supabaseUrl } from './lib/supabase';
import {
  loadUserPrediction,
  saveUserPrediction,
  type UserMatchPrediction,
} from './lib/userMatchPredictions';
import {
  loadInternetContext,
  type InternetContext,
} from './lib/internetContext';
import { loadSportScoreMatches } from './lib/sportScore';

type ShotTarget = {
  x: number;
  y: number;
};
type KeeperDive = 'center' | 'left' | 'right' | 'up';
type AccessMode = 'guest' | 'user' | null;
type AuthMode = 'signin' | 'signup';
type MatchFilter = 'all' | 'live' | 'high' | 'upset';
type ThemeMode = 'light' | 'dark' | 'bmw-m' | 'lamborghini' | 'bugatti';
type GameDifficulty = 'easy' | 'normal' | 'hard';
type GroupStanding = {
  group: string;
  teams: Array<{
    name: string;
    played: number;
    points: number;
    qualified?: boolean;
  }>;
};

const groupStandings: GroupStanding[] = [
  { group: 'A', teams: [
    { name: 'Mexico', played: 3, points: 9 },
    { name: 'South Africa', played: 3, points: 4 },
    { name: 'South Korea', played: 3, points: 3 },
    { name: 'Czech Republic', played: 3, points: 1 },
  ] },
  { group: 'B', teams: [
    { name: 'Switzerland', played: 3, points: 7 },
    { name: 'Canada', played: 3, points: 4 },
    { name: 'Bosnia & Herzegovina', played: 3, points: 4, qualified: true },
    { name: 'Qatar', played: 3, points: 1 },
  ] },
  { group: 'C', teams: [
    { name: 'Brazil', played: 3, points: 7 },
    { name: 'Morocco', played: 3, points: 7 },
    { name: 'Scotland', played: 3, points: 3 },
    { name: 'Haiti', played: 3, points: 0 },
  ] },
  { group: 'D', teams: [
    { name: 'USA', played: 3, points: 6 },
    { name: 'Australia', played: 3, points: 4 },
    { name: 'Paraguay', played: 3, points: 4 },
    { name: 'Turkey', played: 3, points: 3 },
  ] },
  { group: 'E', teams: [
    { name: 'Germany', played: 3, points: 6 },
    { name: 'Ivory Coast', played: 3, points: 6 },
    { name: 'Ecuador', played: 3, points: 4 },
    { name: 'Curacao', played: 3, points: 1 },
  ] },
  { group: 'F', teams: [
    { name: 'Netherlands', played: 3, points: 7 },
    { name: 'Japan', played: 3, points: 5 },
    { name: 'Sweden', played: 3, points: 4, qualified: true },
    { name: 'Tunisia', played: 3, points: 0 },
  ] },
  { group: 'G', teams: [
    { name: 'Belgium', played: 3, points: 5 },
    { name: 'Egypt', played: 3, points: 5 },
    { name: 'Iran', played: 3, points: 3 },
    { name: 'New Zealand', played: 3, points: 1 },
  ] },
  { group: 'H', teams: [
    { name: 'Spain', played: 3, points: 7 },
    { name: 'Cape Verde', played: 3, points: 3 },
    { name: 'Uruguay', played: 3, points: 2 },
    { name: 'Saudi Arabia', played: 3, points: 2 },
  ] },
  { group: 'I', teams: [
    { name: 'France', played: 3, points: 9 },
    { name: 'Norway', played: 3, points: 6 },
    { name: 'Senegal', played: 3, points: 3 },
    { name: 'Iraq', played: 3, points: 0 },
  ] },
  { group: 'J', teams: [
    { name: 'Argentina', played: 3, points: 9 },
    { name: 'Austria', played: 3, points: 4 },
    { name: 'Algeria', played: 3, points: 4 },
    { name: 'Jordan', played: 3, points: 0 },
  ] },
  { group: 'K', teams: [
    { name: 'Colombia', played: 3, points: 7 },
    { name: 'Portugal', played: 3, points: 5 },
    { name: 'D.R. Congo', played: 3, points: 4, qualified: true },
    { name: 'Uzbekistan', played: 3, points: 0 },
  ] },
  { group: 'L', teams: [
    { name: 'England', played: 3, points: 7 },
    { name: 'Croatia', played: 3, points: 6 },
    { name: 'Ghana', played: 3, points: 4 },
    { name: 'Panama', played: 3, points: 0 },
  ] },
];

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getHoursUntil(value: string) {
  return (new Date(value).getTime() - Date.now()) / 36e5;
}

function isFutureMatch(prediction: WorldCupPrediction) {
  return prediction.status === 'live' || new Date(prediction.matchTime).getTime() >= Date.now();
}

function getSoonMatch(predictions: WorldCupPrediction[]) {
  return predictions
    .filter((prediction) => {
      const hours = getHoursUntil(prediction.matchTime);
      return hours >= 0 && hours <= 24;
    })
    .sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime())[0];
}

function isUpsetCandidate(prediction: WorldCupPrediction) {
  const favoriteEdge = Math.max(prediction.homeWin, prediction.awayWin) - Math.min(prediction.homeWin, prediction.awayWin);
  return prediction.confidence <= 58 || favoriteEdge <= 12 || prediction.draw >= 27;
}

function StartScreen({ onEnter }: { onEnter: (mode: Exclude<AccessMode, null>) => void }) {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    setMessage('');

    const request = authMode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { data, error } = await request;

    if (error) {
      setMessage(error.message);
      setIsBusy(false);
      return;
    }

    if (data.session) {
      onEnter('user');
      return;
    }

    setMessage('Аккаунт создан. Теперь можно войти.');
    setAuthMode('signin');
    setIsBusy(false);
  }

  async function handleGoogleSignIn() {
    setIsBusy(true);
    setMessage('');

    try {
      const settingsResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabaseAnonKey,
        },
      });
      const settings = await settingsResponse.json();

      if (!settings?.external?.google) {
        setMessage('Google вход пока не включен в Supabase проекте, который использует этот сайт.');
        setIsBusy(false);
        return;
      }
    } catch {
      setMessage('Не удалось проверить Google вход. Попробуй еще раз.');
      setIsBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
      setIsBusy(false);
    }
  }

  return (
    <main
      className="start-screen"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(18, 49, 58, 0.88), rgba(18, 49, 58, 0.58), rgba(18, 49, 58, 0.22)), url(${stadiumImage})`,
      }}
    >
      <section className="start-panel">
        <div className="start-copy">
          <p className="eyebrow">AI World Cup Predictor 2026</p>
          <h1>Прогнозы матчей, группы и AI-анализ в одном месте.</h1>
          <p>
            Смотри ближайшие матчи, прогнозируемый счет, вероятность победы и объяснение от AI.
            Можно войти в аккаунт или открыть сайт как гость.
          </p>
          <div className="start-features">
            <span>Live Supabase feed</span>
            <span>AI match chat</span>
            <span>Penalty game</span>
          </div>
        </div>

        <form className="auth-box" onSubmit={handleAuth}>
          <div className="auth-tabs">
            <button
              className={authMode === 'signin' ? 'is-active' : ''}
              onClick={() => setAuthMode('signin')}
              type="button"
            >
              Войти
            </button>
            <button
              className={authMode === 'signup' ? 'is-active' : ''}
              onClick={() => setAuthMode('signup')}
              type="button"
            >
              Регистрация
            </button>
          </div>

          <label>
            Email
            <input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label>
            Пароль
            <input
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button className="primary-auth" disabled={isBusy} type="submit">
            {isBusy ? 'Подождите...' : authMode === 'signin' ? 'Войти' : 'Создать аккаунт'}
          </button>
          <button className="google-auth" disabled={isBusy} onClick={handleGoogleSignIn} type="button">
            <span>G</span>
            Войти через Google
          </button>
          <button className="guest-auth" onClick={() => onEnter('guest')} type="button">
            Войти как гость
          </button>

          {message && <p className="auth-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

function MatchAssistant({ prediction }: { prediction: WorldCupPrediction }) {
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextMessage, setContextMessage] = useState('');

  useEffect(() => {
    setQuestion('');
    setAnalysis('');
    setContextMessage('');
  }, [prediction.id]);

  async function analyzeMatch(customQuestion = '') {
    setIsAnalyzing(true);
    setContextMessage('Checking internet context, player news, and team form...');

    let groundedContext: InternetContext | null = null;

    try {
      groundedContext = await loadInternetContext(prediction);
      setContextMessage('Internet context added to the AI forecast.');
    } catch {
      setContextMessage('Internet context unavailable. Forecast uses saved match data only.');
    }

    const prompt = [
      'You are a football match prediction assistant.',
      `Match: ${prediction.homeName} (${prediction.homeCode}) vs ${prediction.awayName} (${prediction.awayCode})`,
      `Kickoff: ${prediction.matchTime}`,
      `Venue: ${prediction.venue}`,
      `Consensus pick: ${prediction.consensusPick}`,
      `Projected score: ${prediction.predictedScore}`,
      `Probabilities: home ${prediction.homeWin}%, draw ${prediction.draw}%, away ${prediction.awayWin}%`,
      `Source summary: ${prediction.aiSummary}`,
      `Model confidence: ${prediction.confidence}%`,
      groundedContext?.text ? `Current internet context:\n${groundedContext.text}` : '',
      groundedContext?.sources.length
        ? `Sources:\n${groundedContext.sources.map((source) => `- ${source.title}: ${source.url}`).join('\n')}`
        : '',
      customQuestion ? `User question: ${customQuestion}` : '',
      '',
      'Give the user a practical decision guide.',
      customQuestion
        ? 'Answer the user question directly first, then include final pick, winning chances, score prediction, and risk level.'
        : 'Include: final pick, winning chances, score prediction, risk level, and what could change the prediction.',
      'Use the internet context for team form, key players, injuries, suspensions, availability, and tactical matchup notes.',
      'If player news is missing or unclear, say it is not confirmed.',
      'Separate verified facts from AI inference.',
      'Do not treat ScoreGPT, simulated brackets, prediction pages, or bracket generators as official fixtures, results, injuries, or lineups.',
      'Prediction pages may only support the prediction itself, not verified match facts.',
      'Start with a fixture verification note.',
      'Be honest if the prediction is uncertain. Do not invent live injuries, odds, results, or lineups.',
    ].filter(Boolean).join('\n');

    try {
      const { data, error } = await supabase.functions.invoke<{ text?: string }>('ai', {
        body: {
          prompt,
          system: 'You are a careful football prediction assistant. Use only provided match data unless the prompt includes sourced internet context. Keep the answer concise and decision-focused.',
        },
      });

      if (error || !data?.text) {
        throw error ?? new Error('No AI answer');
      }

      setAnalysis(data.text);
    } catch {
      const risk = isUpsetCandidate(prediction)
        ? 'Risk level: medium/high because the edge is narrow or confidence is limited.'
        : 'Risk level: medium/low because the model has a clearer favorite.';
      setAnalysis([
        `Final pick: ${prediction.consensusPick}.`,
        `Winning chances: ${prediction.homeCode} ${prediction.homeWin.toFixed(1)}%, draw ${prediction.draw.toFixed(1)}%, ${prediction.awayCode} ${prediction.awayWin.toFixed(1)}%.`,
        `Projected score: ${prediction.predictedScore}.`,
        risk,
        `Decision note: ${prediction.aiSummary}`,
      ].join('\n'));
    } finally {
      setIsAnalyzing(false);
    }
  }

  function askAssistant(event: FormEvent) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isAnalyzing) return;
    void analyzeMatch(trimmedQuestion);
  }

  return (
    <section className="match-assistant" aria-label="AI match assistant">
      <div className="section-title compact">
        <div>
          <p>AI assistant</p>
          <h2>Prediction advisor</h2>
        </div>
        <button disabled={isAnalyzing} onClick={() => analyzeMatch()} type="button">
          {isAnalyzing ? 'Analyzing' : 'Analyze match'}
        </button>
      </div>

      <div className="advisor-grid">
        <div>
          <span>AI pick</span>
          <strong>{prediction.consensusPick}</strong>
        </div>
        <div>
          <span>Score</span>
          <strong>{prediction.predictedScore}</strong>
        </div>
        <div>
          <span>{prediction.homeCode}</span>
          <strong>{prediction.homeWin.toFixed(1)}%</strong>
        </div>
        <div>
          <span>Draw</span>
          <strong>{prediction.draw.toFixed(1)}%</strong>
        </div>
        <div>
          <span>{prediction.awayCode}</span>
          <strong>{prediction.awayWin.toFixed(1)}%</strong>
        </div>
        <div>
          <span>Risk</span>
          <strong>{isUpsetCandidate(prediction) ? 'High' : 'Normal'}</strong>
        </div>
      </div>

      <p className="advisor-text">
        {analysis || `Press Analyze match to get a full AI decision guide for ${prediction.homeCode} vs ${prediction.awayCode}.`}
      </p>
      {contextMessage && <p className="advisor-context-note">{contextMessage}</p>}

      <form className="advisor-chat" onSubmit={askAssistant}>
        <input
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about chances, risk, draw, or predicted score"
          value={question}
        />
        <button disabled={isAnalyzing || !question.trim()} type="submit">
          {isAnalyzing ? 'Wait' : 'Send'}
        </button>
      </form>
    </section>
  );
}

function InternetContextPanel({ prediction }: { prediction: WorldCupPrediction }) {
  const [context, setContext] = useState<InternetContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Press refresh to pull current web context for this match.');

  useEffect(() => {
    setContext(null);
    setMessage('Press refresh to pull current web context for this match.');
  }, [prediction.id]);

  async function refreshContext() {
    setIsLoading(true);
    setMessage('Searching the internet and checking sources...');

    try {
      const nextContext = await loadInternetContext(prediction);
      setContext(nextContext);
      setMessage('Updated with internet-grounded context.');
    } catch {
      setContext({
        text: [
          `Could not reach the internet context service yet.`,
          `Use the model probabilities as a baseline: ${prediction.consensusPick} is the AI pick at ${prediction.confidence}% confidence, projected ${prediction.predictedScore}.`,
          `Check team news, injuries, travel, and confirmed lineups before making a final choice.`,
        ].join('\n'),
        sources: [],
      });
      setMessage('Internet context is unavailable. Showing local decision checklist.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="internet-context" aria-label="Internet match context">
      <div className="section-title compact">
        <div>
          <p>Internet check</p>
          <h2>Decision context</h2>
        </div>
        <button disabled={isLoading} onClick={refreshContext} type="button">
          {isLoading ? 'Searching' : 'Refresh'}
        </button>
      </div>

      <p className="context-status">{message}</p>
      {context && (
        <>
          <p className="context-text">{context.text}</p>
          {context.sources.length > 0 && (
            <div className="context-sources">
              {context.sources.map((source) => (
                <a href={source.url} key={source.url} rel="noreferrer" target="_blank">
                  {source.title}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MatchDetails({ prediction }: { prediction: WorldCupPrediction }) {
  const modelAgreement = prediction.modelBreakdown.filter((model) => model.pick === prediction.consensusPick).length;

  return (
    <section className="match-details" aria-label="Match details">
      <div className="section-title compact">
        <div>
          <p>Match page</p>
          <h2>Details</h2>
        </div>
        <span>{prediction.stage}</span>
      </div>
      <div className="detail-grid">
        <div>
          <span>Venue</span>
          <strong>{prediction.venue}</strong>
        </div>
        <div>
          <span>Kickoff</span>
          <strong>{formatMatchDate(prediction.matchTime)}</strong>
        </div>
        <div>
          <span>Models agree</span>
          <strong>{modelAgreement}/{prediction.modelBreakdown.length}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{prediction.status}</strong>
        </div>
      </div>
    </section>
  );
}

function MyPredictionBox({
  accessMode,
  prediction,
}: {
  accessMode: Exclude<AccessMode, null>;
  prediction: WorldCupPrediction;
}) {
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [savedPrediction, setSavedPrediction] = useState<UserMatchPrediction | null>(null);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMessage('');
    setScore('');
    setNote('');
    setSavedPrediction(null);

    if (accessMode === 'guest') {
      const raw = window.localStorage.getItem(`guest-prediction:${prediction.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as UserMatchPrediction;
        setSavedPrediction(parsed);
        setScore(parsed.predictedScore);
        setNote(parsed.note);
      }
      return;
    }

    void loadUserPrediction(prediction.id)
      .then((loaded) => {
        if (loaded) {
          setSavedPrediction(loaded);
          setScore(loaded.predictedScore);
          setNote(loaded.note);
        }
      })
      .catch(() => setMessage('Could not load your saved prediction.'));
  }, [accessMode, prediction]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      if (accessMode === 'guest') {
        const localPrediction: UserMatchPrediction = {
          matchId: prediction.id,
          predictedScore: score,
          note,
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(`guest-prediction:${prediction.id}`, JSON.stringify(localPrediction));
        setSavedPrediction(localPrediction);
        setMessage('Saved on this device as guest.');
      } else {
        const saved = await saveUserPrediction(prediction.id, score, note);
        setSavedPrediction(saved);
        setMessage('Saved to your account.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save prediction.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="my-prediction">
      <div className="section-title compact">
        <div>
          <p>My prediction</p>
          <h2>Your score</h2>
        </div>
        {savedPrediction && <span>{savedPrediction.predictedScore}</span>}
      </div>
      <form className="prediction-form" onSubmit={handleSave}>
        <input
          onChange={(event) => setScore(event.target.value)}
          pattern="^[0-9]{1,2}-[0-9]{1,2}$"
          placeholder="2-1"
          required
          value={score}
        />
        <input
          onChange={(event) => setNote(event.target.value)}
          placeholder="Short note"
          value={note}
        />
        <button disabled={isSaving} type="submit">
          {isSaving ? 'Saving' : 'Save'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </section>
  );
}

function PenaltyGame() {
  const resetTimer = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const [shots, setShots] = useState(0);
  const [goals, setGoals] = useState(0);
  const [keeperX, setKeeperX] = useState(50);
  const [keeperY, setKeeperY] = useState(44);
  const [keeperDive, setKeeperDive] = useState<KeeperDive>('center');
  const [target, setTarget] = useState<ShotTarget>({ x: 50, y: 78 });
  const [lastTarget, setLastTarget] = useState<ShotTarget>({ x: 50, y: 78 });
  const [shotState, setShotState] = useState<'ready' | 'goal' | 'saved'>('ready');
  const [message, setMessage] = useState('Move the cursor inside the goal and click to shoot.');
  const [isAutoRestarting, setIsAutoRestarting] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => () => {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
  }, []);

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function targetFromPointer(clientX: number, clientY: number, element: HTMLElement): ShotTarget {
    const rect = element.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 10, 90),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 10, 82),
    };
  }

  function aimWithMouse(event: PointerEvent<HTMLDivElement>) {
    if (shotState !== 'ready' || shots >= 5) return;
    setTarget(targetFromPointer(event.clientX, event.clientY, event.currentTarget));
  }

  function chooseKeeperMove(shot: ShotTarget): ShotTarget {
    const roll = Math.random();
    const randomX = 18 + Math.random() * 64;
    const randomY = 28 + Math.random() * 34;

    if (difficulty === 'easy' && roll < 0.62) {
      return {
        x: shot.x < 50 ? 72 + Math.random() * 14 : 14 + Math.random() * 14,
        y: randomY,
      };
    }

    if (difficulty === 'hard' && roll < 0.58) {
      return {
        x: clamp(shot.x + (Math.random() * 10 - 5), 14, 86),
        y: clamp(shot.y + (Math.random() * 14 - 7), 24, 62),
      };
    }

    if (difficulty === 'normal' && roll < 0.42) {
      return {
        x: clamp(shot.x + (Math.random() * 18 - 9), 14, 86),
        y: clamp(shot.y + (Math.random() * 20 - 10), 24, 62),
      };
    }

    return { x: randomX, y: randomY };
  }

  function playTone(type: 'kick' | 'goal' | 'save') {
    if (!soundEnabled) return;

    const AudioContextConstructor = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = audioContext.current ?? new AudioContextConstructor();
    audioContext.current = context;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const frequency = type === 'goal' ? 720 : type === 'save' ? 190 : 360;

    oscillator.type = type === 'goal' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(type === 'goal' ? 980 : 120, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(type === 'kick' ? 0.12 : 0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  function shoot(shot = target) {
    if (shots >= 5 || shotState !== 'ready') return;

    const keeperMove = chooseKeeperMove(shot);
    const reach = difficulty === 'hard' ? 20 : difficulty === 'easy' ? 13 : 17;
    const verticalReach = difficulty === 'hard' ? 24 : difficulty === 'easy' ? 16 : 20;
    const distanceX = Math.abs(shot.x - keeperMove.x);
    const distanceY = Math.abs(shot.y - keeperMove.y);
    const scored = distanceX > reach || distanceY > verticalReach;
    const ballEnd = scored ? shot : keeperMove;
    const nextShots = shots + 1;
    const nextGoals = goals + (scored ? 1 : 0);

    playTone('kick');
    window.setTimeout(() => playTone(scored ? 'goal' : 'save'), 120);
    setTarget(ballEnd);
    setLastTarget(shot);
    setKeeperX(keeperMove.x);
    setKeeperY(keeperMove.y);
    setKeeperDive(keeperMove.y < 34 ? 'up' : keeperMove.x < 43 ? 'left' : keeperMove.x > 57 ? 'right' : 'center');
    setShotState(scored ? 'goal' : 'saved');
    setShots(nextShots);
    setGoals(nextGoals);
    setMessage(scored ? 'Goal. Clean finish.' : 'Saved. The keeper reached it.');

    resetTimer.current = window.setTimeout(() => {
      if (nextShots >= 5) {
        setIsAutoRestarting(true);
        setMessage(`Series complete: ${nextGoals}/5. New round starts automatically.`);

        resetTimer.current = window.setTimeout(() => {
          setShots(0);
          setGoals(0);
          setTarget({ x: 50, y: 78 });
          setLastTarget({ x: 50, y: 78 });
          setKeeperX(50);
          setKeeperY(44);
          setKeeperDive('center');
          setShotState('ready');
          setIsAutoRestarting(false);
          setMessage('New round. Move the cursor inside the goal and click to shoot.');
        }, 2200);

        return;
      }

      setTarget({ x: 50, y: 78 });
      setKeeperX(50);
      setKeeperY(44);
      setKeeperDive('center');
      setShotState('ready');
      setMessage('Move the cursor inside the goal and click to shoot.');
    }, 850);
  }

  function resetGame() {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
    setShots(0);
    setGoals(0);
    setKeeperX(50);
    setKeeperY(44);
    setKeeperDive('center');
    setTarget({ x: 50, y: 78 });
    setLastTarget({ x: 50, y: 78 });
    setShotState('ready');
    setIsAutoRestarting(false);
    setMessage('Move the cursor inside the goal and click to shoot.');
  }

  function shootAtPointer(event: PointerEvent<HTMLDivElement>) {
    const shot = targetFromPointer(event.clientX, event.clientY, event.currentTarget);
    setTarget(shot);
    shoot(shot);
  }

  const goalStyle = {
    '--aim-x': `${target.x}%`,
    '--aim-y': `${target.y}%`,
    '--ball-x': shotState === 'ready' ? '50%' : `${target.x}%`,
    '--ball-y': shotState === 'ready' ? '84%' : `${target.y}%`,
    '--keeper-x': `${keeperX}%`,
    '--keeper-y': `${keeperY}%`,
    '--trail-offset': `${(lastTarget.x - 50) * 0.38}px`,
    '--trail-angle': `${(lastTarget.x - 50) * 0.72}deg`,
  } as CSSProperties;

  return (
    <section className="mini-game" aria-label="Penalty mini game">
      <div className="section-title">
        <div>
          <p>Mini game</p>
          <h2>Penalty shootout</h2>
        </div>
        <span className={shotState === 'goal' ? 'score-pop' : ''}>{goals}/5 goals</span>
      </div>

      <div className="game-options" aria-label="Penalty settings">
        <div className="difficulty-tabs">
          {(['easy', 'normal', 'hard'] as GameDifficulty[]).map((level) => (
            <button
              className={difficulty === level ? 'is-active' : ''}
              onClick={() => setDifficulty(level)}
              type="button"
              key={level}
            >
              {level}
            </button>
          ))}
        </div>
        <button className="sound-toggle" onClick={() => setSoundEnabled((enabled) => !enabled)} type="button">
          Sound {soundEnabled ? 'On' : 'Off'}
        </button>
        <button className="sound-toggle reset-shot" onClick={resetGame} type="button">
          Reset
        </button>
      </div>

      <div
        className={`goal-box ${shotState}`}
        onPointerDown={shootAtPointer}
        onPointerMove={aimWithMouse}
        role="button"
        style={goalStyle}
        tabIndex={0}
      >
        <div className="goal-frame" aria-hidden="true">
          <span className="goal-post goal-post-left" />
          <span className="goal-post goal-post-right" />
          <span className="goal-crossbar" />
        </div>
        <div className="net" />
        <div className="aim-cursor" aria-hidden="true" />
        <div className={`keeper keeper-dive-${keeperDive}`}>
          <span className="keeper-head" />
          <span className="keeper-arm keeper-arm-left" />
          <span className="keeper-body" />
          <span className="keeper-arm keeper-arm-right" />
        </div>
        <div className="shot-trail" />
        <div className={`striker striker-${shotState}`} aria-hidden="true">
          <span className="striker-head" />
          <span className="striker-body" />
          <span className="striker-arm striker-arm-left" />
          <span className="striker-arm striker-arm-right" />
          <span className="striker-leg striker-leg-left" />
          <span className="striker-leg striker-leg-right" />
        </div>
        <div className="ball" />
      </div>

      <div className="game-status">
        <strong>{message}</strong>
        <span>
          {isAutoRestarting
            ? 'Restarting...'
            : `Shot ${Math.min(shots + 1, 5)} of 5 / target ${Math.round(target.x)}-${Math.round(target.y)}`}
        </span>
      </div>
    </section>
  );
}

function App() {
  const [accessMode, setAccessMode] = useState<AccessMode>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedTheme = window.localStorage.getItem('theme-mode');
    return savedTheme === 'dark' || savedTheme === 'bmw-m' || savedTheme === 'lamborghini' || savedTheme === 'bugatti'
      ? savedTheme
      : 'light';
  });
  const [predictions, setPredictions] = useState<WorldCupPrediction[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(true);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');

  async function refreshPredictions() {
    setIsLoadingPredictions(true);

    try {
      let supabaseError = '';
      let sportScoreError = '';
      let nextPredictions: WorldCupPrediction[] = [];

      try {
        nextPredictions = (await loadUpcomingPredictions()).filter(isFutureMatch);
      } catch (error) {
        supabaseError = error instanceof Error ? error.message : 'Supabase unavailable';
      }

      if (nextPredictions.length === 0) {
        try {
          nextPredictions = await loadSportScoreMatches();
        } catch (error) {
          sportScoreError = error instanceof Error ? error.message : 'SportScore unavailable';
        }
      }

      if (nextPredictions.length > 0) {
        setPredictions(nextPredictions);
        setSelectedId((currentId) => nextPredictions.some((item) => item.id === currentId) ? currentId : nextPredictions[0].id);
        setIsLive(true);
        setLoadError('');
      } else {
        throw new Error([
          supabaseError && `Supabase: ${supabaseError}`,
          sportScoreError && `SportScore: ${sportScoreError}`,
        ].filter(Boolean).join(' / ') || 'No real match data is available right now.');
      }
    } catch (error) {
      setPredictions([]);
      setSelectedId('');
      setIsLive(false);
      setLoadError(error instanceof Error ? error.message : 'No real match data is available right now.');
    } finally {
      setIsLoadingPredictions(false);
    }
  }

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAccessMode('user');
      }
    });
  }, []);

  useEffect(() => {
    document.body.dataset.theme = themeMode;
    window.localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    void refreshPredictions();
    return subscribeToPredictions(() => {
      void refreshPredictions();
    });
  }, []);

  const upcomingPredictions = predictions.filter(isFutureMatch);
  const displayPredictions = upcomingPredictions;
  const selectedPrediction = displayPredictions.find((prediction) => prediction.id === selectedId) ?? displayPredictions[0] ?? null;
  const liveMatches = displayPredictions.filter((prediction) => prediction.status === 'live').length;
  const visiblePredictions = displayPredictions.filter((prediction) => {
    if (matchFilter === 'live') return prediction.status === 'live';
    if (matchFilter === 'high') return prediction.confidence >= 65;
    if (matchFilter === 'upset') return isUpsetCandidate(prediction);
    return true;
  });
  const averageConfidence = Math.round(
    displayPredictions.length > 0
      ? displayPredictions.reduce((sum, prediction) => sum + prediction.confidence, 0) / displayPredictions.length
      : 0,
  );
  const upsetAlert = [...displayPredictions]
    .filter((prediction) => prediction.consensusPick !== 'TBD')
    .sort((a, b) => a.confidence - b.confidence)[0] ?? null;
  const groups = groupStandings.filter((group) => ['A', 'E', 'I', 'L'].includes(group.group));
  const soonMatch = getSoonMatch(displayPredictions);

  if (!accessMode) {
    return <StartScreen onEnter={setAccessMode} />;
  }

  if (!selectedPrediction) {
    return (
      <main className="app-shell">
        <section
          className="hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(18, 49, 58, 0.88), rgba(18, 49, 58, 0.58), rgba(18, 49, 58, 0.18)), url(${stadiumImage})`,
          }}
        >
          <div className="hero-motion" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <nav className="topbar" aria-label="Primary navigation">
            <strong>ScoreAI 2026</strong>
            <div>
              <a href="#matches">Live matches</a>
              <a href="#groups">Groups</a>
              <a href="/profile.html">Profile</a>
              <a href="/themes.html">Themes</a>
              <button className="topbar-action" onClick={() => setAccessMode(null)} type="button">
                {accessMode === 'guest' ? 'Guest' : 'Account'}
              </button>
              <button
                className="topbar-action"
                onClick={() => setThemeMode((current) => current === 'light' ? 'dark' : 'light')}
                type="button"
              >
                {themeMode === 'light' ? 'Dark' : 'Light'}
              </button>
            </div>
          </nav>

          <div className="hero__content">
            <p className="eyebrow">Realtime World Cup predictions</p>
            <h1>Only real match data is shown.</h1>
            <p className="hero__copy">
              Supabase and SportScore are checked live. If neither source has upcoming or live matches,
              the site shows an error instead of a fake demo prediction.
            </p>
            <div className="hero__stats" aria-label="Prediction summary">
              <div>
                <span>0</span>
                <small>next matches</small>
              </div>
              <div>
                <span>{isLoadingPredictions ? 'Checking' : 'Error'}</span>
                <small>data source</small>
              </div>
              <div>
                <span>Real</span>
                <small>data mode</small>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard dashboard-empty" id="matches">
          <section className="match-board real-data-empty">
            <div className="section-title">
              <div>
                <p>Realtime feed</p>
                <h2>No real matches loaded</h2>
              </div>
              <span className="status-pill">Real only</span>
            </div>
            <p>
              {isLoadingPredictions
                ? 'Checking Supabase first, then SportScore football live/recent feed...'
                : loadError || 'No real upcoming or live matches are available right now.'}
            </p>
            <button disabled={isLoadingPredictions} onClick={refreshPredictions} type="button">
              {isLoadingPredictions ? 'Checking' : 'Refresh real data'}
            </button>
            <a href="https://sportscore.com/" rel="dofollow noreferrer" target="_blank">
              Powered by SportScore
            </a>
          </section>
        </section>

        <PenaltyGame />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(18, 49, 58, 0.88), rgba(18, 49, 58, 0.58), rgba(18, 49, 58, 0.18)), url(${stadiumImage})`,
        }}
      >
        <div className="hero-motion" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <nav className="topbar" aria-label="Primary navigation">
          <strong>ScoreAI 2026</strong>
          <div>
            <a href="#matches">Live matches</a>
            <a href="#models">AI models</a>
            <a href="#groups">Groups</a>
            <a href="/profile.html">Profile</a>
            <a href="/themes.html">Themes</a>
            <button className="topbar-action" onClick={() => setAccessMode(null)} type="button">
              {accessMode === 'guest' ? 'Guest' : 'Account'}
            </button>
            <button
              className="topbar-action"
              onClick={() => setThemeMode((current) => current === 'light' ? 'dark' : 'light')}
              type="button"
            >
              {themeMode === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </nav>

        <div className="hero__content">
          <p className="eyebrow">Realtime World Cup predictions</p>
          <h1>Next matches predicted live from Supabase.</h1>
          <p className="hero__copy">
            Watch upcoming fixtures, AI consensus picks, projected scores, and model confidence update
            instantly when prediction rows change in the database.
          </p>
          <div className="hero__stats" aria-label="Prediction summary">
            <div>
              <span>{displayPredictions.length}</span>
              <small>next matches</small>
            </div>
            <div>
              <span>{isLive ? 'Live' : 'Real'}</span>
              <small>data source</small>
            </div>
            <div>
              <span>{averageConfidence}%</span>
              <small>avg confidence</small>
            </div>
          </div>
        </div>
      </section>

      {soonMatch && (
        <section className="soon-alert">
          <span>Match soon</span>
          <strong>{soonMatch.homeCode} vs {soonMatch.awayCode}</strong>
          <small>{formatMatchDate(soonMatch.matchTime)} / AI pick {soonMatch.consensusPick}</small>
        </section>
      )}

      <section className="dashboard" id="matches">
        <section className="fixture-list" aria-label="Upcoming fixtures">
          <div className="section-title">
            <div>
              <p>Realtime feed</p>
              <h2>Next matches</h2>
            </div>
            <span className={isLive ? 'status-pill is-live' : 'status-pill'}>
              {isLive ? 'Connected' : 'Real only'}
            </span>
          </div>

          {loadError && <p className="feed-error">{loadError}</p>}

          <div className="filter-tabs" aria-label="Match filters">
            {[
              { key: 'all', label: 'All' },
              { key: 'live', label: 'Live' },
              { key: 'high', label: 'High confidence' },
              { key: 'upset', label: 'Upset alert' },
            ].map((filter) => (
              <button
                className={matchFilter === filter.key ? 'is-active' : ''}
                key={filter.key}
                onClick={() => setMatchFilter(filter.key as MatchFilter)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="fixture-stack">
            {visiblePredictions.map((prediction) => (
              <button
                className={prediction.id === selectedPrediction.id ? 'fixture-button is-active' : 'fixture-button'}
                key={prediction.id}
                onClick={() => setSelectedId(prediction.id)}
                type="button"
              >
                <span>{formatMatchDate(prediction.matchTime)} / {prediction.stage}</span>
                <strong>{prediction.homeCode} vs {prediction.awayCode}</strong>
                <small>AI pick: {prediction.consensusPick} / {prediction.confidence}%</small>
              </button>
            ))}
            {visiblePredictions.length === 0 && (
              <p className="empty-filter">No matches in this filter yet.</p>
            )}
          </div>
        </section>

        <section className="match-board">
          <div className="match-header">
            <div>
              <p>{selectedPrediction.stage} / {selectedPrediction.venue}</p>
              <h2>{selectedPrediction.homeName} vs {selectedPrediction.awayName}</h2>
            </div>
            <span>{formatMatchDate(selectedPrediction.matchTime)}</span>
          </div>

          <div className="consensus-card">
            <div className="team-side">
              <span>Home</span>
              <strong>{selectedPrediction.homeCode}</strong>
              <small>{selectedPrediction.homeWin.toFixed(1)}%</small>
            </div>
            <div className="pick-center">
              <span>AI consensus</span>
              <strong>{selectedPrediction.consensusPick}</strong>
              <small className="score-backdrop">Projected score {selectedPrediction.predictedScore}</small>
            </div>
            <div className="team-side align-right">
              <span>Away</span>
              <strong>{selectedPrediction.awayCode}</strong>
              <small>{selectedPrediction.awayWin.toFixed(1)}%</small>
            </div>
          </div>

          <div className="probability-row" aria-label="Consensus probabilities">
            <div style={{ width: `${selectedPrediction.homeWin}%` }}>Home</div>
            <div style={{ width: `${selectedPrediction.draw}%` }}>Draw</div>
            <div style={{ width: `${selectedPrediction.awayWin}%` }}>Away</div>
          </div>

          <article className="ai-summary">
            <span>AI read</span>
            <p>{selectedPrediction.aiSummary}</p>
            <div className="source-line">
              <strong>{selectedPrediction.sourceName}</strong>
              {selectedPrediction.sourceName.includes('SportScore') && (
                <a href="https://sportscore.com/" rel="dofollow noreferrer" target="_blank">
                  Powered by SportScore
                </a>
              )}
              {selectedPrediction.sourceUrl && (
                <a href={selectedPrediction.sourceUrl} rel="noreferrer" target="_blank">
                  Source
                </a>
              )}
            </div>
            <small>Updated {formatMatchDate(selectedPrediction.updatedAt)}</small>
          </article>

          <InternetContextPanel prediction={selectedPrediction} />

          <div className="model-grid" id="models">
            {selectedPrediction.modelBreakdown.map((model) => (
              <article className="model-card" key={model.model}>
                <div>
                  <span>Model prediction</span>
                  <strong>{model.model}</strong>
                </div>
                <div className="model-pick">{model.pick}</div>
                <div className="model-lines">
                  <span>Score {model.score}</span>
                  <span>Confidence {model.confidence}%</span>
                  <span>{selectedPrediction.status}</span>
                </div>
                <small>Updates when Supabase row changes</small>
              </article>
            ))}
          </div>

          <MatchDetails prediction={selectedPrediction} />
          <MyPredictionBox accessMode={accessMode} prediction={selectedPrediction} />
          <MatchAssistant prediction={selectedPrediction} />
        </section>

        <aside className="side-panel">
          {upsetAlert && (
            <div className="track-card upset-card">
              <span>Upset alert</span>
              <strong>{upsetAlert.homeCode} - {upsetAlert.awayCode}</strong>
              <p>{upsetAlert.consensusPick} is the pick, but confidence is only {upsetAlert.confidence}%.</p>
            </div>
          )}

          <div className="track-card">
            <span>Live now</span>
            <strong>{liveMatches}</strong>
            <p>Matches marked as live in Supabase.</p>
          </div>

          <div className="track-card">
            <span>Best value</span>
            <strong>{selectedPrediction.consensusPick}</strong>
            <p>Highest consensus probability for the selected match.</p>
          </div>

          <section className="groups" id="groups">
            <div className="section-title compact">
              <div>
                <p>Groups</p>
                <h2>Key groups</h2>
              </div>
            </div>
            {groups.map((group) => (
              <article className="group-card" key={group.group}>
                <strong>Group {group.group}</strong>
                <div className="group-heading">
                  <span>Team</span>
                  <small>P / Pts</small>
                </div>
                {group.teams.map((team, index) => (
                  <div className="group-row" key={team.name}>
                    <span>{index + 1}. {team.qualified ? '⚽ ' : ''}{team.name}</span>
                    <small>{team.played} / {team.points}</small>
                  </div>
                ))}
              </article>
            ))}
          </section>
        </aside>
      </section>

      <PenaltyGame />
    </main>
  );
}

export default App;
