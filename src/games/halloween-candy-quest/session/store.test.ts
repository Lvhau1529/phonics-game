import { beforeEach, describe, expect, it } from 'vitest';
import { LIBRARY } from '@/games/halloween-candy-quest/content/words';
import { currentTurn, halloweenActions, halloweenStore } from '@/games/halloween-candy-quest/session/store';
import { DEFAULT_SETTINGS } from '@/games/halloween-candy-quest/session/rules';
import type { Game } from '@/games/halloween-candy-quest/session/types';

const game = (): Game => {
  const value = halloweenStore.get().game;
  if (!value) throw new Error('no game');
  return value;
};
const turnId = () => currentTurn(game()).turnId;
const target = () => currentTurn(game()).question.targetId;
const wrong = () => currentTurn(game()).question.options.find((id) => id !== target()) ?? '';

/** Đi tới bước câu hỏi của lượt hiện tại */
function reachQuestion(): void {
  const id = turnId();
  halloweenActions.zoneShown(id);
  halloweenActions.arrived(id);
  halloweenActions.knock(id);
  halloweenActions.doorOpened(id);
  halloweenActions.greeted(id);
  expect(game().phase).toBe('question');
}

/** Trả lời đúng / sai theo dạng câu hỏi */
function answer(correct: boolean): void {
  const { question } = currentTurn(game());
  if (question.type === 'match_pairs') {
    const [a, b] = question.options;
    halloweenActions.answerPairs(turnId(), correct ? { [a]: a, [b]: b } : { [a]: b, [b]: a });
  } else halloweenActions.answer(turnId(), correct ? target() : wrong());
}

function playTurn(correctOnAttempt: 1 | 2 | 0): void {
  reachQuestion();
  const id = turnId();
  if (correctOnAttempt !== 1) {
    answer(false);
    halloweenActions.feedbackDone(id);
  }
  answer(correctOnAttempt !== 0);
  halloweenActions.feedbackDone(id);
  expect(game().phase).toBe('reward');
  halloweenActions.rewardDone(id);
}

describe('halloweenStore', () => {
  beforeEach(() => {
    halloweenActions.goHome();
    halloweenActions.updateSettings({ ...DEFAULT_SETTINGS, voiceMode: 'game' });
    halloweenActions.setAllLibrary(LIBRARY.map((word) => word.id));
  });

  it('solo: +2 / +1 / 0 kẹo, đủ 8 lượt thì sang kết quả', () => {
    halloweenActions.chooseMode('solo');
    halloweenActions.startGame(0, 42);
    playTurn(1);
    expect(game().teams[0].score).toBe(2);
    playTurn(2);
    expect(game().teams[0].score).toBe(3);
    playTurn(0);
    expect(game().teams[0].score).toBe(3);
    for (let i = 3; i < 8; i += 1) playTurn(1);
    expect(halloweenStore.get().screen).toBe('results');
    expect(game().records).toHaveLength(8);
    expect(game().teams[0].score).toBe(3 + 5 * 2);
  });

  it('chạm hai lần / hẹn giờ chạy muộn không cộng kẹo hai lần', () => {
    halloweenActions.chooseMode('solo');
    halloweenActions.startGame(0, 1);
    reachQuestion();
    const id = turnId();
    expect(halloweenActions.knock(id)).toBe(false);
    answer(true);
    expect(halloweenActions.answer(id, target())).toBeNull();
    halloweenActions.feedbackDone(id);
    halloweenActions.feedbackDone(id);
    expect(game().teams[0].score).toBe(2);
    halloweenActions.rewardDone(id);
    halloweenActions.rewardDone(id);
    expect(game().turn).toBe(1);
    expect(game().records).toHaveLength(1);
  });

  it('team: chờ NEXT TURN, luân phiên đội, mỗi đội 6 lượt', () => {
    halloweenActions.chooseMode('team');
    halloweenActions.startGame(1, 9);
    const id = turnId();
    playTurn(1);
    expect(game().phase).toBe('turn_end');
    expect(game().turn).toBe(0);
    halloweenActions.nextTurn(id);
    expect(game().turn).toBe(1);
    expect(currentTurn(game()).team).toBe(0);
    expect(game().teams.map((team) => team.score)).toEqual([0, 2]);
    for (let turn = 1; turn < 12; turn += 1) {
      const current = turnId();
      playTurn(1);
      halloweenActions.nextTurn(current);
    }
    expect(halloweenStore.get().screen).toBe('results');
    expect(game().records.filter((record) => record.team === 0)).toHaveLength(6);
    expect(game().records.filter((record) => record.team === 1)).toHaveLength(6);
  });

  it('Skip Question thay câu trong cùng lượt, không mất lượt / kẹo', () => {
    halloweenActions.chooseMode('solo');
    halloweenActions.startGame(0, 5);
    reachQuestion();
    const before = currentTurn(game()).question;
    answer(false);
    expect(halloweenActions.skipQuestion()).toBe(true);
    const after = currentTurn(game()).question;
    expect(after.targetId).not.toBe(before.targetId);
    expect(game()).toMatchObject({ turn: 0, attempt: 1, phase: 'question', replaced: 1 });
    answer(true);
    halloweenActions.feedbackDone(turnId());
    expect(game().teams[0].score).toBe(2);
  });

  it('Pause chặn thao tác; hết giờ -> hiện đáp án, 0 kẹo', () => {
    halloweenActions.chooseMode('solo');
    halloweenActions.startGame(0, 8);
    reachQuestion();
    halloweenActions.setPaused(true);
    expect(halloweenActions.answer(turnId(), target())).toBeNull();
    halloweenActions.setPaused(false);
    halloweenActions.timeUp(turnId());
    expect(game().feedback).toBe('reveal');
    halloweenActions.feedbackDone(turnId());
    expect(game().records[0]).toMatchObject({ candies: 0, timedOut: true });
  });

  it('bộ từ: thêm từ tự tạo (không trùng), ít hơn 2 từ thì không vào được màn chọn nhân vật', () => {
    const image = 'data:image/png;base64,AAAA';
    expect(halloweenActions.addCustomWord('  Apple ', '', image)).toBeNull();
    expect(halloweenActions.addCustomWord('apple', '', image)).not.toBeNull();
    expect(halloweenActions.addCustomWord('pumpkin', '', image)).not.toBeNull();
    expect(halloweenActions.addCustomWord('banana', '', '')).not.toBeNull();
    const added = halloweenStore.get().vocabulary.custom.find((word) => word.text === 'Apple');
    expect(added?.enabled).toBe(true);
    if (added) halloweenActions.removeCustomWord(added.id);

    halloweenActions.setAllLibrary(['pumpkin']);
    expect(halloweenActions.openCharacters()).toBe(false);
    halloweenActions.setLibraryWord('ghost', true);
    expect(halloweenActions.openCharacters()).toBe(true);
  });

  it('hai đội không chọn trùng nhân vật', () => {
    const other = halloweenStore.get().teams[1].characterId;
    expect(halloweenActions.setTeamCharacter(0, other)).toBe(false);
    expect(halloweenActions.setTeamCharacter(0, 'mini_witch')).toBe(other !== 'mini_witch');
  });
});
