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

type ShotTarget = {
  x: number;
  y: number;
};
type KeeperDive = 'center' | 'left' | 'right' | 'up';
type AccessMode = 'guest' | 'user' | null;
type AuthMode = 'signin' | 'signup';
type MatchFilter = 'all' | 'live' | 'high' | 'upset';
type ThemeMode = 'light' | 'dark' | 'bmw-m' | 'lamborghini' | 'bugatti';
type LanguageMode = 'en' | 'ru';
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

const ruTeamNames: Record<string, string> = {
  Algeria: 'Алжир',
  Argentina: 'Аргентина',
  Australia: 'Австралия',
  Austria: 'Австрия',
  Belgium: 'Бельгия',
  'Bosnia & Herzegovina': 'Босния и Герцеговина',
  Brazil: 'Бразилия',
  Canada: 'Канада',
  'Cape Verde': 'Кабо-Верде',
  Colombia: 'Колумбия',
  Croatia: 'Хорватия',
  Curacao: 'Кюрасао',
  'Czech Republic': 'Чехия',
  'D.R. Congo': 'ДР Конго',
  Ecuador: 'Эквадор',
  Egypt: 'Египет',
  England: 'Англия',
  France: 'Франция',
  Germany: 'Германия',
  Ghana: 'Гана',
  Haiti: 'Гаити',
  Iran: 'Иран',
  Iraq: 'Ирак',
  'Ivory Coast': 'Кот-д’Ивуар',
  Japan: 'Япония',
  Jordan: 'Иордания',
  Mexico: 'Мексика',
  Morocco: 'Марокко',
  Netherlands: 'Нидерланды',
  'New Zealand': 'Новая Зеландия',
  Norway: 'Норвегия',
  Panama: 'Панама',
  Paraguay: 'Парагвай',
  Portugal: 'Португалия',
  Qatar: 'Катар',
  'Saudi Arabia': 'Саудовская Аравия',
  Scotland: 'Шотландия',
  Senegal: 'Сенегал',
  'South Africa': 'ЮАР',
  'South Korea': 'Южная Корея',
  Spain: 'Испания',
  Sweden: 'Швеция',
  Switzerland: 'Швейцария',
  Tunisia: 'Тунис',
  Turkey: 'Турция',
  Uruguay: 'Уругвай',
  USA: 'США',
  Uzbekistan: 'Узбекистан',
};

