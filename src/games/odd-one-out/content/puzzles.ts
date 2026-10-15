/**
 * Ngân hàng 90 câu đố (15 chủ đề × 3 EASY + 3 CHALLENGE) — lấy từ bản HTML gốc "Speaking Adventure",
 * đã sửa các câu sai hình / trùng ý (xem docs/odd-one-out). Mọi thứ bé học đều đến từ đây.
 */
import bank from '@/games/odd-one-out/content/puzzles.json';
import { PuzzleBankSchema, type Level, type Puzzle } from '@/games/odd-one-out/content/schema';

export type { Level, Puzzle };
export type { PuzzleOption } from '@/games/odd-one-out/content/schema';

export interface Topic {
  id: string;
  title: string;
  emoji: string;
}

/** Thứ tự hiện ở màn Setup */
export const TOPICS: readonly Topic[] = [
  { id: 'colors', title: 'COLORS', emoji: '🎨' },
  { id: 'shapes', title: 'SHAPES', emoji: '🔷' },
  { id: 'toys', title: 'TOYS', emoji: '🧸' },
  { id: 'bugs', title: 'BUGS', emoji: '🐞' },
  { id: 'garden', title: 'GARDEN', emoji: '🌻' },
  { id: 'animals', title: 'ANIMALS', emoji: '🐼' },
  { id: 'jobs', title: 'JOBS', emoji: '👩‍🏫' },
  { id: 'work-places', title: 'WORK PLACES', emoji: '🏥' },
  { id: 'transport', title: 'TRANSPORT', emoji: '🚗' },
  { id: 'weather', title: 'WEATHER', emoji: '🌤️' },
  { id: 'clothes', title: 'CLOTHES', emoji: '👕' },
  { id: 'feelings', title: 'FEELINGS', emoji: '😊' },
  { id: 'food', title: 'FOOD', emoji: '🍎' },
  { id: 'drinks', title: 'DRINKS', emoji: '🥤' },
  { id: 'family', title: 'FAMILY', emoji: '👨‍👩‍👧' },
];

/** Trộn mọi chủ đề */
export const MIXED: Topic = { id: 'mixed', title: 'MIXED', emoji: '🎲' };

export const PUZZLES: readonly Puzzle[] = PuzzleBankSchema.parse(bank).puzzles;

export function getTopic(id: string): Topic {
  return TOPICS.find((topic) => topic.id === id) ?? MIXED;
}

export function puzzlesFor(topicId: string, level: Level | 'mix'): Puzzle[] {
  return PUZZLES.filter(
    (puzzle) =>
      (topicId === MIXED.id || puzzle.topic === topicId) && (level === 'mix' || puzzle.level === level),
  );
}
