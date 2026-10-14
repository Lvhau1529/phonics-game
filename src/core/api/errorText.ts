/**
 * Dịch mã lỗi API (contracts ErrorCode + lỗi mạng) sang câu tiếng Anh ngắn, dễ hiểu cho bé / phụ huynh.
 */
import { isApiError, type ApiErrorCode } from '@/core/api/client';

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
  // Bài tập về nhà
  ASSIGNMENT_NOT_OPEN: 'This homework is not open now.',
  ATTEMPTS_EXHAUSTED: 'No more tries for this homework.',
  SUBMISSION_NOT_EDITABLE: 'This homework is already sent.',
  SUBMISSION_NOT_SUBMITTED: 'Send your homework first.',
  MEDIA_NOT_READY: 'Your recording is still uploading. Try again.',
  MEDIA_TOO_LARGE: 'That file is too big.',
  MEDIA_TYPE_UNSUPPORTED: 'That file type does not work here.',
  MEDIA_UPLOAD_INCOMPLETE: 'Upload did not finish. Try again.',
  MEDIA_STORAGE_DISABLED: 'Recording is not available right now.',
  ANSWER_TYPE_MISMATCH: 'Something went wrong. Try again later.',
  FORBIDDEN_SCOPE: 'This homework is not yours.',
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