const copy = {
  en: {
    dateLocale: 'en-US',
    versus: 'vs',
    startTitle: 'Match predictions, groups, and AI analysis in one place.',
    startText: 'Watch upcoming matches, predicted scores, win chances, and AI explanations. Sign in or open the site as a guest.',
    feedTitle: 'Real match feed',
    feedText: 'ScoreGPT predictions are stored in Supabase and update from that source.',
    forecastTitle: 'AI forecast',
    forecastText: 'See pick, projected score, confidence, risk, and win chances.',
    askTitle: 'Ask about the match',
    askText: 'Chat about players, injuries, form, tactics, draw risk, or upsets.',
    note: 'No fake old matches: if real data is missing, the site shows an error instead of a demo.',
    startHere: 'Start here',
    authTitle: 'Save picks or enter as guest',
    authText: 'Account mode syncs your predictions. Guest mode opens the full site immediately.',
    signIn: 'Sign in',
    signUp: 'Register',
    password: 'Password',
    wait: 'Please wait...',
    createAccount: 'Create account',
    google: 'Continue with Google',
    guest: 'Enter as guest',
    liveMatches: 'Live matches',
    aiModels: 'AI models',
    groups: 'Groups',
    profile: 'Profile',
    themes: 'Themes',
    account: 'Account',
    dark: 'Dark',
    light: 'Light',
    heroEyebrow: 'Realtime World Cup predictions',
    heroTitle: 'Next matches predicted live from Supabase.',
    heroText: 'Watch upcoming fixtures, AI consensus picks, projected scores, and model confidence update instantly when prediction rows change in the database.',
    nextMatches: 'next matches',
    dataSource: 'data source',
    avgConfidence: 'avg confidence',
    matchSoon: 'Match soon',
    aiPick: 'AI pick',
    realtimeFeed: 'Realtime feed',
    connected: 'Connected',
    realOnly: 'Real only',
    all: 'All',
    live: 'Live',
    upcoming: 'Upcoming',
    highConfidence: 'High confidence',
    upsetAlert: 'Upset alert',
    noMatchesFilter: 'No matches in this filter yet.',
    home: 'Home',
    away: 'Away',
    draw: 'Draw',
    aiConsensus: 'AI consensus',
    projectedScore: 'Projected score',
    aiRead: 'AI read',
    source: 'Source',
    updated: 'Updated',
    modelPrediction: 'Model prediction',
    score: 'Score',
    confidence: 'Confidence',
    confidenceLevel: 'Confidence level',
    medium: 'Medium',
    risky: 'Risky',
    updatesWhenSupabase: 'Updates when Supabase row changes',
    liveNow: 'Live now',
    matchesMarkedLive: 'Matches marked as live in Supabase.',
    bestValue: 'Best value',
    highestConsensus: 'Highest consensus probability for the selected match.',
    keyGroups: 'Key groups',
    group: 'Group',
    team: 'Team',
    playedPoints: 'P / Pts',
    bottomLanguage: 'Site language',
    switchLanguage: 'Switch to Russian',
    realDataOnly: 'Real data only',
    playerContext: 'Player context',
    aiMatchChat: 'AI match chat',
    penaltyGame: 'Penalty game',
    accountCreated: 'Account created. You can sign in now.',
    googleDisabled: 'Google sign-in is not enabled in the Supabase project used by this site.',
    googleCheckFailed: 'Could not check Google sign-in. Try again.',
    aiAssistant: 'AI assistant',
    predictionAdvisor: 'Prediction advisor',
    analyzeMatch: 'Analyze match',
    analyzing: 'Analyzing',
    risk: 'Risk',
    high: 'High',
    normal: 'Normal',
    pressAnalyze: 'Press Analyze match to get a full AI decision guide',
    askPlaceholder: 'Ask about chances, risk, draw, or predicted score',
    send: 'Send',
    internetCheck: 'Internet check',
    decisionContext: 'Decision context',
    refresh: 'Refresh',
    searching: 'Searching',
    contextDefault: 'Press refresh to pull current web context for this match.',
    contextSearching: 'Searching the internet and checking sources...',
    contextUpdated: 'Updated with internet-grounded context.',
    contextUnavailable: 'Internet context is unavailable. Showing local decision checklist.',
    contextAdded: 'Internet context added to the AI forecast.',
    contextSavedOnly: 'Internet context unavailable. Forecast uses saved match data only.',
    contextFallback1: 'Could not reach the internet context service yet.',
    contextFallback3: 'Check team news, injuries, travel, and confirmed lineups before making a final choice.',
    finalPick: 'Final pick',
    winningChances: 'Winning chances',
    riskLevel: 'Risk level',
    decisionNote: 'Decision note',
    mediumHighRisk: 'medium/high because the edge is narrow or confidence is limited',
    mediumLowRisk: 'medium/low because the model has a clearer favorite',
    checking: 'Checking',
    error: 'Error',
    real: 'Real',
    dataMode: 'data mode',
    noRealMatches: 'No real matches loaded',
    checkingPredictions: 'Checking current ScoreGPT predictions from Supabase...',
    noCurrentPredictions: 'No current ScoreGPT predictions are available right now.',
    refreshRealData: 'Refresh real data',
    matchPage: 'Match page',
    details: 'Details',
    venue: 'Venue',
    kickoff: 'Kickoff',
    modelsAgree: 'Models agree',
    status: 'Status',
    myPrediction: 'My prediction',
    yourScore: 'Your score',
    shortNote: 'Short note',
    save: 'Save',
    saving: 'Saving',
    savedGuest: 'Saved on this device as guest.',
    savedAccount: 'Saved to your account.',
    couldNotLoadPrediction: 'Could not load your saved prediction.',
    couldNotSavePrediction: 'Could not save prediction.',
    miniGame: 'Mini game',
    penaltyShootout: 'Penalty shootout',
    goals: 'goals',
    sound: 'Sound',
    on: 'On',
    off: 'Off',
    reset: 'Reset',
    shot: 'Shot',
    of: 'of',
    target: 'target',
    restarting: 'Restarting...',
    gameReady: 'Move the cursor inside the goal and click to shoot.',
    gameGoal: 'Goal. Clean finish.',
    gameSaved: 'Saved. The keeper reached it.',
    seriesComplete: 'Series complete',
    newRoundAuto: 'New round starts automatically.',
    newRound: 'New round.',
    easy: 'Easy',
    hard: 'Hard',
    askAi: 'Ask AI',
    colorLegend: 'Color guide',
    legendData: 'Real data',
    legendFavorite: 'Favorite',
    legendRisk: 'Risk',
    legendAi: 'AI analysis',
    demoMatch: 'Portugal vs Spain',
    demoPick: 'AI pick: Portugal',
    demoScore: 'Projected score 2-1',
    demoConfidence: 'Confidence 62%',
    languageButton: 'RU',
  },
  ru: {
    dateLocale: 'ru-RU',
    versus: 'против',
    startTitle: 'Прогнозы матчей, группы и AI-анализ в одном месте.',
    startText: 'Смотри ближайшие матчи, прогноз счёта, шансы победы и объяснение от AI. Можно войти или открыть сайт как гость.',
    feedTitle: 'Реальные матчи',
    feedText: 'Прогнозы ScoreGPT сохраняются в Supabase и обновляются оттуда.',
    forecastTitle: 'AI-прогноз',
    forecastText: 'Смотри фаворита, счёт, уверенность, риск и шансы победы.',
    askTitle: 'Спроси про матч',
    askText: 'Можно спросить про игроков, травмы, форму, тактику, ничью или апсет.',
    note: 'Старые фейковые матчи не показываются: если данных нет, сайт показывает ошибку.',
    startHere: 'Начать здесь',
    authTitle: 'Сохраняй прогнозы или зайди гостем',
    authText: 'Аккаунт синхронизирует прогнозы. Гость сразу открывает сайт.',
    signIn: 'Войти',
    signUp: 'Регистрация',
    password: 'Пароль',
    wait: 'Подождите...',
    createAccount: 'Создать аккаунт',
    google: 'Войти через Google',
    guest: 'Войти как гость',
    liveMatches: 'Матчи',
    aiModels: 'AI модели',
    groups: 'Группы',
    profile: 'Профиль',
    themes: 'Темы',
    account: 'Аккаунт',
    dark: 'Тёмная',
    light: 'Светлая',
    heroEyebrow: 'Прогнозы ЧМ в реальном времени',
    heroTitle: 'Ближайшие матчи с live AI-прогнозом.',
    heroText: 'Смотри матчи, выбор AI, прогноз счёта и уверенность модели. Данные обновляются, когда меняются строки в Supabase.',
    nextMatches: 'матчей',
    dataSource: 'источник',
    avgConfidence: 'средняя уверенность',
    matchSoon: 'Скоро матч',
    aiPick: 'Выбор AI',
    realtimeFeed: 'Лента матчей',
    connected: 'Подключено',
    realOnly: 'Только реальные',
    all: 'Все',
    live: 'Live',
    upcoming: 'Скоро',
    highConfidence: 'Высокая уверенность',
    upsetAlert: 'Апсет',
    noMatchesFilter: 'В этом фильтре пока нет матчей.',
    home: 'Хозяева',
    away: 'Гости',
    draw: 'Ничья',
    aiConsensus: 'Выбор AI',
    projectedScore: 'Прогноз счёта',
    aiRead: 'AI-анализ',
    source: 'Источник',
    updated: 'Обновлено',
    modelPrediction: 'Прогноз модели',
    score: 'Счёт',
    confidence: 'Уверенность',
    confidenceLevel: 'Уровень уверенности',
    medium: 'Средний',
    risky: 'Риск',
    updatesWhenSupabase: 'Обновляется при изменении строки в Supabase',
    liveNow: 'Live сейчас',
    matchesMarkedLive: 'Матчи, отмеченные как live в Supabase.',
    bestValue: 'Лучший выбор',
    highestConsensus: 'Самая высокая вероятность по выбранному матчу.',
    keyGroups: 'Главные группы',
    group: 'Группа',
    team: 'Команда',
    playedPoints: 'И / Очки',
    bottomLanguage: 'Язык сайта',
    switchLanguage: 'Switch to English',
    realDataOnly: 'Только реальные данные',
    playerContext: 'Контекст игроков',
    aiMatchChat: 'AI-чат по матчу',
    penaltyGame: 'Игра пенальти',
    accountCreated: 'Аккаунт создан. Теперь можно войти.',
    googleDisabled: 'Google-вход пока не включен в Supabase-проекте этого сайта.',
    googleCheckFailed: 'Не удалось проверить Google-вход. Попробуй еще раз.',
    aiAssistant: 'AI-помощник',
    predictionAdvisor: 'Советник по прогнозу',
    analyzeMatch: 'Разобрать матч',
    analyzing: 'Анализ...',
    risk: 'Риск',
    high: 'Высокий',
    normal: 'Обычный',
    pressAnalyze: 'Нажми «Разобрать матч», чтобы получить полный AI-разбор',
    askPlaceholder: 'Спроси про шансы, риск, ничью или счет',
    send: 'Отправить',
    internetCheck: 'Проверка интернета',
    decisionContext: 'Контекст решения',
    refresh: 'Обновить',
    searching: 'Поиск',
    contextDefault: 'Нажми обновить, чтобы подтянуть свежий контекст по матчу.',
    contextSearching: 'Ищу информацию в интернете и проверяю источники...',
    contextUpdated: 'Обновлено с учетом интернет-контекста.',
    contextUnavailable: 'Интернет-контекст недоступен. Показываю локальный чеклист.',
    contextAdded: 'Интернет-контекст добавлен в AI-прогноз.',
    contextSavedOnly: 'Интернет-контекст недоступен. Прогноз использует только сохраненные данные матча.',
    contextFallback1: 'Пока не удалось получить интернет-контекст.',
    contextFallback3: 'Перед финальным выбором проверь новости команд, травмы, перелеты и составы.',
    finalPick: 'Итоговый выбор',
    winningChances: 'Шансы',
    riskLevel: 'Уровень риска',
    decisionNote: 'Заметка',
    mediumHighRisk: 'средний/высокий, потому что преимущество небольшое или уверенность ограничена',
    mediumLowRisk: 'средний/низкий, потому что у модели есть более явный фаворит',
    checking: 'Проверка',
    error: 'Ошибка',
    real: 'Реальные',
    dataMode: 'режим данных',
    noRealMatches: 'Реальные матчи не загружены',
    checkingPredictions: 'Проверяю текущие прогнозы ScoreGPT из Supabase...',
    noCurrentPredictions: 'Сейчас нет актуальных прогнозов ScoreGPT.',
    refreshRealData: 'Обновить реальные данные',
    matchPage: 'Страница матча',
    details: 'Детали',
    venue: 'Стадион',
    kickoff: 'Начало',
    modelsAgree: 'Согласие моделей',
    status: 'Статус',
    myPrediction: 'Мой прогноз',
    yourScore: 'Твой счет',
    shortNote: 'Короткая заметка',
    save: 'Сохранить',
    saving: 'Сохранение',
    savedGuest: 'Сохранено на этом устройстве как гость.',
    savedAccount: 'Сохранено в аккаунт.',
    couldNotLoadPrediction: 'Не удалось загрузить сохраненный прогноз.',
    couldNotSavePrediction: 'Не удалось сохранить прогноз.',
    miniGame: 'Мини-игра',
    penaltyShootout: 'Серия пенальти',
    goals: 'голов',
    sound: 'Звук',
    on: 'Вкл',
    off: 'Выкл',
    reset: 'Сброс',
    shot: 'Удар',
    of: 'из',
    target: 'цель',
    restarting: 'Перезапуск...',
    gameReady: 'Наведи курсор внутри ворот и кликни, чтобы ударить.',
    gameGoal: 'Гол. Чистый удар.',
    gameSaved: 'Сейв. Вратарь достал мяч.',
    seriesComplete: 'Серия завершена',
    newRoundAuto: 'Новый раунд начнется автоматически.',
    newRound: 'Новый раунд.',
    easy: 'Легко',
    hard: 'Сложно',
    askAi: 'Спросить AI',
    colorLegend: 'Цвета блоков',
    legendData: 'Реальные данные',
    legendFavorite: 'Фаворит',
    legendRisk: 'Риск',
    legendAi: 'AI-анализ',
    demoMatch: 'Португалия против Испания',
    demoPick: 'Выбор AI: Португалия',
    demoScore: 'Прогноз счёта 2-1',
    demoConfidence: 'Уверенность 62%',
    languageButton: 'EN',
  },
} as const;

