/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Phiên bản + mã commit của bản build (vite.config.ts > define), ví dụ "2.0.0 · 16596c5" */
declare const __BUILD_ID__: string;

/** Biến môi trường của app (apps/game/.env — xem .env.example); đọc qua src/platform/account/config.ts */
interface ImportMetaEnv {
  /** Chế độ offline (mặc định bật): `false` / `0` / `off` mới bật tài khoản qua API */
  readonly VITE_OFFLINE_MODE?: string;
  /** Gốc API (không có / cuối); rỗng = tắt tính năng tài khoản */
  readonly VITE_API_URL?: string;
  /** Google Identity Services client id; rỗng = ẩn nút Google */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
