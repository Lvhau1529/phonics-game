/**
 * Trạng thái của Food Stream: đang ở màn nào + phiên chơi + kết quả lượt vừa xong.
 *
 *   home ─▶ setup ─▶ play ─▶ results
 *              ▲        │ (Quit)
 *              └────────┘
 *
 * React vẽ home / setup / results; Phaser (SceneDirector) chạy play. Hai bên chỉ giao tiếp qua store này.
 */
import { DEFAULT_PACK_ID, getPack, PACKS } from '@/games/food-stream/content/packs';
import { getLevel, LEVELS, levelsForPack } from '@/games/food-stream/content/levels';
import { foodStreamManifest } from '@/games/food-stream/manifest';
import { randomFirstTeam } from '@/games/food-stream/session/RoundController';
import {
  addViewers,
  loadLastSetup,
  recordProgress,
  saveLastSetup,
  type LevelProgress,
} from '@/games/food-stream/session/storage';
import { buildTeams } from '@/games/food-stream/session/teams';
import type { RoundResult, SetupDraft, Team, TeamId } from '@/games/food-stream/session/types';
import { postSoloResult } from '@/platform/account/scoreSync';
import { events } from '@/platform/analytics/events';
import { awardGems } from '@/platform/gems/wallet';
import { createStore } from '@/shared/createStore';

export type Screen = 'home' | 'setup' | 'play' | 'results';

export const QUESTIONS_PER_TEAM_OPTIONS = [5, 10, 15] as const;
export const ANSWER_SECONDS_OPTIONS = [0, 10, 20] as const;

export interface ActiveSession {
  /** Tăng mỗi lần bắt đầu phiên mới (Phaser dựa vào đây để chạy lại từ đầu) */
  id: number;
  settings: SetupDraft;
  teams: Team[];
  firstTeam: TeamId;
  /** Lúc bắt đầu lượt (ms) — tính thời lượng ván khi gửi kết quả lên API */
  startedAt: number;
}

export interface SessionOutcome {
  result: RoundResult;
  /** Solo: sao / điểm cao trước lượt này (để biết kỷ lục mới) */
  previous?: LevelProgress;
  totalViewers: number;
  /** Kim cương nhận được (1 viên / câu đúng của mọi đội, ví chung của Phonics Arcade) */
  gemsEarned: number;
  /** Solo + đã đăng nhập: clientSessionId của kết quả gửi lên API (platform/account/scoreSync); null = không gửi */
  syncId: string | null;
}

export interface FoodStreamState {
  screen: Screen;
  draft: SetupDraft;
  session: ActiveSession | null;
  outcome: SessionOutcome | null;
}

const DEFAULT_DRAFT: SetupDraft = {
  mode: 'solo',
  packId: DEFAULT_PACK_ID,
  levelId: LEVELS[0].id,
  streamer: 'girl',
  teamNames: ['', ''],
  questionsPerTeam: 5,
  steal: true,
  answerSeconds: 0,
};

/** Lần chơi trước (nếu còn hợp lệ) hoặc mặc định */
function initialDraft(): SetupDraft {
  const saved = loadLastSetup() ?? {};
  const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  const packId = pick(
    saved.packId,
    PACKS.map((pack) => pack.id),
    DEFAULT_DRAFT.packId,
  );
  const levels = levelsForPack(getPack(packId)).map((level) => level.id);
  return {
    mode: pick(saved.mode, ['solo', 'classroom'] as const, DEFAULT_DRAFT.mode),
    packId,
    levelId: pick(saved.levelId, levels, levels[0]),
    streamer: pick(saved.streamer, ['girl', 'boy'] as const, DEFAULT_DRAFT.streamer),
    teamNames: [0, 1].map((i) => String(saved.teamNames?.[i] ?? '')) as SetupDraft['teamNames'],
    questionsPerTeam: pick(
      saved.questionsPerTeam,
      QUESTIONS_PER_TEAM_OPTIONS,
      DEFAULT_DRAFT.questionsPerTeam,
    ),
    steal: typeof saved.steal === 'boolean' ? saved.steal : DEFAULT_DRAFT.steal,
    answerSeconds: pick(saved.answerSeconds, ANSWER_SECONDS_OPTIONS, DEFAULT_DRAFT.answerSeconds),
  };
}

export const foodStreamStore = createStore<FoodStreamState>({
  screen: 'home',
  draft: initialDraft(),
  session: null,
  outcome: null,
});

let nextSessionId = 1;

