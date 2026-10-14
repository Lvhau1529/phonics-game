/**
 * Lưu localStorage của Food Stream (plan §24): form Setup gần nhất, sao / điểm cao nhất theo
 * gói + cấp (Solo), tổng người xem tích luỹ. Cài đặt âm thanh dùng chung ở platform/prefs.ts.
 */
import type { SetupDraft } from '@/games/food-stream/session/types';
import { createStore } from '@/core/store/createStore';
import { gameStorageKey, readJson, writeJson } from '@/core/storage/storage';

const STORAGE_KEY = gameStorageKey('food-stream');
const SAVE_VERSION = 1;

export interface LevelProgress {
  stars: number;
  best: number;
}

interface SaveData {
  version: number;
  lastSetup: Partial<SetupDraft> | null;
  /** key: `${packId}/${levelId}` */
  progress: Record<string, LevelProgress>;
  totalViewers: number;
}

function read(): SaveData {
  const stored = readJson<SaveData>(STORAGE_KEY) ?? {};
  return {
    version: SAVE_VERSION,
    lastSetup: stored.lastSetup ?? null,
    progress: stored.progress && typeof stored.progress === 'object' ? stored.progress : {},
    totalViewers: Number(stored.totalViewers) || 0,
  };
}

const data = read();
const write = () => writeJson(STORAGE_KEY, data);

const progressKey = (packId: string, levelId: string) => `${packId}/${levelId}`;

/** Sao đã đạt (React hiện ở lưới cấp độ) */
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

export function getProgress(packId: string, levelId: string): LevelProgress | undefined {
  return progressStore.get().progress[progressKey(packId, levelId)];
}

/** Ghi kết quả Solo; trả về kết quả cũ để màn kết quả biết có kỷ lục mới không */
export function recordProgress(
  packId: string,
  levelId: string,
  stars: number,
  score: number,
): LevelProgress | undefined {
  const key = progressKey(packId, levelId);
  const previous = data.progress[key];
  data.progress[key] = {
    stars: Math.max(previous?.stars ?? 0, stars),
    best: Math.max(previous?.best ?? 0, score),
  };
  write();
  progressStore.set({ progress: { ...data.progress } });
  return previous;
}

export function addViewers(count: number): number {
  data.totalViewers += count;
  write();
  return data.totalViewers;
}
