import { describe, expect, it } from 'vitest';
import { LIBRARY, libraryWord, type VocabWord } from '@/games/halloween-candy-quest/content/words';
import {
  basketLevel,
  buildPlan,
  candiesFor,
  checkSetup,
  choiceCount,
  createRng,
  DEFAULT_SETTINGS,
  houseOfTurn,
  leader,
  questionKey,
  replacementQuestion,
  zoneOfTurn,
  zoneSizes,
} from '@/games/halloween-candy-quest/session/rules';
import type { Settings } from '@/games/halloween-candy-quest/session/types';

const WORDS = LIBRARY.map(libraryWord);
const custom = (id: string, text: string): VocabWord => ({
  id,
  text,
  meaning: '',
  image: 'data:image/png;base64,AA',
  sceneEligible: false,
  custom: true,
});
const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...patch });

describe('chia khu vực', () => {
  it('8 lượt -> 3/3/2, 12 -> 4/4/4, khu nào cũng có lượt khi tổng >= 3', () => {
    expect(zoneSizes(8)).toEqual([3, 3, 2]);
    expect(zoneSizes(12)).toEqual([4, 4, 4]);
    expect(zoneSizes(10)).toEqual([4, 3, 3]);
    expect(Array.from({ length: 8 }, (_, t) => zoneOfTurn(t, 8))).toEqual([0, 0, 0, 1, 1, 1, 2, 2]);
  });

  it('nhà quay vòng trong khu vực', () => {
    expect(Array.from({ length: 7 }, (_, t) => houseOfTurn(t, 20))).toEqual([0, 1, 2, 3, 0, 1, 2]);
    expect(houseOfTurn(7, 20)).toBe(0); // lượt đầu khu 2
  });
});

describe('chấm kẹo', () => {
  it('+2 lần 1, +1 lần 2, 0 khi chưa đúng — không bao giờ âm', () => {
    expect(candiesFor(1, true)).toBe(2);
    expect(candiesFor(2, true)).toBe(1);
    expect(candiesFor(2, false)).toBe(0);
  });

  it('giỏ kẹo và đội dẫn đầu / hoà', () => {
    expect(basketLevel(0, 16)).toBe('empty');
    expect(basketLevel(5, 16)).toBe('half');
    expect(basketLevel(12, 16)).toBe('full');
    expect(
      leader([
        { name: 'A', characterId: 'x', score: 4 },
        { name: 'B', characterId: 'y', score: 4 },
      ]),
    ).toBeNull();
    expect(
      leader([
        { name: 'A', characterId: 'x', score: 2 },
        { name: 'B', characterId: 'y', score: 6 },
      ]),
    ).toBe(1);
  });

  it('số lựa chọn: easy 2, normal 3, không quá số từ', () => {
    expect(choiceCount('easy', 0, 2, 24)).toBe(2);
    expect(choiceCount('normal', 0, 0, 24)).toBe(3);
    expect(choiceCount('normal', 0, 0, 2)).toBe(2);
    expect(choiceCount('mixed', 0, 0, 24)).toBe(2);
    expect(choiceCount('mixed', 0, 2, 24)).toBe(3);
  });
});

