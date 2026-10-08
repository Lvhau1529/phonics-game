import { beforeEach, describe, expect, it } from 'vitest';
import { LEVELS } from '@/games/phonics-ocean/content/levels';
import { phonicsOceanActions, phonicsOceanStore } from '@/games/phonics-ocean/session/store';
import { progressStore } from '@/games/phonics-ocean/session/storage';
import type { RoundResult } from '@/games/phonics-ocean/session/types';

const result = (patch: Partial<RoundResult> = {}): RoundResult => ({
  levelId: LEVELS[0].id,
  endedBy: 'cleared',
  cleared: true,
  score: 1200,
  correct: 12,
  attempts: 13,
  accuracy: 12 / 13,
  bestStreak: 8,
  tier: 3,
  stars: 3,
  words: [{ word: 'map', firstTry: true }],
  ...patch,
});

describe('phonicsOceanStore', () => {
  beforeEach(() => {
    phonicsOceanActions.updateDraft({ levelId: LEVELS[0].id, predators: true });
    phonicsOceanActions.goHome();
  });

  it('home -> setup -> play -> results, lưu sao', () => {
    phonicsOceanActions.openSetup();
    expect(phonicsOceanStore.get().screen).toBe('setup');
    phonicsOceanActions.startSession();
    const { screen, session } = phonicsOceanStore.get();
    expect(screen).toBe('play');
    expect(session?.settings.levelId).toBe(LEVELS[0].id);

    phonicsOceanActions.finishRound(result());
    const state = phonicsOceanStore.get();
    expect(state.screen).toBe('results');
    expect(state.outcome?.gemsEarned).toBeGreaterThan(0);
    expect(progressStore.get().progress[LEVELS[0].id]?.stars).toBe(3);
  });

  it('NEXT LEVEL sang cấp kế và nhớ lựa chọn', () => {
    phonicsOceanActions.startSession();
    phonicsOceanActions.finishRound(result());
    phonicsOceanActions.playNextLevel();
    const state = phonicsOceanStore.get();
    expect(state.screen).toBe('play');
    expect(state.session?.settings.levelId).toBe(LEVELS[1].id);
    expect(state.draft.levelId).toBe(LEVELS[1].id);
  });

  it('QUIT giữa lượt -> về Setup, không có kết quả', () => {
    phonicsOceanActions.startSession();
    phonicsOceanActions.abortSession();
    expect(phonicsOceanStore.get()).toMatchObject({ screen: 'setup', session: null, outcome: null });
  });

  it('chơi lại tạo phiên mới (Phaser chạy lại từ đầu)', () => {
    phonicsOceanActions.startSession();
    const first = phonicsOceanStore.get().session!.id;
    phonicsOceanActions.finishRound(result({ cleared: false, stars: 0, endedBy: 'time' }));
    phonicsOceanActions.playAgain();
    expect(phonicsOceanStore.get().session!.id).toBeGreaterThan(first);
  });
});
