/**
 * 3 "thế giới" mẫu câu (theo bản HTML gốc "Little English Explorers" — bản gốc chỉ có 1 câu / thế giới,
 * ở đây mỗi thế giới 10 câu) + chế độ ALL WORLDS trộn câu của cả 3.
 */
import bank from '@/games/english-explorers/content/worlds.json';
import { WorldBankSchema, type Question, type World } from '@/games/english-explorers/content/schema';

export type { Question, World };
export type { AnswerOption, Picture, PictureName } from '@/games/english-explorers/content/schema';

export const WORLDS: readonly World[] = WorldBankSchema.parse(bank).worlds;

/** Trộn cả 3 thế giới */
export const ALL_WORLDS = 'all';

/** Số câu của ván ALL WORLDS */
export const ALL_WORLDS_COUNT = 10;

export function getWorld(id: string): World | undefined {
  return WORLDS.find((world) => world.id === id);
}

/** Thế giới của một câu (id câu dạng `<world>-<n>`) */
export function worldOf(questionId: string): World | undefined {
  return getWorld(questionId.replace(/-\d+$/, ''));
}
