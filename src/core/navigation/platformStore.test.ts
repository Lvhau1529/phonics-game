import { describe, expect, it } from 'vitest';
import { hashOf, parseHash } from '@/core/navigation/platformStore';

describe('parseHash', () => {
  it('không có hash -> màn chọn game', () => {
    expect(parseHash('')).toEqual({ kind: 'hub' });
    expect(parseHash('#')).toEqual({ kind: 'hub' });
    expect(parseHash('#/')).toEqual({ kind: 'hub' });
  });

  it('#/<id> -> game', () => {
    expect(parseHash('#/bread-catcher')).toEqual({ kind: 'game', gameId: 'bread-catcher' });
    expect(parseHash('#/food-stream/')).toEqual({ kind: 'game', gameId: 'food-stream' });
  });

  it('#/account[/trang] -> màn tài khoản', () => {
    expect(parseHash('#/account')).toEqual({ kind: 'account', page: 'profile' });
    expect(parseHash('#/account/ranking')).toEqual({ kind: 'account', page: 'ranking' });
    expect(parseHash('#/account/login')).toEqual({ kind: 'account', page: 'login' });
    expect(parseHash('#/account/unknown')).toEqual({ kind: 'account', page: 'profile' });
  });

  it('#/homework[/<id>[/result|ranking]] -> màn bài tập', () => {
    expect(parseHash('#/homework')).toEqual({ kind: 'homework', page: { name: 'list' } });
    expect(parseHash('#/homework/a1')).toEqual({
      kind: 'homework',
      page: { name: 'do', assignmentId: 'a1' },
    });
    expect(parseHash('#/homework/a1/result')).toEqual({
      kind: 'homework',
      page: { name: 'result', assignmentId: 'a1' },
    });
    expect(parseHash('#/homework/a1/ranking')).toEqual({
      kind: 'homework',
      page: { name: 'ranking', assignmentId: 'a1' },
    });
    expect(parseHash('#/homework/a1/other')).toEqual({
      kind: 'homework',
      page: { name: 'do', assignmentId: 'a1' },
    });
  });

  it('#/preview -> màn xem trước cho admin', () => {
    expect(parseHash('#/preview')).toEqual({ kind: 'preview' });
    expect(parseHash('#/preview/')).toEqual({ kind: 'preview' });
  });

  it('hashOf là nghịch đảo của parseHash', () => {
    const routes = [
      { kind: 'hub' },
      { kind: 'game', gameId: 'bread-catcher' },
      { kind: 'account', page: 'profile' },
      { kind: 'account', page: 'notifications' },
      { kind: 'homework', page: { name: 'list' } },
      { kind: 'homework', page: { name: 'do', assignmentId: 'a1' } },
      { kind: 'homework', page: { name: 'result', assignmentId: 'a1' } },
      { kind: 'homework', page: { name: 'ranking', assignmentId: 'a1' } },
      { kind: 'preview' },
    ] as const;
    routes.forEach((route) => expect(parseHash(hashOf(route))).toEqual(route));
  });
});
