import { describe, expect, it } from 'vitest';
import { puzzlesFor } from '@/games/odd-one-out/content/puzzles';
import {
  earnsSpeakingPoints,
  pickPuzzles,
  roundLength,
  scoreFor,
  SCORING,
  starsFor,
} from '@/games/odd-one-out/session/rules';

describe('roundLength', () => {
  it('một chủ đề: hết câu của cấp đã chọn', () => {
    expect(roundLength({ topic: 'colors', level: 'easy', count: 15 })).toBe(3);
    expect(roundLength({ topic: 'colors', level: 'mix', count: 6 })).toBe(6);
  });

  it('MIXED: theo số câu đã chọn, không quá số câu có', () => {
    expect(roundLength({ topic: 'mixed', level: 'easy', count: 10 })).toBe(10);
    expect(roundLength({ topic: 'mixed', level: 'challenge', count: 15 })).toBe(15);
  });
});

describe('pickPuzzles', () => {
  it('xáo vị trí nhưng vẫn trỏ đúng hình khác loại', () => {
    for (const item of pickPuzzles({ topic: 'mixed', level: 'mix', count: 15 })) {
      expect(item.options[item.odd]).toBe(item.puzzle.options[item.puzzle.odd]);
      expect(item.options).toHaveLength(4);
    }
  });

  it('MIXED: rải đều chủ đề, không trùng câu', () => {
    const picked = pickPuzzles({ topic: 'mixed', level: 'easy', count: 15 });
    expect(picked).toHaveLength(15);
    expect(new Set(picked.map((item) => item.puzzle.topic)).size).toBe(15);
    expect(new Set(picked.map((item) => item.puzzle.id)).size).toBe(15);
  });

  it('MIXED: tránh lặp hình khác loại khi còn câu khác', () => {
    for (let run = 0; run < 20; run += 1) {
      const picked = pickPuzzles({ topic: 'mixed', level: 'easy', count: 6 });
      const odd = picked.map((item) => item.options[item.odd].name);
      expect(new Set(odd).size, odd.join(',')).toBe(6);
    }
  });

  it('một chủ đề: đúng các câu của chủ đề', () => {
    const picked = pickPuzzles({ topic: 'family', level: 'challenge', count: 6 });
    expect(picked.map((item) => item.puzzle.id).sort()).toEqual(
      puzzlesFor('family', 'challenge')
        .map((puzzle) => puzzle.id)
        .sort(),
    );
  });
});

describe('điểm', () => {
  it('đúng +10, nói +5', () => {
    expect(scoreFor({ correct: true, spoke: true })).toBe(SCORING.correct + SCORING.spoke);
    expect(scoreFor({ correct: false, spoke: false })).toBe(0);
  });

  it('có micro: phải nghe được ít nhất 2 từ (bản gốc cộng điểm nói cả khi bé không nói)', () => {
    expect(earnsSpeakingPoints('', true)).toBe(false);
    expect(earnsSpeakingPoints('cat', true)).toBe(false);
    expect(earnsSpeakingPoints('the cat is different', true)).toBe(true);
  });

  it('không có micro: tin bé (giáo viên nghe)', () => {
    expect(earnsSpeakingPoints('', false)).toBe(true);
  });

  it('sao theo tỉ lệ đúng', () => {
    expect(starsFor(6, 6)).toBe(3);
    expect(starsFor(4, 6)).toBe(2);
    expect(starsFor(1, 6)).toBe(1);
    expect(starsFor(0, 0)).toBe(0);
  });
});
