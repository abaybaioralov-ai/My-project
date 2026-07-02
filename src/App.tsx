import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
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

type Aim = 'left' | 'center' | 'right';
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

const fallbackPredictions: WorldCupPrediction[] = [
  {
    id: 'usa-eng-fallback',
    matchTime: '2026-07-01T20:00:00Z',
    stage: 'Group B',
    venue: 'New York/New Jersey',
    homeName: 'USA',
    homeCode: 'USA',
    awayName: 'England',
    awayCode: 'ENG',
    homeWin: 24.8,
    draw: 22.4,
    awayWin: 52.8,
    predictedScore: '1-2',
    consensusPick: 'ENG',
    confidence: 63,
    aiSummary: 'England is favored by squad depth, while USA keeps upset value from host-region lift.',
    modelBreakdown: [
      { model: 'GPT-5', pick: 'ENG', score: '1-2', confidence: 64 },
      { model: 'Claude', pick: 'ENG', score: '1-1', confidence: 56 },
      { model: 'Gemini', pick: 'ENG', score: '2-3', confidence: 61 },
      { model: 'DeepSeek', pick: 'USA', score: '2-1', confidence: 42 },
    ],
    status: 'upcoming',
    sourceName: 'Fallback demo',
    sourceUrl: null,
    sourceUpdatedAt: null,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bra-sen-fallback',
    matchTime: '2026-07-01T23:00:00Z',
    stage: 'Group B',
    venue: 'Dallas',
    homeName: 'Brazil',
    homeCode: 'BRA',
    awayName: 'Senegal',
    awayCode: 'SEN',
    homeWin: 61.9,
    draw: 18.7,
    awayWin: 19.4,
    predictedScore: '2-1',
    consensusPick: 'BRA',
    confidence: 69,
    aiSummary: 'Brazil leads through attacking ceiling, but Senegal remains a counterattacking threat.',
    modelBreakdown: [
      { model: 'GPT-5', pick: 'BRA', score: '2-1', confidence: 69 },
      { model: 'Claude', pick: 'BRA', score: '1-0', confidence: 62 },
      { model: 'Gemini', pick: 'BRA', score: '3-1', confidence: 72 },
      { model: 'DeepSeek', pick: 'BRA', score: '2-2', confidence: 51 },
    ],
    status: 'upcoming',
    sourceName: 'Fallback demo',
    sourceUrl: null,
    sourceUpdatedAt: null,
    updatedAt: new Date().toISOString(),
  },
];

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

