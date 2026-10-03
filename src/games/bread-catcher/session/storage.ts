/**
 * Lưu localStorage của Bread Catcher: form Setup gần nhất (gồm tên đội), điểm cao Solo,
 * bảng tổng điểm các đội qua nhiều buổi. Cài đặt âm thanh dùng chung ở platform/prefs.ts.
 * An toàn khi localStorage bị chặn (private mode): chỉ giữ trong bộ nhớ.
 */
import { createStore } from '@/shared/createStore';
import type { TeamTotal } from '@/games/bread-catcher/session/leaderboard';
import { TEAM_MASCOTS } from '@/games/bread-catcher/session/teams';
import type { LevelId, SetupDraft } from '@/games/bread-catcher/session/types';
import { gameStorageKey, readJson, removeKeys, writeJson } from '@/platform/storage';

const STORAGE_KEY = gameStorageKey('bread-catcher');
/** Save của các bản cũ: v2 được chuyển sang key mới (giữ điểm các đội), v1 bỏ hẳn */
const PREVIOUS_KEY = 'phonics-bread-catcher-v2';
const LEGACY_KEYS = ['bread-catcher-save-v1', PREVIOUS_KEY];

interface SaveData {
  lastSetup: SetupDraft | null;
  soloBest: Partial<Record<LevelId, number>>;
  teamTotals: TeamTotal[];
}

const DEFAULTS: SaveData = {
  lastSetup: null,
  soloBest: {},
  teamTotals: [],
};

function read(): SaveData {
  const stored = readJson<SaveData>(STORAGE_KEY) ?? readJson<SaveData>(PREVIOUS_KEY) ?? {};
  return {
    lastSetup: stored.lastSetup ?? DEFAULTS.lastSetup,
    soloBest: { ...stored.soloBest },
    // Mascot theo vị trí đội (save cũ còn lion / tiger / panda)
    teamTotals: Array.isArray(stored.teamTotals)
      ? stored.teamTotals.map((row) => ({ ...row, mascot: TEAM_MASCOTS[row.teamId] ?? TEAM_MASCOTS[0] }))
      : [],
  };
}

const data = read();

function write(): void {
  writeJson(STORAGE_KEY, data);
  removeKeys(LEGACY_KEYS);
}

export function loadLastSetup(): SetupDraft | null {
  return data.lastSetup;
}

export function saveLastSetup(draft: SetupDraft): void {
  data.lastSetup = draft;
  write();
}

/** Ghi điểm Solo theo level; trả về điểm cao nhất và có phải kỷ lục mới */
export function recordSoloScore(levelId: LevelId, score: number): { best: number; isNewBest: boolean } {
  const previous = data.soloBest[levelId] ?? 0;
  const isNewBest = score > previous;
  if (isNewBest) {
    data.soloBest[levelId] = score;
    write();
  }
  return { best: Math.max(previous, score), isNewBest };
}

/** Bảng tổng điểm các đội (Class Mode) — React đọc để hiện / reset */
export const teamTotalsStore = createStore<{ totals: TeamTotal[] }>({ totals: data.teamTotals });
teamTotalsStore.subscribe(() => {
  data.teamTotals = teamTotalsStore.get().totals;
  write();
});

export function saveTeamTotals(totals: TeamTotal[]): void {
  teamTotalsStore.set({ totals });
}

export function resetTeamTotals(): void {
  teamTotalsStore.set({ totals: [] });
}
