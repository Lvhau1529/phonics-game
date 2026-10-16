/**
 * Màn xem trước `#/preview` (admin nhúng iframe): chỉ nhận nội dung từ origin admin khai báo trong
 * `VITE_ADMIN_URL` (một hoặc nhiều URL cách nhau dấu phẩy). Không khai báo → chỉ admin dev `http://localhost:5174`.
 */

/** Origin admin dev (phonics-dev chạy admin ở cổng 5174) */
const DEV_ADMIN_URL = 'http://localhost:5174';

/** Tách danh sách URL → tập origin hợp lệ (bỏ URL sai, bỏ dấu / cuối) */
export function parseAdminOrigins(raw: string | undefined): string[] {
  const urls = (raw ?? '').trim() || DEV_ADMIN_URL;
  const origins = urls.split(',').flatMap((url) => {
    try {
      return [new URL(url.trim()).origin];
    } catch {
      return [];
    }
  });
  return [...new Set(origins)];
}

export const ADMIN_ORIGINS: readonly string[] = parseAdminOrigins(import.meta.env.VITE_ADMIN_URL);