function localMatchAnswer(prediction: WorldCupPrediction, question: string) {
  const favorite = prediction.consensusPick;
  const risk = isUpsetCandidate(prediction) ? 'This is an upset-risk match because the model edge is narrow.' : 'The model sees a clearer favorite here.';

  return `${favorite} is the current AI pick for ${prediction.homeCode} vs ${prediction.awayCode}. Projected score: ${prediction.predictedScore}. ${risk} ${prediction.aiSummary} Question noted: "${question}"`;
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
  const [question, setQuestion] = useState('Why is this the AI pick?');
  const [answer, setAnswer] = useState(prediction.aiSummary);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    setQuestion('Why is this the AI pick?');
    setAnswer(prediction.aiSummary);
  }, [prediction]);

  async function askAi() {
    setIsAsking(true);

    const prompt = [
      `Match: ${prediction.homeName} (${prediction.homeCode}) vs ${prediction.awayName} (${prediction.awayCode})`,
      `Consensus pick: ${prediction.consensusPick}`,
      `Projected score: ${prediction.predictedScore}`,
      `Probabilities: home ${prediction.homeWin}%, draw ${prediction.draw}%, away ${prediction.awayWin}%`,
      `Source summary: ${prediction.aiSummary}`,
      `Question: ${question}`,
    ].join('\n');

    try {
      const { data, error } = await supabase.functions.invoke<{ text?: string }>('ai', {
        body: {
          prompt,
          system: 'Explain football match predictions in 2 concise sentences. Do not invent live facts.',
        },
      });

      if (error || !data?.text) {
        throw error ?? new Error('No AI answer');
      }

      setAnswer(data.text);
    } catch {
      setAnswer(localMatchAnswer(prediction, question));
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <section className="match-assistant" aria-label="AI match assistant">
      <div className="section-title compact">
        <div>
          <p>Ask AI</p>
          <h2>Match explanation</h2>
        </div>
      </div>
      <div className="assistant-row">
        <input
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about risk, score, or pick"
          value={question}
        />
        <button disabled={isAsking} onClick={askAi} type="button">
          {isAsking ? 'Thinking' : 'Ask'}
        </button>
      </div>
      <p>{answer}</p>
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
  const directions: Aim[] = ['left', 'center', 'right'];
  const resetTimer = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const [shots, setShots] = useState(0);
  const [goals, setGoals] = useState(0);
  const [keeper, setKeeper] = useState<Aim>('center');
  const [ball, setBall] = useState<Aim>('center');
  const [shotState, setShotState] = useState<'ready' | 'goal' | 'saved'>('ready');
  const [message, setMessage] = useState('Choose a corner and take the shot.');
  const [isAutoRestarting, setIsAutoRestarting] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => () => {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
  }, []);

  function directionFromPointer(clientX: number, element: HTMLElement): Aim {
    const rect = element.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;

    if (position < 0.34) return 'left';
    if (position > 0.66) return 'right';
    return 'center';
  }

  function aimWithMouse(event: PointerEvent<HTMLDivElement>) {
    if (shotState !== 'ready' || shots >= 5) return;
    setBall(directionFromPointer(event.clientX, event.currentTarget));
  }

  function chooseKeeperMove(direction: Aim): Aim {
    const roll = Math.random();

    if (difficulty === 'easy' && roll < 0.62) {
      return directions.filter((item) => item !== direction)[Math.floor(Math.random() * 2)];
    }

    if (difficulty === 'hard' && roll < 0.58) {
      return direction;
    }

    return directions[Math.floor(Math.random() * directions.length)];
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

  function shoot(direction = ball) {
    if (shots >= 5 || shotState !== 'ready') return;

    const keeperMove = chooseKeeperMove(direction);
    const scored = direction !== keeperMove;
    const nextShots = shots + 1;
    const nextGoals = goals + (scored ? 1 : 0);

    playTone('kick');
    window.setTimeout(() => playTone(scored ? 'goal' : 'save'), 120);
    setBall(direction);
    setKeeper(keeperMove);
    setShotState(scored ? 'goal' : 'saved');
    setShots(nextShots);
    setGoals(nextGoals);
    setMessage(scored ? 'Goal. Clean finish.' : 'Saved. The keeper read it.');

    resetTimer.current = window.setTimeout(() => {
      if (nextShots >= 5) {
        setIsAutoRestarting(true);
        setMessage(`Series complete: ${nextGoals}/5. New round starts automatically.`);

        resetTimer.current = window.setTimeout(() => {
          setShots(0);
          setGoals(0);
          setBall('center');
          setKeeper('center');
          setShotState('ready');
          setIsAutoRestarting(false);
          setMessage('New round. Aim with the mouse and click to shoot.');
        }, 2200);

        return;
      }

      setBall('center');
      setKeeper('center');
      setShotState('ready');
      setMessage('Aim with the mouse and click to shoot.');
    }, 850);
  }

  function resetGame() {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
    setShots(0);
    setGoals(0);
    setKeeper('center');
    setBall('center');
    setShotState('ready');
    setIsAutoRestarting(false);
    setMessage('Aim with the mouse and click to shoot.');
  }

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
      </div>

      <div
        className={`goal-box ${shotState}`}
        onClick={() => shoot()}
        onPointerMove={aimWithMouse}
        role="button"
        tabIndex={0}
      >
        <div className="goal-frame" aria-hidden="true">
          <span className="goal-post goal-post-left" />
          <span className="goal-post goal-post-right" />
          <span className="goal-crossbar" />
        </div>
        <div className="net" />
        <div className={`keeper keeper-${keeper}`}>
          <span className="keeper-head" />
          <span className="keeper-arm keeper-arm-left" />
          <span className="keeper-body" />
          <span className="keeper-arm keeper-arm-right" />
        </div>
        <div className={`shot-trail trail-${ball}`} />
        <div className={`striker striker-${ball} striker-${shotState}`} aria-hidden="true">
          <span className="striker-head" />
          <span className="striker-body" />
          <span className="striker-arm striker-arm-left" />
          <span className="striker-arm striker-arm-right" />
          <span className="striker-leg striker-leg-left" />
          <span className="striker-leg striker-leg-right" />
        </div>
        <div className={`ball ball-${ball}`} />
      </div>

      <div className="game-status">
        <strong>{message}</strong>
        <span>{isAutoRestarting ? 'Restarting...' : `Shot ${Math.min(shots + 1, 5)} of 5 / aim: ${ball}`}</span>
      </div>

      <div className="shot-controls">
        <button disabled={shots >= 5 || shotState !== 'ready'} onClick={() => shoot('left')} type="button">
          Left
        </button>
        <button disabled={shots >= 5 || shotState !== 'ready'} onClick={() => shoot('center')} type="button">
          Center
        </button>
        <button disabled={shots >= 5 || shotState !== 'ready'} onClick={() => shoot('right')} type="button">
          Right
        </button>
        <button className="reset-shot" onClick={resetGame} type="button">
          Reset
        </button>
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
  const [predictions, setPredictions] = useState<WorldCupPrediction[]>(fallbackPredictions);
  const [selectedId, setSelectedId] = useState(fallbackPredictions[0].id);
  const [isLive, setIsLive] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');

  async function refreshPredictions() {
    try {
      const nextPredictions = await loadUpcomingPredictions();

      if (nextPredictions.length > 0) {
        setPredictions(nextPredictions);
        setSelectedId((currentId) => nextPredictions.some((item) => item.id === currentId) ? currentId : nextPredictions[0].id);
        setIsLive(true);
        setLoadError('');
      }
    } catch (error) {
      setIsLive(false);
      setLoadError(error instanceof Error ? error.message : 'Supabase is unavailable');
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

  const selectedPrediction = predictions.find((prediction) => prediction.id === selectedId) ?? predictions[0];
  const liveMatches = predictions.filter((prediction) => prediction.status === 'live').length;
  const visiblePredictions = predictions.filter((prediction) => {
    if (matchFilter === 'live') return prediction.status === 'live';
    if (matchFilter === 'high') return prediction.confidence >= 65;
    if (matchFilter === 'upset') return isUpsetCandidate(prediction);
    return true;
  });
  const averageConfidence = Math.round(
    predictions.reduce((sum, prediction) => sum + prediction.confidence, 0) / predictions.length,
  );
  const upsetAlert = [...predictions]
    .filter((prediction) => prediction.consensusPick !== 'TBD')
    .sort((a, b) => a.confidence - b.confidence)[0] ?? predictions[0];
  const groups = groupStandings.filter((group) => ['A', 'E', 'I', 'L'].includes(group.group));
  const soonMatch = getSoonMatch(predictions);

  if (!accessMode) {
    return <StartScreen onEnter={setAccessMode} />;
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
              <span>{predictions.length}</span>
              <small>next matches</small>
            </div>
            <div>
              <span>{isLive ? 'Live' : 'Demo'}</span>
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
              {isLive ? 'Connected' : 'Fallback'}
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
              {selectedPrediction.sourceUrl && (
                <a href={selectedPrediction.sourceUrl} rel="noreferrer" target="_blank">
                  Source
                </a>
              )}
            </div>
            <small>Updated {formatMatchDate(selectedPrediction.updatedAt)}</small>
          </article>

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
          <div className="track-card upset-card">
            <span>Upset alert</span>
            <strong>{upsetAlert.homeCode} - {upsetAlert.awayCode}</strong>
            <p>{upsetAlert.consensusPick} is the pick, but confidence is only {upsetAlert.confidence}%.</p>
          </div>

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