type UiCopy = (typeof copy)[LanguageMode];

function formatMatchDate(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
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

function formatMatchStatus(status: WorldCupPrediction['status'], text: UiCopy) {
  if (status === 'live') return text.live;
  if (status === 'upcoming') return text.upcoming;
  return status;
}

function formatStage(stage: string, text: UiCopy) {
  return stage.replace(/^Group\b/i, text.group);
}

function formatTeamName(name: string, languageMode: LanguageMode) {
  return languageMode === 'ru' ? ruTeamNames[name] ?? name : name;
}

function formatMatchLabel(prediction: WorldCupPrediction, languageMode: LanguageMode, text: UiCopy) {
  if (languageMode === 'ru') {
    return `${formatTeamName(prediction.homeName, languageMode)} ${text.versus} ${formatTeamName(prediction.awayName, languageMode)}`;
  }

  return `${prediction.homeCode} ${text.versus} ${prediction.awayCode}`;
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

function getConfidenceBadge(prediction: WorldCupPrediction, text: UiCopy) {
  if (isUpsetCandidate(prediction) || prediction.confidence < 58) {
    return { className: 'is-risky', label: text.risky };
  }

  if (prediction.confidence >= 68) {
    return { className: 'is-high', label: text.high };
  }

  return { className: 'is-medium', label: text.medium };
}

function splitScore(score: string) {
  const [home = '-', away = '-'] = score.split('-').map((part) => part.trim());
  return { home, away };
}

function StartScreen({
  languageMode,
  onEnter,
  onToggleLanguage,
}: {
  languageMode: LanguageMode;
  onEnter: (mode: Exclude<AccessMode, null>) => void;
  onToggleLanguage: () => void;
}) {
  const text = copy[languageMode];
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

    setMessage(text.accountCreated);
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
        setMessage(text.googleDisabled);
        setIsBusy(false);
        return;
      }
    } catch {
      setMessage(text.googleCheckFailed);
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
        <button className="language-toggle start-language-toggle" onClick={onToggleLanguage} type="button">
          {text.languageButton}
        </button>
        <div className="start-copy">
          <p className="eyebrow">AI World Cup Predictor 2026</p>
          <h1>{text.startTitle}</h1>
          <p>{text.startText}</p>
          <div className="welcome-demo-card" aria-label="Example prediction">
            <div>
              <span>{text.demoMatch}</span>
              <strong>{text.demoScore}</strong>
            </div>
            <div>
              <small>{text.demoPick}</small>
              <small>{text.demoConfidence}</small>
            </div>
          </div>
          <div className="start-quick-guide" aria-label="30 second site guide">
            <article>
              <span>1</span>
              <strong>{text.feedTitle}</strong>
              <small>{text.feedText}</small>
            </article>
            <article>
              <span>2</span>
              <strong>{text.forecastTitle}</strong>
              <small>{text.forecastText}</small>
            </article>
            <article>
              <span>3</span>
              <strong>{text.askTitle}</strong>
              <small>{text.askText}</small>
            </article>
          </div>
          <p className="start-data-note">
            {text.note}
          </p>
          <div className="start-features">
            <span>{text.realDataOnly}</span>
            <span>{text.playerContext}</span>
            <span>{text.aiMatchChat}</span>
            <span>{text.penaltyGame}</span>
          </div>
        </div>

        <form className="auth-box" onSubmit={handleAuth}>
          <div className="auth-intro">
            <span>{text.startHere}</span>
            <strong>{text.authTitle}</strong>
            <p>{text.authText}</p>
          </div>
          <div className="auth-tabs">
            <button
              className={authMode === 'signin' ? 'is-active' : ''}
              onClick={() => setAuthMode('signin')}
              type="button"
            >
              {text.signIn}
            </button>
            <button
              className={authMode === 'signup' ? 'is-active' : ''}
              onClick={() => setAuthMode('signup')}
              type="button"
            >
              {text.signUp}
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
            {isBusy ? text.wait : authMode === 'signin' ? text.signIn : text.createAccount}
          </button>
          <button className="google-auth" disabled={isBusy} onClick={handleGoogleSignIn} type="button">
            <span>G</span>
            {text.google}
          </button>
          <button className="guest-auth" onClick={() => onEnter('guest')} type="button">
            {text.guest}
          </button>

          {message && <p className="auth-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

function MatchAssistant({
  languageMode,
  prediction,
  text,
}: {
  languageMode: LanguageMode;
  prediction: WorldCupPrediction;
  text: UiCopy;
}) {
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
    setContextMessage(text.contextSearching);

    let groundedContext: InternetContext | null = null;
    const responseLanguage = text.dateLocale === 'ru-RU' ? 'Russian' : 'English';

    try {
      groundedContext = await loadInternetContext(prediction);
      setContextMessage(text.contextAdded);
    } catch {
      setContextMessage(text.contextSavedOnly);
    }

    const prompt = [
      'You are a football match prediction assistant.',
      `Answer in ${responseLanguage}.`,
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
        ? `${text.riskLevel}: ${text.mediumHighRisk}.`
        : `${text.riskLevel}: ${text.mediumLowRisk}.`;
      setAnalysis([
        `${text.finalPick}: ${prediction.consensusPick}.`,
        `${text.winningChances}: ${prediction.homeCode} ${prediction.homeWin.toFixed(1)}%, ${text.draw.toLowerCase()} ${prediction.draw.toFixed(1)}%, ${prediction.awayCode} ${prediction.awayWin.toFixed(1)}%.`,
        `${text.projectedScore}: ${prediction.predictedScore}.`,
        risk,
        `${text.decisionNote}: ${prediction.aiSummary}`,
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
    <section className="match-assistant" id="ai-assistant" aria-label="AI match assistant">
      <div className="section-title compact">
        <div>
          <p>{text.aiAssistant}</p>
          <h2>{text.predictionAdvisor}</h2>
        </div>
        <button disabled={isAnalyzing} onClick={() => analyzeMatch()} type="button">
          {isAnalyzing ? text.analyzing : text.analyzeMatch}
        </button>
      </div>

      <div className="advisor-grid">
        <div>
          <span>{text.aiPick}</span>
          <strong>{prediction.consensusPick}</strong>
        </div>
        <div>
          <span>{text.score}</span>
          <strong>{prediction.predictedScore}</strong>
        </div>
        <div>
          <span>{prediction.homeCode}</span>
          <strong>{prediction.homeWin.toFixed(1)}%</strong>
        </div>
        <div>
          <span>{text.draw}</span>
          <strong>{prediction.draw.toFixed(1)}%</strong>
        </div>
        <div>
          <span>{prediction.awayCode}</span>
          <strong>{prediction.awayWin.toFixed(1)}%</strong>
        </div>
        <div>
          <span>{text.risk}</span>
          <strong>{isUpsetCandidate(prediction) ? text.high : text.normal}</strong>
        </div>
      </div>

      <p className="advisor-text">
        {analysis || `${text.pressAnalyze} ${formatTeamName(prediction.homeName, languageMode)} ${text.versus} ${formatTeamName(prediction.awayName, languageMode)}.`}
      </p>
      {contextMessage && <p className="advisor-context-note">{contextMessage}</p>}

      <form className="advisor-chat" onSubmit={askAssistant}>
        <input
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={text.askPlaceholder}
          value={question}
        />
        <button disabled={isAnalyzing || !question.trim()} type="submit">
          {isAnalyzing ? text.wait : text.send}
        </button>
      </form>
    </section>
  );
}

function InternetContextPanel({ prediction, text }: { prediction: WorldCupPrediction; text: UiCopy }) {
  const [context, setContext] = useState<InternetContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>(text.contextDefault);

  useEffect(() => {
    setContext(null);
    setMessage(text.contextDefault);
  }, [prediction.id, text.contextDefault]);

  async function refreshContext() {
    setIsLoading(true);
    setMessage(text.contextSearching);

    try {
      const nextContext = await loadInternetContext(prediction);
      setContext(nextContext);
      setMessage(text.contextUpdated);
    } catch {
      setContext({
        text: [
          text.contextFallback1,
          `${text.aiPick}: ${prediction.consensusPick}, ${text.confidence.toLowerCase()} ${prediction.confidence}%, ${text.projectedScore.toLowerCase()} ${prediction.predictedScore}.`,
          text.contextFallback3,
        ].join('\n'),
        sources: [],
      });
      setMessage(text.contextUnavailable);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="internet-context" aria-label="Internet match context">
      <div className="section-title compact">
        <div>
          <p>{text.internetCheck}</p>
          <h2>{text.decisionContext}</h2>
        </div>
        <button disabled={isLoading} onClick={refreshContext} type="button">
          {isLoading ? text.searching : text.refresh}
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

type GeneratedForecast = {
  pick: string;
  score: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  summary: string;
};

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI did not return JSON.');
  return JSON.parse(match[0]) as GeneratedForecast;
}

function clampPercent(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(100, Math.max(0, number));
}

function normalizeForecast(rawForecast: GeneratedForecast, prediction: WorldCupPrediction): GeneratedForecast {
  const homeWin = Math.min(72, clampPercent(rawForecast.homeWin, 34));
  const draw = Math.max(14, clampPercent(rawForecast.draw, 28));
  const awayWin = Math.min(72, clampPercent(rawForecast.awayWin, 38));
  const total = homeWin + draw + awayWin || 100;
  const normalizedHome = Number(((homeWin / total) * 100).toFixed(1));
  const normalizedDraw = Number(((draw / total) * 100).toFixed(1));
  const normalizedAway = Number((100 - normalizedHome - normalizedDraw).toFixed(1));
  const pick = String(rawForecast.pick || '').toUpperCase();
  const safePick = [prediction.homeCode, prediction.awayCode, 'DRAW'].includes(pick)
    ? pick
    : normalizedHome >= normalizedAway && normalizedHome >= normalizedDraw
      ? prediction.homeCode
      : normalizedAway >= normalizedDraw
        ? prediction.awayCode
        : 'DRAW';

  return {
    pick: safePick,
    score: String(rawForecast.score || '1-1').slice(0, 7),
    homeWin: normalizedHome,
    draw: normalizedDraw,
    awayWin: normalizedAway,
    confidence: Math.round(clampPercent(rawForecast.confidence, Math.max(normalizedHome, normalizedAway, normalizedDraw))),
    summary: String(rawForecast.summary || `AI generated a forecast for ${prediction.homeName} vs ${prediction.awayName}.`),
  };
}

async function completePredictionWithAi(prediction: WorldCupPrediction): Promise<WorldCupPrediction> {
  const alreadyHasForecast = prediction.consensusPick !== 'TBD'
    && prediction.predictedScore !== 'TBD'
    && prediction.confidence > 0;

  if (alreadyHasForecast) return prediction;

  const prompt = [
    'You are a careful football prediction model.',
    'Generate a structured forecast for this World Cup 2026 match.',
    `Match: ${prediction.homeName} (${prediction.homeCode}) vs ${prediction.awayName} (${prediction.awayCode})`,
    `Stage: ${prediction.stage}`,
    `Kickoff: ${prediction.matchTime}`,
    `Source note: ${prediction.aiSummary}`,
    '',
    'Return ONLY valid JSON, no markdown:',
    '{',
    `  "pick": "${prediction.homeCode} | ${prediction.awayCode} | DRAW",`,
    '  "score": "1-0",',
    '  "homeWin": 40,',
    '  "draw": 25,',
    '  "awayWin": 35,',
    '  "confidence": 55,',
    '  "summary": "One short reason for the pick."',
    '}',
    '',
    'Rules:',
    '- Do not invent official results.',
    '- This is an AI forecast, not confirmed fact.',
    '- Percentages must add up to about 100.',
    '- Score must be plausible for football.',
  ].join('\n');

  try {
    const { data, error } = await supabase.functions.invoke<{ text?: string }>('ai', {
      body: {
        prompt,
        system: 'Return strict JSON only. You are estimating football match probabilities and scorelines.',
      },
    });

    if (error || !data?.text) {
      throw error ?? new Error('No AI forecast returned.');
    }

    const forecast = normalizeForecast(extractJson(data.text), prediction);

    return {
      ...prediction,
      homeWin: forecast.homeWin,
      draw: forecast.draw,
      awayWin: forecast.awayWin,
      predictedScore: forecast.score,
      consensusPick: forecast.pick,
      confidence: forecast.confidence,
      aiSummary: `${forecast.summary} Generated by AI because ScoreGPT has not published this match score yet.`,
      modelBreakdown: [
        ...prediction.modelBreakdown.filter((model) => model.pick !== 'TBD'),
        {
          model: 'AI generated forecast',
          pick: forecast.pick,
          score: forecast.score,
          confidence: forecast.confidence,
        },
      ],
      sourceName: `${prediction.sourceName} + AI forecast`,
    };
  } catch {
    return prediction;
  }
}

async function completeMissingPredictions(predictions: WorldCupPrediction[]) {
  return Promise.all(predictions.map((prediction) => completePredictionWithAi(prediction)));
}

function MatchDetails({ prediction, text }: { prediction: WorldCupPrediction; text: UiCopy }) {
  const modelAgreement = prediction.modelBreakdown.filter((model) => model.pick === prediction.consensusPick).length;

  return (
    <section className="match-details" aria-label="Match details">
      <div className="section-title compact">
        <div>
          <p>{text.matchPage}</p>
          <h2>{text.details}</h2>
        </div>
        <span>{formatStage(prediction.stage, text)}</span>
      </div>
      <div className="detail-grid">
        <div>
          <span>{text.venue}</span>
          <strong>{prediction.venue}</strong>
        </div>
        <div>
          <span>{text.kickoff}</span>
          <strong>{formatMatchDate(prediction.matchTime, text.dateLocale)}</strong>
        </div>
        <div>
          <span>{text.modelsAgree}</span>
          <strong>{modelAgreement}/{prediction.modelBreakdown.length}</strong>
        </div>
        <div>
          <span>{text.status}</span>
          <strong>{formatMatchStatus(prediction.status, text)}</strong>
        </div>
      </div>
    </section>
  );
}

function MyPredictionBox({
  accessMode,
  prediction,
  text,
}: {
  accessMode: Exclude<AccessMode, null>;
  prediction: WorldCupPrediction;
  text: UiCopy;
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
      .catch(() => setMessage(text.couldNotLoadPrediction));
  }, [accessMode, prediction, text.couldNotLoadPrediction]);

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
        setMessage(text.savedGuest);
      } else {
        const saved = await saveUserPrediction(prediction.id, score, note);
        setSavedPrediction(saved);
        setMessage(text.savedAccount);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.couldNotSavePrediction);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="my-prediction">
      <div className="section-title compact">
        <div>
          <p>{text.myPrediction}</p>
          <h2>{text.yourScore}</h2>
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
          placeholder={text.shortNote}
          value={note}
        />
        <button disabled={isSaving} type="submit">
          {isSaving ? text.saving : text.save}
        </button>
      </form>
      {message && <p>{message}</p>}
    </section>
  );
}

function PenaltyGame({ text }: { text: UiCopy }) {
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
  const [message, setMessage] = useState<string>(text.gameReady);
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
    setMessage(scored ? text.gameGoal : text.gameSaved);

    resetTimer.current = window.setTimeout(() => {
      if (nextShots >= 5) {
        setIsAutoRestarting(true);
        setMessage(`${text.seriesComplete}: ${nextGoals}/5. ${text.newRoundAuto}`);

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
          setMessage(`${text.newRound} ${text.gameReady}`);
        }, 2200);

        return;
      }

      setTarget({ x: 50, y: 78 });
      setKeeperX(50);
      setKeeperY(44);
      setKeeperDive('center');
      setShotState('ready');
      setMessage(text.gameReady);
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
    setMessage(text.gameReady);
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
          <p>{text.miniGame}</p>
          <h2>{text.penaltyShootout}</h2>
        </div>
        <span className={shotState === 'goal' ? 'score-pop' : ''}>{goals}/5 {text.goals}</span>
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
              {level === 'easy' ? text.easy : level === 'hard' ? text.hard : text.normal}
            </button>
          ))}
        </div>
        <button className="sound-toggle" onClick={() => setSoundEnabled((enabled) => !enabled)} type="button">
          {text.sound} {soundEnabled ? text.on : text.off}
        </button>
        <button className="sound-toggle reset-shot" onClick={resetGame} type="button">
          {text.reset}
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
            ? text.restarting
            : `${text.shot} ${Math.min(shots + 1, 5)} ${text.of} 5 / ${text.target} ${Math.round(target.x)}-${Math.round(target.y)}`}
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
  const [languageMode, setLanguageMode] = useState<LanguageMode>(() => (
    window.localStorage.getItem('language-mode') === 'ru' ? 'ru' : 'en'
  ));
  const text = copy[languageMode];
  const [predictions, setPredictions] = useState<WorldCupPrediction[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(true);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');

  async function refreshPredictions() {
    setIsLoadingPredictions(true);

    try {
      let nextPredictions: WorldCupPrediction[] = [];

      try {
        nextPredictions = (await loadUpcomingPredictions()).filter(isFutureMatch);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Supabase unavailable');
      }

      if (nextPredictions.length > 0) {
        const completedPredictions = await completeMissingPredictions(nextPredictions);
        setPredictions(completedPredictions);
        setSelectedId((currentId) => completedPredictions.some((item) => item.id === currentId) ? currentId : completedPredictions[0].id);
        setIsLive(true);
        setLoadError('');
      } else {
        throw new Error('No current ScoreGPT predictions are available in Supabase right now.');
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
    document.documentElement.lang = languageMode;
    window.localStorage.setItem('language-mode', languageMode);
  }, [languageMode]);

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
  const confidenceBadge = selectedPrediction ? getConfidenceBadge(selectedPrediction, text) : null;
  const selectedScore = selectedPrediction ? splitScore(selectedPrediction.predictedScore) : null;
  const toggleLanguage = () => setLanguageMode((current) => current === 'en' ? 'ru' : 'en');

  if (!accessMode) {
    return (
      <StartScreen
        languageMode={languageMode}
        onEnter={setAccessMode}
        onToggleLanguage={toggleLanguage}
      />
    );
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
              <a href="#matches">{text.liveMatches}</a>
              <a href="#groups">{text.groups}</a>
              <a href="/profile.html">{text.profile}</a>
              <a href="/themes.html">{text.themes}</a>
              <button className="topbar-action" onClick={() => setAccessMode(null)} type="button">
                {accessMode === 'guest' ? 'Guest' : text.account}
              </button>
              <button className="topbar-action language-toggle" onClick={toggleLanguage} type="button">
                {text.languageButton}
              </button>
              <button
                className="topbar-action"
                onClick={() => setThemeMode((current) => current === 'light' ? 'dark' : 'light')}
                type="button"
              >
                {themeMode === 'light' ? text.dark : text.light}
              </button>
            </div>
          </nav>

          <div className="hero__content">
            <p className="eyebrow">{text.heroEyebrow}</p>
            <h1>{text.heroTitle}</h1>
            <p className="hero__copy">
              {text.note}
            </p>
            <div className="hero__stats" aria-label="Prediction summary">
              <div>
                <span>0</span>
                <small>{text.nextMatches}</small>
              </div>
              <div>
                <span>{isLoadingPredictions ? text.checking : text.error}</span>
                <small>{text.dataSource}</small>
              </div>
              <div>
                <span>{text.real}</span>
                <small>{text.dataMode}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard dashboard-empty" id="matches">
          <section className="match-board real-data-empty">
            <div className="section-title">
              <div>
                <p>{text.realtimeFeed}</p>
                <h2>{isLoadingPredictions ? text.checkingPredictions : text.noRealMatches}</h2>
              </div>
              <span className="status-pill">{text.realOnly}</span>
            </div>
            {isLoadingPredictions && (
              <div className="skeleton-board" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
            <p>
              {isLoadingPredictions
                ? text.checkingPredictions
                : loadError || text.noCurrentPredictions}
            </p>
            <button disabled={isLoadingPredictions} onClick={refreshPredictions} type="button">
              {isLoadingPredictions ? text.checking : text.refreshRealData}
            </button>
            <a href="https://scoregpt.app/world-cup-2026" rel="noreferrer" target="_blank">
              {text.source}: ScoreGPT
            </a>
          </section>
        </section>

        <PenaltyGame text={text} />
        <section className="bottom-language-panel" aria-label="Language switcher">
          <span>{text.bottomLanguage}</span>
          <button className="language-toggle" onClick={toggleLanguage} type="button">
            {text.switchLanguage}
          </button>
        </section>
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
            <a href="#matches">{text.liveMatches}</a>
            <a href="#models">{text.aiModels}</a>
            <a href="#groups">{text.groups}</a>
            <a href="/profile.html">{text.profile}</a>
            <a href="/themes.html">{text.themes}</a>
            <button className="topbar-action" onClick={() => setAccessMode(null)} type="button">
              {accessMode === 'guest' ? 'Guest' : text.account}
            </button>
            <button className="topbar-action language-toggle" onClick={toggleLanguage} type="button">
              {text.languageButton}
            </button>
            <button
              className="topbar-action"
              onClick={() => setThemeMode((current) => current === 'light' ? 'dark' : 'light')}
              type="button"
            >
              {themeMode === 'light' ? text.dark : text.light}
            </button>
          </div>
        </nav>

        <div className="hero__content">
          <p className="eyebrow">{text.heroEyebrow}</p>
          <h1>{text.heroTitle}</h1>
          <p className="hero__copy">{text.heroText}</p>
          <div className="hero__stats" aria-label="Prediction summary">
            <div>
              <span>{displayPredictions.length}</span>
              <small>{text.nextMatches}</small>
            </div>
            <div>
              <span>{isLive ? 'Live' : 'Real'}</span>
              <small>{text.dataSource}</small>
            </div>
            <div>
              <span>{averageConfidence}%</span>
              <small>{text.avgConfidence}</small>
            </div>
          </div>
        </div>
      </section>

      {soonMatch && (
        <section className="soon-alert">
          <span>{text.matchSoon}</span>
          <strong>{formatMatchLabel(soonMatch, languageMode, text)}</strong>
          <small>{formatMatchDate(soonMatch.matchTime, text.dateLocale)} / {text.aiPick} {soonMatch.consensusPick}</small>
        </section>
      )}

      <section className="color-legend" aria-label={text.colorLegend}>
        <span>{text.colorLegend}</span>
        <small className="legend-data">{text.legendData}</small>
        <small className="legend-favorite">{text.legendFavorite}</small>
        <small className="legend-risk">{text.legendRisk}</small>
        <small className="legend-ai">{text.legendAi}</small>
      </section>

      <section className="dashboard" id="matches">
        <section className="fixture-list" aria-label="Upcoming fixtures">
          <div className="section-title">
            <div>
              <p>{text.realtimeFeed}</p>
              <h2>{text.nextMatches}</h2>
            </div>
            <span className={isLive ? 'status-pill is-live' : 'status-pill'}>
              {isLive ? text.connected : text.realOnly}
            </span>
          </div>

          {loadError && <p className="feed-error">{loadError}</p>}

          <div className="filter-tabs" aria-label="Match filters">
            {[
              { key: 'all', label: text.all },
              { key: 'live', label: text.live },
              { key: 'high', label: text.highConfidence },
              { key: 'upset', label: text.upsetAlert },
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
                <span className="fixture-time">{formatMatchDate(prediction.matchTime, text.dateLocale)}</span>
                <strong>{formatMatchLabel(prediction, languageMode, text)}</strong>
                <span className="fixture-pick">
                  <small>{formatStage(prediction.stage, text)}</small>
                  <b>{prediction.consensusPick} / {prediction.confidence}%</b>
                </span>
              </button>
            ))}
            {visiblePredictions.length === 0 && (
              <p className="empty-filter">{text.noMatchesFilter}</p>
            )}
          </div>
        </section>

        <section className="match-board">
          <section className="scoreboard-card">
            <div className="scoreboard-topline">
              <span>{formatStage(selectedPrediction.stage, text)} / {selectedPrediction.venue}</span>
              <span>{formatMatchDate(selectedPrediction.matchTime, text.dateLocale)}</span>
            </div>

            <div className="scoreboard-main">
              <div className="score-team home-team">
                <span>{text.home}</span>
                <strong>{selectedPrediction.homeCode}</strong>
                <small>{formatTeamName(selectedPrediction.homeName, languageMode)}</small>
              </div>

              <div className="score-center">
                <span>{text.projectedScore}</span>
                <strong>{selectedScore?.home ?? '-'}<small>-</small>{selectedScore?.away ?? '-'}</strong>
                <em>{text.aiPick}: {selectedPrediction.consensusPick}</em>
                {confidenceBadge && (
                  <b className={`confidence-badge ${confidenceBadge.className}`}>
                    {text.confidenceLevel}: {confidenceBadge.label} / {selectedPrediction.confidence}%
                  </b>
                )}
              </div>

              <div className="score-team away-team">
                <span>{text.away}</span>
                <strong>{selectedPrediction.awayCode}</strong>
                <small>{formatTeamName(selectedPrediction.awayName, languageMode)}</small>
              </div>
            </div>

            <div className="probability-chart" aria-label="Consensus probabilities">
              {[
                { key: 'home', label: text.home, value: selectedPrediction.homeWin },
                { key: 'draw', label: text.draw, value: selectedPrediction.draw },
                { key: 'away', label: text.away, value: selectedPrediction.awayWin },
              ].map((item) => (
                <div className={`probability-bar probability-${item.key}`} key={item.key}>
                  <span style={{ height: `${item.value}%` }} />
                  <strong>{item.value.toFixed(1)}%</strong>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
          </section>

          <article className="ai-summary">
            <span>{text.aiRead}</span>
            <p>{selectedPrediction.aiSummary}</p>
            <div className="source-line">
              <strong>{selectedPrediction.sourceName}</strong>
              {selectedPrediction.sourceUrl && (
                <a href={selectedPrediction.sourceUrl} rel="noreferrer" target="_blank">
                  {text.source}
                </a>
              )}
            </div>
            <small>{text.updated} {formatMatchDate(selectedPrediction.updatedAt, text.dateLocale)}</small>
          </article>

          <InternetContextPanel prediction={selectedPrediction} text={text} />

          <div className="model-grid" id="models">
            {selectedPrediction.modelBreakdown.map((model) => (
              <article className="model-card" key={model.model}>
                <div>
                  <span>{text.modelPrediction}</span>
                  <strong>{model.model}</strong>
                </div>
                <div className="model-pick">{model.pick}</div>
                <div className="model-lines">
                  <span>{text.score} {model.score}</span>
                  <span>{text.confidence} {model.confidence}%</span>
                  <span>{formatMatchStatus(selectedPrediction.status, text)}</span>
                </div>
                <small>{text.updatesWhenSupabase}</small>
              </article>
            ))}
          </div>

          <MatchDetails prediction={selectedPrediction} text={text} />
          <MyPredictionBox accessMode={accessMode} prediction={selectedPrediction} text={text} />
          <MatchAssistant languageMode={languageMode} prediction={selectedPrediction} text={text} />
        </section>

        <aside className="side-panel">
          {upsetAlert && (
            <div className="track-card upset-card">
              <span>{text.upsetAlert}</span>
              <strong>{formatMatchLabel(upsetAlert, languageMode, text)}</strong>
              <p>{text.aiPick}: {upsetAlert.consensusPick}, {text.confidence.toLowerCase()} {upsetAlert.confidence}%.</p>
            </div>
          )}

          <div className="track-card">
            <span>{text.liveNow}</span>
            <strong>{liveMatches}</strong>
            <p>{text.matchesMarkedLive}</p>
          </div>

          <div className="track-card">
            <span>{text.bestValue}</span>
            <strong>{selectedPrediction.consensusPick}</strong>
            <p>{text.highestConsensus}</p>
          </div>

          <section className="groups" id="groups">
            <div className="section-title compact">
              <div>
                <p>{text.groups}</p>
                <h2>{text.keyGroups}</h2>
              </div>
            </div>
            {groups.map((group) => (
              <article className="group-card" key={group.group}>
                <strong>{text.group} {group.group}</strong>
                <div className="group-heading">
                  <span>{text.team}</span>
                  <small>{text.playedPoints}</small>
                </div>
                {group.teams.map((team, index) => (
                  <div className={team.qualified ? 'group-row is-qualified' : 'group-row'} key={team.name}>
                    <span>{index + 1}. {formatTeamName(team.name, languageMode)}</span>
                    <small>{team.played} / {team.points}</small>
                  </div>
                ))}
              </article>
            ))}
          </section>
        </aside>
      </section>

      <a className="ask-ai-fab" href="#ai-assistant">
        {text.askAi}
      </a>

      <PenaltyGame text={text} />
      <section className="bottom-language-panel" aria-label="Language switcher">
        <span>{text.bottomLanguage}</span>
        <button className="language-toggle" onClick={toggleLanguage} type="button">
          {text.switchLanguage}
        </button>
      </section>
    </main>
  );
}

export default App;
