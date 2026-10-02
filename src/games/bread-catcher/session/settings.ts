/**
 * Cấp độ, thời gian và luật chơi. Số liệu lấy từ content/game_config.json (resource pack),
 * riêng level HARD được thêm vào: tốc độ vừa phải nhưng bật toàn bộ logic troll.
 */
import gameConfig from '@/games/bread-catcher/content/game_config.json';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import type {
  LevelId,
  PackId,
  SessionSettings,
  TargetSupport,
  TimeOption,
} from '@/games/bread-catcher/session/types';

export interface LevelDef {
  id: LevelId;
  label: string;
  /** Mô tả ngắn cho giáo viên ở màn Setup */
  hint: string;
  /** Tốc độ rơi (px/s) */
  fallSpeed: number;
  /** Khoảng cách giữa 2 lần rơi chữ (ms) */
  spawnMs: number;
  /** Thời gian mỗi lượt khi chọn AUTO (giây) */
  suggestedTime: number;
  support: TargetSupport;
  /** Bật prank + chữ cái "láo" (logic troll) */
  troll: boolean;
}

const { difficulty } = gameConfig;

export const LEVELS: Record<LevelId, LevelDef> = {
  gentle: {
    id: 'gentle',
    label: UI_TEXT.gentle,
    hint: 'Slow letters. The word and letter hints are shown.',
    ...difficulty.gentle,
    support: 'full',
    troll: false,
  },
  easy: {
    id: 'easy',
    label: UI_TEXT.easy,
    hint: 'See the word, then catch its letters in order.',
    ...difficulty.easy,
    support: 'word',
    troll: false,
  },
  normal: {
    id: 'normal',
    label: UI_TEXT.normal,
    hint: 'Listen to the word. Only the first letter is shown.',
    ...difficulty.normal,
    support: 'first-letter',
    troll: false,
  },
  fast: {
    id: 'fast',
    label: UI_TEXT.fast,
    hint: 'Listen and build the word from blank slots.',
    ...difficulty.fast,
    support: 'blank',
    troll: false,
  },
  hard: {
    id: 'hard',
    label: UI_TEXT.hard,
    hint: 'Crazy bakery surprises! Letters dodge, bounce and hide.',
    fallSpeed: 100,
    spawnMs: 1100,
    suggestedTime: 90,
    support: 'word',
    troll: true,
  },
};

export const LEVEL_ORDER: LevelId[] = ['gentle', 'easy', 'normal', 'fast', 'hard'];

export const TIME_OPTIONS: TimeOption[] = ['auto', ...gameConfig.timerOptionsSeconds];

/** Giới hạn khi giáo viên tự nhập thời gian (giây) */
export const CUSTOM_TIME = { min: 15, max: 600 } as const;

export function isValidTime(time: unknown): time is TimeOption {
  return (
    time === 'auto' ||
    (Number.isInteger(time) && (time as number) >= CUSTOM_TIME.min && (time as number) <= CUSTOM_TIME.max)
  );
}

export const RULES = {
  teamCount: gameConfig.classMode.teamCount,
  wordsPerTurn: gameConfig.classMode.wordsPerTurn,
  soloWordsPerTurn: gameConfig.soloMode.wordsPerTurn,
  countdownSeconds: gameConfig.defaults.countdownSeconds,
  correctWordScore: gameConfig.scoring.correctWord,
  wordPool: {
    retryAfterDraws: gameConfig.wordPool.wrongRetryAfterDraws,
    reserveFloorRatio: gameConfig.wordPool.reserveFloorRatio,
  },
  pauseOverlayOpacity: gameConfig.pause.overlayOpacity,
} as const;

export const DEFAULT_SETTINGS: Omit<SessionSettings, 'customWords'> = {
  mode: 'class',
  packId: gameConfig.defaults.contentPack as PackId,
  levelId: gameConfig.defaults.difficulty as LevelId,
  time: gameConfig.defaults.timeLimitSeconds,
};

export function timeLimitSeconds(settings: Pick<SessionSettings, 'time' | 'levelId'>): number {
  return settings.time === 'auto' ? LEVELS[settings.levelId].suggestedTime : settings.time;
}

export function wordsPerTurn(settings: Pick<SessionSettings, 'mode'>): number {
  return settings.mode === 'solo' ? RULES.soloWordsPerTurn : RULES.wordsPerTurn;
}
