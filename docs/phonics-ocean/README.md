# 🐟 Phonics Ocean

Game kiểu **Feeding Frenzy** luyện phonics: bé điều khiển cá đỏ bơi trong biển, **ăn cá mang đúng từ** theo âm /
vần / từ vừa nghe để được điểm và **lớn dần** (3 cỡ), né **cá săn mồi**. Thiết kế gốc: resource pack _Phonics Ocean
Complete Pack_ (`GAMEPLAY_PHONICS_V2.md`) — nguồn đã chép vào `_source/phonics-ocean/`.
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
  - Vật phẩm trôi lên: bong bóng (đỡ 1 lần cắn), đồng hồ (+10 giây), tim (+1).
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

| Cấp | Tên             | Kiểu (`mode`) | Mục tiêu                                     | Biome         | Cá săn mồi     |
| --- | --------------- | ------------- | -------------------------------------------- | ------------- | -------------- |
| 1   | SOUND REEF      | `initial`     | nghe /m/ → ăn từ bắt đầu bằng m              | coral_reef    | puffer         |
| 2   | CVC LAGOON A-I  | `word`        | nghe từ (cat) → ăn đúng từ, nhiễu khác 1 âm  | shipwreck     | puffer         |
| 3   | CVC DEEP SEA    | `word`        | như trên với e / o / u                       | deep_ocean    | shark          |
| 4   | RHYME CURRENT   | `rime`        | -at → ăn từ cùng vần; 3 câu cùng vần = COMBO | ice_sea       | shark, puffer  |
| 5   | BLEND WRECK     | `contains`    | bl, st, nd… → ăn từ có cụm đó                | volcano       | eel, barracuda |
| 6   | DIGRAPH TRENCH  | `contains`    | sh, ch, th…                                  | treasure_zone | angler         |
| 7   | MAGIC-E BAY     | `word`        | nghe kite, nhiễu ưu tiên cặp kit / kite      | ice_sea       | shark, puffer  |
| 8   | TREASURE REVIEW | `sentence`    | "I can see a ___." + từ                      | treasure_zone | angler, shark  |

Độ khó tự điều chỉnh (§7 của pack): chuỗi 5 đúng → thêm 1 cá + bơi nhanh hơn chút; nhầm 2 lần → bớt 1 cá, gợi ý,
cá săn mồi chậm lại; tỉ lệ đúng < 70% → tối đa 3 cá. Máy không đọc được (không có Web Speech / tắt VOICE) thì khung
mục tiêu hiện luôn từ thay cho giọng đọc.

## Nội dung & asset

- **Đổi danh sách từ:** sửa `_source/phonics-ocean/data/word_bank.csv` (và `levels/level_0x.json` cho thời gian,
  số từ, số cá…) rồi `pnpm assets:phonics-ocean`. Chữ trên cá vẽ live nên không phải vẽ lại sprite. Cách đọc âm cho
  Web Speech (`SPEECH`), kiểu câu hỏi, cá săn mồi theo cấp, từ gây nhiễu Magic-E nằm ở `tools/phonics_ocean/build_content.py`.
- **Ảnh:** `tools/phonics_ocean/build_sprites.py` cắt `_source/phonics-ocean/art/player-revision-board.png` (cá đỏ
  bản mới — không dùng cá hề — theo README của pack, cá săn mồi, vật phẩm) và `level-design-master.png` (25 cá mồi),
  cùng 6 nền biome → `public/assets/phonics-ocean/` + `game/config/sprites.json`.
- **Nền:** ảnh của pack chỉ ~480px nên được phóng ×4 kiểu pixel-art (nearest) cho sắc nét, trôi parallax nhẹ theo
  cá của bé; lớp nước phủ gần như bỏ hẳn.
- **Đàn cá:** khung bơi đã cắt sẵn của OceanFeast pack (`_source/phonics-ocean/oceanfeast/`).
- **Tài nguyên HD:** prompt gen đầy đủ (nền 16:9, sprite sheet nhân vật, nhạc, SFX, giọng đọc) ở
  [ASSET_PROMPTS.md](ASSET_PROMPTS.md). Thả file vào `_source/phonics-ocean/hd/` (`backgrounds/`, `sheets/` nền
  magenta theo lưới, hoặc `sprites/<key>.png`) rồi `pnpm assets:phonics-ocean` — có file nào thì thay file đó.
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
| `session/` | `questions.ts` (sinh đề), `round.ts` (luật điểm / lớn lên / độ khó / sao), `store.ts`, `storage.ts` — có test |
| `game/`    | `OceanScene` (lượt chơi), `LobbyScene` (nền sau màn React), `PauseScene`; `objects/` cá, cá săn mồi, vật phẩm; `ui/` HUD, khung mục tiêu |
| `app/`     | màn Home / Setup / Results, Hướng dẫn                                                          |
