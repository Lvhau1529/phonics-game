# Quy tắc cho phonics-game (Phonics Arcade — React 19 + Phaser 3 + Vite)

Đọc [README.md](README.md) trước (kiến trúc, styling, asset pipeline, PWA, tài khoản & đồng bộ). API: repo
phonics-api; kiến trúc hệ thống + ADR: repo phonics-workspace.

## Git

- **Không tự `git push`.** Chỉ push khi người dùng yêu cầu rõ ràng. Làm xong thì commit (nếu phù hợp) và báo lại.
- Trước mỗi lần push: `pnpm build` (gồm typecheck) phải qua; đóng server dev / preview mình đã mở.
- Commit message **không** có dòng ghi công Claude. Subject tiếng Anh, body có thể tiếng Việt.
- Dùng **pnpm**; thêm / đổi package thì commit kèm `pnpm-lock.yaml` (deploy cài bằng `--frozen-lockfile`).
- Secret chỉ trong `.env` (gitignored); mẫu ở `.env.example`. Không ghi secret vào docs / commit / log.
- Không sửa tay `public/assets` — chạy `pnpm assets:*` (Python, `tools/`) rồi commit ảnh sinh ra.

## Dev cùng các repo khác

Repo này độc lập (clone, cài, build, deploy riêng). Muốn chạy cả hệ thống (API + game + admin) và sửa
`@phonics/contracts` thấy ngay ở mọi app: dùng repo **phonics-workspace** (README ở đó). Trong workspace, chạy lệnh
từ gốc workspace (`pnpm --filter <app> ...`), không `cd` vào repo rồi `pnpm install` (sẽ ghi đè liên kết contracts local).

## Nguyên tắc

- **UI trong game chỉ tiếng Anh**, ngắn, nhãn nút VIẾT HOA (bé ~5 tuổi). Phần Hướng dẫn (GUIDE) tiếng Việt cho
  giáo viên. Comment / JSDoc tiếng Việt.
- Không có `VITE_API_URL` → app phải chạy y hệt bản offline: mọi code tài khoản nằm sau `ACCOUNT_ENABLED`
  (`src/platform/account/config.ts`), không gọi mạng, không hiện nút.
- Import bằng alias `@/` (ESLint cấm `../`). Mỗi component một `*.module.scss` (`@use '@/platform/styles/abstracts' as *;`,
  bọc `@layer components`). Tailwind chỉ cho utility nhỏ trong JSX. Token màu / font ở `styles/tailwind.css`.
- State: `createStore` (`src/shared/createStore.ts`) + `useStore(store, selector)`; selector trả slice ổn định.
  React và Phaser của một game chỉ nói chuyện qua store của game đó.
- Dữ liệu ngoài (API, localStorage, env) phải parse bằng zod (schema từ `@phonics/contracts`) trước khi dùng.
  localStorage key dạng `phonics-arcade:<ten>` (xem README > Storage keys).

## Cấu trúc nhanh

| Thư mục | Vai trò |
| --- | --- |
| `src/platform/` | Khung chung: hub, `platformStore` (hash route), gems/wallet, ui kit, pwa, audio, phaser |
| `src/platform/account/` | Tài khoản: `apiClient`, `authStore`, `accountApi`, `scoreSync`, `gamesSync`, `notificationsStore`, màn hình `screens/` |
| `src/platform/analytics/` | Sự kiện lượt xem / lượt chơi (ẩn danh) |
| `src/games/<id>/` | Từng game: `manifest.ts`, `session/` (store + luật), `app/` (màn React), `game/` (Phaser) |

## Cách làm việc thường gặp

- **Thêm game:** tạo `src/games/<id>/` + `manifest.ts`, thêm vào `src/games/index.ts`; ở phonics-api thêm `GameId`
  trong contracts (phát hành bản mới) + `GAME_REGISTRY` + seed catalog, rồi `pnpm up @phonics/contracts` ở đây; cuối ván solo gọi `postSoloResult(...)` và `trackPlay`
  (xem `bread-catcher/session/sessionStore.ts > finishSession`), màn kết quả thêm `<PointsSynced>`.
- **Thêm route platform:** `ACCOUNT_PAGES` + `parseHash` trong `platformStore.ts`, màn trong `account/screens/`,
  switch trong `AccountRoot.tsx`. Id game không được trùng `account`.
- **Gọi API mới:** schema trong contracts (phonics-api) → hàm trong `account/accountApi.ts` (`request(path, { schema })`) →
  store / màn hình. Lỗi hiển thị cho bé qua `account/errorText.ts` (map `ErrorCode` → câu tiếng Anh).
- **Thêm icon:** thêm vào `EXPORTS` trong `tools/arcade_ui/build_ui.py` → `pnpm assets:ui` (root) → commit PNG →
  khai báo trong `src/platform/ui/icons.ts`. Không chỉnh tay `public/assets`.
- **Test:** Vitest + jsdom, file `*.test.ts(x)` cạnh code (`pnpm test`). Store / queue / parse hash phải có test.

## Kiểm tra trước khi commit

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Build phải thành công cả khi không có `.env`.
Typecheck dùng TypeScript 7 (alias `typescript-7`); `typescript` 6 chỉ để ESLint parse (ADR 0010).
