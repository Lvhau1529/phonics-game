/**
 * Màn đang mở, đồng bộ với URL hash:
 *   #/<game-id>                    — game (giáo viên đánh dấu / chia sẻ link mở thẳng một game)
 *   #/account[/login|register|edit|ranking|notifications] — màn tài khoản (`#/account` = hồ sơ)
 *   (không có hash)                — màn chọn game
 * Nút Back của trình duyệt / Android quay về màn trước.
 */
import { createStore } from '@/shared/createStore';

const HASH_PREFIX = '#/';
/** Đoạn hash dành riêng cho màn tài khoản — không game nào được dùng id này (xem src/games/index.ts) */
export const ACCOUNT_SEGMENT = 'account';

export type AccountPage = 'profile' | 'login' | 'register' | 'edit' | 'ranking' | 'notifications';

const ACCOUNT_PAGES: Record<string, AccountPage> = {
  '': 'profile',
  profile: 'profile',
  login: 'login',
  register: 'register',
  edit: 'edit',
  ranking: 'ranking',
  notifications: 'notifications',
};

export type Route =
  { kind: 'hub' } | { kind: 'game'; gameId: string } | { kind: 'account'; page: AccountPage };

export function parseHash(hash: string): Route {
  if (!hash.startsWith(HASH_PREFIX)) return { kind: 'hub' };
  const path = decodeURIComponent(hash.slice(HASH_PREFIX.length)).replace(/\/+$/, '');
  if (!path) return { kind: 'hub' };
  const [head, ...rest] = path.split('/');
  if (head === ACCOUNT_SEGMENT) {
    return { kind: 'account', page: ACCOUNT_PAGES[rest.join('/')] ?? 'profile' };
  }
  return { kind: 'game', gameId: path };
}

export function hashOf(route: Route): string {
  switch (route.kind) {
    case 'hub':
      return '';
    case 'game':
      return `${HASH_PREFIX}${encodeURIComponent(route.gameId)}`;
    case 'account':
      return `${HASH_PREFIX}${ACCOUNT_SEGMENT}${route.page === 'profile' ? '' : `/${route.page}`}`;
  }
}

export const platformStore = createStore<{ route: Route }>({ route: parseHash(window.location.hash) });

window.addEventListener('hashchange', () => platformStore.set({ route: parseHash(window.location.hash) }));

export const platformActions = {
  openGame(id: string): void {
    window.location.hash = hashOf({ kind: 'game', gameId: id });
  },

  openAccount(page: AccountPage = 'profile'): void {
    window.location.hash = hashOf({ kind: 'account', page });
  },

  /** Về màn chọn game */
  exitToHub(): void {
    if (platformStore.get().route.kind === 'hub' && !window.location.hash) return;
    // Bỏ hash mà không để lại "#" trên URL
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    platformStore.set({ route: { kind: 'hub' } });
  },
};
