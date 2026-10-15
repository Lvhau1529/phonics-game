import type { Level, Puzzle, PuzzleOption } from '@/games/odd-one-out/content/puzzles';

export type LevelChoice = Level | 'mix';

/** Form Setup (nhớ cho lần sau) */
export interface SetupDraft {
  /** Tên bé — hiện trên bảng xếp hạng của máy này */
  name: string;
  /** Id chủ đề hoặc 'mixed' */
  topic: string;
  level: LevelChoice;
  /** Số câu khi chơi MIXED (một chủ đề thì chơi hết câu của chủ đề) */
  count: number;
  /** Bước nói "I think the ___ is different because ___" */
  speaking: boolean;
}

/** Một câu trong ván: hình đã được xáo vị trí */
export interface RoundPuzzle {
  puzzle: Puzzle;
  options: PuzzleOption[];
  /** Vị trí hình khác loại sau khi xáo */
  odd: number;
}

/** choose: nhìn & chọn · speak: nói lý do · answer: xem đáp án, nghe câu mẫu */
export type Phase = 'choose' | 'speak' | 'answer';

export interface PuzzleRecord {
  puzzleId: string;
  chosen: number;
  correct: boolean;
  /** Được cộng điểm nói */
  spoke: boolean;
  /** Câu micro nghe được (rỗng nếu không dùng micro) */
  heard: string;
  /** Thời gian làm câu này (ms): từ lúc hiện câu tới lúc xem đáp án */
  ms: number;
}

export interface ActiveRound {
  /** Tăng mỗi ván mới */
  id: number;
  settings: SetupDraft;
  puzzles: RoundPuzzle[];
  index: number;
  phase: Phase;
  selected: number | null;
  records: PuzzleRecord[];
  score: number;
  startedAt: number;
  /** Lúc hiện câu hiện tại — đồng hồ của câu chạy từ đây tới lúc xem đáp án */
  puzzleStartedAt: number;
}
