# 🐟 Phonics Ocean

Game kiểu **Feeding Frenzy** luyện phonics: bé điều khiển cá bơi trong biển, **ăn cá mang đúng từ** theo âm /
vần / từ vừa nghe để được điểm và **lớn dần** (3 cỡ), né **cá săn mồi**. Biển sâu dần qua 6 biome, mỗi biome bé
điều khiển một loài cá khác. Thiết kế gốc: resource pack _Phonics Ocean Complete Pack_ (`GAMEPLAY_PHONICS_V2.md`:
luật chơi, word bank) + ảnh của _Phonics Ocean v3_ (`GAMEPLAY_PHONICS_V3.md`) — nguồn đã chép vào
`_source/phonics-ocean/`.
Code: `src/games/phonics-ocean/` — khung chung xem [README gốc](../../README.md).

## Cách chơi

- **Home:** `PLAY` + SOUND · MUSIC · VOICE + `GUIDE` (hướng dẫn tiếng Việt cho người lớn).
- **Dive Setup:** chọn 1 trong 8 cấp (hiện số sao đã đạt) + **BIG FISH** ON (3 tim) / OFF (luyện tập, không có cá
  săn mồi).
- **Một lượt:** `GET READY! → GO!` → mỗi đề: khung trên cùng hiện mục tiêu + nút loa, 2–6 cá mang chữ bơi vào.
  - Điều khiển: chạm / giữ kéo để cá bơi tới; máy tính: mũi tên / WASD hoặc chuột. Phím cách: nghe lại, `P` / `Esc`:
    tạm dừng (chuyển tab tự dừng).
  - Ăn đúng: cắn + đọc lại từ, +100 (đúng sau khi nhầm +50), chuỗi 3 ×2, chuỗi 5 ×3, thanh **Growth** tăng;
    đủ 1/3 và 2/3 số từ thì cá lớn thêm một cỡ (`BIGGER!`).
  - Ăn nhầm (chỉ khi bé chủ động bơi vào cá sai): choáng nhẹ, mất chuỗi, đọc lại đề — **không mất tim**. Nhầm 2 lần
    liên tiếp: cá đúng phát sáng gợi ý. Cá sai tự bơi vào cá đang đứng yên thì chỉ bị đẩy ra.
  - Cá săn mồi: dấu `!` cảnh báo ở mép màn ~1,3 giây trước khi vào, xuất hiện từ phía xa bé; cắn thì mất 1 tim.
  - Vật phẩm trôi lên: bong bóng (đỡ 1 lần cắn), đồng hồ (+10 giây), tim (+1), **nam châm** (6 giây: cá mang
    chữ ĐÚNG trong bán kính ~240 px tự trôi dần về miệng cá của bé; cá sai không bị hút; bé nhầm liên tiếp thì nam
    châm ra thường hơn). Nam châm nhỏ lơ lửng trên đầu cá khi đang bật, nhấp nháy lúc sắp hết.
  - **Bạn đồng hành** (chỉ trang trí, không va chạm): rùa bơi chậm ngang qua nửa dưới mỗi ~20 giây; cá heo lướt
    vòng cung ăn mừng khi chuỗi đúng 5 / 10…, RHYME COMBO hoặc lớn thêm một cỡ.
  - **Chướng ngại** (chỉ biome sâu: twilight_trench = sứa, thuỷ lôi; abyss_cave = + cua; volcanic_ruins = sứa, cua,
    đá rơi): cái đầu sau 8 giây, rồi mỗi ~9 giây, tối đa 1 (twilight) / 2 cùng lúc; bé nhầm liên tiếp thì ra thưa
    gấp đôi. Xuất hiện xa cá của bé, chậm, đá rơi có hạt vụn báo trước. Chạm: choáng nhẹ (như ăn nhầm) + bật ra +
    mất nửa thanh FRENZY — **không mất tim**; bong bóng đỡ được (không vỡ). Thuỷ lôi chạm thì "POP" thành bong bóng
    (không nổ). BIG FISH OFF (luyện tập) thì không có chướng ngại.
  - **Đàn cá kiểu Feeding Frenzy** (`session/frenzy.ts`, `game/systems/SchoolDirector.ts`): biển luôn có ~16 cá
    nhỏ bơi theo bầy, ~4 cá vừa, 1 cá mú lớn. Ăn được cá **nhỏ hơn mình** (cỡ 1: cá nhỏ; cỡ 2: thêm cá vừa; cỡ 3:
    cả cá mú) — +10 / +25 / +60 điểm, cá ăn được thì sợ và lảng ra; va cá to hơn chỉ bật ra (không mất tim).
    Cá săn mồi đi qua cũng đớp cá nhỏ.
  - **FRENZY!**: ăn liên tục (cả cá thường lẫn cá mang chữ đúng) đầy thanh tia sét → 6 giây điểm ×2, bơi nhanh.
    Lớn lên + qua màn vẫn chỉ nhờ ăn đúng cá mang chữ (không để "ăn bừa" thay cho học).
  - Kết thúc: đủ số từ → `LEVEL CLEAR!`; hết giờ → `TIME'S UP!`; hết tim → `OH NO!`.
