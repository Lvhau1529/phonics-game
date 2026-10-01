# 🎮 Phonics Arcade

Bộ game phonics cho lớp mẫu giáo (~5 tuổi) chạy trên web, cài được như app nhờ PWA; bố cục **dọc** cho
điện thoại và **ngang** cho máy chiếu lớp học / máy tính / tablet. Mở app là **màn chọn game**; mỗi game
là một module độc lập, thêm game mới không phải sửa game cũ.

| Game                 | Mô tả                                                                                                               | Tài liệu                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 🍞 **Bread Catcher** | Di chuyển rổ hứng bánh chữ theo đúng thứ tự để ghép từ. Class 3 đội / Solo.                                         | [docs/bread-catcher](docs/bread-catcher/README.md) |
| 🍩 **Food Stream**   | Livestream ăn uống: nghe âm / từ, cho streamer ăn đúng món chữ cái / tranh. Classroom 2 đội / Solo, 7 kiểu câu hỏi. | [docs/food-stream](docs/food-stream/README.md)     |

Màn chọn game có **kim cương**: bé nhận 1 viên cho mỗi câu / từ đúng (tối đa 10 viên mỗi ván, ở mọi game),
dùng để **mở khoá game mới** (game có `price` trong manifest); game sắp ra mắt hiện thẻ **COMING SOON**.
Bấm bộ đếm kim cương hiện lời động viên bé chăm chỉ luyện tập để có kim cương mở game.

Giao diện trong game hoàn toàn bằng tiếng Anh; riêng phần **Hướng dẫn** (nút GUIDE ở màn chính của mỗi game,
nút "?" cạnh từng mục ở Setup) viết bằng tiếng Việt cho giáo viên / phụ huynh.

## Tech stack

