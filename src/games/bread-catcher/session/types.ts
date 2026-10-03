/**
 * Kiểu dữ liệu của "classroom shell" — độc lập với React và Phaser
 * để tái sử dụng cho các game lớp học khác (plan §37).
 */

export type GameMode = 'class' | 'solo';

/** HARD = logic troll cũ (prank + chữ cái "láo") */
export type LevelId = 'gentle' | 'easy' | 'normal' | 'fast' | 'hard';

/** Gói từ có sẵn (lấy từ resource pack) */
export type BuiltinPackId = 'early_blending' | 'blending_core' | 'picture_vocab' | 'mixed_review';

/** 'custom' = MY WORDS: giáo viên tự nhập từ ở màn Setup */
export type PackId = BuiltinPackId | 'custom';

/** 'auto' = theo level, hoặc số giây (có sẵn 45–120 hoặc giáo viên tự nhập) */
export type TimeOption = 'auto' | number;

export type TeamId = 0 | 1 | 2;

/** Linh vật đầu bếp (Kids Bakery pack) — 3 đội Class Mode + Solo */
export type MascotId = 'fox' | 'frog' | 'penguin' | 'bear';

/**
 * Mức gợi ý ở ô từ (plan §27):
 *   full         — hiện từ + chữ mờ trong từng ô
 *   word         — hiện từ, ô trống
 *   first-letter — chỉ gợi ý chữ đầu (nghe phát âm)
 *   blank        — ô trống hoàn toàn (nghe phát âm)
 */
export type TargetSupport = 'full' | 'word' | 'first-letter' | 'blank';

export interface SessionSettings {
  mode: GameMode;
  packId: PackId;
  levelId: LevelId;
  time: TimeOption;
  /** Từ tự nhập đã chuẩn hoá (viết hoa, bỏ trùng) — chỉ dùng khi packId = 'custom' */
  customWords: string[];
}

/** Nội dung form Setup (được nhớ lại cho lần sau) */
export interface SetupDraft extends Omit<SessionSettings, 'customWords'> {
  /** Ô MY WORDS, giữ nguyên như giáo viên gõ (tách thành từ lúc bấm START) */
  customText: string;
  teamNames: [string, string, string];
  playerName: string;
}

export interface Team {
  id: TeamId;
  name: string;
  mascot: MascotId;
}

export interface WordAttempt {
  word: string;
  correct: boolean;
}

export interface TurnResult {
  teamId: TeamId;
  /** Các từ đã chơi xong (đúng hoặc sai), theo thứ tự */
  attempts: WordAttempt[];
  correctWords: number;
  wrongWords: number;
  /** Số lần hứng nhầm chữ (tie-breaker) */
  wrongCatches: number;
  timeLimitMs: number;
  timeRemainingMs: number;
  score: number;
  endedBy: 'words' | 'time';
}
