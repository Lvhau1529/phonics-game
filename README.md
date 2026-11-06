# 🎮 Phonics Arcade

Bộ game phonics cho lớp mẫu giáo (~5 tuổi) chạy trên web, cài được như app nhờ PWA; bố cục **dọc** cho
điện thoại và **ngang** cho máy chiếu lớp học / máy tính / tablet. Mở app là **màn chọn game**; mỗi game
là một module độc lập, thêm game mới không phải sửa game cũ.

| Game                 | Mô tả                                                                                                               | Tài liệu                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 🍞 **Bread Catcher** | Di chuyển rổ hứng bánh chữ theo đúng thứ tự để ghép từ. Class 3 đội / Solo.                                         | [docs/bread-catcher](docs/bread-catcher/README.md) |
| 🍩 **Food Stream**   | Livestream ăn uống: nghe âm / từ, cho streamer ăn đúng món chữ cái / tranh. Classroom 2 đội / Solo, 7 kiểu câu hỏi. | [docs/food-stream](docs/food-stream/README.md)     |
| 🐟 **Phonics Ocean** | Kiểu Feeding Frenzy: bơi ăn đúng cá mang chữ để lớn dần, né cá săn mồi. 8 cấp: âm đầu → CVC → vần → blend → digraph → Magic E → ôn tập. | [docs/phonics-ocean](docs/phonics-ocean/README.md) |
| 🧩 **Odd One Out** | Nhìn 4 hình, tìm hình khác loại rồi nói lý do bằng tiếng Anh. 15 chủ đề × 6 câu, bảng xếp hạng trên máy, micro (Web Speech). | [docs/odd-one-out](docs/odd-one-out/README.md) |
| 🦁 **Little English Explorers** | 3 thế giới con vật, mỗi thế giới một mẫu câu (lives in / is / has): chọn đáp án, nói cả câu. | [docs/english-explorers](docs/english-explorers/README.md) |
| 🎃 **Halloween Candy Quest** | Phiêu lưu xin kẹo pixel-art: nhân vật tự đi, bé gõ cửa, chủ nhà hỏi từ vựng (4 dạng: nghe chọn, tìm vật, nghe loa, ghép cặp), đúng thì kẹo bay vào giỏ. Solo / 2 đội luân phiên, giáo viên tự chọn bộ từ. | [docs/halloween-candy-quest](docs/halloween-candy-quest/README.md) |

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
| Nội dung      | JSON + Zod (kiểm tra gói nội dung của Food Stream, Phonics Ocean)                                                                                                    |
| Giọng đọc     | Web Speech API (đọc âm / từ, không cần file ghi âm)                                                                                                   |
| Format code   | Prettier (+ plugin sắp xếp class Tailwind) + EditorConfig                                                                                             |
| Lưu dữ liệu   | localStorage (`phonics-arcade:prefs`, `phonics-arcade:wallet`, `phonics-arcade:<game-id>`; tài khoản: xem [Tài khoản & đồng bộ](#tài-khoản--đồng-bộ)) |
| Asset         | PNG (hình), OGG + MP3 fallback (audio) — sinh bằng script Python                                                                                      |
| Font          | Baloo 2 (giao diện), Andika (chữ cái / từ vựng — font cho trẻ tập đọc)                                                                                |

## Chạy

```bash
pnpm install      # cần token GitHub Packages cho @phonics/contracts (xem mục Gói @phonics/contracts)
pnpm dev          # http://localhost:5173 (có --host để mở từ điện thoại cùng mạng LAN)
pnpm build        # typecheck + build vào dist/
pnpm preview      # chạy thử bản build (có service worker)
pnpm typecheck
pnpm format       # Prettier
```

Link mở thẳng một game: `/#/bread-catcher`, `/#/food-stream`, `/#/phonics-ocean`, `/#/odd-one-out`, `/#/english-explorers`, `/#/halloween-candy-quest`; màn tài khoản: `/#/account` (nút Back của trình
duyệt / Android quay về màn chọn game).

## Kiến trúc

```text
src/
├── main.tsx                 # Tailwind (nạp đầu tiên), font, global.scss, khởi động store, <PlatformApp games={GAMES} />
├── app/                     # KHUNG: PlatformApp (màn chọn game ↔ game ↔ tài khoản, React.lazy), AccountRoot (#/account/...)
├── core/                    # HẠ TẦNG — không nghiệp vụ, không biết module / game nào
│   ├── api/                 #   client.ts: request + zod, token, refresh single flight, ApiError; errorText.ts
│   ├── navigation/          #   platformStore.ts: màn đang mở, đồng bộ URL hash
│   ├── config/              #   account.ts: OFFLINE_MODE / ACCOUNT_ENABLED / API_URL (env, zod)
│   ├── store/  storage/     #   createStore + useStore; localStorage an toàn theo từng game
│   ├── sync/                #   syncQueue.ts: hàng đợi gửi API lưu localStorage (offline)
│   ├── hooks/               #   useRequest (cache theo key), useDelayedLoading
│   ├── audio/  phaser/      #   AudioContext, SFX, prefs âm thanh; PhaserHost, createPhaserGame, viewport + view, text, font
│   └── types/  utils/       #   GameManifest, ValueOf; format, random, speech, timeAgo
├── ui/                      # DESIGN SYSTEM: Button/, Dialog/, Icon/, OptionGroup/… (mỗi component một thư mục),
│                            #   guide/, svg/, icons.ts, tone.ts, styles/ (tailwind.css, global.scss, abstracts/)
├── modules/                 # NGHIỆP VỤ — mỗi module tự đóng gói, bố cục cố định (xem "Module" bên dưới)
│   ├── auth/                #   tài khoản gia đình: phụ huynh đăng nhập / Google / đặt mật khẩu, chọn bé, AccountButton
│   ├── catalog/             #   danh mục game từ server + mở khoá
│   ├── results/             #   gửi kết quả ván Solo (scoreSyncStore), PointsSynced
│   ├── analytics/           #   sự kiện ẩn danh VIEW / PLAY
│   ├── gems/                #   ví kim cương, GemCounter, GemReward
│   ├── homework/            #   bài tập về nhà: renderers/ (14 dạng câu), answers/, màn làm bài / kết quả
│   ├── hub/                 #   màn chọn game
│   └── pwa/                 #   nút cập nhật khi có bản deploy mới
└── games/
    ├── index.ts             # danh sách game ở màn chọn game
    ├── bread-catcher/       # xem docs/bread-catcher
    ├── food-stream/         # xem docs/food-stream
    ├── phonics-ocean/       # xem docs/phonics-ocean
    ├── odd-one-out/         # xem docs/odd-one-out (chỉ màn React, không Phaser)
    ├── english-explorers/   # xem docs/english-explorers (chỉ màn React, không Phaser)
    └── halloween-candy-quest/ # xem docs/halloween-candy-quest (chỉ màn React, sân khấu pixel-art bằng DOM)
```

### Module (ADR 0023)

Mỗi `src/modules/<tên>/` chỉ gồm các thư mục chức năng (thiếu thì không tạo) + `index.ts` / `constants.ts`:

```text
modules/<tên>/
├── repositories/<x>Repository.ts   chỉ khai báo endpoint + schema, trả DTO như BE — CHỈ services/ được import
├── services/<x>Service.ts          gọi repository → trả Model (không trả DTO cho UI)
├── models/<X>Model.ts              class bọc DTO: field readonly cùng tên + getter đã format cho UI
├── stores/<x>Store.ts              state + action (gọi service)
├── hooks/use<X>.ts                 React đọc store / tải dữ liệu qua service
├── components/<Comp>/Comp.tsx (+ Comp.module.scss, Comp.test.tsx)
├── screens/<Screen>/Screen.tsx (+ .module.scss)
├── utils/                          hàm thuần của module
└── index.ts                        public API — app, games, module khác chỉ import từ đây
```

Luồng dữ liệu bắt buộc: **screen / component → hook hoặc store → service → repository → `core/api`**; UI chỉ thấy
Model. Phụ thuộc một chiều `main → app → games → modules → ui / core`. ESLint (`eslint.config.js`) chặn:

- import sâu vào module khác (chỉ qua `@/modules/<tên>`; riêng screen — điểm vào route — import theo đường
  `screens/` để giữ code-splitting);
- repository ngoài `services/`; `request()` ngoài `repositories/`;
- `components/`, `screens/`, `renderers/`, `guide/` gọi service hoặc import `@phonics/contracts` (dùng kiểu /
  validator module export ở `models/`, `utils/`, vd `homework/models/question.ts`, `auth/utils/password.ts`);
- `core/` / `ui/` import `modules/` / `games/` / `app/`; `modules/` import `games/` / `app/`.

Bố cục thư mục được kiểm tra bằng `src/test/architecture.test.ts`.

Mỗi game tự chứa (`src/games/<id>/`): `manifest.ts` (thẻ game + `load: () => import(root)`), `<Name>Game.tsx`
(root: Phaser + màn React), `content/` (dữ liệu / nội dung JSON + schema), `session/` (store + luật + text, thuần TS),
`app/` (màn React, `guide/`, `assets.ts`; mỗi component một `*.module.scss`), `game/` (Phaser), dữ liệu lưu riêng. React và Phaser của một game chỉ nói chuyện qua store của game đó.

**Độ phân giải:** toạ độ game là 360 × (640–800) khi dọc, (720–960) × 540 khi ngang, canvas render gấp đôi
(`RENDER_SCALE`) qua camera zoom → chữ học sắc nét. Code layout luôn dùng `view(scene)` / `isLandscape(scene)`
(`src/core/phaser/view.ts`). Đổi hướng màn hình ở màn React thì game tự dựng lại theo bố cục mới;
đang chơi dở thì chờ hết phiên.

**Import:** alias `@/` trỏ tới `src/` (khai báo ở `tsconfig.json` và `vite.config.ts`).

### Thêm một game mới

1. Tạo `src/games/<id>/` với root component (dùng `PhaserHost` + `createPhaserGame`, `useGameOrientation`,
   `ScreenLayer`, `GuideDialog`...) và `manifest.ts` (`id` dùng cho URL và key lưu trữ — không đổi sau khi phát
   hành). Phần tử gốc: ``<main className={clsx('app', `app--${orientation}`, styles.theme)}>`` — theme riêng
   (nếu có) ghi đè token `--color-*` trong `<Root>.module.scss` (xem Food Stream). `PreloadScene` gọi
   `reportLoadProgress(this)` trong `preload()` và `markAssetsReady(this.game)` khi xong (`core/phaser/assetLoading.ts`):
   SceneDirector chờ `ASSETS_READY`, còn `PhaserHost` hiện thanh tải ở đáy màn React / màn LOADING nếu bé vào chơi
   khi ảnh chưa tải xong (tải xong tự vào ván).
2. Thêm manifest vào `src/games/index.ts` (bỏ thẻ COMING SOON tương ứng trong `UPCOMING`). Muốn bé dùng
   kim cương mở khoá thì đặt `price` trong manifest; bỏ trống = miễn phí.
3. Asset vào `public/assets/<id>/` (script sinh ở `tools/<id>/`), ảnh bìa 16:9 `public/assets/<id>/cover.png`.
4. Lưu dữ liệu bằng `gameStorageKey('<id>')`; âm thanh / giọng đọc theo `prefsStore` chung.
5. Chơi xong ván gọi `awardGems(sốCâuĐúng)` (`@/modules/gems`) và hiện `<GemReward amount={…} />`
   ở màn kết quả. Nút / icon dùng bộ chung (`BackButton`, `Icon`, `Dialog`) cho thống nhất.

## Tài khoản & đồng bộ

Bé ~5 tuổi **không có tài khoản riêng** (contracts 2.0, `phonics-api/docs/family-first.md`): bé chơi trên máy lớp
(giáo viên mở chế độ lớp / đội, không cần tài khoản) hoặc trên điện thoại của phụ huynh. Ở nhà, **phụ huynh đăng
nhập tài khoản gia đình** (do trung tâm tạo, mail mời đặt mật khẩu) → **chọn hồ sơ bé** → bé chơi; **điểm ván Solo,
bài tập về nhà, game được mở khoá ghi cho hồ sơ bé** (API NestJS ở repo [phonics-api](https://github.com/Lvhau1529/phonics-api),
hợp đồng chung `@phonics/contracts` — xem [bên dưới](#gói-phonicscontracts-github-packages)).
Toàn bộ phần này nằm ở các module `auth`, `catalog`, `results`, `homework` (`src/modules/`) và **chỉ bật khi có `VITE_API_URL` và `VITE_OFFLINE_MODE=false`**.
Mặc định (BE chưa lên) game chạy **offline mode**: không gọi mạng, kể cả khi đã đặt `VITE_API_URL`. Riêng nút **SIGN IN** vẫn hiện ở màn chọn game; bấm vào chỉ mở hộp **COMING SOON**.

### Cấu hình (`.env`, mẫu ở `.env.example`)

| Biến                    | Ý nghĩa                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_OFFLINE_MODE`     | **Mặc định bật** (thiếu biến cũng tính là bật): game chạy offline, không gọi API. `false` / `0` / `off` = bật tài khoản khi API đã sẵn sàng. |
| `VITE_API_URL`          | Gốc API, không có `/` cuối (vd `http://localhost:3000`); client ghép `${VITE_API_URL}${API_PREFIX}${path}` (`/api/v1/...`, hằng số trong contracts). Rỗng = tắt tài khoản.                      |
| `VITE_GOOGLE_CLIENT_ID` | Client id Google Identity Services cho nút **Continue with Google** (phụ huynh); rỗng = ẩn nút Google. Script GIS chỉ nạp khi mở màn đăng nhập. |
| `VITE_ADMIN_URL` | URL admin được nhúng màn xem trước câu hỏi / phiếu `#/preview` (nhiều URL cách nhau dấu phẩy). Rỗng = chỉ admin dev `http://localhost:5174`. Màn này nhận nội dung qua `postMessage`, chỉ từ origin này. |

Biến được kiểm tra bằng zod ở `core/config/account.ts` (`OFFLINE_MODE`, `ACCOUNT_ENABLED`, `API_URL`,
`GOOGLE_CLIENT_ID`). Chạy cả hệ thống qua phonics-dev mà muốn thử tài khoản thì đặt `VITE_OFFLINE_MODE=false` trong `.env`.

### Màn hình (hash, `core/navigation/platformStore.ts`)

| Hash                      | Màn             | Ghi chú                                                                                                                                                                                    |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#/account/login`         | PARENT SIGN IN  | phụ huynh: email + mật khẩu hoặc Google (`app: 'game'`). Tài khoản không phải PARENT bị từ chối (`NOT_FAMILY_ACCOUNT`); email Google chưa có tài khoản gia đình → nhờ trung tâm tạo       |
| `#/account`               | WHO IS PLAYING? | màn chọn bé (`GET /auth/profiles`): bé đã duyệt bấm vào chơi (`POST /auth/switch-profile`), bé chờ duyệt / bị từ chối hiện trạng thái; SIGN OUT                                             |
| `#/set-password?token=…`  | SET PASSWORD    | link mời trong mail `parent.invite` (`POST /auth/set-password`) → đăng nhập luôn → màn chọn bé                                                                                              |
| `#/homework`              | HOMEWORK        | bài tập về nhà của bé đang chơi: tab TO DO / DONE / ALL (`GET /me/assignments`) — `src/modules/homework/`. Chưa chọn bé → đăng nhập / chọn bé tại chỗ (`ChildRequired`)                    |
| `#/homework/<id>`         | làm bài         | một câu mỗi màn, 14 dạng câu (`renderers/`), chạm để chọn, bàn phím a–z trên màn, ghi âm / tô chữ tải lên object storage; tự lưu `PUT /me/submissions/:id/answers` sau 2 s + bản nháp localStorage; SEND = `POST …/submit` |
| `#/homework/<id>/result`  | RESULT          | sao / điểm / hạng, SEE ANSWERS (đúng / sai, đáp án nếu GV cho xem), nhận xét của GV (chỉ xem — `GET /me/submissions/:id/comments`), TRY AGAIN khi còn lượt                                 |

Thanh trên màn chọn game có nút tài khoản (`AccountButton`): **SIGN IN** (khách) → **WHO'S PLAYING?** (phụ huynh chưa
chọn bé) → avatar + tên bé (đang chơi). Bấm tên bé mở **ASK A GROWN-UP** (`GrownUpGate`: phép cộng hai chữ số, chọn
1 trong 3) rồi mới về màn chọn bé — bé không tự đổi người chơi / đăng xuất. Màn tài khoản là một chunk tải động riêng
(`app/AccountRoot`). Chữ trong UI là tiếng Anh ngắn; mã lỗi API dịch ở `core/api/errorText.ts`.

**Màn chờ & chống nháy** (`ui/LottieLoader/`, `core/hooks/useDelayedLoading.ts`, `core/hooks/useRequest.ts` — màn gọi qua hook của module, vd `useFamilyProfiles`):

- `LottieLoader` (lottie-web bản light, file `assets/shared/ui/lottie/loading.json` tải một lần): `sm` nằm trong
  dòng chữ (SAVING POINTS…, góc header đang tải lại), `lg` khối giữa màn + nhãn LOADING…; `prefers-reduced-motion`
  hoặc không tải được file → ba chấm tĩnh.
- Màn chờ lớn chỉ hiện sau **200 ms** và giữ ít nhất **400 ms** (`useDelayedLoading(loading, { delay, minDuration })`);
  tải nhanh hơn thì không hiện gì.
- `useRequest` giữ kết quả mới nhất theo key trong bộ nhớ (xoá khi đổi phiên / đăng xuất): mở lại màn hiện ngay bản
  cũ rồi tải lại ngầm (`isRefreshing` → chấm nhỏ ở header, không unmount danh sách). Đổi key (tab): dữ liệu cũ mờ đi
  (`stale`, opacity .6) tới khi có dữ liệu mới.

### Gọi API: repository → service → model

Mọi lời gọi API đi qua hai lớp + model trong module sở hữu dữ liệu (bố cục ở mục Module phía trên):

| Lớp        | File                                          | Việc                                                                                                                                                                  |
| ---------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository | `modules/<x>/repositories/<x>Repository.ts`   | Chỉ khai báo endpoint: `request(ENDPOINTS.x, { method, body, query, schema, auth })` (`core/api/client.ts`), trả DTO đúng như BE. Không map / logic.                  |
| Service    | `modules/<x>/services/<x>Service.ts`          | Gọi repository, đổi DTO → Model. Store / hook **chỉ gọi service**; màn / component chỉ dùng hook hoặc action của store.                                              |
| Model      | `modules/<x>/models/<Name>Model.ts`           | Class nhận DTO contracts, gán từng field `readonly` cùng tên; getter cho dữ liệu chỉ FE dùng (`UserModel.firstName`, `FamilyProfileModel.canPlay`…). Lưu localStorage: `toJSON()`; đọc lại `Schema.safeParse` → `new XModel(...)`. |

Ack của mutation / hàng đợi (kết quả ván, sự kiện) không tới UI nên service có thể trả thẳng DTO.
**Không spread model** (`{ ...model }` mất getter): tạo instance mới.

### Token & khôi phục phiên (`core/api/client.ts`, `modules/auth/stores/authStore.ts`)

- Access token (15 phút) chỉ giữ trong bộ nhớ; refresh token nhận qua body (header `X-Refresh-Transport: body`
  ở mọi lời gọi `/auth/*`) và lưu localStorage. Mỗi lần refresh server xoay token mới → luôn lưu bản mới.
- `tokenStore` chỉ giữ **một phiên đang dùng**: phiên phụ huynh (màn chọn bé: `auth/profiles`, `auth/switch-profile`)
  hoặc phiên bé đang chơi (mọi `/me/*`). Khi bé chơi, refresh token phụ huynh "đỗ" trong `authStore.parentRefreshToken`;
  về màn chọn bé / đổi bé = thu hồi phiên bé (`auth/logout`) rồi lấy lại phiên phụ huynh (`backToParent`).
- Mọi lời gọi bị 401 → refresh **một lần** (gộp nhiều lời gọi cùng lúc) → gọi lại; refresh phiên bé bị từ chối (phụ
  huynh mất quyền vào hồ sơ…) → tự về phiên phụ huynh; refresh phiên phụ huynh bị từ chối → đăng xuất trên máy. Mở
  app có refresh token → `status: 'restoring'` rồi `signedIn`; mất mạng lúc mở app vẫn giữ phiên đã lưu, điểm xếp hàng chờ.
- Store đồng bộ (catalog, bài tập, điểm chờ gửi) nghe `watchActiveStudent`: đổi bé A → B thì bỏ dữ liệu của A, tải
  của B, gửi các ván đang chờ của B.
- Response được kiểm tra bằng zod schema của `@phonics/contracts`; lỗi gom về `ApiError { statusCode, code }`.

### Đồng bộ điểm, mở khoá, sự kiện (`core/sync/syncQueue.ts`)

Ba hàng đợi localStorage gửi **tuần tự**, chạy khi: vừa thêm, mở app, có mạng (`online`), quay lại tab,
chọn bé. 2xx → bỏ khỏi hàng đợi; 4xx (trừ 401 / 429) → bỏ + đánh dấu bị từ chối; mất mạng / 5xx → giữ lại.

| Gì                                                                                                                                                              | Khi nào                                    | Endpoint                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Kết quả ván **Solo** của bé đang chơi (đã chọn hồ sơ bé) (`results/stores/scoreSyncStore.ts`, game gọi `postSoloResult`)                                                            | cuối ván (`finishSession` / `finishRound`) | `POST /game/results` (idempotent theo `clientSessionId`)                                     |
| Mở khoá game bằng kim cương khi bé đang chơi (`gamesSync.ts` › `unlockWithGems`)                                                                                | bấm UNLOCK                                 | `POST /me/games/:id/unlock`                                                                  |
| Sự kiện ẩn danh VIEW (bấm thẻ game) / PLAY (xong ván — mọi chế độ, cả khách, **trừ** ván solo của bé đã chọn hồ sơ vì server tự ghi từ kết quả) (`analytics/events.ts`) | ngay lúc đó, gom ≤ 50                      | `POST /public/events` (kèm bearer nếu đang đăng nhập; đóng trang gửi bằng `fetch keepalive`) |

Khách (máy lớp dùng chung) và phụ huynh chưa chọn bé **không** xếp hàng điểm. Màn kết quả hiện `<PointsSynced sessionId />` cạnh
`<GemReward>`: "+N POINTS · TOTAL X" / "SAVING POINTS…" / "POINTS WILL BE SAVED WHEN ONLINE".

### Catalog game & mở khoá (`gamesSync.ts`)

`GET /public/games` (cache localStorage) phủ lên manifest qua `useCatalog()`: `enabled=false` ẩn thẻ,
`comingSoon=true` thành thẻ COMING SOON, `price` ghi đè giá trong manifest (`null` = miễn phí). Bé đang chơi:
`GET /me/games` → game server đã mở; `isUnlocked(game)` = server mở ∪ ví kim cương trên máy.

### Key localStorage

| Key                           | Nội dung                                      |
| ----------------------------- | --------------------------------------------- |
| `phonics-arcade:auth`         | `{ user, refreshToken, parent?: { user, refreshToken } }` — phiên đang dùng (phụ huynh hoặc bé) + phiên phụ huynh đang đỗ khi bé chơi |
| `phonics-arcade:score-queue`  | kết quả ván Solo chờ gửi (`{ userId, body }`) |
| `phonics-arcade:unlock-queue` | mở khoá bằng kim cương chờ báo server         |
| `phonics-arcade:event-queue`  | sự kiện VIEW / PLAY chờ gửi                   |
| `phonics-arcade:client-id`    | UUID ẩn danh của thiết bị (sự kiện)           |
| `phonics-arcade:catalog`      | cache `GET /public/games`                     |
| `phonics-arcade:homework:<submissionId>` | bản nháp câu trả lời bài tập đang làm (`{ userId, assignmentId, answers, updatedAt }`) — gộp với bản server khi mở lại, xoá khi nộp |

Icon dùng riêng cho phần này (trophy, medal, crown, star, check, settings, linh vật ong ngủ) xuất từ
Bee pack bằng `pnpm assets:ui` (bảng `EXPORTS` / `MASCOTS` trong `tools/arcade_ui/build_ui.py`).

## Styling

**SCSS Modules** cho style của component + **Tailwind CSS v4** cho utility nhỏ và token thiết kế.

| Ở đâu                                        | Dùng cho                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/styles/tailwind.css`           | **Token** màu / font / bo góc (`@theme`) — nguồn duy nhất: `bg-orange`, `text-ink`, `font-learning` trong JSX hoặc `var(--color-orange)`, `var(--font-ui)`, `var(--radius-card)` trong SCSS. Biến thể `app-landscape:`, `projector:`, `wide:`; utility `text-outline`. |
| `src/ui/styles/global.scss`            | Reset, `html / body / #root`, `.app`, biến `--outline`. Không thêm style component vào đây.                                                                                                                                                                            |
| `src/ui/styles/abstracts/`             | Mixin / biến SCSS (không sinh CSS khi chỉ `@use`): `screen`, `card`, `text-button`, `focus-ring`, `ellipsis`, `candy-scrollbar`, `app-landscape`, `projector`, `wide`, `phone-landscape`, keyframes (`keyframes-bob`, `keyframes-screen-in`, `keyframes-pop`).         |
| `Component.module.scss` cạnh `Component.tsx` | Style của component: tên class tự đổi thành duy nhất (`Button_btn_x7Gk` khi dev, `_x7GkQ2` khi build) nên không đụng nhau giữa các game.                                                                                                                               |

Quy ước:

- File module bắt đầu bằng `@use '@/ui/styles/abstracts' as *;` và bọc toàn bộ trong
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
pnpm assets:food-stream   # Food Stream: cắt art board -> public/assets/food-stream + src/games/food-stream/game/config/sprites.json
pnpm assets:phonics-ocean # Phonics Ocean: cắt sheet của pack v3 -> public/assets/phonics-ocean + sprites.json; word_bank.csv -> content/levels.json
pnpm assets:audio         # mọi WAV master -> .ogg + .mp3 (SFX chung -> public/assets/shared/sfx)
pnpm assets:ui            # giao diện chung (icon, kim cương, linh vật ong, nền màn chọn game) -> public/assets/shared/ui
pnpm assets:icons         # icon PWA / favicon hoa cúc pixel (_source/platform/app-icon) -> public/icons
pnpm assets:avatars       # ảnh đại diện tài khoản (Animal Avatar sheet, _source/platform/avatars) -> public/assets/shared/avatars
pnpm assets               # chạy tất cả
```

- `tools/common/`: xử lý ảnh dùng chung (làm sạch alpha, cắt sát, resize, viền sticker), cắt sheet nền magenta
  (`magenta_sheet.py`), đường dẫn.
- `tools/bread_catcher/`: `build_sprites.py` (toạ độ cắt, ảnh bìa), `phonics_art.py`, `brainrot_art.py`.
- `tools/food_stream/build_sprites.py`: toạ độ cắt nhân vật / món ăn / đạo cụ / tranh, huy hiệu che chữ in sẵn,
  frame cắn, ảnh bìa.
- `tools/phonics_ocean/`: `build_sprites.py` (pack v3: cắt 3 sheet nền magenta theo dải hàng — cá của bé theo
  biome, cá mang chữ, đàn cá, cá săn mồi, vật phẩm; 6 nền biome -> WebP; ảnh bìa), `build_content.py`
  (word_bank.csv + level_0x.json -> `src/games/phonics-ocean/content/levels.json`).
- `tools/build_audio.py`: bảng nguồn -> đích cho mọi game (đã mix sẵn, không normalize lại).
- `tools/arcade_ui/build_ui.py`: cắt Phonics Arcade Bee resource pack (`_source/platform/`: sheet lưới 4×4 / 3×3
  nền vàng gradient không alpha, thứ tự ô trong `asset_manifest.json`). Tách nền bằng flood fill từ mép sheet (giữ
  phần bao bởi viền mực), gán từng mảnh vào ô theo trọng tâm để icon lấn ô không bị cắt; cảnh linh vật cắt ô vuông
  (khung bo vẽ bằng CSS — mixin `mascot-frame`). Chỉ xuất ảnh đang dùng (bảng `EXPORTS` / `MASCOTS`), ảnh lớn ra WebP.
- `tools/build_app_icons.py`: icon app của cả Phonics Arcade từ Daisy Pixel Icon Pack (`_source/platform/app-icon/`):
  cắt góc nền trắng của `master-1024.png`, sinh bản maskable / apple-touch; favicon chép nguyên bản crop của pack.
- `tools/build_avatars.py`: 8 avatar con vật (preset `AVATARS` của contracts) từ Animal Avatar sheet
  (`_source/platform/avatars/`, nền magenta 2×4, khung gỗ tròn) -> WebP vuông 224px. Avatar cũ `pip` / `girl` / `boy`
  (không còn trong picker) vẫn dùng ảnh ong / streamer — map ở `src/modules/auth/utils/avatars.ts`.
- Chỉ dùng khung / icon **không có chữ in sẵn** (hoặc che chữ in sẵn) — chữ cái, tên đội, nhãn nút vẽ live.

## Gói `@phonics/contracts` (GitHub Packages)

Schema / type / hằng số dùng chung với API là gói `@lvhau1529/phonics-contracts` (phát hành từ repo phonics-api), cài qua alias
`"@phonics/contracts": "npm:@lvhau1529/phonics-contracts@^1"` nên code vẫn `import … from '@phonics/contracts'`.
GitHub Packages cần token kể cả khi chỉ đọc. Token **chỉ nằm trong biến môi trường `NODE_AUTH_TOKEN`** (GitHub PAT
classic, quyền `read:packages`). File `.npmrc.auth` (commit, không chứa secret) ghi
`//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}`; pnpm 12 bỏ qua `${...}` trong credential của `.npmrc` repo,
nên phải bật file này bằng biến `PNPM_CONFIG_NPMRC_AUTH_FILE=.npmrc.auth` (pnpm chỉ tin file auth do môi trường chỉ
định):

- Vercel: chỉ cần đặt `NODE_AUTH_TOKEN` (Production + Preview); `vercel.json > installCommand` đã kèm
  `PNPM_CONFIG_NPMRC_AUTH_FILE=.npmrc.auth`. Biến `NPM_RC` cũ không cần nữa (xoá đi).
- CI (GitHub Actions): đã đặt sẵn cả hai biến (`NODE_AUTH_TOKEN` = `GITHUB_TOKEN`); ở trang package
  `phonics-contracts` > Package settings > Manage Actions access, thêm repo này với quyền Read.
- Máy dev: đặt `NODE_AUTH_TOKEN` trong biến môi trường user. Cài qua phonics-dev (`pnpm repos install`) thì launcher
  tự bật `.npmrc.auth`; cài thẳng trong repo thì chạy `PNPM_CONFIG_NPMRC_AUTH_FILE=.npmrc.auth pnpm install`
  (PowerShell: `$env:PNPM_CONFIG_NPMRC_AUTH_FILE='.npmrc.auth'; pnpm install`), hoặc một lần thêm dòng
  `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}` vào `~/.npmrc` (file user được mở rộng env) rồi
  `pnpm install` như thường.

Nâng version: `pnpm up @phonics/contracts` rồi commit lockfile. Sửa contracts và thấy ngay ở app (không cần phát hành):
chạy qua launcher phonics-dev (`pnpm dev`).

## Deploy (Vercel)

Cấu hình sẵn trong `vercel.json`: cài bằng `PNPM_CONFIG_NPMRC_AUTH_FILE=.npmrc.auth pnpm install --frozen-lockfile`,
build bằng `pnpm run build`, xuất ra `dist/`. Import repo GitHub vào Vercel (Root Directory = gốc repo) và đặt biến
`NODE_AUTH_TOKEN` (token đọc GitHub Packages, xem trên) cùng các biến `VITE_*`.

- Dùng **pnpm** (chỉ giữ `pnpm-lock.yaml`). Thêm / đổi package xong nhớ commit lại `pnpm-lock.yaml`,
  nếu không Vercel báo `ERR_PNPM_OUTDATED_LOCKFILE`.
- `pnpm-workspace.yaml` > `allowBuilds`: package có build script phải được cho phép / chặn rõ ràng
  (pnpm 11+ coi script bị bỏ qua là lỗi khi cài).
- Vercel không chạy Python: ảnh / âm thanh trong `public/assets/` phải được sinh sẵn
  (`pnpm assets`) và commit lên.
- Cache: bundle JS/CSS/font có hash ở `/static` (cache 1 năm); ảnh / SFX ở `/assets` (1 ngày),
  nhạc 7 ngày; `sw.js` và manifest luôn kiểm tra bản mới. Service worker precache mọi game để chơi offline.
  Lần mở đầu chỉ đăng ký service worker khi game đầu tiên tải xong asset (hoặc sau 20 giây ở màn chọn game) để
  lượt precache ~19 MB không tranh băng thông với game bé vừa mở (`core/phaser/assetActivity.ts`).
- Cập nhật PWA (`src/modules/pwa/`): deploy xong, máy người dùng phát hiện `sw.js` mới khi mở / tải lại
  trang, quay lại tab, hoặc mỗi 30 phút → màn chọn game hiện nút **NEW VERSION! UPDATE** (không tự reload
  giữa ván). Mã bản build (`version · commit`) ghi ở cuối phần Hướng dẫn của mỗi game.

## Credits

Xem [CREDITS.md](CREDITS.md).
