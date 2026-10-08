import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/games/phonics-ocean/content/levels';
import type { LevelDef } from '@/games/phonics-ocean/content/schema';
import { comboMultiplier, RoundState, RULES, starsFor, tierFor } from '@/games/phonics-ocean/session/round';

const level = (patch: Partial<LevelDef> = {}): LevelDef => ({ ...LEVELS[0], ...patch });

describe('luật điểm', () => {
  it('combo ×2 từ chuỗi 3, ×3 từ chuỗi 5', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(3)).toBe(2);
    expect(comboMultiplier(5)).toBe(3);
  });

  it('cỡ cá theo mốc 1/3, 2/3 số từ cần qua màn', () => {
    expect(tierFor(0, 12)).toBe(1);
    expect(tierFor(3, 12)).toBe(1);
    expect(tierFor(4, 12)).toBe(2);
    expect(tierFor(8, 12)).toBe(3);
    expect(tierFor(12, 12)).toBe(3);
  });

  it('sao: chưa qua màn = 0; 3 sao từ 90%; 2 sao từ ngưỡng thành thạo', () => {
    expect(starsFor(false, 1, 0.8)).toBe(0);
    expect(starsFor(true, 0.95, 0.8)).toBe(3);
    expect(starsFor(true, 0.85, 0.8)).toBe(2);
    expect(starsFor(true, 0.5, 0.8)).toBe(1);
  });
});

describe('RoundState', () => {
  it('ăn đúng: điểm, chuỗi, lớn lên, qua màn', () => {
    const round = new RoundState(level({ correctToClear: 6, startChoices: 3, maxChoices: 5 }));
    round.startQuestion();
    expect(round.answerCorrect('map', 'm').points).toBe(RULES.points.firstTry);
    round.startQuestion();
    const second = round.answerCorrect('sun', 's');
    expect(second.grew).toBe(true);
    expect(round.tier).toBe(2);
    for (let i = 0; i < 3; i += 1) {
      round.startQuestion();
      round.answerCorrect('fish', 'f');
    }
    round.startQuestion();
    const last = round.answerCorrect('net', 'n');
    expect(last.cleared).toBe(true);
    expect(round.finish('cleared')).toMatchObject({ cleared: true, stars: 3, correct: 6, bestStreak: 6 });
  });

  it('ăn nhầm không mất tim; nhầm 2 lần -> gợi ý và bớt cá; đúng sau khi nhầm được ít điểm hơn', () => {
    const round = new RoundState(level({ startChoices: 3 }));
    round.startQuestion();
    expect(round.answerWrong()).toEqual({ hint: false, easier: false });
    expect(round.answerWrong()).toEqual({ hint: true, easier: true });
    expect(round.hearts).toBe(RULES.hearts);
    expect(round.choices).toBe(2);
    expect(round.predatorsCalm).toBe(true);
    const outcome = round.answerCorrect('map', 'm');
    expect(outcome.points).toBe(RULES.points.retry);
    expect(round.hint).toBe(false);
    expect(round.finish('time').words).toEqual([{ word: 'map', firstTry: false }]);
  });

  it('chuỗi 5 câu đúng -> thêm cá (tới maxChoices)', () => {
    const round = new RoundState(level({ startChoices: 3, maxChoices: 4, correctToClear: 50 }));
    const harder = Array.from({ length: 10 }, () => {
      round.startQuestion();
      return round.answerCorrect('map', 'm').harder;
    });
    expect(harder.filter(Boolean)).toHaveLength(1);
    expect(round.choices).toBe(4);
  });

  it('tỉ lệ đúng thấp -> tối đa 3 cá', () => {
    const round = new RoundState(level({ startChoices: 5, maxChoices: 6 }));
    expect(round.choiceCount).toBe(5);
    round.startQuestion();
    round.answerCorrect('map', 'm');
    round.answerWrong();
    round.startQuestion();
    round.answerCorrect('map', 'm');
    round.answerWrong();
    round.answerWrong();
    expect(round.accuracy).toBeLessThan(RULES.struggleAccuracy);
    expect(round.choiceCount).toBeLessThanOrEqual(RULES.struggleChoices);
  });

  it('cấp vần: đủ chuỗi cùng vần ăn đúng ngay -> RHYME COMBO', () => {
    const rime = LEVELS.find((item) => item.mode === 'rime')!;
    const round = new RoundState(rime);
    const combos = ['cat', 'hat', 'bat'].map((word) => {
      round.startQuestion();
      return round.answerCorrect(word, '-at').rhymeCombo;
    });
    expect(combos).toEqual([false, false, true]);
  });

  it('tim chỉ mất khi bị cá săn mồi cắn, không xuống dưới 0, hồi tối đa 3', () => {
    const round = new RoundState(level());
    expect(round.loseHeart()).toBe(2);
    round.gainHeart();
    round.gainHeart();
    expect(round.hearts).toBe(RULES.hearts);
    round.loseHeart();
    round.loseHeart();
    round.loseHeart();
    expect(round.loseHeart()).toBe(0);
  });
});
