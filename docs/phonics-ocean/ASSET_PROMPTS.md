# Phonics Ocean — Prompt gen tài nguyên HD

Tài nguyên hiện tại cắt từ các board concept của pack (ảnh nhỏ: nền ~480px, cá ~40–60px) nên nền phải phóng to
×4 và trông thô. File này là bộ prompt để đưa cho AI khác (ChatGPT / GPT-image, Midjourney, Leonardo, Suno…) gen
**bộ tài nguyên đầy đủ, đồng bộ phong cách**. Pipeline đã sẵn sàng nhận file mới — không phải sửa code.

## Cách đưa tài nguyên vào game

1. Lưu file đúng **tên + thư mục** ghi ở từng mục:
   - nền → `_source/phonics-ocean/hd/backgrounds/<biome>.png`
   - sprite sheet → `_source/phonics-ocean/hd/sheets/<tên>.png` (nền magenta, lưới đúng số hàng × cột)
   - (tuỳ chọn) một sprite lẻ → `_source/phonics-ocean/hd/sprites/<key>.png` (nền trong suốt, key trong
     `src/games/phonics-ocean/game/config/sprites.json`)
   - nhạc → `_source/phonics-ocean/audio/bgm/<tên>.wav`, SFX → `_source/phonics-ocean/audio/sfx/<tên>.wav`
2. Chạy `pnpm assets:phonics-ocean` (ảnh) và `pnpm assets:audio` (âm thanh), mở game kiểm tra, commit cả
   `_source/` lẫn `public/assets/phonics-ocean/`.
3. File nào chưa có thì game vẫn dùng ảnh cũ từ pack. Sheet có mặt thì thay **cả nhóm khung** (vd sheet cá nóc 3
   khung thay 5 khung cũ).

Mẹo khi gen: gen từng sheet một, dán **Style guide** vào đầu mỗi prompt; nếu AI không xuất được đúng lưới thì gen từng
con rồi tự ghép vào lưới (ô bằng nhau, cách nhau ≥ 40px nền magenta), hoặc xuất PNG trong suốt từng con vào
`hd/sprites/`.

---

## 0. Style guide (dán vào đầu MỌI prompt ảnh)

```text
STYLE: cute 16-bit-inspired pixel art for a kindergarten phonics game "Phonics Ocean" (Feeding Frenzy-like
underwater arcade). Bright saturated tropical colors, clean 1–2 px dark navy outline (#08263F) around every
character, soft top-left lighting, simple cel shading, big friendly eyes, no scary gore. Consistent palette and
pixel density across all assets. Side view. Characters face RIGHT. NO text, NO letters, NO numbers, NO UI, NO
watermark, NO signature, NO drop shadow on the background.
```

Với sprite sheet thêm đoạn sau:

```text
SHEET FORMAT: solid flat magenta background #FF00FF everywhere (no gradient, no vignette, no texture, no
shadows on the background). Characters arranged in an exact grid of equal cells, one character per cell,
centered, same scale in every cell, at least 40 px of empty magenta between characters, nothing touching the
image edges or crossing into another cell. Do not use magenta or pink-magenta colors inside the characters.
```

---

## 1. Nền 6 biome (16:9, ≥ 1920×1080, PNG)

Yêu cầu chung (dán sau Style guide):

```text
BACKGROUND: 16:9 underwater game background, 2560x1440 (or 1920x1080). Wide landscape composition.
Keep the CENTER and UPPER-MIDDLE area as calm open water with little detail (fish and word labels swim
there and must stay readable). Put the detailed scenery along the bottom 30% and the left/right edges.
Top 12% slightly lighter water with soft light rays. Crisp pixel-art detail, high resolution, NOT blurry,
no fish, no creatures, no characters, no bubbles in the middle, no text.
```

