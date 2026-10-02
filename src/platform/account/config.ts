/**
 * Cấu hình tài khoản / đồng bộ từ biến môi trường Vite (apps/game/.env, xem .env.example):
 *   VITE_OFFLINE_MODE     — **mặc định bật** (BE chưa lên): game chạy như bản offline kể cả khi đã có
 *                           VITE_API_URL — không gọi mạng, nút SIGN IN chỉ báo COMING SOON. Đặt `false` để bật
 *                           tài khoản khi API đã sẵn sàng.
 *   VITE_API_URL          — gốc API (không có dấu / cuối), vd http://localhost:3000. Rỗng = TẮT toàn bộ
 *                           tính năng tài khoản (như offline).
 *   VITE_GOOGLE_CLIENT_ID — OAuth client id của Google Identity Services; rỗng = ẩn nút Google.
 */
import { z } from 'zod';

/** Giá trị coi là "tắt" cho cờ boolean trong env (không phân biệt hoa thường) */
const FALSY = ['false', '0', 'no', 'off'];

const Env = z.object({
  VITE_OFFLINE_MODE: z
    .string()
    .trim()
    .default('')
    .transform((value) => !FALSY.includes(value.toLowerCase())),
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

export type AccountEnv = z.infer<typeof Env>;

const OFFLINE_ENV: AccountEnv = { VITE_OFFLINE_MODE: true, VITE_API_URL: '', VITE_GOOGLE_CLIENT_ID: '' };

/** Parse env thô (tách riêng để test); cấu hình sai thì coi như offline (không chặn game), chỉ báo ở console */
export function parseAccountEnv(raw: Partial<Record<keyof AccountEnv, string | undefined>>): AccountEnv {
  const parsed = Env.safeParse(raw);
  if (parsed.success) return parsed.data;
  console.error(
    '[Phonics Arcade] Invalid env:',
    parsed.error.issues.map((issue) => issue.message).join('; '),
  );
  return OFFLINE_ENV;
}

const env = parseAccountEnv({
  VITE_OFFLINE_MODE: import.meta.env.VITE_OFFLINE_MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

/** Đang chạy chế độ offline (mặc định, hoặc chưa cấu hình API) */
export const OFFLINE_MODE: boolean = env.VITE_OFFLINE_MODE || env.VITE_API_URL === '';
export const API_URL: string = OFFLINE_MODE ? '' : env.VITE_API_URL;
export const GOOGLE_CLIENT_ID: string = env.VITE_GOOGLE_CLIENT_ID;
/** Có API (và đã tắt offline mode) thì mới có đăng nhập, điểm, xếp hạng, thông báo, catalog game */
export const ACCOUNT_ENABLED: boolean = !OFFLINE_MODE;