- **Kết quả:** 0–3 sao (chưa qua màn 0 sao; ≥ 90% đúng 3 sao; ≥ ngưỡng thành thạo của cấp 2 sao), điểm, số từ,
  tỉ lệ đúng, chuỗi dài nhất, các từ đã ăn (xanh = đúng ngay), kim cương (1 viên / từ đúng), NEXT LEVEL khi qua màn.

### Cấp độ (`content/levels.json`, sinh từ CSV của pack)

| Cấp | Tên             | Kiểu (`mode`) | Mục tiêu                                     | Biome (cá của bé)              | Cá săn mồi     |
| --- | --------------- | ------------- | -------------------------------------------- | ------------------------------ | -------------- |
| 1   | SOUND REEF      | `initial`     | nghe /m/ → ăn từ bắt đầu bằng m              | coral_reef (cá đỏ)             | puffer         |
| 2   | CVC LAGOON A-I  | `word`        | nghe từ (cat) → ăn đúng từ, nhiễu khác 1 âm  | coral_reef (cá đỏ)             | puffer         |
| 3   | CVC DEEP SEA    | `word`        | như trên với e / o / u                       | kelp_forest (cá bướm sọc vàng) | shark          |
| 4   | RHYME CURRENT   | `rime`        | -at → ăn từ cùng vần; 3 câu cùng vần = COMBO | kelp_forest (cá bướm sọc vàng) | shark, puffer  |
| 5   | BLEND WRECK     | `contains`    | bl, st, nd… → ăn từ có cụm đó                | shipwreck_bay (cá đuôi gai)    | eel, barracuda |
| 6   | DIGRAPH TRENCH  | `contains`    | sh, ch, th…                                  | twilight_trench (cá mao tiên)  | angler         |
| 7   | MAGIC-E BAY     | `word`        | nghe kite, nhiễu ưu tiên cặp kit / kite      | abyss_cave (cá lồng đèn tím)   | shark, puffer  |
| 8   | TREASURE REVIEW | `sentence`    | "I can see a ___." + từ                      | volcanic_ruins (cá giáp)       | angler, shark  |

Độ khó tự điều chỉnh (§7 của pack): chuỗi 5 đúng → thêm 1 cá + bơi nhanh hơn chút; nhầm 2 lần → bớt 1 cá, gợi ý,
cá săn mồi chậm lại; tỉ lệ đúng < 70% → tối đa 3 cá. Máy không đọc được (không có Web Speech / tắt VOICE) thì khung
mục tiêu hiện luôn từ thay cho giọng đọc.

## Nội dung & asset

