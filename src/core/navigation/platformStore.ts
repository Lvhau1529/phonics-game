/**
 * Màn đang mở, đồng bộ với URL hash:
 *   #/<game-id>                    — game (giáo viên đánh dấu / chia sẻ link mở thẳng một game)
 *   #/account[/login|register|edit|ranking|notifications] — màn tài khoản (`#/account` = hồ sơ)
 *   #/homework[/<assignmentId>[/result|/ranking]] — bài tập về nhà (phiếu bài tập GV giao)
 *   (không có hash)                — màn chọn game
 * Nút Back của trình duyệt / Android quay về màn trước.
 */
import { createStore } from '@/core/store/createStore';
import { type ValueOf } from '@/core/types/valueOf';

const HASH_PREFIX = '#/';
/** Đoạn hash dành riêng cho màn tài khoản — không game nào được dùng id này (xem src/games/index.ts) */
export const ACCOUNT_SEGMENT = 'account';
/** Đoạn hash của màn bài tập về nhà — cũng không game nào được dùng */
export const HOMEWORK_SEGMENT = 'homework';

export const AccountPage = {
  PROFILE: 'profile',
  LOGIN: 'login',
  REGISTER: 'register',
  EDIT: 'edit',
  RANKING: 'ranking',
  NOTIFICATIONS: 'notifications',
} as const;
export type AccountPage = ValueOf<typeof AccountPage>;

const ACCOUNT_PAGES: Record<string, AccountPage> = {
  '': AccountPage.PROFILE,
  ...Object.fromEntries(Object.values(AccountPage).map((page) => [page, page] as const)),
};

/** Tên màn bài tập: danh sách, làm bài, kết quả, xếp hạng của một bài giao */
export const HomeworkPageName = {
  LIST: 'list',
  DO: 'do',
  RESULT: 'result',
  RANKING: 'ranking',
} as const;
export type HomeworkPageName = ValueOf<typeof HomeworkPageName>;

export type HomeworkPage =
  | { name: typeof HomeworkPageName.LIST }
  | { name: Exclude<HomeworkPageName, typeof HomeworkPageName.LIST>; assignmentId: string };

export const RouteKind = {
  HUB: 'hub',
  GAME: 'game',
  ACCOUNT: 'account',
  HOMEWORK: 'homework',
} as const;
export type RouteKind = ValueOf<typeof RouteKind>;

export type Route =
  | { kind: typeof RouteKind.HUB }
  | { kind: typeof RouteKind.GAME; gameId: string }
  | { kind: typeof RouteKind.ACCOUNT; page: AccountPage }
  | { kind: typeof RouteKind.HOMEWORK; page: HomeworkPage };

function parseHomework(rest: string[]): HomeworkPage {
  const [assignmentId, sub] = rest;
  if (!assignmentId) return { name: HomeworkPageName.LIST };
  if (sub === HomeworkPageName.RESULT || sub === HomeworkPageName.RANKING) return { name: sub, assignmentId };
  return { name: HomeworkPageName.DO, assignmentId };
}

export function parseHash(hash: string): Route {
  if (!hash.startsWith(HASH_PREFIX)) return { kind: RouteKind.HUB };
  const path = decodeURIComponent(hash.slice(HASH_PREFIX.length)).replace(/\/+$/, '');
  if (!path) return { kind: RouteKind.HUB };
  const [head, ...rest] = path.split('/');
  if (head === ACCOUNT_SEGMENT) {
    return { kind: RouteKind.ACCOUNT, page: ACCOUNT_PAGES[rest.join('/')] ?? AccountPage.PROFILE };
  }
  if (head === HOMEWORK_SEGMENT) return { kind: RouteKind.HOMEWORK, page: parseHomework(rest) };
  return { kind: RouteKind.GAME, gameId: path };
}

export function hashOf(route: Route): string {
  switch (route.kind) {
    case RouteKind.HUB:
      return '';
    case RouteKind.GAME:
      return `${HASH_PREFIX}${encodeURIComponent(route.gameId)}`;
    case RouteKind.ACCOUNT:
      return `${HASH_PREFIX}${ACCOUNT_SEGMENT}${route.page === AccountPage.PROFILE ? '' : `/${route.page}`}`;
    case RouteKind.HOMEWORK: {
      const { page } = route;
      if (page.name === HomeworkPageName.LIST) return `${HASH_PREFIX}${HOMEWORK_SEGMENT}`;
      const base = `${HASH_PREFIX}${HOMEWORK_SEGMENT}/${encodeURIComponent(page.assignmentId)}`;
      return page.name === HomeworkPageName.DO ? base : `${base}/${page.name}`;
    }
  }
}

export const platformStore = createStore<{ route: Route }>({ route: parseHash(window.location.hash) });

window.addEventListener('hashchange', () => platformStore.set({ route: parseHash(window.location.hash) }));

export const platformActions = {
  openGame(id: string): void {
    window.location.hash = hashOf({ kind: RouteKind.GAME, gameId: id });
  },

  openAccount(page: AccountPage = AccountPage.PROFILE): void {
    window.location.hash = hashOf({ kind: RouteKind.ACCOUNT, page });
  },

  openHomework(page: HomeworkPage = { name: HomeworkPageName.LIST }): void {
    window.location.hash = hashOf({ kind: RouteKind.HOMEWORK, page });
  },

  /** Về màn chọn game */
  exitToHub(): void {
    if (platformStore.get().route.kind === RouteKind.HUB && !window.location.hash) return;
    // Bỏ hash mà không để lại "#" trên URL
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    platformStore.set({ route: { kind: RouteKind.HUB } });
  },
};
