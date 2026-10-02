/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** Mã commit của bản build: Vercel có sẵn biến môi trường, build ở máy thì hỏi git */
function commitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

const ROOT = fileURLToPath(new URL('.', import.meta.url));

/**
 * Tên class của CSS Modules (*.module.scss): hash theo đường dẫn file + tên class (giống nhau ở mọi máy).
 * Dev: `Button_btn_x7Gk` — đọc được trong DevTools; build: `_x7GkQ2` — ngắn.
 */
function scopedClassName(isBuild: boolean) {
  return (local: string, filename: string): string => {
    const file = relative(ROOT, filename.split('?')[0]).replaceAll('\\', '/');
    const hash = createHash('sha256').update(`${file}:${local}`).digest('base64url').slice(0, 6);
    return isBuild ? `_${hash}` : `${basename(file).split('.')[0]}_${local}_${hash.slice(0, 4)}`;
  };
}

/**
 * Dev cùng phonics-api: launcher phonics-dev đặt PHONICS_CONTRACTS_SRC = thư mục packages/contracts của API →
 * `@phonics/contracts` đọc thẳng mã nguồn (sửa schema thấy ngay, không cần phát hành). Không có biến (CI, Vercel,
 * chạy repo riêng) = dùng gói đã cài từ GitHub Packages.
 */
const contractsSrc = process.env.PHONICS_CONTRACTS_SRC;
const contractsAlias: Record<string, string> = contractsSrc
  ? { '@phonics/contracts': resolve(contractsSrc, 'src/index.ts') }
  : {};
const contractsFs = contractsSrc
  ? { fs: { allow: [searchForWorkspaceRoot(process.cwd()), contractsSrc] } }
  : {};

export default defineConfig(({ command }) => ({
  // Đường dẫn tương đối để deploy được ở bất kỳ thư mục con nào (itch.io, GitHub Pages...)
  base: './',
  resolve: {
    // import '@/game/...' thay cho '../../game/...' (khai báo tương ứng trong tsconfig.json > paths)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), ...contractsAlias },
    // contracts đọc từ mã nguồn API vẫn dùng chung một bản zod với app
    dedupe: ['zod'],
  },
  server: { ...contractsFs },
  define: {
    // Hiện trong Hướng dẫn để biết máy đang chạy bản nào (so với `git log`)
    __BUILD_ID__: JSON.stringify(`${version} · ${commitSha()}`),
  },
  css: {
    // Xem được file .scss gốc trong DevTools khi dev
    devSourcemap: true,
    modules: { generateScopedName: scopedClassName(command === 'build') },
  },
  plugins: [
    // Tailwind v4: xử lý file CSS có @import 'tailwindcss/…' (src/platform/styles/tailwind.css);
    // *.scss vẫn đi qua Sass như thường

    tailwindcss(),
    react(),
    VitePWA({
      // Có bản mới thì hỏi người dùng (nút ở màn Home) thay vì tự reload giữa ván — src/app/pwa
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/favicon.ico', 'icons/favicon-*.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Phonics Arcade',
        short_name: 'Phonics Arcade',
        description: 'Classroom phonics games for kindergarten: Bread Catcher, Food Stream and more',
        lang: 'en',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        background_color: '#3D1C6E',
        theme_color: '#7A3BB8',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Chuyển một lần từ bản 'autoUpdate' cũ sang bản có nút UPDATE (xem public/sw-migrate.js)
        importScripts: ['sw-migrate.js'],
        // Precache mọi thứ cần để chơi offline mọi game (nhạc của các resource pack nhỏ nên cache luôn)
        globPatterns: ['**/*.{js,css,html,png,webp,json,woff2}', 'assets/**/*.{ogg,mp3}'],
        // Ảnh nền bản ngang (máy chiếu) chỉ cache khi thực sự dùng — điện thoại không phải tải
        globIgnores: ['**/*_wide.png'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('_wide.png'),
            // Dùng ngay bản đã cache, đồng thời tải ngầm bản mới — thay ảnh (giữ tên) vẫn được cập nhật
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'phonics-wide-backgrounds',
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    // Test đơn vị cạnh code: *.test.ts(x); DOM giả lập bằng jsdom (store, storage, màn React)
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  build: {
    target: 'es2022',
    // Bundle JS/CSS/font (tên có hash) để riêng ở /static — cache vĩnh viễn được (xem vercel.json).
    // /assets giữ cho ảnh / âm thanh của game (tên cố định, sinh bởi tools/).
    assetsDir: 'static',
    chunkSizeWarningLimit: 1600, // Phaser ~1.2MB
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
}));
