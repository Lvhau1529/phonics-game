import { describe, expect, it } from 'vitest';
import {
  ALL_FILTER,
  boardCounts,
  rankBoard,
  rankOf,
  type BoardRecord,
} from '@/games/odd-one-out/session/leaderboard';

let seq = 0;
const rec = (patch: Partial<BoardRecord>): BoardRecord => ({
  id: String(++seq),
  name: 'An',
  topic: 'colors',
  level: 'easy',
  count: 3,
  score: 30,
  correct: 3,
  totalMs: 30_000,
  createdAt: seq,
  ...patch,
});

describe('rankBoard', () => {
  it('xếp theo điểm, rồi câu đúng, rồi thời gian ngắn hơn', () => {
    const rows = rankBoard(
      [
        rec({ name: 'A', score: 30, correct: 3, totalMs: 50_000 }),
        rec({ name: 'B', score: 30, correct: 3, totalMs: 20_000 }),
        rec({ name: 'C', score: 45, correct: 3 }),
        rec({ name: 'D', score: 30, correct: 2 }),
      ],
      ALL_FILTER,
    );
    expect(rows.map((row) => row.name)).toEqual(['C', 'B', 'A', 'D']);
  });

  it('mỗi tên (không phân biệt hoa / thường, khoảng trắng) chỉ giữ lượt tốt nhất', () => {
    const rows = rankBoard([rec({ name: 'An', score: 10 }), rec({ name: ' an ', score: 40 })], ALL_FILTER);
    expect(rows).toHaveLength(1);
    expect(rows[0].score).toBe(40);
  });

  it('lọc theo chủ đề / cấp / số câu', () => {
    const records = [
      rec({ name: 'A', topic: 'colors' }),
      rec({ name: 'B', topic: 'mixed', level: 'easy', count: 45 }),
    ];
    expect(rankBoard(records, { topic: 'mixed', level: 'easy', count: 45 }).map((r) => r.name)).toEqual([
      'B',
    ]);
    expect(rankBoard(records, { topic: 'all', level: 'challenge', count: 'all' })).toEqual([]);
  });
});

describe('boardCounts', () => {
  it('lấy số câu từ dữ liệu (ván 45 câu vẫn lọc được — lỗi bảng trống của bản gốc)', () => {
    expect(boardCounts([rec({ count: 45 }), rec({ count: 6 }), rec({ count: 45 })])).toEqual([6, 45]);
  });
});

describe('rankOf', () => {
  it('hạng của lượt vừa chơi; null nếu tên đó đã có lượt tốt hơn', () => {
    const best = rec({ name: 'A', score: 50 });
    const worse = rec({ name: 'A', score: 10 });
    const other = rec({ name: 'B', score: 40 });
    const records = [best, worse, other];
    expect(rankOf(records, ALL_FILTER, best.id)).toBe(1);
    expect(rankOf(records, ALL_FILTER, other.id)).toBe(2);
    expect(rankOf(records, ALL_FILTER, worse.id)).toBeNull();
  });
});
