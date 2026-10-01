/**
 * Hàm gọi API có kiểu cho từng endpoint game client dùng (đường dẫn + schema từ @phonics/contracts).
 * Các store (auth, điểm, catalog, thông báo, sự kiện) chỉ gọi qua đây, không tự ghép URL.
 */
import {
  AuthResponse,
  ENDPOINTS,
  EventBatchResponse,
  GameResultResponse,
  MarkReadResponse,
  MeResponse,
  MyPointsResponse,
  NotificationListResponse,
  PublicClassesResponse,
  PublicGamesResponse,
  RankingResponse,
  StudentGamesResponse,
  User,
  type EventBatchBody,
  type GameId,
  type GameResultBody,
  type GoogleBody,
  type LoginBody,
  type RangePreset,
  type RegisterBody,
  type UpdateProfileBody,
} from '@phonics/contracts';
import { request } from '@/platform/account/apiClient';

// ---- Auth ----
export const login = (body: LoginBody) =>
  request(ENDPOINTS.auth.login, { method: 'POST', body, schema: AuthResponse, auth: 'none' });

export const register = (body: RegisterBody) =>
  request(ENDPOINTS.auth.register, { method: 'POST', body, schema: AuthResponse, auth: 'none' });

export const googleSignIn = (body: GoogleBody) =>
  request(ENDPOINTS.auth.google, { method: 'POST', body, schema: AuthResponse, auth: 'none' });

export const logout = (refreshToken: string) =>
  request(ENDPOINTS.auth.logout, { method: 'POST', body: { refreshToken }, auth: 'optional' });

export const getMe = () => request(ENDPOINTS.auth.me, { schema: MeResponse });

export const updateProfile = (body: UpdateProfileBody) =>
  request(ENDPOINTS.me.profile, { method: 'PATCH', body, schema: User });

// ---- Public ----
export const getPublicClasses = () =>
  request(ENDPOINTS.public.classes, { schema: PublicClassesResponse, auth: 'none' });

export const getPublicGames = () =>
  request(ENDPOINTS.public.games, { schema: PublicGamesResponse, auth: 'none' });

export const postEvents = (body: EventBatchBody, keepalive = false) =>
  request(ENDPOINTS.public.events, {
    method: 'POST',
    body,
    schema: EventBatchResponse,
    auth: 'optional',
    keepalive,
  });

// ---- Game ----
export const postGameResult = (body: GameResultBody) =>
  request(ENDPOINTS.game.results, { method: 'POST', body, schema: GameResultResponse });

export const getMyGames = () => request(ENDPOINTS.me.games, { schema: StudentGamesResponse });

export const unlockGameWithGems = (gameId: string, gemsSpent: number) =>
  request(ENDPOINTS.me.unlockGame(gameId), { method: 'POST', body: { gemsSpent } });

// ---- Points / ranking ----
export const getMyPoints = (range: RangePreset = 'all', gameId?: GameId) =>
  request(ENDPOINTS.me.points, { query: { range, gameId }, schema: MyPointsResponse });

export const getClassRanking = (range: RangePreset = 'all', gameId?: GameId) =>
  request(ENDPOINTS.me.ranking, { query: { range, gameId }, schema: RankingResponse });

// ---- Notifications ----
export const getNotifications = (unread: boolean, pageSize = 20) =>
  request(ENDPOINTS.me.notifications, {
    query: { unread: unread ? 'true' : undefined, pageSize },
    schema: NotificationListResponse,
  });

/** Không có ids = đánh dấu tất cả đã đọc */
export const markNotificationsRead = (ids?: string[]) =>
  request(ENDPOINTS.me.notificationsRead, {
    method: 'PATCH',
    body: ids ? { ids } : {},
    schema: MarkReadResponse,
  });
