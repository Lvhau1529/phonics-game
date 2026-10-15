import type { AnswerOption, Question } from '@/games/english-explorers/content/worlds';

export interface SetupDraft {
  /** Tên bé (bỏ trống = EXPLORER) */
  name: string;
  /** Id thế giới hoặc 'all' */
  world: string;
  /** Bước "SAY IT!" sau khi chọn đúng */
  speaking: boolean;
}

/** Một câu trong ván: 3 đáp án đã xáo vị trí */
export interface RoundQuestion {
  question: Question;
  options: AnswerOption[];
  /** Vị trí đáp án đúng sau khi xáo */
  answer: number;
}

/** choose: chọn đáp án (sai thì chọn lại) · speak: nói cả câu · done: (tắt bước nói) đã chọn đúng, chờ NEXT */
export type Phase = 'choose' | 'speak' | 'done';

export interface QuestionRecord {
  questionId: string;
  /** Số lần chọn sai trước khi đúng */
  misses: number;
  /** Được cộng điểm nói */
  spoke: boolean;
  heard: string;
  points: number;
}

export interface ActiveRound {
  id: number;
  settings: SetupDraft;
  questions: RoundQuestion[];
  index: number;
  phase: Phase;
  /** Các đáp án đã chọn sai ở câu hiện tại (mờ đi, không bấm lại được) */
  wrong: number[];
  records: QuestionRecord[];
  score: number;
  startedAt: number;
}
