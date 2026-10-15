import { describe, expect, it } from 'vitest';
import { PUZZLES, TOPICS, puzzlesFor } from '@/games/odd-one-out/content/puzzles';

describe('ngân hàng câu đố Odd One Out', () => {
  it('15 chủ đề × 3 EASY + 3 CHALLENGE', () => {
    expect(PUZZLES).toHaveLength(90);
    for (const topic of TOPICS) {
      expect(puzzlesFor(topic.id, 'easy'), topic.id).toHaveLength(3);
      expect(puzzlesFor(topic.id, 'challenge'), topic.id).toHaveLength(3);
    }
  });

  it('id không trùng, mỗi câu 4 tên khác nhau', () => {
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    for (const puzzle of PUZZLES) {
      expect(new Set(puzzle.options.map((o) => o.name)).size, puzzle.id).toBe(4);
      expect(
        new Set(puzzle.options.map((o) => o.emoji ?? `${o.shape}${o.color ?? ''}`)).size,
        puzzle.id,
      ).toBe(4);
    }
  });

  it('câu mẫu nhắc đúng hình khác loại', () => {
    for (const puzzle of PUZZLES) {
      expect(puzzle.sample.toLowerCase(), puzzle.id).toContain(puzzle.options[puzzle.odd].name.toLowerCase());
    }
  });

  it('không dùng emoji quá mới (Unicode 14+: máy cũ hiện ô vuông) hoặc ký tự không phải emoji', () => {
    const tooNew = ['🩷', '🪏', '🪺', '🪹', '🪽', '🫎', '🪿', '▭'];
    for (const puzzle of PUZZLES) {
      for (const option of puzzle.options)
        expect(tooNew, `${puzzle.id} ${option.name}`).not.toContain(option.emoji);
    }
  });
});