- **Đổi danh sách từ:** sửa `_source/phonics-ocean/data/word_bank.csv` (và `levels/level_0x.json` cho thời gian,
  số từ, số cá…) rồi `pnpm assets:phonics-ocean`. Chữ trên cá vẽ live nên không phải vẽ lại sprite. Cách đọc âm cho
  Web Speech (`SPEECH`), kiểu câu hỏi, cá săn mồi và biome theo cấp, từ gây nhiễu Magic-E nằm ở
  `tools/phonics_ocean/build_content.py`.
- **Ảnh (pack v3, `_source/phonics-ocean/v3/`):** `tools/phonics_ocean/build_sprites.py` cắt 3 sprite sheet nền
  magenta theo dải hàng (bảng `SHEETS`): 6 loài cá của bé × 4 khung bơi, 25 cá mang chữ, đàn cá (nhỏ: cá hề / xanh /
  vàng / lục; vừa: cá thù lù / cá bướm cam / cá đuôi gai; lớn: cá mú), 5 loại cá săn mồi × 3 khung, rùa / cá heo
  × 3 khung (`helper.*`), chướng ngại (`hazard.jelly.*`, `hazard.mine`, `hazard.crab.*`, `hazard.rock.*`), 7 vật
  phẩm (gồm `item.magnet`) → `public/assets/phonics-ocean/` + `game/config/sprites.json`. Ô chưa dùng (nút UI, hiệu
  ứng) bỏ qua — thêm key vào `SHEETS` khi làm tính năng.
- **Cá mang chữ:** sprite v3 có sẵn nhãn kem trống giữa thân; game vẽ chữ trên nhãn cùng màu đúng chỗ đó (nới rộng
  theo độ dài từ — `game/objects/WordFish.ts`).
- **Nền:** 6 ảnh 16:9 (1672×941) xuất WebP cùng độ phân giải, trôi parallax nhẹ theo cá của bé.
- **Prompt gen thêm tài nguyên** (phong cách, nhạc, SFX, giọng đọc): [ASSET_PROMPTS.md](ASSET_PROMPTS.md).
- **Âm thanh:** 5 SFX của pack (`correct`, `wrong_soft`, `level_up`, `collect`, `danger`) qua `pnpm assets:audio`
  → `public/assets/phonics-ocean/sfx/`. Pack chưa có nhạc nền nên dùng chung nhạc của Food Stream.
- **Giọng đọc:** Web Speech (`shared/speech.ts`). Khi có file ghi âm theo `audio_manifest.csv` của pack thì thay
  phần phát ở `game/systems/Voice.ts`.

## Lưu trữ & đồng bộ

- localStorage `phonics-arcade:phonics-ocean`: form Setup gần nhất + sao / điểm cao nhất theo cấp.
- Kết quả gửi API (`postSoloResult`) khi `@phonics/contracts` có `phonics-ocean` trong `GameId` — đã thêm ở
  phonics-api (contracts 1.2.0, `GAME_REGISTRY`: total ≤ 30, score ≤ 50 000, seed catalog "Phonics Ocean"). Game /
  admin nhận sau khi phát hành contracts 1.2.0 và `pnpm up @phonics/contracts`; trước đó game tự bỏ qua (không lỗi).

## Code

| Thư mục    | Nội dung                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `content/` | `levels.json` (sinh tự động) + `schema.ts` (zod) + `levels.ts`                                 |
| `session/` | `questions.ts` (sinh đề), `round.ts` (luật điểm / lớn lên / độ khó / sao), `frenzy.ts` (đàn cá, FRENZY), `sea.ts` (nam châm, rùa / cá heo, chướng ngại), `store.ts`, `storage.ts` — có test |
| `game/`    | `OceanScene` (lượt chơi), `LobbyScene` (nền sau màn React), `PauseScene`; `objects/` cá, cá săn mồi, vật phẩm, `Companion` (rùa / cá heo), `Hazard`; `ui/` HUD, khung mục tiêu |
| `app/`     | màn Home / Setup / Results, Hướng dẫn                                                          |
