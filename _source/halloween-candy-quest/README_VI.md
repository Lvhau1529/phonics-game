# HƯỚNG DẪN SỬ DỤNG RESOURCE PACK — HALLOWEEN CANDY QUEST v1.0

Bộ tài nguyên **pixel art 16-bit** dành cho game học tiếng Anh cho trẻ 5–6 tuổi, gồm 2 chế độ **Solo** và **2 đội chơi lần lượt**, hành trình xin kẹo Halloween.

## Trong tệp ZIP có gì?

- **3 khu vực**: Pumpkin Garden, Candy Village, Magic Castle. Mỗi khu có 2 phiên bản nền, cả 320×180 và 1280×720 (16:9, phóng to nguyên pixel).
- **6 nhân vật**: Pumpkin Kid, Little Ghost, Mini Witch, Vampire Kid, Black Cat, Bat Explorer; mỗi nhân vật có ảnh đại diện, **5 trạng thái × 2 frame** và spritesheet riêng.
- **NPC và đồ tương tác**: chủ nhà, ma dễ thương, nhà ở, cửa, bí ngô, rương kẹo, giỏ, vật thể trong môi trường.
- **24 từ vựng** với 24 PNG icon riêng và 24 thẻ hình 256×256 có nhãn tiếng Anh.
- **UI và VFX**: khung câu hỏi, panel, nút, hiệu ứng nhận kẹo, nền parallax mẫu, tile địa hình.
- **Âm thanh**: 12 hiệu ứng 8-bit nguyên bản và 1 nhạc nền Halloween vui nhộn dài 16 giây, có thể lặp.
- **00_PREVIEW.png**: ảnh xem trước; `asset_manifest.json/.csv`: bảng danh mục và kích thước asset; `README.md` giải thích kỹ thuật bằng tiếng Anh.

## Thứ tự dùng cho game

1. Dùng background 1280×720 cho desktop. Trên điện thoại, chọn camera hoặc bố cục riêng, không kéo giãn ép tỷ lệ.
2. Đặt nhà, cửa, nhân vật và đồ vật từ những PNG **nền trong suốt** bên trên background.
3. Cho nhân vật tự đi đến nhà, trẻ chạm cửa để nhận câu hỏi, chọn hình đúng và xem kẹo bay vào giỏ.
4. Animation nhân vật dùng từng frame hoặc sheet 2 cột × 5 hàng, **mỗi frame 48×48**, theo thứ tự idle, walk, knock, celebrate, try_again.
5. Đưa thẻ trong `vocabulary/cards/` vào câu hỏi; khi cần ảnh không có chữ thì dùng `vocabulary/icons/`.
6. Khi trẻ trả lời đúng, phát hiệu ứng `sfx_correct.wav`, sau đó `sfx_candy_collect.wav`. Nhạc nền để ở mức âm lượng nhỏ.

## Lưu ý chất lượng

Đây là **resource pack v1 phục vụ dựng prototype**, không phải bộ animation production hoàn thiện. Các sprite được tách từ bảng hình nguồn nên có thể còn vài pixel nền hoặc cần thêm frame để tạo chuyển động mượt. Nền là cảnh vẽ sẵn, chưa phải hệ tile map/collision map hoàn chỉnh. Một số nút UI có chữ tiếng Anh cố định. Âm thanh phát âm từng từ chưa có vì từ vựng tùy biến, về sau cần TTS, giáo viên đọc hoặc tải file ghi âm. Những hạn chế này được ghi rõ để người lập trình không hiểu nhầm bộ hình là đầy đủ logic trò chơi.

**Không có code trong gói**; có thể dùng hình và âm thanh độc lập trong Phaser, PixiJS, Unity, Godot hoặc web app.
