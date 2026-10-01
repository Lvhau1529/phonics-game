/**
 * Cấu hình tài khoản / đồng bộ từ biến môi trường Vite (apps/game/.env, xem .env.example):
 *   VITE_API_URL          — gốc API (không có dấu / cuối), vd http://localhost:3000. Rỗng = TẮT toàn bộ
 *                           tính năng tài khoản: app chạy y như bản offline (không UI, không gọi mạng).
 *   VITE_GOOGLE_CLIENT_ID — OAuth client id của Google Identity Services; rỗng = ẩn nút Google.
 */
import { z } from 'zod';

const Env = z.object({
  VITE_API_URL: z
    .string()
    .trim()
    .default('')
    .transform((value) => value.replace(/\/+$/, ''))
    .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), {
      message: 'VITE_API_URL phải là URL http(s) hoặc để trống',
    }),
  VITE_GOOGLE_CLIENT_ID: z.string().trim().default(''),
});

function readEnv(): z.infer<typeof Env> {
  const parsed = Env.safeParse({
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  });
  if (parsed.success) return parsed.data;
  // Cấu hình sai thì coi như không có API (không chặn game), chỉ báo ở console
  console.error(
    '[Phonics Arcade] Invalid env:',
    parsed.error.issues.map((issue) => issue.message).join('; '),
  );
  return { VITE_API_URL: '', VITE_GOOGLE_CLIENT_ID: '' };
}

const env = readEnv();

export const API_URL: string = env.VITE_API_URL;
export const GOOGLE_CLIENT_ID: string = env.VITE_GOOGLE_CLIENT_ID;
/** Có API thì mới có đăng nhập, điểm, xếp hạng, thông báo, catalog game */
export const ACCOUNT_ENABLED: boolean = API_URL !== '';
