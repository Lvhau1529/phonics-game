# 🧩 Odd One Out — Speaking Adventure

Bé nhìn 4 hình, **tìm hình khác loại**, rồi **nói lý do bằng tiếng Anh** ("I think the cat is different because the
others are colors."). 15 chủ đề × 6 câu (3 EASY + 3 CHALLENGE) = 90 câu đố + MIXED.
Code: `src/games/odd-one-out/` (chỉ có màn React, không dùng Phaser) — khung chung xem [README gốc](../../README.md).
Bản gốc (HTML một file, tách ảnh ra `_source/odd-one-out/art/`): `_source/odd-one-out/odd-one-out.original.html`.

## Cách chơi

- **Home:** PLAY, LEADERBOARD, SOUND · MUSIC · VOICE, GUIDE (tiếng Việt cho người lớn).
- **Setup:** tên bé (bắt buộc — dùng cho bảng xếp hạng), chủ đề (15 + MIXED), cấp EASY / CHALLENGE / MIX,
  số câu khi MIXED (6 / 10 / 15), SPEAKING STEP ON / OFF.
- **Một câu:** (1) LOOK & CHOOSE — máy đọc "Which one is different?", chạm hình (phím 1–4 / A–D);
  (2) SAY WHY — khung câu + micro (Web Speech `SpeechRecognition`, nếu trình duyệt có), vẫn đổi được hình;
  (3) LEARN & SHINE — hình đúng / sai, nhóm của 3 hình còn lại, câu mẫu (máy đọc), NEXT.
  Đồng hồ chạy riêng từng câu.
- **Điểm:** đúng +10; nói +5 (có micro: nghe được ≥ 2 từ; micro không dùng được: tin bé). Sao: ≥ 90% / ≥ 60% đúng.
  Kim cương 1 / câu đúng (tối đa 10). Học sinh đã đăng nhập: gửi kết quả lên API (`gameId: odd-one-out`).
- **Bảng xếp hạng** (localStorage `phonics-arcade:odd-one-out`, trên máy này): mỗi tên giữ lượt tốt nhất; xếp theo
  điểm ↓, câu đúng ↓, tổng thời gian ↑; lọc theo chủ đề / cấp / số câu; CLEAR có hỏi lại.

## Lỗi của bản gốc đã sửa

Tìm thấy khi đọc mã và chơi thử bản HTML gốc:

| Lỗi                                                                                                  | Sửa                                                            |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Bảng xếp hạng trống ("No scores yet!") ngay sau ván 45 câu (MIXED + EASY): bộ lọc số câu chỉ có 3/6/9/12/15/30/90 | Lựa chọn số câu lấy từ dữ liệu (`boardCounts`)               |
| "Level" ở Teacher zone lọc chồng lên cấp bé chọn → "Oops! No questions match"                         | Chỉ còn một chỗ chọn cấp                                       |
| +5 điểm nói mỗi lần bấm I'VE SPOKEN, kể cả khi không nói                                             | Có micro: phải nghe được bé nói                                |
| Chạm hình là khoá lựa chọn                                                                            | Bước nói vẫn đổi được hình                                     |
| Câu hỏi / tên hình không được đọc to (bé 5 tuổi chưa đọc được)                                        | Máy đọc câu hỏi, tên hình, câu mẫu; nút LISTEN                |
| `confirm()` / `alert()` của trình duyệt                                                               | Hộp thoại của game                                             |
| Thứ tự 4 hình cố định                                                                                 | Xáo vị trí mỗi ván; MIXED rải đều chủ đề, tránh lặp hình khác loại |
| Gợi ý tiếng Việt trong giao diện của bé                                                               | Chuyển vào phần Hướng dẫn (có bảng đáp án)                    |

Nội dung (90 câu, `content/puzzles.json`, test ở `content/puzzles.test.ts`):

| Câu             | Lỗi                                                         | Sửa                                              |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| colors-e3       | 🩷 (Unicode 15) — máy cũ hiện ô vuông                        | chấm màu hồng vẽ bằng CSS                        |
| shapes-c1/c2/c3 | "rectangle" là ký tự ▭ (không phải emoji); c2 trùng ý c1; "oval" là 🥚 | hình chữ nhật / bầu dục vẽ bằng CSS; c2 đổi thành "hình 3 cạnh" |
| toys-c2         | "puppet" 🎎 là búp bê Nhật                                   | robot 🤖                                          |
| garden-c2       | "watering can" 🚿 (vòi sen), "pillow" 🛏️ (giường), 🪏 Unicode 15 | gloves / bucket / **bed** / flower pot         |
| transport-c2    | "submarine" 🚢 (tàu thuỷ)                                    | ship 🚢                                           |
| clothes-c3      | "cap" 🎓 (mũ tốt nghiệp)                                     | hat 👒 / helmet / cap 🧢 / **socks**              |
| family-c3       | "grandparents" là 2 emoji, trùng nghĩa grandmother / grandfather | baby / girl / boy / **grandfather**         |

## Asset

`pnpm assets:odd-one-out` (`tools/odd_one_out/build_assets.py`): hai bé thám hiểm → `public/assets/odd-one-out/art/*.webp`,
ảnh bìa `cover.png` 480×270. Câu đố dùng emoji / hình CSS.
