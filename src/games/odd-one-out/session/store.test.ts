import { beforeEach, describe, expect, it } from 'vitest';
import { boardStore, clearBoard } from '@/games/odd-one-out/session/storage';
import { oddOneOutActions, oddOneOutStore } from '@/games/odd-one-out/session/store';
import { SCORING } from '@/games/odd-one-out/session/rules';

const round = () => {
  const value = oddOneOutStore.get().round;
  if (!value) throw new Error('no round');
  return value;
};
const wrongOf = () => (round().puzzles[round().index].odd + 1) % 4;

describe('oddOneOutStore', () => {
  beforeEach(() => {
    clearBoard();
    oddOneOutActions.goHome();
    oddOneOutActions.updateDraft({ name: '', topic: 'colors', level: 'easy', count: 6, speaking: true });
  });

  it('không có tên thì không vào ván', () => {
    expect(oddOneOutActions.startRound()).toBe(false);
    expect(oddOneOutStore.get().screen).toBe('home');
  });

  it('chơi hết ván -> lưu bảng xếp hạng, sang màn kết quả', () => {
    oddOneOutActions.updateDraft({ name: '  Bé   An ' });
    expect(oddOneOutActions.startRound()).toBe(true);
    expect(round().settings.name).toBe('Bé An');
    expect(round().puzzles).toHaveLength(3);

    for (let i = 0; i < 3; i += 1) {
      oddOneOutActions.choose(round().puzzles[i].odd);
      expect(round().phase).toBe('speak');
      oddOneOutActions.submitSpeaking('the cat is different', true);
      expect(round().phase).toBe('answer');
      oddOneOutActions.next();
    }

    const state = oddOneOutStore.get();
    expect(state.screen).toBe('results');
    expect(state.outcome?.record).toMatchObject({ name: 'Bé An', correct: 3, count: 3 });
    expect(state.outcome?.record.score).toBe(3 * (SCORING.correct + SCORING.spoke));
    expect(state.outcome?.rank).toBe(1);
    expect(boardStore.get().records).toHaveLength(1);
  });

  it('bước nói: đổi được lựa chọn; không nói gì thì không có điểm nói', () => {
    oddOneOutActions.updateDraft({ name: 'An' });
    oddOneOutActions.startRound();
    oddOneOutActions.choose(wrongOf());
    oddOneOutActions.choose(round().puzzles[0].odd);
    oddOneOutActions.submitSpeaking('', true);
    expect(round().records[0]).toMatchObject({ correct: true, spoke: false });
    expect(round().score).toBe(SCORING.correct);
  });

  it('tắt bước nói: chọn xong xem đáp án ngay, không chấm lại khi chạm tiếp', () => {
    oddOneOutActions.updateDraft({ name: 'An', speaking: false });
    oddOneOutActions.startRound();
    oddOneOutActions.choose(wrongOf());
    expect(round().phase).toBe('answer');
    oddOneOutActions.choose(round().puzzles[0].odd);
    expect(round().records).toHaveLength(1);
    expect(round().score).toBe(0);
  });

  it('QUIT giữa ván -> về Setup, không lưu', () => {
    oddOneOutActions.updateDraft({ name: 'An' });
    oddOneOutActions.startRound();
    oddOneOutActions.quit();
    expect(oddOneOutStore.get().screen).toBe('setup');
    expect(boardStore.get().records).toHaveLength(0);
  });

  it('bảng xếp hạng quay về đúng màn đã mở nó', () => {
    oddOneOutActions.openLeaderboard();
    expect(oddOneOutStore.get().screen).toBe('leaderboard');
    oddOneOutActions.closeLeaderboard();
    expect(oddOneOutStore.get().screen).toBe('home');
  });
});
