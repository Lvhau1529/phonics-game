# 🍞 Bread Catcher

Bánh chữ rơi xuống, di chuyển rổ để **hứng đúng thứ tự các chữ** ghép thành từ mục tiêu.
Thiết kế chi tiết: [GAME_PLAN.md](GAME_PLAN.md) (từ _Phonics Bread Catcher Full Resource Pack_).
Code: `src/games/bread-catcher/` — khung chung (màn chọn game, âm thanh, nút...) xem [README gốc](../../README.md).

## Cách chơi

- **Home:** `PLAY` (vào Setup, chọn CLASS MODE 3 đội hoặc SOLO MODE 1 người) + bật/tắt SOUND · MUSIC · VOICE.
- **Setup:** chế độ, gói từ (Blending Words / Early Blending / Picture Vocabulary / Mixed Review /
  **My Words** tự nhập),
  cấp độ, thời gian (AUTO / 45–120s, hoặc **tự nhập** 15–600 giây ở ô CUSTOM), tên đội
  (bỏ trống = LIONS / TIGERS / PANDAS). Lựa chọn được nhớ cho lần sau.
- **Magic Dice** (Class): thứ tự lượt được xáo **một lần** đầu buổi, xúc xắc chỉ hé lộ đội kế tiếp
  → mỗi đội chơi đúng 1 lần. Lượt cuối chỉ còn 1 đội nên không đổ: hiện luôn `LAST TEAM` + `START`.
- **Một lượt:** `GET READY! 3-2-1-GO!` → tối đa **5 từ**. Hứng đúng lần lượt từng chữ; hứng nhầm
  **một** chữ là sang từ khác (từ sai được giữ lại để luyện sau). Đúng cả từ **+100**.
  Hết giờ thì lượt kết thúc ngay.
- **Pause** che tối sân chơi (chữ rơi bị ẩn); **Resume** luôn đếm ngược 3-2-1-GO.
  **Back / End Game** có hộp thoại xác nhận; kết thúc khi chưa đủ 3 đội thì về Setup,
  không hiện thống kê so sánh.
- **Final Results:** xếp hạng theo điểm → ít lần hứng nhầm hơn → còn nhiều thời gian hơn →
  đồng hạng. Mọi đội hạng nhất đều được mở **Winner's Gift** (nội dung quà đang là placeholder
  trong `src/games/bread-catcher/session/rewards.ts`).
- **Class Leaderboard:** tổng điểm các đội qua nhiều buổi được lưu localStorage (theo vị trí TEAM 1/2/3,
  đổi tên vẫn giữ điểm). Ở Final Results bảng hiện thứ tự cũ rồi trượt sang thứ tự mới — đội vượt hạng
  có "▲ RANK UP!". Nút **RESET SCORES** (có xác nhận) ở Final Results và Setup.
- Tên đội / cài đặt Setup được lưu ngay khi gõ, mở lại app vẫn còn. Tên quá dài tự cắt "…" ở mọi màn.

**Điều khiển:** mobile kéo ngang ở bất kỳ đâu (kéo tương đối, ngón tay không che rổ);
desktop dùng chuột hoặc ← → / A D, `P` / `Esc` để tạm dừng. Game tự dừng khi chuyển app.

### Từ vựng

Lấy toàn bộ phần **Phonics** của bảng học (M A S P T I N C O D) trong `src/games/bread-catcher/content/phonics_word_bank.json`;
phần ESL của bảng không dùng.

| Gói                | Nội dung                                                           |
| ------------------ | ------------------------------------------------------------------ |
| BLENDING WORDS     | map, mop, man… + miss, cast (mặc định)                             |
| EARLY BLENDING     | am, at, it, in, on, ma                                             |
| PICTURE VOCABULARY | 68 từ tranh theo chữ cái (monkey, alligator, astronaut, dinosaur…) |
| MIXED REVIEW       | tất cả các gói trên                                                |
| MY WORDS           | giáo viên tự gõ / dán bộ từ cho buổi chơi (xem dưới)               |

Từ dài (tới 9 chữ) tự thu nhỏ ô chữ cho vừa màn hình; nên chọn thời gian dài hơn cho gói từ tranh.

**Tranh từ vựng:** từ có tranh (cả 68 từ PICTURE VOCABULARY + 28 từ BLENDING: map, man, cat, pot, dad…)
hiện tranh ở bên trái ô từ ở mọi cấp độ; chạm tranh để nghe lại từ (nút loa nhỏ ở góc tranh). MY WORDS
tự có tranh nếu từ gõ vào trùng tên tranh. Từ không có tranh giữ nút loa như cũ. Tranh nằm trong atlas
`public/assets/bread-catcher/words/` (frame = từ viết thường); test `game/config/wordPictures.test.ts`
bảo đảm mọi từ PICTURE VOCABULARY đều có tranh.

