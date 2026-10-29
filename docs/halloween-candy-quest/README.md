# 🎃 Halloween Candy Quest

Phiêu lưu xin kẹo ở làng **Candy Moon** cho trẻ 5–6 tuổi: nhân vật tự đi tới từng ngôi nhà, bé **chạm cửa** để gõ,
chủ nhà đưa ra một thử thách từ vựng tiếng Anh, đúng thì kẹo bay vào giỏ. Qua 3 khu vực rồi về lễ hội tổng kết.
Code: `src/games/halloween-candy-quest/` (chỉ màn React — sân khấu pixel-art 320×180 vẽ bằng DOM, không dùng Phaser).
Tài liệu thiết kế gốc: `_source/halloween-candy-quest/GAMEPLAY_SPEC_V1.md` (spec đã chốt) và `README.md` của resource pack.

## Luồng màn

`home → mode (SOLO / TEAM) → setup (Teacher Setup) ⇄ vocab (WORDS) → characters → [team] picker → play → results`

| Màn | Nội dung |
| --- | --- |
| Home | PLAY, TEACHER SETUP, SOUND · MUSIC · VOICE, GUIDE |
| Mode | SOLO ADVENTURE (1 bé) / TEAM CANDY BATTLE (2 đội, 1 màn hình) |
| Setup | MODE, TURNS (solo 6/8/10/12, team 8/12/16/20), DIFFICULTY, CHALLENGES, WHO READS THE WORDS, TIMER, SHOW SCORE (team), WORDS, READY CHECK |
| Words | Bật / tắt 24 từ thư viện, thêm từ riêng (chữ + nghĩa + ảnh upload) |
| Characters | Solo: 1 trong 6; Team: tên đội + 2 nhân vật khác nhau |
| Picker | Bí ngô quay chọn đội đi trước (một lần trước trận) |
| Play | HUD (giỏ kẹo / 2 đội, lượt, khu vực, nút giáo viên) + sân khấu + lớp phủ thử thách |
| Results | Solo: tổng kẹo + Happy Halloween; Team: 2 giỏ, đội nhiều kẹo hơn / It's a tie; từ đã chơi; PLAY AGAIN / NEW WORD SET / HOME |

## Một lượt (`session/types.ts > Phase`)

```text
zone ─▶ walk ─▶ knock ─(chạm cửa)─▶ knocking ─▶ greeting ─▶ question ─▶ feedback ─▶ reward
  reward ─▶ [solo] lượt sau | [team] turn_end ─(NEXT TURN của giáo viên)─▶ lượt sau
  feedback: đúng -> reward (+2 / +1) · sai lần 1 -> question (lần 2) · sai lần 2 / hết giờ -> hiện đáp án -> reward (0)
```

- Mọi action của ván nhận `turnId` + kiểm tra pha → chạm hai lần / hẹn giờ chạy muộn không cộng kẹo hay chuyển lượt
  hai lần. Kẹo chỉ cộng ở bước `feedback → reward`.
- Khu vực mở theo **số lượt đã chơi** (8 lượt: 3/3/2; 12: 4/4/4), không theo số câu đúng.
- Team: A–B–A–B từ đội đi trước; lượt của A và lượt kế của B cùng dạng + cùng số lựa chọn, khác từ đích.
- Skip Question (🔄): thay câu ngay trong lượt (cùng dạng nếu được), giữ đội / lượt / cơ hội nhận đủ kẹo.
- Pause (⏸): dừng hẹn giờ pha, đồng hồ, khoá đáp án.

## Bốn dạng thử thách (`app/components/QuestionPanel.tsx`)

| Dạng | Cách chơi | Điều kiện |
| --- | --- | --- |
| LISTEN & CHOOSE | Nghe "Find the …!", chạm 1 trong 2–3 thẻ hình | ≥ 2 từ |
| FIND THE OBJECT | Chạm đúng vật (sprite riêng, vùng chạm lớn) trong cảnh khu vực | ≥ 2 từ thư viện (từ tự thêm không có sprite cảnh) |
| LOOK & LISTEN | 1 hình lớn, bấm loa ★ ● ▲ để nghe, PICK loa đúng | Có giọng máy |
| MATCH THE PAIRS | Chạm hình rồi chạm loa, đủ 2 cặp thì kiểm tra cả thử thách | Có giọng máy |

Trọng số chọn dạng theo khu vực: `session/rules.ts > ZONE_WEIGHTS` (khu 1 chỉ Listen & Choose / Find the Object,
khu 3 có Match the Pairs). Dạng thiếu tài nguyên tự bỏ và READY CHECK báo trước.

## Giọng đọc

Pack v1 **chưa có file ghi âm từng từ** → dùng Web Speech (`session/voice.ts`). `WHO READS THE WORDS`: GAME / BOTH
(máy đọc) hoặc TEACHER (máy im, khung câu hỏi hiện "TEACHER, SAY: …"). Không có giọng máy thì Look & Listen /
Match the Pairs tự tắt (không tạo nút loa giả).

## Lưu trữ

`phonics-arcade:halloween-candy-quest` (zod): Teacher Setup, bộ từ (id thư viện đang bật + tối đa 30 từ riêng, ảnh
upload thu nhỏ ≤ 160px dạng data URL), tên đội / nhân vật lần trước. Học sinh đã đăng nhập, ván Solo: gửi kết quả
lên API (`gameId: halloween-candy-quest`, `levelId` = độ khó, `correct` = số câu đúng ngay lần đầu, `score` = số kẹo)
— cần `GameId` này trong `@phonics/contracts`; chưa có thì `postSoloResult` bỏ qua, game vẫn chạy.

## Asset

`pnpm assets:halloween-candy-quest` (`tools/halloween_candy_quest/build_assets.py`) đọc `_source/halloween-candy-quest/`
(resource pack v1.0, bỏ `source_atlases/` vì chỉ là bảng tham khảo) → `public/assets/halloween-candy-quest/`:

- `bg/` nền 320×180 của 3 khu vực (CSS phóng nearest-neighbor), `buildings/`, `doors/`, `npcs/`, `props/`, `candy/`,
  `baskets/`, `words/` (24 icon), `fx/`
- `chars/<id>.png` spritesheet 2 frame × 5 tư thế (idle, walk, knock, celebrate, try_again) ghép từ frame rời +
  `chars/<id>_portrait.png`
- `sfx/*.ogg|mp3`: 12 SFX + nhạc nền (`app/audio.ts`, nhạc nhỏ để không át giọng đọc)
- `cover.png` 480×270

Sprite được cắt từ concept sheet nên còn sót nhãn chữ / vệt viền: tool xoá các mảng điểm ảnh vụn (`clean()`).

## Giới hạn hiện tại (theo spec §14.2, §17)

- Nhân vật chỉ có 2 frame / tư thế, đi ngang; nhà / cửa / vị trí đứng là toạ độ đặt tay (`content/world.ts`),
  không có collision / waypoint.
- Chưa có upload file ghi âm cho từ riêng (dùng giọng máy đọc chữ), chưa có nhiều bộ từ đặt tên / Export–Import,
  chưa có khôi phục ván dở khi tải lại trang.
