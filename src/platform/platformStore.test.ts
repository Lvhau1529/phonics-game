import { describe, expect, it } from 'vitest';
import { hashOf, parseHash } from '@/platform/platformStore';

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

  it('hashOf là nghịch đảo của parseHash', () => {
    const routes = [
      { kind: 'hub' },
      { kind: 'game', gameId: 'bread-catcher' },
      { kind: 'account', page: 'profile' },
      { kind: 'account', page: 'notifications' },
    ] as const;
    routes.forEach((route) => expect(parseHash(hashOf(route))).toEqual(route));
  });
});