**MY WORDS (tự nhập):** chọn gói này ở Setup rồi gõ / dán từ vào ô bên dưới (cách nhau bằng dấu cách,
dấu phẩy, chấm phẩy, gạch chéo hoặc xuống dòng). Từ hợp lệ hiện thành thẻ — bấm để nghe giọng đọc thử.
Chỉ nhận chữ a–z, 2–10 chữ cái mỗi từ; từ trùng tính một lần; phần bị bỏ qua (số, dấu nháy, chữ có dấu
tiếng Việt…) được liệt kê màu đỏ. Chưa có từ hợp lệ thì nút START bị khoá. Nội dung ô được nhớ cùng form
Setup. Chữ nhiễu lấy từ chính bộ từ; nếu ít hơn 6 chữ cái khác nhau thì bù thêm chữ của bảng Phonics.
Code: `session/content.ts` (`parseCustomWords`, `sessionWords`, `sessionLetters`),
`app/components/CustomWordsInput.tsx`.

### Bố cục ngang (máy chiếu lớp học)

- Tự bật khi màn hình rộng hơn cao (máy tính nối máy chiếu, TV, tablet nằm ngang).
  Điện thoại xoay ngang vẫn chơi dọc và hiện lời nhắc xoay máy.
- Game: toạ độ cao 540, rộng 720–960 (4:3 → 16:9); HUD gọn 1 hàng, ô từ ở giữa, ảnh nền bản ngang;
  màn mở quà chia 2 cột.
- Màn React: Home / Setup chia 2 cột, Final Results xếp 3 đội nằm ngang; màn hình ≥ 1280×700 tự phóng to UI.
- Đổi hướng màn hình khi đang ở Home / Setup / Results thì game tự chuyển bố cục; đang chơi dở thì
  chờ hết phiên mới chuyển.

### Cấp độ

| Level  | Rơi (px/s) | Nhịp rơi | AUTO | Gợi ý                           |
| ------ | ---------: | -------: | ---: | ------------------------------- |
| GENTLE |         58 |  1750 ms |  90s | Hiện từ + chữ mờ trong từng ô   |
| EASY   |         72 |  1450 ms |  75s | Hiện từ, ô trống (mặc định)     |
| NORMAL |         92 |  1200 ms |  60s | Nghe phát âm, chỉ gợi ý chữ đầu |
| FAST   |        115 |  1000 ms |  50s | Nghe phát âm, ô trống           |
| HARD   |        100 |  1100 ms |  90s | Hiện từ + **logic troll**       |

Trình duyệt không có giọng đọc (hoặc tắt VOICE) thì NORMAL / FAST tự hiện từ để vẫn chơi được.

Ảnh nền theo cấp độ (`game/config/stages.ts`): GENTLE — Sweet Shop (tiệm bánh ngọt hồng), EASY — Bakery
Kitchen, NORMAL — Village Bakery, FAST — Premium Bakery, HARD — Midnight Kitchen (bếp đêm bột tung toé).
Bánh chữ rơi ngẫu nhiên trong 16 kiểu: 4 bánh pixel-art gốc + 12 bánh ngọt có lòng kem trống (chữ đặt giữa
lòng kem).

### Kids Bakery Phonics pack

Bộ tài nguyên bổ sung ở `_source/bread-catcher/bakery-pack/` (13 ảnh nền magenta), cắt bằng
`tools/bread_catcher/bakery_pack.py` (gọi từ `pnpm assets:bread`):

| Ảnh nguồn            | Dùng cho                                                                           |
| -------------------- | ---------------------------------------------------------------------------------- |
| `01_bakery_treats`   | `bread/letter_treat_01..12` — bánh chữ, `letter` trong sprites.json = tâm lòng kem |
| `02`–`07`            | atlas `words/words.webp` + `words.json` — 96 tranh từ vựng                         |
| `08` (hàng đầu)      | `rewards/trophy, medal, ribbon, chef_hat` — icon bay ra khỏi hộp quà Winner's Gift |
| `09`                 | 8 linh vật đầu bếp — **chưa dùng** (đội vẫn là LIONS / TIGERS / PANDAS)            |
| `10`/`11`, `12`/`13` | `bg_bakery_04` (Sweet Shop), `bg_bakery_05` (Midnight Kitchen), bản ngang + dọc    |

