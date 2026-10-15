/**
 * Luật Odd One Out (thuần TS): chọn câu cho ván, điểm, sao, điểm nói.
 */
import { MIXED, puzzlesFor, type Puzzle } from '@/games/odd-one-out/content/puzzles';
import type { LevelChoice, PuzzleRecord, RoundPuzzle, SetupDraft } from '@/games/odd-one-out/session/types';
import { shuffle } from '@/core/utils/random';
import { toWords } from '@/core/utils/speechRecognition';

export const SCORING = {
  /** Chọn đúng hình khác loại */
  correct: 10,
  /** Nói lý do (micro nghe thấy bé nói, hoặc máy không có micro) */
  spoke: 5,
} as const;

/** Số câu khi chơi MIXED */
export const MIXED_COUNTS = [6, 10, 15] as const;

/** Micro nghe được ít nhất ngần này từ thì tính là bé đã nói */
export const MIN_SPOKEN_WORDS = 2;

/** Số câu thực tế của ván: một chủ đề = hết câu của chủ đề ở cấp đó (3 hoặc 6); MIXED = `count` */
export function roundLength(settings: Pick<SetupDraft, 'topic' | 'level' | 'count'>): number {
  const available = puzzlesFor(settings.topic, settings.level).length;
  return settings.topic === MIXED.id ? Math.min(settings.count, available) : available;
}

/**
 * Chọn & xáo câu cho ván. MIXED: rải đều chủ đề (không 2 câu cùng chủ đề khi còn chủ đề khác) và tránh lặp
 * hình khác loại (câu EASY của nhiều chủ đề cùng dùng apple / car / cat...).
 * Vị trí 4 hình cũng được xáo để bé không đoán theo vị trí.
 */
export function pickPuzzles(
  settings: Pick<SetupDraft, 'topic' | 'level' | 'count'>,
  random: <T>(items: readonly T[]) => T[] = shuffle,
): RoundPuzzle[] {
  const pool = random(puzzlesFor(settings.topic, settings.level));
  const length = roundLength(settings);
  const picked: Puzzle[] = [];
  if (settings.topic === MIXED.id) {
    // Lần lượt lấy 1 câu / chủ đề cho tới khi đủ
    const byTopic = new Map<string, Puzzle[]>();
    for (const puzzle of pool) byTopic.set(puzzle.topic, [...(byTopic.get(puzzle.topic) ?? []), puzzle]);
    const queues = random([...byTopic.values()]);
    const oddName = (puzzle: Puzzle) => puzzle.options[puzzle.odd].name;
    const usedOdd = new Set<string>();
    const isFresh = (puzzle: Puzzle) => !usedOdd.has(oddName(puzzle));
    while (picked.length < length && queues.some((queue) => queue.length > 0)) {
      // Mỗi lượt mỗi chủ đề góp đúng 1 câu; trong lượt, chủ đề còn câu có hình khác loại chưa dùng được lấy trước
      const pending = queues.filter((queue) => queue.length > 0);
      while (pending.length > 0 && picked.length < length) {
        const withFresh = pending.findIndex((q) => q.some(isFresh));
        const [queue] = pending.splice(Math.max(0, withFresh), 1);
        const [next] = queue.splice(Math.max(0, queue.findIndex(isFresh)), 1);
        usedOdd.add(oddName(next));
        picked.push(next);
      }
    }
  } else {
    picked.push(...pool.slice(0, length));
  }
  return picked.map((puzzle) => {
    const options = random(puzzle.options);
    return { puzzle, options, odd: options.indexOf(puzzle.options[puzzle.odd]) };
  });
}

/** Điểm nói: máy nghe được (ít nhất 2 từ); micro không dùng được -> tin bé (giáo viên nghe) */
export function earnsSpeakingPoints(heard: string, micAvailable: boolean): boolean {
  return micAvailable ? toWords(heard).length >= MIN_SPOKEN_WORDS : true;
}

export function scoreFor(record: Pick<PuzzleRecord, 'correct' | 'spoke'>): number {
  return (record.correct ? SCORING.correct : 0) + (record.spoke ? SCORING.spoke : 0);
}

/** 3 sao: ≥ 90% đúng · 2 sao: ≥ 60% · 1 sao: chơi hết ván */
export function starsFor(correct: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

/** Nhãn cấp cho bảng xếp hạng / kết quả */
export function levelLabel(level: LevelChoice): string {
  return level === 'easy' ? 'EASY' : level === 'challenge' ? 'CHALLENGE' : 'MIX';
}