describe('lịch câu hỏi', () => {
  it('solo: đúng số lượt, đáp án khác nhau, có đáp án đúng, từ đích không lặp liên tiếp', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const plan = buildPlan({
        settings: settings({ mode: 'solo', difficulty: 'normal' }),
        words: WORDS,
        canSpeak: true,
        teamCount: 1,
        firstTeam: 0,
        rng: createRng(seed),
        gameId: 1,
      });
      expect(plan).toHaveLength(8);
      plan.forEach((turn, index) => {
        const { question } = turn;
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.options).toContain(question.targetId);
        if (question.type === 'match_pairs')
          expect([...question.sounds].sort()).toEqual([...question.options].sort());
        else if (question.type === 'find_object') expect(question.options).toHaveLength(4);
        else expect(question.options).toHaveLength(3);
        if (index > 0) expect(question.targetId).not.toBe(plan[index - 1].question.targetId);
      });
      // Khu 1 chỉ dùng Listen & Choose / Find the Object
      expect(
        plan
          .filter((turn) => turn.zone === 0)
          .every((turn) => ['listen_choose', 'find_object'].includes(turn.question.type)),
      ).toBe(true);
      expect(new Set(plan.map((turn) => turn.turnId)).size).toBe(8);
    }
  });

  it('team: luân phiên A-B từ đội đi trước, mỗi đội nửa số lượt, cặp lượt cùng dạng + cùng số lựa chọn', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const plan = buildPlan({
        settings: settings({ mode: 'team', teamTurns: 12, difficulty: 'mixed' }),
        words: WORDS,
        canSpeak: true,
        teamCount: 2,
        firstTeam: 1,
        rng: createRng(seed),
        gameId: 2,
      });
      expect(plan.map((turn) => turn.team)).toEqual([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]);
      for (let i = 0; i < plan.length; i += 2) {
        const [a, b] = [plan[i].question, plan[i + 1].question];
        expect(b.type).toBe(a.type);
        expect(b.options.length).toBe(a.options.length);
        expect(questionKey(b)).not.toBe(questionKey(a));
        expect(b.targetId).not.toBe(a.targetId);
      }
    }
  });

  it('không có giọng máy: bỏ Look & Listen / Match the Pairs; từ tự thêm không vào Find the Object', () => {
    const words = [...WORDS.slice(0, 2), custom('custom-a', 'apple'), custom('custom-b', 'book')];
    const plan = buildPlan({
      settings: settings({ mode: 'solo', soloTurns: 12 }),
      words,
      canSpeak: false,
      teamCount: 1,
      firstTeam: 0,
      rng: createRng(7),
      gameId: 3,
    });
    for (const { question } of plan) {
      expect(['listen_choose', 'find_object']).toContain(question.type);
      if (question.type === 'find_object') {
        expect(question.options.every((id) => !id.startsWith('custom-'))).toBe(true);
      }
    }
  });

  it('2 từ vẫn chơi đủ lượt (lặp có kiểm soát)', () => {
    const plan = buildPlan({
      settings: settings({ mode: 'team', teamTurns: 12, difficulty: 'normal' }),
      words: WORDS.slice(0, 2),
      canSpeak: true,
      teamCount: 2,
      firstTeam: 0,
      rng: createRng(3),
      gameId: 4,
    });
    expect(plan).toHaveLength(12);
    for (const { question } of plan) {
      expect(question.options.length).toBe(question.type === 'find_object' ? 2 : 2);
    }
  });

  it('câu thay thế khác từ đích, cùng dạng khi được', () => {
    const [first] = buildPlan({
      settings: settings({ mode: 'solo', questionTypes: ['listen_choose'] }),
      words: WORDS,
      canSpeak: true,
      teamCount: 1,
      firstTeam: 0,
      rng: createRng(5),
      gameId: 5,
    });
    const next = replacementQuestion(first.question, WORDS, ['listen_choose'], 2, createRng(9), 'r');
    expect(next?.type).toBe('listen_choose');
    expect(next?.targetId).not.toBe(first.question.targetId);
  });
});

describe('kiểm tra Setup', () => {
  it('ít hơn 2 từ / không dạng nào -> lỗi', () => {
    expect(checkSetup(settings(), WORDS.slice(0, 1), true, true).errors).toHaveLength(1);
    expect(checkSetup(settings({ questionTypes: [] }), WORDS, true, true).errors).toHaveLength(1);
    expect(checkSetup(settings(), WORDS, true, true)).toEqual({ errors: [], warnings: [] });
  });

  it('cảnh báo: lặp từ, thiếu giọng máy, chỉ còn dạng không chơi được', () => {
    const words = [custom('custom-a', 'apple'), custom('custom-b', 'book')];
    const check = checkSetup(
      settings({ questionTypes: ['find_object', 'look_listen'] }),
      words,
      false,
      false,
    );
    expect(check.errors).toHaveLength(1);
    expect(check.warnings.length).toBeGreaterThanOrEqual(3);
  });
});
