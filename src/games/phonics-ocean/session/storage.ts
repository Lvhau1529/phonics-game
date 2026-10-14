/**
 * Lưu localStorage của Phonics Ocean (`phonics-arcade:phonics-ocean`): form Setup gần nhất và
 * sao / điểm cao nhất theo cấp. Cài đặt âm thanh dùng chung ở platform/prefs.ts.
 */
import { z } from 'zod';
import type { SetupDraft } from '@/games/phonics-ocean/session/types';
import { gameStorageKey, readJson, writeJson } from '@/core/storage/storage';
import { createStore } from '@/core/store/createStore';

const STORAGE_KEY = gameStorageKey('phonics-ocean');
const SAVE_VERSION = 1;

const LevelProgressSchema = z.object({
  stars: z.number().int().min(0).max(3),
  best: z.number().min(0),
});

const SaveSchema = z.object({
  lastSetup: z.object({ levelId: z.string(), predators: z.boolean() }).partial().nullable().catch(null),
  progress: z.record(z.string(), LevelProgressSchema).catch({}),
});

export type LevelProgress = z.infer<typeof LevelProgressSchema>;

interface SaveData {
  version: number;
  lastSetup: Partial<SetupDraft> | null;
  progress: Record<string, LevelProgress>;
}

function read(): SaveData {
  const parsed = SaveSchema.safeParse(readJson(STORAGE_KEY) ?? {});
  return {
    version: SAVE_VERSION,
    lastSetup: parsed.success ? parsed.data.lastSetup : null,
    progress: parsed.success ? parsed.data.progress : {},
  };
}

const data = read();
const write = () => writeJson(STORAGE_KEY, data);

/** Sao đã đạt (React hiện ở danh sách cấp) */
export const progressStore = createStore<{ progress: Record<string, LevelProgress> }>({
  progress: { ...data.progress },
});

export function loadLastSetup(): Partial<SetupDraft> | null {
  return data.lastSetup;
}

export function saveLastSetup(draft: SetupDraft): void {
  data.lastSetup = draft;
  write();
}

/** Ghi kết quả; trả về kết quả cũ để màn kết quả biết có kỷ lục mới không */
export function recordProgress(levelId: string, stars: number, score: number): LevelProgress | undefined {
  const previous = data.progress[levelId];
  data.progress[levelId] = {
    stars: Math.max(previous?.stars ?? 0, stars),
    best: Math.max(previous?.best ?? 0, score),
  };
  write();
  progressStore.set({ progress: { ...data.progress } });
  return previous;
}
