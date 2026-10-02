# 🍩 Food Stream

Livestream "ăn uống" cho bé luyện phonics: **nghe âm / từ → chọn món ăn mang chữ cái (hoặc tranh) →
cho streamer ăn** → nghe lại âm → thêm người xem, tim, combo. Thiết kế gốc: [GAME_PLAN.md](GAME_PLAN.md),
key asset dự kiến: [ASSET_MANIFEST.json](ASSET_MANIFEST.json).
Code: `src/games/food-stream/` — khung chung (màn chọn game, âm thanh, nút...) xem [README gốc](../../README.md).

## Cách chơi

- **Home:** `PLAY` + bật/tắt SOUND · MUSIC · VOICE + `GUIDE` (hướng dẫn tiếng Việt cho người lớn).
- **Go Live Setup:** SOLO / CLASSROOM, gói từ, cấp độ (Solo hiện số sao đã đạt).
  - Solo: chọn nhân vật stream PINK / BLUE.
  - Classroom: tên TEAM A (nhân vật hồng) / TEAM B (xanh), số câu mỗi đội 5 / 10 / 15,
    **STEAL** (đội kia giành quyền khi đội này sai), **ANSWER TIMER** OFF / 10 / 20 giây.
- **Một lượt:** (Classroom: "WHO GOES FIRST?" chọn ngẫu nhiên đội đi trước) → `GET READY! 3-2-1-GO!` →
  từng câu hỏi. Đúng: món ăn bay vào miệng, streamer ăn (FULL → BITE 1 → BITE 2 → vụn bánh),
  máy đọc lại âm / từ, người xem + tim tăng, bình luận khen. Sai: món rung + mờ, streamer "suy nghĩ",
  chọn lại (Solo, sai 2 lần có gợi ý) / đội kia giành quyền / hiện đáp án (Classroom).
- **Điểm:** đúng +10, đúng ngay lần đầu +5; chuỗi 3 câu ×2, 5 câu ×3 (COMBO). Hoàn hảo cả lượt +500 người xem.
- **Kết quả:** Solo 1–3 sao (≥ 90% / ≥ 60% đúng ngay lần đầu), NEXT LEVEL; Classroom đội thắng / hoà,
  không phản ứng tiêu cực cho đội thua. Từ đã học có tranh.
- **Điều khiển:** chạm / chuột; phím số 1–6 chọn món, phím cách nghe lại, `P` / `Esc` tạm dừng.
  Chuyển tab / app thì tự tạm dừng.

### Cấp độ (mỗi cấp một kiểu câu hỏi — plan §6)

| Cấp | Kiểu              | Đề                         | Lựa chọn                  |
| --- | ----------------- | -------------------------- | ------------------------- |
| 1   | HEAR & TAP        | nghe âm /d/                | 3 món mang chữ cái        |
| 2   | PICTURE SOUND     | tranh + đọc từ             | chữ cái đầu               |
| 3   | FIND THE WORD     | âm /d/                     | 3 món cắm thẻ tranh + từ  |
| 4   | BUILD THE WORD    | tranh + đọc từ, ô chữ      | các chữ của từ + 1 chữ nhiễu |
| 5   | MISSING LETTER    | d _ g + tranh              | nguyên âm                 |
| 6   | LISTEN & BUILD    | chỉ nghe                   | các chữ + 2 chữ nhiễu     |
| 7   | SPEED REVIEW      | trộn tất cả, 90 giây       | 4 lựa chọn                |

Cấp chỉ hiện ở gói có đủ nội dung (vd CVC WORDS không có âm mục tiêu nên không có cấp 1, 3).
Máy không đọc được (hoặc tắt VOICE) thì tự hiện ký hiệu âm / tranh / chữ thay cho giọng đọc.

## Nội dung (không hard-code trong scene)

- Gói chữ cái: `content/packs/letter-d.json`, `letter-o.json` (schema Zod ở `content/schema.ts`):
  âm, cách đọc gần đúng cho Web Speech (`phonemeSpeech`), chữ dễ nhầm, từ có tranh, từ CVC.
