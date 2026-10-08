import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/games/phonics-ocean/content/levels';
import {
  Bag,
  magicEPair,
  matchesTarget,
  oneLetterApart,
  QuestionDeck,
  RHYME_CHAIN,
} from '@/games/phonics-ocean/session/questions';

describe('matchesTarget', () => {
  it('âm đầu / vần / cụm chữ / từ', () => {
    expect(matchesTarget('initial', 'm', 'map')).toBe(true);
    expect(matchesTarget('initial', 'm', 'ham')).toBe(false);
    expect(matchesTarget('rime', '-at', 'cat')).toBe(true);
    expect(matchesTarget('rime', '-at', 'cap')).toBe(false);
    expect(matchesTarget('contains', 'sh', 'fish')).toBe(true);
    expect(matchesTarget('contains', 'st', 'nest')).toBe(true);
    expect(matchesTarget('word', 'kite', 'kit')).toBe(false);
  });
});

describe('cặp từ gần âm', () => {
  it('chỉ khác 1 chữ', () => {
    expect(oneLetterApart('tub', 'cub')).toBe(true);
    expect(oneLetterApart('tub', 'tub')).toBe(false);
    expect(oneLetterApart('tub', 'cup')).toBe(false);
    expect(oneLetterApart('tub', 'tube')).toBe(false);
  });

  it('cặp Magic-E', () => {
    expect(magicEPair('kit', 'kite')).toBe(true);
    expect(magicEPair('cube', 'cub')).toBe(true);
    expect(magicEPair('kite', 'bike')).toBe(false);
  });
});

describe('Bag', () => {
  it('bốc hết mọi phần tử trước khi lặp lại, không lặp ngay phần tử vừa bốc', () => {
    const bag = new Bag([1, 2, 3]);
    const first = [bag.draw(), bag.draw(), bag.draw()];
    expect([...first].sort()).toEqual([1, 2, 3]);
    for (let i = 0; i < 50; i += 1) {
      const previous = bag.draw();
      expect(bag.draw()).not.toBe(previous);
    }
  });
});

describe('QuestionDeck', () => {
  it.each(LEVELS.map((level) => [level.id, level] as const))(
    '%s: đúng 1 cá đúng, không trùng, cá gây nhiễu không khớp mục tiêu',
    (_id, level) => {
      const deck = new QuestionDeck(level, { canSpeak: true });
      for (let i = 0; i < 60; i += 1) {
        const choiceCount = level.startChoices + (i % (level.maxChoices - level.startChoices + 1));
        const question = deck.next(choiceCount);
        expect(question.choices).toContain(question.answer);
        expect(new Set(question.choices).size).toBe(question.choices.length);
        expect(question.choices.length).toBeGreaterThanOrEqual(2);
        expect(question.choices.length).toBeLessThanOrEqual(choiceCount);
        const matching = question.choices.filter((word) =>
          matchesTarget(question.mode, question.targetId, word),
        );
        expect(matching).toEqual([question.answer]);
        expect(question.promptSpeech.length).toBeGreaterThan(0);
      }
    },
  );

  it('cấp vần giữ cùng một vần RHYME_CHAIN câu liền nhau', () => {
    const level = LEVELS.find((item) => item.mode === 'rime')!;
    const deck = new QuestionDeck(level, { canSpeak: true });
    const targets = Array.from({ length: RHYME_CHAIN * 4 }, () => deck.next(3).targetId);
    for (let chain = 0; chain < 4; chain += 1) {
      const slice = targets.slice(chain * RHYME_CHAIN, (chain + 1) * RHYME_CHAIN);
      expect(new Set(slice).size).toBe(1);
    }
  });

  it('nghe từ: giấu từ khi đọc được, hiện từ khi máy không đọc được', () => {
    const level = LEVELS.find((item) => item.mode === 'word')!;
    expect(new QuestionDeck(level, { canSpeak: true }).next(3).hidden).toBe(true);
    expect(new QuestionDeck(level, { canSpeak: false }).next(3).hidden).toBe(false);
  });

  it('Magic E: ưu tiên cặp kit / kite làm cá gây nhiễu', () => {
    const level = LEVELS.find((item) => item.id === 'magic-e-bay')!;
    const deck = new QuestionDeck(level, { canSpeak: true });
    for (let i = 0; i < 40; i += 1) {
      const question = deck.next(3);
      const partner = level.extraDistractors.find((word) => magicEPair(word, question.answer));
      if (partner) expect(question.choices).toContain(partner);
    }
  });

  it('ôn tập: câu khung "I can see a ___."', () => {
    const level = LEVELS.find((item) => item.mode === 'sentence')!;
    const question = new QuestionDeck(level, { canSpeak: true }).next(3);
    expect(question.sentence).toMatch(/^I can see an? ___\.$/);
    expect(question.promptSpeech.at(-1)).toBe(question.answer);
  });
});
