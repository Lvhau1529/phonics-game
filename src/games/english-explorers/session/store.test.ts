import { beforeEach, describe, expect, it } from 'vitest';
import { SCORING } from '@/games/english-explorers/session/rules';
import { progressStore } from '@/games/english-explorers/session/storage';
import { englishExplorersActions, englishExplorersStore } from '@/games/english-explorers/session/store';

const round = () => {
  const value = englishExplorersStore.get().round;
  if (!value) throw new Error('no round');
  return value;
};
const current = () => round().questions[round().index];
const wrongOf = () => (current().answer + 1) % 3;

describe('englishExplorersStore', () => {
  beforeEach(() => {
    englishExplorersActions.goHome();
    englishExplorersActions.updateDraft({ name: '', world: 'habitats', speaking: true });
  });

  it('chọn sai: đánh dấu, chọn lại; đúng -> bước nói', () => {
    englishExplorersActions.startRound();
    expect(englishExplorersActions.choose(wrongOf())).toBe(false);
    expect(round().wrong).toHaveLength(1);
    // Bấm lại đáp án đã sai: bỏ qua
    expect(englishExplorersActions.choose(round().wrong[0])).toBeNull();
    expect(englishExplorersActions.choose(current().answer)).toBe(true);
    expect(round().phase).toBe('speak');
  });

  it('chơi hết thế giới -> kết quả, lưu sao; điểm không cộng dồn qua các ván (lỗi bản gốc)', () => {
    for (let game = 0; game < 2; game += 1) {
      englishExplorersActions.startRound();
      for (let i = 0; i < 10; i += 1) {
        englishExplorersActions.choose(current().answer);
        englishExplorersActions.submitSpeaking(current().question.sentence, true);
      }
      const state = englishExplorersStore.get();
      expect(state.screen).toBe('results');
      expect(round().score).toBe(10 * (SCORING.byMisses[0] + SCORING.spoke));
      expect(state.outcome).toMatchObject({ stars: 3, firstTry: 10, spoken: 10 });
    }
    expect(progressStore.get().progress.habitats).toEqual({ stars: 3, best: 150 });
  });

  it('nói sai câu (có micro) -> không có điểm nói', () => {
    englishExplorersActions.startRound();
    englishExplorersActions.choose(current().answer);
    englishExplorersActions.submitSpeaking('hello', true);
    expect(round().records[0]).toMatchObject({ spoke: false, points: SCORING.byMisses[0] });
  });

  it('tắt bước nói: đúng -> done -> NEXT', () => {
    englishExplorersActions.updateDraft({ speaking: false });
    englishExplorersActions.startRound();
    englishExplorersActions.choose(current().answer);
    expect(round().phase).toBe('done');
    englishExplorersActions.next();
    expect(round().index).toBe(1);
    expect(round().records[0].spoke).toBe(false);
  });

  it('tên trống -> hiện EXPLORER; NEXT WORLD sang thế giới kế tiếp', () => {
    englishExplorersActions.startRound();
    expect(round().settings.name).toBe('');
    englishExplorersActions.playNextWorld();
    expect(round().settings.world).toBe('describe');
  });
});
