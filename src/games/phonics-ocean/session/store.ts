/**
 * Trạng thái của Phonics Ocean: đang ở màn nào + phiên chơi + kết quả lượt vừa xong.
 *
 *   home ─▶ setup ─▶ play ─▶ results
 *              ▲        │ (Quit)
 *              └────────┘
 *
 * React vẽ home / setup / results; Phaser (SceneDirector) chạy play. Hai bên chỉ giao tiếp qua store này.
 */
import { GameId } from '@phonics/contracts';
import { getLevel, LEVELS, nextLevel } from '@/games/phonics-ocean/content/levels';
import { phonicsOceanManifest } from '@/games/phonics-ocean/manifest';
import {
  loadLastSetup,
  recordProgress,
  saveLastSetup,
  type LevelProgress,
} from '@/games/phonics-ocean/session/storage';
import type { RoundResult, SetupDraft } from '@/games/phonics-ocean/session/types';
import { postSoloResult } from '@/platform/account/scoreSync';
import { events } from '@/platform/analytics/events';
import { awardGems } from '@/platform/gems/wallet';
import { createStore } from '@/shared/createStore';

export type Screen = 'home' | 'setup' | 'play' | 'results';

export interface ActiveSession {
  /** Tăng mỗi lần bắt đầu phiên mới (Phaser dựa vào đây để chạy lại từ đầu) */
  id: number;
  settings: SetupDraft;
  /** Lúc bắt đầu lượt (ms) — thời lượng ván khi gửi kết quả lên API */
  startedAt: number;
}

export interface SessionOutcome {
  result: RoundResult;
  /** Sao / điểm cao trước lượt này (để biết kỷ lục mới) */
  previous?: LevelProgress;
  /** Kim cương nhận được (1 viên / từ đúng, ví chung của Phonics Arcade) */
  gemsEarned: number;
  /** Đã đăng nhập: clientSessionId của kết quả gửi lên API; null = không gửi */
  syncId: string | null;
}

export interface PhonicsOceanState {
  screen: Screen;
  draft: SetupDraft;
  session: ActiveSession | null;
  outcome: SessionOutcome | null;
}

const DEFAULT_DRAFT: SetupDraft = { levelId: LEVELS[0].id, predators: true };

/** Lần chơi trước (nếu còn hợp lệ) hoặc mặc định */
function initialDraft(): SetupDraft {
  const saved = loadLastSetup() ?? {};
  return {
    levelId: LEVELS.some((level) => level.id === saved.levelId) ? saved.levelId! : DEFAULT_DRAFT.levelId,
    predators: typeof saved.predators === 'boolean' ? saved.predators : DEFAULT_DRAFT.predators,
  };
}

export const phonicsOceanStore = createStore<PhonicsOceanState>({
  screen: 'home',
  draft: initialDraft(),
  session: null,
  outcome: null,
});

let nextSessionId = 1;

function update(patch: Partial<PhonicsOceanState>): void {
  phonicsOceanStore.set((state) => ({ ...state, ...patch }));
}

function createSession(settings: SetupDraft): ActiveSession {
  return { id: nextSessionId++, settings, startedAt: Date.now() };
}

/** API đã biết game này chưa (thêm 'phonics-ocean' vào GameId của @phonics/contracts ở phonics-api) */
const KNOWN_BY_API = GameId.safeParse(phonicsOceanManifest.id).success;

/**
 * Lượt xong: học sinh đã đăng nhập -> gửi kết quả lên API (khi contracts đã có game này);
 * không gửi thì ghi sự kiện PLAY ẩn danh (events cũng tự bỏ qua game API chưa biết).
 */
function syncResult(session: ActiveSession, result: RoundResult): string | null {
  if (!KNOWN_BY_API) {
    events.trackPlay(phonicsOceanManifest.id, 'solo');
    return null;
  }
  const level = getLevel(result.levelId);
  const syncId = postSoloResult({
    gameId: phonicsOceanManifest.id,
    levelId: result.levelId,
    correct: Math.min(result.correct, level.correctToClear),
    total: level.correctToClear,
    score: result.score,
    durationMs: Math.min(3_600_000, Math.max(0, Date.now() - session.startedAt)),
    endedBy: result.cleared ? 'completed' : 'time',
    details: {
      endedBy: result.endedBy,
      stars: result.stars,
      attempts: result.attempts,
      accuracy: Math.round(result.accuracy * 100) / 100,
      bestStreak: result.bestStreak,
      tier: result.tier,
      predators: session.settings.predators,
    },
  });
  if (!syncId) events.trackPlay(phonicsOceanManifest.id, 'solo');
  return syncId;
}

export const phonicsOceanActions = {
  goHome(): void {
    update({ screen: 'home', session: null, outcome: null });
  },

  openSetup(): void {
    update({ screen: 'setup', session: null, outcome: null });
  },

  /** Cập nhật form Setup và lưu ngay */
  updateDraft(patch: Partial<SetupDraft>): void {
    const draft = { ...phonicsOceanStore.get().draft, ...patch };
    saveLastSetup(draft);
    update({ draft });
  },

  startSession(): void {
    const { draft } = phonicsOceanStore.get();
    saveLastSetup(draft);
    update({ screen: 'play', session: createSession(draft), outcome: null });
  },

  /** Chơi lại cùng cấp */
  playAgain(): void {
    const { session } = phonicsOceanStore.get();
    if (!session) return;
    update({ screen: 'play', session: createSession(session.settings), outcome: null });
  },

  /** Sang cấp tiếp theo */
  playNextLevel(): void {
    const { session } = phonicsOceanStore.get();
    const next = session && nextLevel(session.settings.levelId);
    if (!session || !next) return;
    phonicsOceanActions.updateDraft({ levelId: next.id });
    update({
      screen: 'play',
      session: createSession({ ...session.settings, levelId: next.id }),
      outcome: null,
    });
  },

  /** Lượt chơi kết thúc -> lưu tiến độ, sang màn kết quả */
  finishRound(result: RoundResult): void {
    const { session } = phonicsOceanStore.get();
    if (!session) return;
    const previous = recordProgress(result.levelId, result.stars, result.score);
    const gemsEarned = awardGems(result.correct);
    const syncId = syncResult(session, result);
    update({ screen: 'results', outcome: { result, previous, gemsEarned, syncId } });
  },

  /** Thoát giữa lượt (nút QUIT) -> về Setup, không lưu kết quả */
  abortSession(): void {
    update({ screen: 'setup', session: null, outcome: null });
  },
};
