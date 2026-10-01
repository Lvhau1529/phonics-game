/**
 * Trạng thái toàn app: đang ở màn nào + phiên chơi hiện tại.
 *
 *   home ─▶ setup ─▶ play ─▶ results ─▶ gift
 *              ▲        │  (Back / End Game khi chưa đủ 3 đội)
 *              └────────┘
 *
 * React vẽ các màn home / setup / results; Phaser (SceneDirector) chạy play / gift.
 * Hai bên chỉ giao tiếp qua store này.
 */
import { breadCatcherManifest } from '@/games/bread-catcher/manifest';
import { postSoloResult } from '@/platform/account/scoreSync';
import { events } from '@/platform/analytics/events';
import { awardGems } from '@/platform/gems/wallet';
import { createStore } from '@/shared/createStore';
import { shuffle } from '@/shared/random';
import { PACKS, parseCustomWords, sessionWords } from '@/games/bread-catcher/session/content';
import {
  DEFAULT_SETTINGS,
  isValidTime,
  LEVELS,
  RULES,
  wordsPerTurn,
} from '@/games/bread-catcher/session/settings';
import {
  addSession,
  rankTotals,
  withTeams,
  type LeaderboardUpdate,
} from '@/games/bread-catcher/session/leaderboard';
import {
  loadLastSetup,
  recordSoloScore,
  resetTeamTotals,
  saveLastSetup,
  saveTeamTotals,
  teamTotalsStore,
} from '@/games/bread-catcher/session/storage';
import { buildTeams } from '@/games/bread-catcher/session/teams';
import type {
  GameMode,
  SessionSettings,
  SetupDraft,
  Team,
  TeamId,
  TurnResult,
} from '@/games/bread-catcher/session/types';
import WordPool from '@/games/bread-catcher/session/WordPool';

export type Screen = 'home' | 'setup' | 'play' | 'results' | 'gift';

export interface ActiveSession {
  /** Tăng mỗi lần bắt đầu phiên mới (Phaser dựa vào đây để chạy lại từ đầu) */
  id: number;
  settings: SessionSettings;
  teams: Team[];
  /** Thứ tự lượt đã xáo từ đầu buổi; xúc xắc chỉ "hé lộ" dần (plan §6) */
  turnOrder: TeamId[];
  /** Kết quả theo thứ tự đã chơi */
  results: TurnResult[];
  /** Chỉ có ở Solo */
  soloBest?: { best: number; isNewBest: boolean };
  /** Chỉ có ở Class Mode khi chơi đủ lượt: bảng tổng điểm trước / sau buổi này */
  leaderboard?: LeaderboardUpdate;
  /** Kim cương nhận được khi chơi xong buổi (1 viên / từ đúng, ví chung của Phonics Arcade) */
  gemsEarned?: number;
  /** Solo + đã đăng nhập: clientSessionId của kết quả gửi lên API (platform/account/scoreSync); null = không gửi */
  syncId?: string | null;
}

export interface AppState {
  screen: Screen;
  draft: SetupDraft;
  session: ActiveSession | null;
}

/** Form Setup: lần chơi trước (nếu còn hợp lệ) hoặc mặc định */
function initialDraft(): SetupDraft {
  const fallback: SetupDraft = {
    ...DEFAULT_SETTINGS,
    customText: '',
    teamNames: ['', '', ''],
    playerName: '',
  };
  const saved = loadLastSetup();
  if (!saved) return fallback;
  return {
    mode: saved.mode === 'solo' ? 'solo' : 'class',
    packId: saved.packId === 'custom' || saved.packId in PACKS ? saved.packId : fallback.packId,
    levelId: saved.levelId in LEVELS ? saved.levelId : fallback.levelId,
    time: isValidTime(saved.time) ? saved.time : fallback.time,
    customText: String(saved.customText ?? ''),
    teamNames: [0, 1, 2].map((i) => String(saved.teamNames?.[i] ?? '')) as SetupDraft['teamNames'],
    playerName: String(saved.playerName ?? ''),
  };
}

export const appStore = createStore<AppState>({
  screen: 'home',
  draft: initialDraft(),
  session: null,
});

let nextSessionId = 1;
/** Word pool sống theo phiên (không nằm trong state vì là object có hành vi) */
let wordPool: WordPool | null = null;

function update(patch: Partial<AppState>): void {
  appStore.set((state) => ({ ...state, ...patch }));
}

function createSession(settings: SessionSettings, teams: Team[]): ActiveSession {
  wordPool = new WordPool(sessionWords(settings), RULES.wordPool);
  return {
    id: nextSessionId++,
    settings,
    teams,
    turnOrder: shuffle(teams.map((team) => team.id)),
    results: [],
  };
}

/** Class Mode chơi đủ lượt: cộng điểm vào bảng tổng (một lần cho mỗi buổi) */
function recordLeaderboard(session: ActiveSession): ActiveSession {
  if (session.settings.mode !== 'class' || session.leaderboard) return session;
  const previous = withTeams(teamTotalsStore.get().totals, session.teams);
  const next = addSession(previous, session.teams, session.results);
  saveTeamTotals(next);
  const gained = Object.fromEntries(session.results.map((result) => [result.teamId, result.score]));
  return { ...session, leaderboard: { before: rankTotals(previous), after: rankTotals(next), gained } };
}

