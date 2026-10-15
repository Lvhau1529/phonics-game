# 🦁 Little English Explorers

Bé đi qua 3 "thế giới" con vật, mỗi thế giới một **mẫu câu**: nhìn tranh, nghe câu hỏi, chọn đáp án, rồi **nói cả
câu tiếng Anh**. Code: `src/games/english-explorers/` (chỉ có màn React, không dùng Phaser) — khung chung xem
[README gốc](../../README.md). Bản gốc (bản "Design Preview" HTML, 1 câu / thế giới):
`_source/english-explorers/little-english-explorers.original.html`.

| Thế giới | Tiêu đề            | Mẫu câu                         | Ví dụ                           |
| -------- | ------------------ | ------------------------------- | ------------------------------- |
| 1        | WHERE DO THEY LIVE? | live / lives + place           | The fish lives in the ocean.    |
| 2        | WHAT AM I LIKE?    | am / is / are + describing word | The elephant is big.            |
| 3        | WHAT DO I HAVE?    | has / have + body parts         | The rabbit has two long ears.   |

Mỗi thế giới 10 câu (`content/worlds.json`, test ở `content/worlds.test.ts`); **ALL WORLDS** = 10 câu rải đều 3 thế giới.

## Cách chơi

- **Home:** PLAY, SOUND · MUSIC · VOICE, GUIDE.
- **Chọn thế giới:** tên bé (tuỳ chọn, trống = EXPLORER), SAY IT STEP ON / OFF, chạm thẻ thế giới để vào chơi
  (thẻ hiện số sao đã đạt).
- **Một câu:** LOOK (tranh) → LISTEN (máy đọc câu hỏi + 3 đáp án; nút loa xanh) → CHOOSE (phím 1–3 / A–C; sai thì
  đáp án mờ đi, "Try again!", chọn lại) → SPEAK (câu mẫu, HEAR IT, micro SAY IT so câu nghe được với câu mẫu;
  không có micro: I SAID IT!).
- **Điểm:** đúng ngay 10 / sai 1 lần 5 / sai 2 lần 2; nói đủ câu (≥ 60% từ, micro) +5. Sao theo câu đúng ngay
  lần đầu (≥ 90% / ≥ 60%). Kim cương 1 / câu đúng ngay (tối đa 10). Sao / điểm cao nhất lưu theo thế giới
  (`phonics-arcade:english-explorers`). Học sinh đã đăng nhập: gửi kết quả lên API (`gameId: english-explorers`).

## Lỗi của bản gốc đã sửa

| Lỗi                                                                                 | Sửa                                                         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Gợi ý tiếng Việt ("Cá sống ở đại dương.") hiện **trước khi** bé chọn → lộ đáp án      | Bỏ khỏi giao diện của bé; nghĩa tiếng Việt nằm ở Hướng dẫn |
| Chọn rồi không đổi được, không biết đúng / sai cho tới khi bấm I'VE SPOKEN            | Phản hồi ngay; sai thì chọn lại                            |
| Vào lại cùng thế giới để cộng điểm mãi (+5 mỗi lần, kể cả chọn sai)                  | Điểm tính theo ván; kỷ lục / sao lưu riêng từng thế giới  |
| Esc ở màn chào nhảy vào chọn thế giới, bỏ qua tên (tên trống)                        | Không còn phím tắt đó; tên trống hiện EXPLORER             |
| Thẻ thế giới `role="button"` chứa `<button>` → Enter gọi `load()` hai lần            | Mỗi thẻ là một `<button>`                                  |
| `alert()` tiếng Việt khi không có giọng đọc / micro                                 | Nút micro ẩn khi không hỗ trợ; thông báo tiếng Anh trong game |
| Câu hỏi không tự đọc; nút "NEXT WORLD →" thực ra quay về màn chọn thế giới           | Máy đọc câu hỏi + đáp án; NEXT WORLD sang thế giới kế tiếp |
| Mỗi thế giới chỉ 1 câu mẫu                                                           | 10 câu / thế giới + ALL WORLDS                            |

## Asset

`pnpm assets:english-explorers` (`tools/english_explorers/build_assets.py`): 9 tranh (lion, rabbit, elephant, fish,
elephant_scene, rabbit_scene, forest, ocean, desert) → `public/assets/english-explorers/pictures/*.webp` (cắt bớt mép
lẹm của concept sheet), ảnh bìa `cover.png` 480×270. Câu không có tranh riêng dùng emoji.
