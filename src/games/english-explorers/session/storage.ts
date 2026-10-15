/**
 * Lưu localStorage của Little English Explorers (`phonics-arcade:english-explorers`): form Setup gần nhất +
 * sao / điểm cao nhất của từng thế giới. Dữ liệu đọc lại được kiểm tra bằng zod.
 */
import { z } from 'zod';
import type { SetupDraft } from '@/games/english-explorers/session/types';
import { createStore } from '@/core/store/createStore';
import { gameStorageKey, readJson, writeJson } from '@/core/storage/storage';

export const STORAGE_KEY = gameStorageKey('english-explorers');
const SAVE_VERSION = 1;

const SetupSchema = z
  .object({ name: z.string().max(40), world: z.string(), speaking: z.boolean() })
  .partial();
const ProgressSchema = z.record(z.string(), z.object({ stars: z.int().min(0).max(3), best: z.int().min(0) }));

export type WorldProgress = z.infer<typeof ProgressSchema>[string];

interface SaveData {
  version: number;
  lastSetup: Partial<SetupDraft>;
  progress: Record<string, WorldProgress>;
}

function read(): SaveData {
  const stored = readJson<{ lastSetup: unknown; progress: unknown }>(STORAGE_KEY) ?? {};
  const setup = SetupSchema.safeParse(stored.lastSetup ?? {});
  const progress = ProgressSchema.safeParse(stored.progress ?? {});
  return {
    version: SAVE_VERSION,
    lastSetup: setup.success ? setup.data : {},
    progress: progress.success ? progress.data : {},
  };
}

const data = read();
const write = () => writeJson(STORAGE_KEY, data);

/** Sao đã đạt theo thế giới (React hiện trên thẻ thế giới) */
export const progressStore = createStore<{ progress: Record<string, WorldProgress> }>({
  progress: { ...data.progress },
});

export function loadLastSetup(): Partial<SetupDraft> {
  return data.lastSetup;
}

export function saveLastSetup(draft: SetupDraft): void {
  data.lastSetup = draft;
  write();
}

/** Ghi kết quả; trả về kết quả cũ để màn kết quả biết có kỷ lục mới không */
export function recordProgress(worldId: string, stars: number, score: number): WorldProgress | undefined {
  const previous = data.progress[worldId];
  data.progress[worldId] = {
    stars: Math.max(previous?.stars ?? 0, stars),
    best: Math.max(previous?.best ?? 0, score),
  };
  write();
  progressStore.set({ progress: { ...data.progress } });
  return previous;
}