| File (`hd/backgrounds/`) | Prompt riêng                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coral_reef.png`         | `Shallow sunny coral reef: turquoise water, golden sand floor, colorful branching corals (pink, orange, purple, yellow), sea anemones, a few rocks on the sides.`          |
| `shipwreck.png`          | `Sunken wooden pirate shipwreck lying on the sand on the left side, broken mast, scattered barrels and a small treasure chest, blue-green water, seaweed and corals.`      |
| `deep_ocean.png`         | `Deep blue ocean cave: dark navy rocky arches on both sides, glowing bioluminescent plants and corals, soft beams from above, mysterious but friendly.`                    |
| `ice_sea.png`            | `Arctic ice sea: icebergs and ice cliffs on the sides, pale cyan water, frosty icicles at the top, snowy ice floor with small ice crystals.`                              |
| `volcano.png`            | `Underwater volcano zone: dark volcanic rocks, a friendly smoking volcano in the background, glowing orange lava cracks on the floor, warm red-orange water tint at bottom.` |
| `treasure_zone.png`      | `Ancient sunken temple: stone columns and ruins, piles of gold coins, open treasure chests with gems, green-blue water, light rays on the gold.`                          |

---

## 2. Sprite sheet nhân vật (nền magenta `#FF00FF`)

Kích thước gợi ý: mỗi ô ~256×256 px (cá lớn 384×256). Thứ tự ô: **trái → phải, trên → dưới**.

### 2.1 Cá của bé — 3 cỡ (theo bản sửa mới nhất: cá săn mồi đỏ, KHÔNG phải cá hề)

```text
CHARACTER: the player fish — a chubby, cute but predatory red-orange reef fish (like a red grouper / red snapper
cartoon), big round eye, small sharp teeth visible only when the mouth is open, spiky dorsal fin, cream belly,
darker red spots. Same character in every frame. NOT a clownfish (no white stripes).
```

| File (`hd/sheets/`) | Lưới  | Nội dung từng ô                                                                                                                                         |
| ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `player_tier1.png`  | 1 × 6 | `Baby size (small, young, rounder). 6-frame swim cycle: tail and fins move left-right smoothly, mouth closed, body steady.`                              |
| `player_tier2.png`  | 1 × 6 | `Medium size (teen, a bit longer and stronger). 6-frame swim cycle, mouth closed.`                                                                      |
| `player_tier3.png`  | 1 × 5 | `Big adult size (powerful). Frames 1–2: swim, mouth closed. Frame 3: mouth WIDE open biting forward (teeth showing). Frame 4: mouth open. Frame 5: mouth half open.` |

### 2.2 Cá mang chữ (word-fish) — 25 màu

```text
25 different small friendly reef fish, all the SAME size and SAME body shape family (round body, big eye,
calm closed-mouth smile), each a different bright color pattern: red, yellow, blue, green, pink, teal stripes,
lime, orange, rainbow, purple, coral, sky blue, gold, mint, magenta-free violet, etc. The middle of the body
must be a simple plain area (a white word label will be drawn on top in-game). Facing right.
```

| File            | Lưới  |
| --------------- | ----- |
| `word_fish.png` | 5 × 5 |

### 2.3 Đàn cá Feeding Frenzy (ăn được theo cỡ)

| File (`hd/sheets/`) | Lưới  | Prompt                                                                                                                                                        |
| ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `school_tiny.png`   | 4 × 6 | `Tiny schooling fish (sardine / tetra size). Row 1: silver-gray, row 2: pink, row 3: yellow, row 4: green. Each row is a 6-frame swim cycle of the same fish.` |
| `school_medium.png` | 3 × 3 | `Medium reef fish. Row 1: black-and-white striped sergeant fish, row 2: yellow butterflyfish, row 3: red snapper. Each row: 3-frame swim cycle.`              |
| `school_big.png`    | 1 × 3 | `Large brown spotted grouper, calm and chunky, 3-frame swim cycle. Bigger than the medium fish.`                                                              |

### 2.4 Cá săn mồi (nguy hiểm nhưng không đáng sợ với trẻ)

```text
PREDATOR: cartoon "big bad" fish for kids — grumpy eyebrows, toothy grin, but cute, not realistic or gory.
Each sheet is a 3-frame swim cycle of ONE predator, mouth slightly open.
```