function update(patch: Partial<FoodStreamState>): void {
  foodStreamStore.set((state) => ({ ...state, ...patch }));
}

function createSession(settings: SetupDraft): ActiveSession {
  const teams = buildTeams(settings);
  return { id: nextSessionId++, settings, teams, firstTeam: randomFirstTeam(teams), startedAt: Date.now() };
}

/**
 * Lượt xong: Solo của học sinh đã đăng nhập -> gửi kết quả lên API (điểm, xếp hạng); các lượt còn lại
 * (Classroom, khách) chỉ ghi sự kiện PLAY ẩn danh (server tự ghi PLAY từ kết quả gửi lên).
 */
function syncResult(session: ActiveSession, result: RoundResult): string | null {
  const { settings } = session;
  const solo = settings.mode === 'solo';
  const team = result.teams[0];
  let syncId: string | null = null;
  if (solo && team) {
    const total = questionCount(settings);
    syncId = postSoloResult({
      gameId: foodStreamManifest.id,
      levelId: settings.levelId,
      packId: settings.packId,
      correct: Math.min(team.correct, total),
      total,
      score: team.score,
      durationMs: Math.min(3_600_000, Math.max(0, Date.now() - session.startedAt)),
      endedBy: result.endedBy === 'questions' ? 'completed' : 'time',
      details: {
        stars: result.stars,
        perfect: result.perfect,
        viewers: result.viewers,
        hearts: result.hearts,
        bestStreak: team.bestStreak,
        firstTry: result.records.filter((record) => record.firstTry).length,
        questions: result.records.length,
      },
    });
  }
  if (!syncId) events.trackPlay(foodStreamManifest.id, solo ? 'solo' : 'class');
  return syncId;
}

/** Số câu của lượt */
export function questionCount(settings: SetupDraft): number {
  return settings.mode === 'solo' ? getLevel(settings.levelId).questions : settings.questionsPerTeam * 2;
}

export const foodStreamActions = {
  goHome(): void {
    update({ screen: 'home', session: null, outcome: null });
  },

  openSetup(): void {
    update({ screen: 'setup', session: null, outcome: null });
  },

  /** Cập nhật form Setup và lưu ngay; đổi gói thì giữ cấp nếu gói mới chơi được, không thì về cấp đầu */
  updateDraft(patch: Partial<SetupDraft>): void {
    const draft = { ...foodStreamStore.get().draft, ...patch };
    const levels = levelsForPack(getPack(draft.packId));
    if (!levels.some((level) => level.id === draft.levelId)) draft.levelId = levels[0].id;
    saveLastSetup(draft);
    update({ draft });
  },

  startSession(): void {
    const { draft } = foodStreamStore.get();
    saveLastSetup(draft);
    update({ screen: 'play', session: createSession(draft), outcome: null });
  },

  /** Chơi lại cùng cài đặt (đội đi trước được bốc lại) */
  playAgain(): void {
    const { session } = foodStreamStore.get();
    if (!session) return;
    update({ screen: 'play', session: createSession(session.settings), outcome: null });
  },

  /** Solo: sang cấp tiếp theo của cùng gói */
  playNextLevel(): void {
    const { session } = foodStreamStore.get();
    if (!session) return;
    const next = nextLevelId(session.settings);
    if (!next) return;
    foodStreamActions.updateDraft({ levelId: next });
    update({ screen: 'play', session: createSession({ ...session.settings, levelId: next }), outcome: null });
  },

  /** Lượt chơi kết thúc -> lưu tiến độ, sang màn kết quả */
  finishRound(result: RoundResult): void {
    const { session } = foodStreamStore.get();
    if (!session) return;
    const { settings } = session;
    const previous =
      settings.mode === 'solo'
        ? recordProgress(settings.packId, settings.levelId, result.stars, result.teams[0]?.score ?? 0)
        : undefined;
    const totalViewers = addViewers(result.viewers);
    const gemsEarned = awardGems(result.teams.reduce((sum, team) => sum + team.correct, 0));
    const syncId = syncResult(session, result);
    update({ screen: 'results', outcome: { result, previous, totalViewers, gemsEarned, syncId } });
  },

  /** Thoát giữa lượt (nút QUIT) -> về Setup, không lưu kết quả */
  abortSession(): void {
    update({ screen: 'setup', session: null, outcome: null });
  },
};

export function nextLevelId(settings: SetupDraft): string | undefined {
  const levels = levelsForPack(getPack(settings.packId));
  const index = levels.findIndex((level) => level.id === settings.levelId);
  return levels[index + 1]?.id;
}
