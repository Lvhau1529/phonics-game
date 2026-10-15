/**
 * Lưu localStorage của Odd One Out (`phonics-arcade:odd-one-out`): form Setup gần nhất + bảng xếp hạng
 * trên máy. Dữ liệu đọc lại được kiểm tra bằng zod — bản ghi hỏng thì bỏ qua, không làm vỡ game.
 */
import { z } from 'zod';
import { BoardRecordSchema, MAX_RECORDS, type BoardRecord } from '@/games/odd-one-out/session/leaderboard';
import type { SetupDraft } from '@/games/odd-one-out/session/types';
import { createStore } from '@/core/store/createStore';
import { gameStorageKey, readJson, writeJson } from '@/core/storage/storage';

export const STORAGE_KEY = gameStorageKey('odd-one-out');
const SAVE_VERSION = 1;

const SetupSchema = z
  .object({
    name: z.string().max(40),
    topic: z.string(),
    level: z.enum(['easy', 'challenge', 'mix']),
    count: z.int(),
    speaking: z.boolean(),
  })
  .partial();

interface SaveData {
  version: number;
  lastSetup: Partial<SetupDraft>;
  board: BoardRecord[];
}

function read(): SaveData {
  const stored = readJson<{ lastSetup: unknown; board: unknown }>(STORAGE_KEY) ?? {};
  const setup = SetupSchema.safeParse(stored.lastSetup ?? {});
  const board = Array.isArray(stored.board)
    ? stored.board.flatMap((row) => {
        const parsed = BoardRecordSchema.safeParse(row);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  return {
    version: SAVE_VERSION,
    lastSetup: setup.success ? setup.data : {},
    board: board.slice(-MAX_RECORDS),
  };
}

const data = read();
const write = () => writeJson(STORAGE_KEY, data);

/** Bảng xếp hạng (React đọc ở màn LEADERBOARD / kết quả) */
export const boardStore = createStore<{ records: BoardRecord[] }>({ records: [...data.board] });

export function loadLastSetup(): Partial<SetupDraft> {
  return data.lastSetup;
}

export function saveLastSetup(draft: SetupDraft): void {
  data.lastSetup = draft;
  write();
}

export function addBoardRecord(record: BoardRecord): void {
  data.board = [...data.board, record].slice(-MAX_RECORDS);
  write();
  boardStore.set({ records: [...data.board] });
}

export function clearBoard(): void {
  data.board = [];
  write();
  boardStore.set({ records: [] });
}
