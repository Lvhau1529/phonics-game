/**
 * Gọi API của Phonics Arcade (`${API_URL}/api${path}`), kiểm tra response bằng zod schema của
 * @phonics/contracts, lỗi gom về `ApiError` (có `code` để UI dịch sang câu tiếng Anh cho bé).
 *
 * Token:
 *   - access token (15 phút) chỉ giữ trong bộ nhớ (`tokenStore`), gắn `Authorization: Bearer`;
 *   - refresh token nhận qua body (header `X-Refresh-Transport: body` ở mọi lời gọi /auth/*), authStore
 *     lưu localStorage. Mỗi lần refresh server xoay token mới -> luôn ghi đè bản mới.
 *   - 401 ở bất kỳ lời gọi nào -> refresh (gộp nhiều lời gọi cùng lúc thành một — single flight) -> gọi lại
 *     đúng một lần; refresh bị từ chối -> xoá token (authStore nghe `tokenStore` để về trạng thái khách).
 */
import {
  API_PREFIX,
  ApiErrorBody,
  AuthResponse,
  ENDPOINTS,
  REFRESH_TRANSPORT_HEADER,
  type ErrorCode,
} from '@phonics/contracts';
import type { ZodType } from 'zod';
import { API_URL } from '@/platform/account/config';
import { createStore } from '@/shared/createStore';

export type ApiErrorCode = ErrorCode | 'NETWORK' | 'BAD_RESPONSE';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, string[]>;

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  /** Không tới được server (mất mạng, DNS, CORS) — khác với server trả lỗi */
  get isNetworkError(): boolean {
    return this.code === 'NETWORK';
  }

  /** Lỗi do client (4xx) — gửi lại cũng không được */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export interface Tokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/** Token hiện tại; authStore subscribe để lưu refresh token + nhận biết bị đăng xuất */
export const tokenStore = createStore<Tokens>({ accessToken: null, refreshToken: null });

export function setTokens(tokens: Tokens): void {
  tokenStore.set(tokens);
}

export function clearTokens(): void {
  tokenStore.set({ accessToken: null, refreshToken: null });
}

export type AuthMode =
  /** Bắt buộc đăng nhập: gắn bearer, 401 -> refresh -> gọi lại; chưa có access token thì refresh trước */
  | 'required'
  /** Gắn bearer nếu đang đăng nhập, không có cũng gửi (sự kiện ẩn danh) */
  | 'optional'
  /** Không gắn bearer (đăng nhập, đăng ký, public) */
  | 'none';

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Query string (bỏ qua giá trị undefined) */
  query?: Record<string, string | number | boolean | undefined>;
  /** Schema kiểm tra response; không có = không đọc body */
  schema?: ZodType<T>;
  auth?: AuthMode;
  /** Gửi được cả khi trang đang đóng (pagehide) */
  keepalive?: boolean;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

function buildUrl(path: string, query?: RequestOptions<unknown>['query']): string {
  const url = new URL(`${API_URL}${API_PREFIX}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Không phải JSON (proxy, HTML lỗi...)
  }
  const parsed = ApiErrorBody.safeParse(body);
  if (parsed.success) {
    return new ApiError(response.status, parsed.data.code, parsed.data.message, parsed.data.details);
  }
  return new ApiError(
    response.status,
    response.status >= 500 ? 'INTERNAL' : 'VALIDATION_ERROR',
    response.statusText || `HTTP ${response.status}`,
  );
}

/** fetch thô: lỗi mạng -> ApiError NETWORK (statusCode 0) */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    throw new ApiError(0, 'NETWORK', error instanceof Error ? error.message : 'Network error');
  }
}

// ---------------------------------------------------------------------------
// Refresh token (single flight)
// ---------------------------------------------------------------------------
let refreshing: Promise<boolean> | null = null;
/** Response refresh gần nhất, authStore lấy để cập nhật user sau khi khôi phục phiên */
let lastRefreshed: AuthResponse | null = null;

/**
 * Lấy access token mới bằng refresh token. Nhiều lời gọi 401 cùng lúc chỉ refresh một lần.
 *   true  — có token mới
 *   false — không có refresh token, hoặc server từ chối (hết hạn / bị thu hồi / đã dùng):
 *           token bị xoá, người dùng thành khách
 * Mất mạng / lỗi server -> ném ApiError, giữ nguyên token để lần sau thử lại.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function doRefresh(): Promise<boolean> {
  const { refreshToken } = tokenStore.get();
  if (!refreshToken) return false;
  const response = await send(buildUrl(ENDPOINTS.auth.refresh), {
    method: 'POST',
    headers: { ...JSON_HEADERS, [REFRESH_TRANSPORT_HEADER]: 'body' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    const error = await parseError(response);
    if (error.isClientError) {
      clearTokens();
      return false;
    }
    throw error;
  }
  const parsed = AuthResponse.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new ApiError(response.status, 'BAD_RESPONSE', 'Unexpected refresh response');
  lastRefreshed = parsed.data;
  // Token xoay vòng: luôn lưu refresh token MỚI (bản cũ đã bị server vô hiệu)
  setTokens({ accessToken: parsed.data.accessToken, refreshToken: parsed.data.refreshToken ?? refreshToken });
  return true;
}

export function takeRefreshedAuth(): AuthResponse | null {
  const value = lastRefreshed;
  lastRefreshed = null;
  return value;
}

// ---------------------------------------------------------------------------
// request
// ---------------------------------------------------------------------------
export async function request<T = void>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { method = 'GET', body, query, schema, auth = 'required', keepalive } = options;
  const url = buildUrl(path, query);

  const attempt = (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) Object.assign(headers, JSON_HEADERS);
    if (path.startsWith('/auth/')) headers[REFRESH_TRANSPORT_HEADER] = 'body';
    const { accessToken } = tokenStore.get();
    if (auth !== 'none' && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return send(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive,
    });
  };

  // Vừa mở app (chỉ còn refresh token): lấy access token trước, đỡ một lượt 401
  if (auth === 'required' && !tokenStore.get().accessToken && tokenStore.get().refreshToken) {
    await refreshAccessToken();
  }

  let response = await attempt();
  if (response.status === 401 && auth !== 'none' && tokenStore.get().refreshToken) {
    if (await refreshAccessToken()) response = await attempt();
  }

  if (!response.ok) {
    const error = await parseError(response);
    // Hết cách lấy token hợp lệ -> coi như đã đăng xuất
    if (response.status === 401 && auth === 'required') clearTokens();
    throw error;
  }

  if (!schema) return undefined as T;
  const json: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error('[Phonics Arcade] Bad API response', path, parsed.error.issues);
    throw new ApiError(response.status, 'BAD_RESPONSE', 'Unexpected response');
  }
  return parsed.data;
}