| File (`hd/sheets/`)      | Lưới  | Nhân vật                                       |
| ------------------------ | ----- | ---------------------------------------------- |
| `predator_shark.png`     | 1 × 3 | `Blue-gray cartoon shark, white belly.`        |
| `predator_puffer.png`    | 1 × 3 | `Orange spiky pufferfish, puffed up, grumpy.`  |
| `predator_eel.png`       | 1 × 3 | `Green moray eel, long wavy body.`             |
| `predator_angler.png`    | 1 × 3 | `Purple anglerfish with a glowing yellow lure.` |
| `predator_barracuda.png` | 1 × 3 | `Silver-blue barracuda, long and fast.`        |

### 2.5 Vật phẩm

| File (`hd/sheets/`) | Lưới  | Prompt                                                                                                                                                         |
| ------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items.png`         | 1 × 6 | `Game power-up icons, glossy, no glow halo: 1 gold star, 2 yellow lightning bolt, 3 blue shiny bubble shield, 4 golden stopwatch, 5 red heart, 6 wooden treasure chest.` |

---

## 3. Âm thanh

### 3.1 Nhạc nền (Suno / Udio) → `_source/phonics-ocean/audio/bgm/`

Hiện game mượn nhạc của Food Stream. Có nhạc riêng thì đặt đúng tên file rồi đổi đường dẫn trong
`src/games/phonics-ocean/game/config/assets.ts` (`musicUrls` → `assets/phonics-ocean/music/`).

| File                        | Prompt                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bgm_menu.wav`              | `Cheerful underwater chiptune for a kids game menu, bubbly marimba and 8-bit synth, 100 BPM, light and calm, seamless loop, 60–90 s, instrumental.` |
| `bgm_gameplay.wav`          | `Upbeat playful underwater chiptune, steady groove, bouncy bass, sparkling arps, 118 BPM, not too busy (voice-over plays on top), seamless loop, 90 s, instrumental.` |
| `bgm_reward.wav`            | `Happy celebration chiptune, bright and short, seamless loop, 30–45 s, instrumental.`                                                       |
| `jingle_level_complete.wav` | `Short triumphant 8-bit victory jingle, 3–4 seconds, ends on a happy chord.`                                                                 |

### 3.2 SFX (thay bản tạm của pack, giữ đúng tên) → `_source/phonics-ocean/audio/sfx/`

`correct.wav` (tiếng "gulp" vui + chuông nhỏ), `wrong_soft.wav` (tiếng "boop" nhẹ, không gắt), `level_up.wav`
(arpeggio đi lên), `collect.wav` (bong bóng "pop" ngắn), `danger.wav` (2 nốt cảnh báo nhẹ). Tất cả mono, 44.1 kHz,
< 1 giây, đầu file không có khoảng lặng.

### 3.3 Giọng đọc (tuỳ chọn — game đang dùng Web Speech của trình duyệt)

Thu âm / TTS giọng nữ Mỹ, rõ, chậm vừa, mỗi clip một file WAV, cắt sát. Âm vị đọc **sạch** (/m/ là "mmm", /t/
không thành "tuh"). Danh sách theo `content/levels.json` (đặt tên `phoneme_<x>.wav`, `rime_<x>.wav`,
`word_<x>.wav`, `prompt_i_can_see.wav`):

- Âm đầu (cấp 1): a e i o u m s f n t p b c d h
- Vần (cấp 4): at an ap ig in it og ot ug un ut um ub
- Cụm phụ âm / digraph (cấp 5–6): bl cl fl gl pl sl fr cr dr gr tr st nd mp nt sk · sh ch th ph wh ck ng
- Từ: toàn bộ `words` của 8 cấp trong `src/games/phonics-ocean/content/levels.json` (≈ 140 từ) + câu
  "I can see a…" / "I can see an…"

Khi có clip, cần thêm code phát file trong `game/systems/Voice.ts` (hiện chỉ đọc bằng Web Speech).
