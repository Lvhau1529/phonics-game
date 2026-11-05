/**
 * Màn đang mở, đồng bộ với URL hash:
 *   #/<game-id>                    — game (giáo viên đánh dấu / chia sẻ link mở thẳng một game)
 *   #/account[/login]              — tài khoản gia đình (`#/account` = màn chọn bé của phụ huynh)
 *   #/set-password?token=…         — phụ huynh đặt mật khẩu từ link mời (mail `parent.invite`)
 *   #/homework[/<assignmentId>[/result]] — bài tập về nhà (phiếu bài tập GV giao)
 *   #/preview                      — xem trước câu hỏi / phiếu cho admin (nhúng iframe, nội dung gửi qua postMessage)
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
/** Đoạn hash của màn xem trước (admin nhúng iframe) — cũng không game nào được dùng */
export const PREVIEW_SEGMENT = 'preview';
/** Đoạn hash của màn đặt mật khẩu từ link mời — cũng không game nào được dùng */
export const SET_PASSWORD_SEGMENT = 'set-password';

export const AccountPage = {
  /** Màn chọn bé (phụ huynh) */
  PROFILES: 'profiles',
  LOGIN: 'login',
} as const;
export type AccountPage = ValueOf<typeof AccountPage>;

const ACCOUNT_PAGES: Record<string, AccountPage> = {
  '': AccountPage.PROFILES,
  ...Object.fromEntries(Object.values(AccountPage).map((page) => [page, page] as const)),
};

/** Tên màn bài tập: danh sách, làm bài, kết quả của một bài giao */
export const HomeworkPageName = {
  LIST: 'list',
  DO: 'do',
  RESULT: 'result',
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
  PREVIEW: 'preview',
  SET_PASSWORD: 'set-password',
} as const;
export type RouteKind = ValueOf<typeof RouteKind>;

export type Route =
  | { kind: typeof RouteKind.HUB }
  | { kind: typeof RouteKind.GAME; gameId: string }
  | { kind: typeof RouteKind.ACCOUNT; page: AccountPage }
  | { kind: typeof RouteKind.HOMEWORK; page: HomeworkPage }
  | { kind: typeof RouteKind.PREVIEW }
  | { kind: typeof RouteKind.SET_PASSWORD; token: string };

function parseHomework(rest: string[]): HomeworkPage {
  const [assignmentId, sub] = rest;
  if (!assignmentId) return { name: HomeworkPageName.LIST };
  if (sub === HomeworkPageName.RESULT) return { name: sub, assignmentId };
  return { name: HomeworkPageName.DO, assignmentId };
}

export function parseHash(hash: string): Route {
  if (!hash.startsWith(HASH_PREFIX)) return { kind: RouteKind.HUB };
  // Query trong hash (`#/set-password?token=…`): tách trước khi đọc đường dẫn
  const [rawPath = '', rawQuery = ''] = hash.slice(HASH_PREFIX.length).split('?', 2);
  const path = decodeURIComponent(rawPath).replace(/\/+$/, '');
  if (!path) return { kind: RouteKind.HUB };
  const [head, ...rest] = path.split('/');
  if (head === ACCOUNT_SEGMENT) {
    return { kind: RouteKind.ACCOUNT, page: ACCOUNT_PAGES[rest.join('/')] ?? AccountPage.PROFILES };
  }
  if (head === HOMEWORK_SEGMENT) return { kind: RouteKind.HOMEWORK, page: parseHomework(rest) };
  if (head === PREVIEW_SEGMENT) return { kind: RouteKind.PREVIEW };
  if (head === SET_PASSWORD_SEGMENT) {
    return { kind: RouteKind.SET_PASSWORD, token: new URLSearchParams(rawQuery).get('token') ?? '' };
  }
  return { kind: RouteKind.GAME, gameId: path };
}

export function hashOf(route: Route): string {
  switch (route.kind) {
    case RouteKind.HUB:
      return '';
    case RouteKind.GAME:
      return `${HASH_PREFIX}${encodeURIComponent(route.gameId)}`;
    case RouteKind.ACCOUNT:
      return `${HASH_PREFIX}${ACCOUNT_SEGMENT}${route.page === AccountPage.PROFILES ? '' : `/${route.page}`}`;
    case RouteKind.HOMEWORK: {
      const { page } = route;
      if (page.name === HomeworkPageName.LIST) return `${HASH_PREFIX}${HOMEWORK_SEGMENT}`;
      const base = `${HASH_PREFIX}${HOMEWORK_SEGMENT}/${encodeURIComponent(page.assignmentId)}`;
      return page.name === HomeworkPageName.DO ? base : `${base}/${page.name}`;
    }
    case RouteKind.PREVIEW:
      return `${HASH_PREFIX}${PREVIEW_SEGMENT}`;
    case RouteKind.SET_PASSWORD:
      return `${HASH_PREFIX}${SET_PASSWORD_SEGMENT}?${new URLSearchParams({ token: route.token }).toString()}`;
  }
}

export const platformStore = createStore<{ route: Route }>({ route: parseHash(window.location.hash) });

window.addEventListener('hashchange', () => platformStore.set({ route: parseHash(window.location.hash) }));

export const platformActions = {
  openGame(id: string): void {
    window.location.hash = hashOf({ kind: RouteKind.GAME, gameId: id });
  },

  openAccount(page: AccountPage = AccountPage.PROFILES): void {
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
