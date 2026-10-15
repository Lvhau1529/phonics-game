import { describe, expect, it } from 'vitest';
import { ALL_WORLDS, ALL_WORLDS_COUNT } from '@/games/english-explorers/content/worlds';
import {
  earnsSpeakingPoints,
  pickQuestions,
  pointsFor,
  spokenPrompt,
  starsFor,
} from '@/games/english-explorers/session/rules';

describe('pickQuestions', () => {
  it('một thế giới: cả 10 câu, đáp án đúng vẫn đúng sau khi xáo', () => {
    const picked = pickQuestions('habitats');
    expect(picked).toHaveLength(10);
    for (const item of picked)
      expect(item.options[item.answer]).toBe(item.question.options[item.question.answer]);
  });

  it('ALL WORLDS: 10 câu rải đều 3 thế giới', () => {
    const picked = pickQuestions(ALL_WORLDS);
    expect(picked).toHaveLength(ALL_WORLDS_COUNT);
    const worlds = picked.map((item) => item.question.id.split('-')[0]);
    expect(new Set(worlds.slice(0, 3)).size).toBe(3);
  });
});

describe('điểm', () => {
  it('giảm theo số lần sai', () => {
    expect([0, 1, 2, 5].map(pointsFor)).toEqual([10, 5, 2, 2]);
  });

  it('có micro: phải nói gần đủ câu mẫu', () => {
    expect(earnsSpeakingPoints('fish lives in the ocean', 'The fish lives in the ocean.', true)).toBe(true);
    expect(earnsSpeakingPoints('ocean', 'The fish lives in the ocean.', true)).toBe(false);
    expect(earnsSpeakingPoints('', 'The fish lives in the ocean.', false)).toBe(true);
  });

  it('sao theo câu đúng ngay lần đầu', () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(6, 10)).toBe(2);
    expect(starsFor(2, 10)).toBe(1);
  });
});

describe('spokenPrompt', () => {
  it('chỗ trống đọc thành "...", kèm 3 đáp án', () => {
    expect(spokenPrompt('The elephant is ___.', ['big', 'small', 'thin'])).toBe(
      'The elephant is .... big, small, or thin?',
    );
    expect(spokenPrompt('Where does the fish live?', ['the ocean', 'the forest', 'the desert'])).toBe(
      'Where does the fish live? the ocean, the forest, or the desert?',
    );
  });
});