- Gói tổng hợp CVC WORDS / ALL LETTERS ghép tự động từ các gói chữ cái (`content/packs.ts`).
  **Thêm chữ cái mới** = thêm một JSON + import vào `content/packs.ts` (+ tranh nếu có).
- Sinh câu hỏi theo luật plan §8 ở `session/questions.ts`: không trùng lựa chọn, đáp án không đứng
  cùng chỗ quá 2 lần liên tiếp, mục tiêu trả lời chưa tốt được hỏi lại sau 2 câu.

## Cấu trúc module

```text
src/games/food-stream/
├── manifest.ts, FoodStreamGame.tsx
├── FoodStreamGame.module.scss  # theme kẹo hồng / tím: ghi đè token --color-* trên phần tử gốc
├── content/                    # gói nội dung (JSON + schema), cấp độ
├── session/                    # KHÔNG phụ thuộc React/Phaser
│   ├── store.ts                #   màn hiện tại, form Setup, phiên chơi, kết quả
│   ├── RoundController.ts      #   luật một lượt: trả lời, steal, gợi ý, điểm, ghi kết quả
│   ├── roundState.ts           #   state machine tường minh (plan §9)
│   ├── questions.ts            #   QuestionDeck (plan §8)
│   ├── text.ts                 #   chữ hiển thị, bình luận khán giả
│   ├── scoring.ts, teams.ts, storage.ts, types.ts
├── app/                        # React: Home / Setup / Results, Hướng dẫn (guide/), ảnh (assets.ts)
└── game/                       # Phaser
    ├── createGame.ts, SceneDirector.ts
    ├── config/                 #   nhạc (assets.ts), theme + thời lượng hiệu ứng (theme.ts),
    │                           #   manifest ảnh sprites.json / sprites.ts (sinh bởi tool) — React và Phaser cùng dùng
    ├── scenes/                 #   Boot → Preload → Studio (nền màn React) | Live (+ Pause)
    ├── objects/                #   StreamRoom, Streamer, FoodPiece, FoodChoice, PromptPanel
    ├── systems/                #   Effects, feeding (bay vào miệng / ăn), Voice (giọng đọc + duck nhạc)
    └── ui/                     #   Hud, ProgressBar, TeamBoard, CommentFeed, CandyButton, layout, text
```

LiveScene chỉ **diễn**: gọi `RoundController.answer()` rồi chạy hiệu ứng theo kết quả, đẩy state machine
`feeding → eating → reward → next-question` khi hiệu ứng xong — không thể chạm 2 lần / cộng điểm 2 lần.

## Asset

- Art board gốc ở `_source/food-stream/art/` (AI generated, có nhãn / nền). `pnpm assets:food-stream`
  cắt từ board **nền trong suốt** (`asset-board-initial.png`): 2 nhân vật × 3 tư thế, 8 món ăn
  (+ frame cắn 1 / cắn 2 tạo bằng code), đĩa, đạo cụ phòng, icon UI; tranh từ vựng lấy từ board 01–03
  (xoá nền thẻ bằng flood fill). Chữ in sẵn trên món ăn được che bằng huy hiệu chữ vẽ live
  (anchor `badge` trong `game/config/sprites.json`).
- Còn thiếu: tranh "ostrich" (gói O vẫn chơi được, từ này không dùng ở câu hỏi cần tranh), SFX riêng
  (đang dùng thư viện SFX chung), file ghi âm giọng đọc (đang dùng Web Speech — thay trong `game/systems/Voice.ts`).
- Nhạc: `_source/food-stream/audio/bgm/*.wav` → `pnpm assets:audio`.

### Chỉnh game thường gặp (đường dẫn trong `src/games/food-stream/`)

| Muốn…                          | Sửa                                            |
| ------------------------------ | ---------------------------------------------- |
| Từ / âm / chữ nhiễu            | `content/packs/*.json`                         |
| Cấp độ, số câu, số lựa chọn    | `content/levels.ts`                            |
| Điểm, combo, người xem, sao    | `session/scoring.ts`                           |
| Bình luận khán giả, chữ hiển thị | `session/text.ts`                            |
| Tốc độ hiệu ứng, màu           | `game/config/theme.ts`                         |
| Vị trí cắt sprite / huy hiệu   | `tools/food_stream/build_sprites.py`           |