Ảnh của pack xuất ở 2x (`scale: 2` trong sprites.json), game vẽ ở scale 0.5 cho sắc nét. Thêm tranh: thêm
tên từ đúng thứ tự ô trong `WORD_SHEETS` (bakery_pack.py) rồi chạy lại `pnpm assets:bread`.

### Level HARD — logic troll

Giữ lại toàn bộ logic troll của bản Bread Catcher cũ, chỉnh cho game ghép chữ:

- Prank liên tục (hồi chiêu 3–6s): đảo điều khiển, rổ teo, `+500 BONUS!` giả, lộn ngược màn hình,
  tắt đèn, `TIME'S UP!` giả, gió thổi, động đất, mưa trứng, turbo.
- Nhân vật brainrot phá game: **Tung Tung Tung Sahur** (đập văng rổ), **Lirili Larila**
  (đóng băng rổ + ăn vụng chữ), **Tralalero Tralala** (đá văng chữ), **Bombardiro Crocodilo** (thả bom).
- 60% chữ "láo": chữ cần hứng né rổ, nảy ra khỏi rổ, lắc lư, tăng tốc, đổi thành chữ khác, dịch chuyển,
  tàng hình; chữ nhiễu bám theo rổ hoặc giả dạng chữ cần hứng rồi lộ mặt giữa đường.
- Hứng trứng / bom chỉ làm rổ choáng, **không** tính là hứng sai. Đã bỏ trò "thu thuế điểm" để
  kết quả giữa các đội vẫn công bằng.

Thông số ở `game/config/troll.ts`, logic ở `game/systems/troll/`.

## Cấu trúc module

```text
src/games/bread-catcher/
├── manifest.ts              # thẻ game ở màn chọn game + import động
├── BreadCatcherGame.tsx     # root: Phaser + màn React phủ lên
├── content/                 # JSON từ resource pack: game_config, phonics_word_bank, ui_text.en
├── session/                 # logic buổi học, KHÔNG phụ thuộc React/Phaser
│   ├── sessionStore.ts      #   màn hiện tại + phiên chơi (React và Phaser cùng đọc)
│   ├── settings.ts          #   cấp độ, thời gian, luật
│   ├── content.ts           #   gói từ, bộ chữ nhiễu
│   ├── WordPool.ts          #   chọn từ ít lặp (từ đúng rút ra, từ sai luyện lại, sàn dự trữ 30%)
│   ├── ranking.ts           #   xếp hạng + tie-breaker, đội thắng
│   ├── leaderboard.ts, teams.ts, rewards.ts, storage.ts, text.ts, types.ts
├── app/                     # React: Home / Setup / Results, Leaderboard, TimeInput, Hướng dẫn (guide/), ảnh (assets.ts)
│                            #   (mỗi component một *.module.scss cạnh nó; màu cấp độ: levelTone.ts)
└── game/                    # Phaser
    ├── createGame.ts, SceneDirector.ts
    ├── config/              #   gameConfig, assets (nhạc), stages, hazards, troll
    ├── core/                #   event bus của lượt chơi, key scene, service
    ├── scenes/              #   Boot → Preload → Shell | TurnPicker → Game (+ Pause, TurnComplete) | Gift
    ├── objects/, systems/ (troll/), ui/
```

**Luồng màn hình:** `home → setup → play → results → gift`. React vẽ home / setup / results
(Phaser vẽ nền động phía sau), `SceneDirector` chạy các scene Phaser cho play / gift.

### Chỉnh game thường gặp (đường dẫn trong `src/games/bread-catcher/`)

| Muốn…                               | Sửa                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| Tốc độ / nhịp / thời gian mỗi level | `content/game_config.json`, HARD ở `session/settings.ts`                             |
| Thêm / sửa từ vựng                  | `content/phonics_word_bank.json`, gói ở `session/content.ts` (luật MY WORDS cũng ở đây) |
| Chữ hiển thị                        | `content/ui_text.en.json`                                                            |
| Phần thưởng trong hộp quà           | `session/rewards.ts`                                                                 |
| Tranh từ vựng / bánh chữ / ảnh nền  | `tools/bread_catcher/bakery_pack.py`, `game/config/stages.ts`                        |
| Nhịp rơi chữ cần hứng / chữ nhiễu   | `game/config/gameConfig.ts` (`SPAWN`)                                                |
| Trò troll của level HARD            | `game/config/troll.ts`                                                               |
| Nhạc nền / volume                   | `game/config/assets.ts` (SFX dùng chung: `src/platform/audio/sfx.ts`)                |
