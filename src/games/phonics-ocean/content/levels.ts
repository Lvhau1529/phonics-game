/**
 * 8 cấp của Phonics Ocean (GAMEPLAY_PHONICS_V2.md §5): âm đầu → CVC → vần → cụm phụ âm → digraph →
 * Magic E → ôn tập. Scene không bao giờ hard-code từ: mọi thứ học đều đến từ levels.json.
 */
import data from '@/games/phonics-ocean/content/levels.json';
import { ContentSchema, type LevelDef } from '@/games/phonics-ocean/content/schema';

export type { LevelDef };

export const LEVELS: readonly LevelDef[] = ContentSchema.parse(data).levels;

export function getLevel(id: string): LevelDef {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}

export function nextLevel(id: string): LevelDef | undefined {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index >= 0 ? LEVELS[index + 1] : undefined;
}
