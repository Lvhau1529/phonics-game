/**
 * HTTP client dùng chung (tài khoản + analytics): gọi API của Phonics Arcade (`${API_URL}${API_PREFIX}${path}` →
 * /api/v1/...), kiểm tra response bằng zod schema của @phonics/contracts, lỗi gom về `ApiError` (có `code` để UI
 * dịch sang câu tiếng Anh cho bé). Chỉ các `*Repository` gọi `request`; store / màn hình đi qua `*Service`.
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
  ErrorCode,
  RefreshTransport,
} from '@phonics/contracts';
import type { ZodType } from 'zod';
import { API_URL } from '@/core/config/account';
import { createStore } from '@/core/store/createStore';
import { type ValueOf } from '@/core/types/valueOf';

/** Mã lỗi chỉ client sinh ra (không có trong `ErrorCode` của server) */
export const ClientErrorCode = {
  /** Không tới được server (mất mạng, DNS, CORS) */
  NETWORK: 'NETWORK',
  /** Server trả về nhưng response không đúng schema */
  BAD_RESPONSE: 'BAD_RESPONSE',
} as const;
export type ClientErrorCode = ValueOf<typeof ClientErrorCode>;

export type ApiErrorCode = ErrorCode | ClientErrorCode;

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
    return this.code === ClientErrorCode.NETWORK;
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

export const AuthMode = {
  /** Bắt buộc đăng nhập: gắn bearer, 401 -> refresh -> gọi lại; chưa có access token thì refresh trước */
  REQUIRED: 'required',
  /** Gắn bearer nếu đang đăng nhập, không có cũng gửi (sự kiện ẩn danh) */
  OPTIONAL: 'optional',
  /** Không gắn bearer (đăng nhập, đăng ký, public) */
  NONE: 'none',
} as const;
export type AuthMode = ValueOf<typeof AuthMode>;

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;
export type HttpMethod = ValueOf<typeof HttpMethod>;

/** Query string (bỏ qua giá trị undefined) */
export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestOptions<T> {
  method?: HttpMethod;
  body?: unknown;
  query?: QueryParams;
  /** Schema kiểm tra response; không có = không đọc body */
  schema?: ZodType<T>;
  auth?: AuthMode;
  /** Gửi được cả khi trang đang đóng (pagehide) */
  keepalive?: boolean;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
/**
 * API trả `message` / `details` theo Accept-Language (vi | en, mặc định vi — ADR 0025). UI game chỉ tiếng Anh nên
 * luôn xin `en` (không để trình duyệt tự gửi vi-VN), kể cả lời gọi refresh. Header nằm trong danh sách CORS-safelisted.
 */
const LOCALE_HEADERS = { 'Accept-Language': 'en' } as const;

function buildUrl(path: string, query?: QueryParams): string {
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
    response.status >= 500 ? ErrorCode.enum.INTERNAL : ErrorCode.enum.VALIDATION_ERROR,
    response.statusText || `HTTP ${response.status}`,
  );
}

/** fetch thô: lỗi mạng -> ApiError NETWORK (statusCode 0) */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    throw new ApiError(0, ClientErrorCode.NETWORK, error instanceof Error ? error.message : 'Network error');
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
    method: HttpMethod.POST,
    headers: { ...LOCALE_HEADERS, ...JSON_HEADERS, [REFRESH_TRANSPORT_HEADER]: RefreshTransport.enum.body },
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
  if (!parsed.success)
    throw new ApiError(response.status, ClientErrorCode.BAD_RESPONSE, 'Unexpected refresh response');
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
  const { method = HttpMethod.GET, body, query, schema, auth = AuthMode.REQUIRED, keepalive } = options;
  const url = buildUrl(path, query);

  const attempt = (): Promise<Response> => {
    const headers: Record<string, string> = { ...LOCALE_HEADERS };
    if (body !== undefined) Object.assign(headers, JSON_HEADERS);
    if (path.startsWith('/auth/')) headers[REFRESH_TRANSPORT_HEADER] = RefreshTransport.enum.body;
    const { accessToken } = tokenStore.get();
    if (auth !== AuthMode.NONE && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return send(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive,
    });
  };

  // Vừa mở app (chỉ còn refresh token): lấy access token trước, đỡ một lượt 401
  if (auth === AuthMode.REQUIRED && !tokenStore.get().accessToken && tokenStore.get().refreshToken) {
    await refreshAccessToken();
  }

  let response = await attempt();
  if (response.status === 401 && auth !== AuthMode.NONE && tokenStore.get().refreshToken) {
    if (await refreshAccessToken()) response = await attempt();
  }

  if (!response.ok) {
    const error = await parseError(response);
    // Hết cách lấy token hợp lệ -> coi như đã đăng xuất
    if (response.status === 401 && auth === AuthMode.REQUIRED) clearTokens();
    throw error;
  }

  if (!schema) return undefined as T;
  const json: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error('[Phonics Arcade] Bad API response', path, parsed.error.issues);
    throw new ApiError(response.status, ClientErrorCode.BAD_RESPONSE, 'Unexpected response');
  }
  return parsed.data;
}