| Hạng mục      | Công nghệ                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Game engine   | Phaser 3 (WebGL / Canvas, Arcade Physics, Sound Manager + Web Audio)                                                                                  |
| Ngôn ngữ      | TypeScript (strict)                                                                                                                                   |
| App shell     | React 19 — màn chọn game + màn Home / Setup / Results của từng game                                                                                   |
| Styling       | SCSS Modules (Sass) cho component + Tailwind CSS v4 cho utility / token — xem [Styling](#styling)                                                     |
| Bundler / dev | Vite (mỗi game một chunk tải động)                                                                                                                    |
| PWA           | vite-plugin-pwa (manifest + service worker, chơi offline)                                                                                             |
| Nội dung      | JSON + Zod (kiểm tra gói nội dung của Food Stream)                                                                                                    |
| Giọng đọc     | Web Speech API (đọc âm / từ, không cần file ghi âm)                                                                                                   |
| Format code   | Prettier (+ plugin sắp xếp class Tailwind) + EditorConfig                                                                                             |
| Lưu dữ liệu   | localStorage (`phonics-arcade:prefs`, `phonics-arcade:wallet`, `phonics-arcade:<game-id>`; tài khoản: xem [Tài khoản & đồng bộ](#tài-khoản--đồng-bộ)) |
| Asset         | PNG (hình), OGG + MP3 fallback (audio) — sinh bằng script Python                                                                                      |
| Font          | Baloo 2 (giao diện), Andika (chữ cái / từ vựng — font cho trẻ tập đọc)                                                                                |

## Chạy

```bash
pnpm install
pnpm dev          # http://localhost:5173 (có --host để mở từ điện thoại cùng mạng LAN)
pnpm build        # typecheck + build vào dist/
pnpm preview      # chạy thử bản build (có service worker)
pnpm typecheck
pnpm format       # Prettier
```

Link mở thẳng một game: `/#/bread-catcher`, `/#/food-stream`; màn tài khoản: `/#/account` (nút Back của trình
duyệt / Android quay về màn chọn game).

## Kiến trúc

```text
src/
├── main.tsx                 # Tailwind (nạp đầu tiên), font, global.scss, <PlatformApp games={GAMES} />
├── shared/                  # tiện ích thuần TS: createStore, random, speech (Web Speech), format
├── platform/                # KHUNG DÙNG CHUNG — không biết gì về từng game
│   ├── PlatformApp.tsx      #   màn chọn game ↔ game đang mở (React.lazy, báo lỗi khi tải hỏng)
│   ├── platformStore.ts     #   game đang mở, đồng bộ URL hash
│   ├── types.ts             #   GameManifest: hợp đồng giữa platform và một game
│   ├── hub/                 #   màn chọn game: thẻ game (khoá / COMING SOON), bộ đếm kim cương, hộp thoại
│   ├── gems/wallet.ts       #   ví kim cương chung: nhận sau ván (awardGems), mở khoá game (unlockGame)
│   ├── prefs.ts, storage.ts #   cài đặt âm thanh chung, localStorage an toàn theo từng game
│   ├── audio/               #   1 AudioContext cho cả app, thư viện SFX chung, phát SFX từ React
│   ├── phaser/              #   PhaserHost (mount / khoá input), createPhaserGame, viewport + view
│   │                        #   (toạ độ logic, render ×2), AudioSystem (nhạc + duck), font, chữ sắc nét
│   ├── ui/                  #   Button, BackButton, Icon (+ icons.ts), Dialog, GemReward, OptionGroup, Field,
│   │                        #   NameInput, AudioToggles, RotateHint, ScreenLayer, ScreenHeader, tone.ts,
│   │                        #   guide/ (GuideDialog, GuideButton, GuideCard, guideContent.module.scss)
│   ├── account/             #   tài khoản học sinh & đồng bộ API (chỉ khi có VITE_API_URL) — xem bên dưới
│   ├── analytics/events.ts  #   sự kiện ẩn danh VIEW / PLAY (thống kê game)
│   ├── pwa/                 #   nút cập nhật khi có bản deploy mới
│   └── styles/              #   tailwind.css (token + Tailwind), global.scss (reset), abstracts/ (mixin SCSS)
└── games/
    ├── index.ts             # danh sách game ở màn chọn game
    ├── bread-catcher/       # xem docs/bread-catcher
    └── food-stream/         # xem docs/food-stream
```

Mỗi game tự chứa: `manifest.ts` (thẻ game + `load: () => import(root)`), root component (Phaser + màn React),
store / luật chơi thuần TS (`session/`), màn React (`app/`, mỗi component một `*.module.scss`), Phaser (`game/`),
nội dung, dữ liệu lưu riêng. React và Phaser của một game chỉ nói chuyện qua store của game đó.

**Độ phân giải:** toạ độ game là 360 × (640–800) khi dọc, (720–960) × 540 khi ngang, canvas render gấp đôi
(`RENDER_SCALE`) qua camera zoom → chữ học sắc nét. Code layout luôn dùng `view(scene)` / `isLandscape(scene)`
(`src/platform/phaser/view.ts`). Đổi hướng màn hình ở màn React thì game tự dựng lại theo bố cục mới;
đang chơi dở thì chờ hết phiên.

**Import:** alias `@/` trỏ tới `src/` (khai báo ở `tsconfig.json` và `vite.config.ts`).

### Thêm một game mới

1. Tạo `src/games/<id>/` với root component (dùng `PhaserHost` + `createPhaserGame`, `useGameOrientation`,
   `ScreenLayer`, `GuideDialog`...) và `manifest.ts` (`id` dùng cho URL và key lưu trữ — không đổi sau khi phát
   hành). Phần tử gốc: ``<main className={clsx('app', `app--${orientation}`, styles.theme)}>`` — theme riêng
   (nếu có) ghi đè token `--color-*` trong `<Root>.module.scss` (xem Food Stream).
2. Thêm manifest vào `src/games/index.ts` (bỏ thẻ COMING SOON tương ứng trong `UPCOMING`). Muốn bé dùng
   kim cương mở khoá thì đặt `price` trong manifest; bỏ trống = miễn phí.
3. Asset vào `public/assets/<id>/` (script sinh ở `tools/<id>/`), ảnh bìa 16:9 `public/assets/<id>/cover.png`.
4. Lưu dữ liệu bằng `gameStorageKey('<id>')`; âm thanh / giọng đọc theo `prefsStore` chung.
5. Chơi xong ván gọi `awardGems(sốCâuĐúng)` (platform/gems/wallet.ts) và hiện `<GemReward amount={…} />`
   ở màn kết quả. Nút / icon dùng bộ chung (`BackButton`, `Icon`, `Dialog`) cho thống nhất.

## Tài khoản & đồng bộ

Học sinh có thể đăng nhập để **điểm ván Solo được lưu lên server** (API NestJS ở `apps/api`, hợp đồng chung
`packages/contracts`): tổng điểm, xếp hạng trong lớp, thông báo của giáo viên, game được giáo viên mở khoá.
Toàn bộ phần này nằm ở `src/platform/account/` và **chỉ bật khi có `VITE_API_URL`** — không có thì app chạy
y như bản offline (không UI tài khoản, không gọi mạng).

### Cấu hình (`apps/game/.env`, mẫu ở `.env.example`)

| Biến                    | Ý nghĩa                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`          | Gốc API, không có `/` cuối (vd `http://localhost:3000`); client ghép `${VITE_API_URL}/api${path}`. Rỗng = tắt tài khoản.                      |
| `VITE_GOOGLE_CLIENT_ID` | Client id Google Identity Services cho nút **Continue with Google**; rỗng = ẩn nút Google. Script GIS chỉ nạp khi mở màn đăng nhập / đăng ký. |

Biến được kiểm tra bằng zod ở `platform/account/config.ts` (`ACCOUNT_ENABLED`, `API_URL`, `GOOGLE_CLIENT_ID`).

### Màn hình (hash `#/account/...`, `platformStore.ts`)

| Hash                      | Màn          | Ghi chú                                                                                                                                                                                                            |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#/account`               | MY PROFILE   | avatar, tên, lớp, tổng điểm + hạng (`GET /me/points`), MY GAMES (điểm từng game, khoá / mở), nút RANKING · MESSAGES · EDIT · SIGN OUT                                                                              |
| `#/account/login`         | SIGN IN      | email + mật khẩu hoặc Google; đã đăng nhập thì chuyển sang hồ sơ                                                                                                                                                   |
| `#/account/register`      | NEW ACCOUNT  | email, mật khẩu, tên, avatar (preset `AVATARS` của contracts → ảnh ở `avatars.ts`), lớp (`GET /public/classes`). Google lần đầu (422 `PROFILE_REQUIRED`) → form này ở "chế độ Google" (không hỏi email / mật khẩu) |
| `#/account/edit`          | EDIT PROFILE | tên + avatar (`PATCH /me/profile`); đổi lớp phải nhờ giáo viên                                                                                                                                                     |
| `#/account/ranking`       | RANKING      | tab WEEK / MONTH / ALL + chip lọc game (`GET /me/class/ranking`)                                                                                                                                                   |
| `#/account/notifications` | MESSAGES     | thông báo; mở màn là đánh dấu đã đọc (`PATCH /me/notifications/read`)                                                                                                                                              |

Khách mở màn cần đăng nhập → hiện SIGN IN tại chỗ (`AccountRoot.tsx`). Màn tài khoản là một chunk tải động
riêng (`PlatformApp.tsx`). Thanh trên màn chọn game có nút **SIGN IN** (khách) / avatar + tên (đã đăng nhập) và
chuông thông báo kèm số chưa đọc. Chữ trong UI là tiếng Anh ngắn cho bé; mã lỗi API dịch ở `errorText.ts`.

### Token & khôi phục phiên (`apiClient.ts`, `authStore.ts`)

- Access token (15 phút) chỉ giữ trong bộ nhớ; refresh token nhận qua body (header `X-Refresh-Transport: body`
  ở mọi lời gọi `/auth/*`) và lưu localStorage. Mỗi lần refresh server xoay token mới → luôn lưu bản mới.
- Mọi lời gọi bị 401 → refresh **một lần** (gộp nhiều lời gọi cùng lúc) → gọi lại; refresh bị từ chối → đăng xuất
  trên máy. Mở app có refresh token → `status: 'restoring'` rồi `signedIn`; mất mạng lúc mở app vẫn giữ user đã
  lưu, điểm xếp hàng chờ.
- Response được kiểm tra bằng zod schema của `@phonics/contracts`; lỗi gom về `ApiError { statusCode, code }`.

### Đồng bộ điểm, mở khoá, sự kiện (`syncQueue.ts`)

Ba hàng đợi localStorage gửi **tuần tự**, chạy khi: vừa thêm, mở app, có mạng (`online`), quay lại tab,
đăng nhập xong. 2xx → bỏ khỏi hàng đợi; 4xx (trừ 401 / 429) → bỏ + đánh dấu bị từ chối; mất mạng / 5xx → giữ lại.

| Gì                                                                                                                                                              | Khi nào                                    | Endpoint                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Kết quả ván **Solo** của học sinh đã đăng nhập (`scoreSync.ts`, game gọi `postSoloResult`)                                                                      | cuối ván (`finishSession` / `finishRound`) | `POST /game/results` (idempotent theo `clientSessionId`)                                     |
| Mở khoá game bằng kim cương khi đang đăng nhập (`gamesSync.ts` › `unlockWithGems`)                                                                              | bấm UNLOCK                                 | `POST /me/games/:id/unlock`                                                                  |
| Sự kiện ẩn danh VIEW (bấm thẻ game) / PLAY (xong ván — mọi chế độ, cả khách, **trừ** ván solo đã đăng nhập vì server tự ghi từ kết quả) (`analytics/events.ts`) | ngay lúc đó, gom ≤ 50                      | `POST /public/events` (kèm bearer nếu đang đăng nhập; đóng trang gửi bằng `fetch keepalive`) |

Khách (máy lớp dùng chung) **không** xếp hàng điểm. Màn kết quả hiện `<PointsSynced sessionId />` cạnh
`<GemReward>`: "+N POINTS · TOTAL X" / "SAVING POINTS…" / "POINTS WILL BE SAVED WHEN ONLINE".

### Catalog game & mở khoá (`gamesSync.ts`)

`GET /public/games` (cache localStorage) phủ lên manifest qua `useCatalog()`: `enabled=false` ẩn thẻ,
`comingSoon=true` thành thẻ COMING SOON, `price` ghi đè giá trong manifest (`null` = miễn phí). Đã đăng nhập:
`GET /me/games` → game server đã mở; `isUnlocked(game)` = server mở ∪ ví kim cương trên máy.
Thông báo: `GET /me/notifications?unread=true` khi mở app, quay lại tab, mỗi 5 phút (`notificationsStore.ts`).

### Key localStorage

| Key                           | Nội dung                                      |
| ----------------------------- | --------------------------------------------- |
| `phonics-arcade:auth`         | `{ user, refreshToken }` — phiên đăng nhập    |
| `phonics-arcade:score-queue`  | kết quả ván Solo chờ gửi (`{ userId, body }`) |
| `phonics-arcade:unlock-queue` | mở khoá bằng kim cương chờ báo server         |
| `phonics-arcade:event-queue`  | sự kiện VIEW / PLAY chờ gửi                   |
| `phonics-arcade:client-id`    | UUID ẩn danh của thiết bị (sự kiện)           |
| `phonics-arcade:catalog`      | cache `GET /public/games`                     |

Icon dùng riêng cho phần này (trophy, medal, crown, star, chuông, check, settings, linh vật ong ngủ) xuất từ
Bee pack bằng `pnpm assets:ui` (bảng `EXPORTS` / `MASCOTS` trong `tools/arcade_ui/build_ui.py`).

## Styling

**SCSS Modules** cho style của component + **Tailwind CSS v4** cho utility nhỏ và token thiết kế.

| Ở đâu                                        | Dùng cho                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/platform/styles/tailwind.css`           | **Token** màu / font / bo góc (`@theme`) — nguồn duy nhất: `bg-orange`, `text-ink`, `font-learning` trong JSX hoặc `var(--color-orange)`, `var(--font-ui)`, `var(--radius-card)` trong SCSS. Biến thể `app-landscape:`, `projector:`, `wide:`; utility `text-outline`. |
| `src/platform/styles/global.scss`            | Reset, `html / body / #root`, `.app`, biến `--outline`. Không thêm style component vào đây.                                                                                                                                                                            |
| `src/platform/styles/abstracts/`             | Mixin / biến SCSS (không sinh CSS khi chỉ `@use`): `screen`, `card`, `text-button`, `focus-ring`, `ellipsis`, `candy-scrollbar`, `app-landscape`, `projector`, `wide`, `phone-landscape`, keyframes (`keyframes-bob`, `keyframes-screen-in`, `keyframes-pop`).         |
| `Component.module.scss` cạnh `Component.tsx` | Style của component: tên class tự đổi thành duy nhất (`Button_btn_x7Gk` khi dev, `_x7GkQ2` khi build) nên không đụng nhau giữa các game.                                                                                                                               |

Quy ước:

- File module bắt đầu bằng `@use '@/platform/styles/abstracts' as *;` và bọc toàn bộ trong
  `@layer components { … }`. Tên class camelCase (`styles.logoTop`), ghép nhiều class bằng `clsx`.
- Thứ tự layer: `theme < base < components < utilities` → class Tailwind gắn thêm vào phần tử **luôn thắng**
  style của module (vd `<Button className="mt-4">`). Không dùng Preflight của Tailwind (reset riêng ở
  `global.scss`).
- Tailwind cho bố cục / tinh chỉnh một lần ngay trong JSX (`flex flex-col gap-2`, `sr-only`); thứ gì có trạng
  thái, animation, pseudo-element, nhiều dòng → SCSS module. Prettier tự sắp xếp class Tailwind.
- Màn cha chỉnh component con qua prop `className` (vị trí trong lưới, cỡ nút...). Import file `.module.scss`
  **cuối cùng** trong danh sách import để CSS của màn nạp sau CSS của component con.
- Màu theo dữ liệu: prop `tone` (`OptionGroup`, `GuideCard accent`) → biến CSS, không tạo class cho từng màu.
- Bố cục ngang của game theo class `.app--landscape` trên phần tử gốc (mixin `app-landscape` / biến thể
  `app-landscape:`), không theo media query — đang chơi dở thì giữ bố cục cũ.
- Keyframes khai báo trong chính file module dùng nó (dùng mixin keyframes có sẵn): CSS Modules đổi tên
  keyframes theo từng file.
- Theme của game: ghi đè `--color-*` (và `--screen-layer-bg`, `--guide-backdrop-bg`) trên phần tử gốc — component
  chung và class Tailwind bên trong tự đổi màu theo.

## Asset pipeline

Tài nguyên gốc trong `_source/<game>/` (sprite sheet / art board, WAV master của resource pack) — **không** đưa
vào build. Script Python sinh file dùng trong game ở `public/assets/`:

```bash
pip install -r tools/requirements.txt
pnpm assets:bread         # Bread Catcher: cắt sprite + vẽ pixel-art bằng code -> public/assets/bread-catcher
pnpm assets:food-stream   # Food Stream: cắt art board -> public/assets/food-stream + src/games/food-stream/sprites.json
pnpm assets:audio         # mọi WAV master -> .ogg + .mp3 (SFX chung -> public/assets/shared/sfx)
pnpm assets:ui            # giao diện chung (icon, kim cương, linh vật ong, nền màn chọn game) -> public/assets/shared/ui
pnpm assets:icons         # icon PWA / favicon hoa cúc pixel (_source/platform/app-icon) -> public/icons
pnpm assets               # chạy tất cả
```

- `tools/common/`: xử lý ảnh dùng chung (làm sạch alpha, cắt sát, resize, viền sticker), đường dẫn.
- `tools/bread_catcher/`: `build_sprites.py` (toạ độ cắt, ảnh bìa), `phonics_art.py`, `brainrot_art.py`.
- `tools/food_stream/build_sprites.py`: toạ độ cắt nhân vật / món ăn / đạo cụ / tranh, huy hiệu che chữ in sẵn,
  frame cắn, ảnh bìa.
- `tools/build_audio.py`: bảng nguồn -> đích cho mọi game (đã mix sẵn, không normalize lại).
- `tools/arcade_ui/build_ui.py`: cắt Phonics Arcade Bee resource pack (`_source/platform/`: sheet lưới 4×4 / 3×3
  nền vàng gradient không alpha, thứ tự ô trong `asset_manifest.json`). Tách nền bằng flood fill từ mép sheet (giữ
  phần bao bởi viền mực), gán từng mảnh vào ô theo trọng tâm để icon lấn ô không bị cắt; cảnh linh vật cắt ô vuông
  (khung bo vẽ bằng CSS — mixin `mascot-frame`). Chỉ xuất ảnh đang dùng (bảng `EXPORTS` / `MASCOTS`), ảnh lớn ra WebP.
- `tools/build_app_icons.py`: icon app của cả Phonics Arcade từ Daisy Pixel Icon Pack (`_source/platform/app-icon/`):
  cắt góc nền trắng của `master-1024.png`, sinh bản maskable / apple-touch; favicon chép nguyên bản crop của pack.
- Chỉ dùng khung / icon **không có chữ in sẵn** (hoặc che chữ in sẵn) — chữ cái, tên đội, nhãn nút vẽ live.

## Deploy (Vercel)

Cấu hình sẵn trong `vercel.json`: cài bằng `pnpm install --frozen-lockfile`, build bằng
`pnpm run build`, xuất ra `dist/`. Chỉ cần import repo GitHub vào Vercel (hoặc chạy `vercel --prod`).

- Dùng **pnpm** (chỉ giữ `pnpm-lock.yaml`). Thêm / đổi package xong nhớ commit lại `pnpm-lock.yaml`,
  nếu không Vercel báo `ERR_PNPM_OUTDATED_LOCKFILE`.
- `pnpm-workspace.yaml` > `allowBuilds`: package có build script phải được cho phép / chặn rõ ràng
  (pnpm 11+ coi script bị bỏ qua là lỗi khi cài).
- Vercel không chạy Python: ảnh / âm thanh trong `public/assets/` phải được sinh sẵn
  (`pnpm assets`) và commit lên.
- Cache: bundle JS/CSS/font có hash ở `/static` (cache 1 năm); ảnh / SFX ở `/assets` (1 ngày),
  nhạc 7 ngày; `sw.js` và manifest luôn kiểm tra bản mới. Service worker precache mọi game để chơi offline.
- Cập nhật PWA (`src/platform/pwa/`): deploy xong, máy người dùng phát hiện `sw.js` mới khi mở / tải lại
  trang, quay lại tab, hoặc mỗi 30 phút → màn chọn game hiện nút **NEW VERSION! UPDATE** (không tự reload
  giữa ván). Mã bản build (`version · commit`) ghi ở cuối phần Hướng dẫn của mỗi game.

## Credits

Xem [CREDITS.md](CREDITS.md).
