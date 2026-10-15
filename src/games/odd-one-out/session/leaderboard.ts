/**
 * Bảng xếp hạng trên máy này (localStorage — không chia sẻ giữa các máy).
 * Mỗi tên chỉ giữ lượt tốt nhất trong bộ lọc đang xem; xếp theo điểm ↓, câu đúng ↓, tổng thời gian ↑, chơi trước.
 */
import { z } from 'zod';

export const BoardRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  topic: z.string().min(1),
  level: z.enum(['easy', 'challenge', 'mix']),
  count: z.int().min(1),
  score: z.int().min(0),
  correct: z.int().min(0),
  totalMs: z.number().min(0),
  createdAt: z.number(),
});
export type BoardRecord = z.infer<typeof BoardRecordSchema>;

/** Giữ ngần này lượt gần nhất */
export const MAX_RECORDS = 500;

export interface BoardFilter {
  /** 'all' hoặc id chủ đề / 'mixed' */
  topic: string;
  level: 'all' | BoardRecord['level'];
  /** 'all' hoặc số câu */
  count: 'all' | number;
}

export const ALL_FILTER: BoardFilter = { topic: 'all', level: 'all', count: 'all' };

export function compareRecords(a: BoardRecord, b: BoardRecord): number {
  return b.score - a.score || b.correct - a.correct || a.totalMs - b.totalMs || a.createdAt - b.createdAt;
}

const nameKey = (name: string) => name.trim().toLocaleLowerCase();

/** Lượt tốt nhất của từng tên khớp bộ lọc, đã xếp hạng */
export function rankBoard(records: readonly BoardRecord[], filter: BoardFilter): BoardRecord[] {
  const best = new Map<string, BoardRecord>();
  for (const record of records) {
    if (filter.topic !== 'all' && record.topic !== filter.topic) continue;
    if (filter.level !== 'all' && record.level !== filter.level) continue;
    if (filter.count !== 'all' && record.count !== filter.count) continue;
    const key = nameKey(record.name);
    const previous = best.get(key);
    if (!previous || compareRecords(record, previous) < 0) best.set(key, record);
  }
  return [...best.values()].sort(compareRecords);
}

/**
 * Các số câu có trong dữ liệu (lựa chọn của bộ lọc "PUZZLES").
 * Bản gốc chỉ có sẵn 3/6/9/12/15/30/90 — ván 45 câu (MIXED + EASY) không có trong danh sách nên
 * bảng trống trơn ngay sau khi chơi xong.
 */
export function boardCounts(records: readonly BoardRecord[]): number[] {
  return [...new Set(records.map((record) => record.count))].sort((a, b) => a - b);
}

/** Hạng (1, 2, ...) của lượt `id` trong bảng đã lọc; null nếu lượt đó không phải lượt tốt nhất của tên */
export function rankOf(records: readonly BoardRecord[], filter: BoardFilter, id: string): number | null {
  const index = rankBoard(records, filter).findIndex((record) => record.id === id);
  return index < 0 ? null : index + 1;
}
