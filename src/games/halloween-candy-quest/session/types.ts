import type { VocabWord } from '@/games/halloween-candy-quest/content/words';

export type Mode = 'solo' | 'team';
export type Difficulty = 'easy' | 'normal' | 'mixed';
export type QuestionType = 'listen_choose' | 'find_object' | 'look_listen' | 'match_pairs';
/** game: máy đọc · teacher: giáo viên đọc (máy im) · both: máy đọc, giáo viên có thể đọc lại */
export type VoiceMode = 'game' | 'teacher' | 'both';
export type TimerSeconds = 0 | 30 | 45;

export const QUESTION_TYPES: readonly QuestionType[] = [
  'listen_choose',
  'find_object',
  'look_listen',
  'match_pairs',
];

/** Cấu hình buổi chơi (Teacher Setup) — lưu trên máy */
export interface Settings {
  mode: Mode;
  soloTurns: number;
  teamTurns: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
  /** 0 = tắt đồng hồ */
  timerSeconds: TimerSeconds;
  voiceMode: VoiceMode;
  /** Team: hiện điểm trong lúc chơi (tắt = chỉ hiện ở cuối) */
  showLiveScore: boolean;
}

export interface TeamSetup {
  name: string;
  characterId: string;
}

/** Thử thách chọn 1 trong 2–3 (thẻ hình / loa / vật trong cảnh); `options` = id từ, đã xáo */
export interface ChoiceQuestion {
  id: string;
  type: 'listen_choose' | 'find_object' | 'look_listen';
  targetId: string;
  options: string[];
}

/** Ghép 2 hình với 2 loa: `options` = thứ tự hình, `sounds` = thứ tự loa (đã xáo riêng) */
export interface MatchQuestion {
  id: string;
  type: 'match_pairs';
  targetId: string;
  options: string[];
  sounds: string[];
}

export type Question = ChoiceQuestion | MatchQuestion;

/** Một lượt đã lên lịch trước khi chơi */
export interface PlannedTurn {
  /** Duy nhất trong ván — chống cộng kẹo hai lần */
  turnId: string;
  team: number;
  zone: number;
  /** Ngôi nhà trong khu vực (0–3) */
  house: number;
  question: Question;
}

/**
 * Pha của một lượt (spec §5.2):
 *   zone ─▶ walk ─▶ knock ─(chạm cửa)─▶ knocking ─▶ greeting ─▶ question ─▶ feedback ─▶ reward
 *     reward ─▶ [solo] lượt sau (zone / walk) | [team] turn_end ─(NEXT TURN)─▶ lượt sau
 *   feedback: đúng -> reward · sai lần 1 -> question (lần thử 2) · sai lần 2 / hết giờ -> hiện đáp án -> reward (0 kẹo)
 */
export type Phase =
  'zone' | 'walk' | 'knock' | 'knocking' | 'greeting' | 'question' | 'feedback' | 'reward' | 'turn_end';

/** wrong: sai lần 1 (sẽ thử lại) · reveal: sai lần 2 / hết giờ, hiện đáp án */
export type Feedback = 'correct' | 'wrong' | 'reveal';

export interface Team {
  name: string;
  characterId: string;
  score: number;
}

export interface TurnRecord {
  turnId: string;
  team: number;
  questionId: string;
  type: QuestionType;
  targetId: string;
  attempts: number;
  candies: number;
  /** Số câu bị giáo viên thay (Skip Question) trong lượt */
  replaced: number;
  timedOut: boolean;
}

export interface Game {
  id: number;
  settings: Settings;
  /** Bản chụp các từ của ván (đổi bộ từ giữa chừng không ảnh hưởng) */
  words: VocabWord[];
  /** Máy đọc được từ (Look & Listen / Match the Pairs cần) */
  canSpeak: boolean;
  teams: Team[];
  firstTeam: number;
  plan: PlannedTurn[];
  turn: number;
  phase: Phase;
  /** Lần thử của câu hiện tại (1 / 2) */
  attempt: number;
  feedback: Feedback | null;
  /** Kẹo của lượt vừa xong (hiệu ứng reward) */
  lastCandies: number;
  replaced: number;
  timedOut: boolean;
  paused: boolean;
  records: TurnRecord[];
  /** Khoá `(từ, dạng, đáp án)` đã dùng — hạn chế lặp nguyên câu */
  usedKeys: string[];
  startedAt: number;
}
