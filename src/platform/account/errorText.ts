/**
 * Dịch mã lỗi API (contracts ErrorCode + lỗi mạng) sang câu tiếng Anh ngắn, dễ hiểu cho bé / phụ huynh.
 */
import { isApiError, type ApiErrorCode } from '@/platform/account/apiClient';

const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  NETWORK: 'No internet. Try again later.',
  INVALID_CREDENTIALS: 'Wrong email or password.',
  EMAIL_TAKEN: 'This email is already used.',
  CLASS_NOT_JOINABLE: 'Please pick another class.',
  ACCOUNT_DISABLED: 'This account is turned off. Ask your teacher.',
  GOOGLE_EMAIL_UNVERIFIED: 'Please verify your Google email first.',
  GOOGLE_TOKEN_INVALID: 'Google sign-in did not work. Try again.',
  PROFILE_REQUIRED: 'Tell us your name and class first.',
  VALIDATION_ERROR: 'Please check what you typed.',
  UNAUTHORIZED: 'Please sign in again.',
  TOKEN_EXPIRED: 'Please sign in again.',
  INVALID_REFRESH: 'Please sign in again.',
  REFRESH_REUSED: 'Please sign in again.',
  RATE_LIMITED: 'Too fast! Wait a moment and try again.',
  NOT_FOUND: 'Not found.',
  BAD_RESPONSE: 'Something went wrong. Try again later.',
  INTERNAL: 'Something went wrong. Try again later.',
};

const FALLBACK = 'Something went wrong. Try again later.';

export function errorText(error: unknown): string {
  if (isApiError(error)) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}

/** Lỗi validate theo field (ApiErrorBody.details) -> câu đầu tiên của field, nếu có */
export function fieldError(error: unknown, field: string): string | undefined {
  if (!isApiError(error)) return undefined;
  return error.details?.[field]?.[0];
}