/** Chơi xong buổi: cộng kim cương theo số từ đúng của mọi đội (một lần cho mỗi buổi) */
function recordGems(session: ActiveSession): ActiveSession {
  if (session.gemsEarned !== undefined) return session;
  const correctWords = session.results.reduce((sum, result) => sum + result.correctWords, 0);
  return { ...session, gemsEarned: awardGems(correctWords) };
}

/**
 * Chơi xong: Solo của học sinh đã đăng nhập -> gửi kết quả lên API (điểm, xếp hạng); các ván còn lại
 * (Class Mode, khách) chỉ ghi sự kiện PLAY ẩn danh (server tự ghi PLAY từ kết quả gửi lên).
 */
function recordSync(session: ActiveSession): ActiveSession {
  if (session.syncId !== undefined) return session;
  const { settings } = session;
  const result = session.results[0];
  let syncId: string | null = null;
  if (settings.mode === 'solo' && result) {
    syncId = postSoloResult({
      gameId: breadCatcherManifest.id,
      levelId: settings.levelId,
      packId: settings.packId,
      correct: result.correctWords,
      total: wordsPerTurn(settings),
      score: result.score,
      durationMs: Math.max(0, result.timeLimitMs - result.timeRemainingMs),
      endedBy: result.endedBy === 'words' ? 'completed' : 'time',
      details: {
        attempts: result.attempts,
        wrongCatches: result.wrongCatches,
        timeLimitMs: result.timeLimitMs,
        timeRemainingMs: result.timeRemainingMs,
      },
    });
  }
  if (!syncId) events.trackPlay(breadCatcherManifest.id, settings.mode === 'solo' ? 'solo' : 'class');
  return { ...session, syncId };
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
/** Đội tới lượt (null = mọi đội đã chơi xong) */
export function currentTeam(session: ActiveSession): Team | null {
  const id = session.turnOrder[session.results.length];
  return session.teams.find((team) => team.id === id) ?? null;
}

export function isSessionComplete(session: ActiveSession): boolean {
  return session.results.length >= session.teams.length;
}

export function getWordPool(): WordPool {
  if (!wordPool) throw new Error('No active session');
  return wordPool;
}

/** Từ của đội vừa chơi — đội sau nên tránh (plan §14) */
export function previousTeamWords(session: ActiveSession): Set<string> {
  const last = session.results.at(-1);
  return new Set(last?.attempts.map((attempt) => attempt.word) ?? []);
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export const sessionActions = {
  goHome(): void {
    update({ screen: 'home', session: null });
  },

  openSetup(mode?: GameMode): void {
    const { draft } = appStore.get();
    update({ screen: 'setup', session: null, draft: mode ? { ...draft, mode } : draft });
  },

  /** Cập nhật form Setup và lưu ngay (tên đội còn nguyên khi mở lại app) */
  updateDraft(patch: Partial<SetupDraft>): void {
    const draft = { ...appStore.get().draft, ...patch };
    saveLastSetup(draft);
    update({ draft });
  },

  startSession(): void {
    const { draft } = appStore.get();
    const { mode, packId, levelId, time, customText } = draft;
    const customWords = packId === 'custom' ? parseCustomWords(customText).words : [];
    if (packId === 'custom' && customWords.length === 0) return; // nút START đang bị khoá
    saveLastSetup(draft);
    const settings = { mode, packId, levelId, time, customWords };
    update({ screen: 'play', session: createSession(settings, buildTeams(draft)) });
  },

  /** Chơi lại với cùng cài đặt và đội (xáo lại thứ tự, word pool mới) */
  playAgain(): void {
    const { session } = appStore.get();
    if (!session) return;
    update({ screen: 'play', session: createSession(session.settings, session.teams) });
  },

  recordTurn(result: TurnResult): void {
    const { session } = appStore.get();
    if (!session) return;
    const soloBest =
      session.settings.mode === 'solo' ? recordSoloScore(session.settings.levelId, result.score) : undefined;
    update({ session: { ...session, results: [...session.results, result], soloBest } });
  },

  /** Đủ lượt -> Final Results; chưa đủ thì kết thúc và không hiện thống kê (plan §20) */
  finishSession(): void {
    const { session } = appStore.get();
    if (!session || !isSessionComplete(session)) {
      sessionActions.abortSession();
      return;
    }
    update({ screen: 'results', session: recordSync(recordGems(recordLeaderboard(session))) });
  },

  /** Xoá bảng tổng điểm các đội (nút RESET SCORES) */
  resetTeamTotals(): void {
    resetTeamTotals();
  },

  abortSession(): void {
    wordPool = null;
    update({ screen: 'setup', session: null });
  },

  openGift(): void {
    const { session } = appStore.get();
    if (session && session.settings.mode === 'class' && isSessionComplete(session))
      update({ screen: 'gift' });
  },

  backToResults(): void {
    if (appStore.get().session) update({ screen: 'results' });
  },
};
