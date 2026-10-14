/**
 * Hợp đồng giữa platform (màn chọn game, dịch vụ dùng chung) và từng game.
 *
 * Mỗi game là một module độc lập trong `src/games/<id>/`:
 *   - `manifest.ts`  — thông tin hiện ở màn chọn game + hàm `load` (import động → tách chunk riêng)
 *   - root component — tự quản lý màn React, game Phaser, store, lưu trữ của riêng nó
 * Thêm game mới = tạo thư mục mới + thêm manifest vào src/games/index.ts.
 */
import type { ComponentType } from 'react';

export interface GameManifest {
  /** Dùng cho URL (#/<id>) và key lưu trữ — không đổi sau khi phát hành */
  id: string;
  title: string;
  /** Một dòng mô tả ngắn (tiếng Anh) trên thẻ game */
  tagline: string;
  /** Ảnh bìa thẻ game (tương đối với trang) */
  cover: string;
  /** Màu nhấn của thẻ game */
  accent: string;
  /** Kỹ năng luyện tập, hiện dạng nhãn nhỏ trên thẻ */
  skills: readonly string[];
  /** Số kim cương để mở khoá (platform/gems/wallet.ts); bỏ trống = miễn phí, luôn chơi được */
  price?: number;
  load: () => Promise<{ default: ComponentType }>;
}

/** Game sắp ra mắt: thẻ COMING SOON ở màn chọn game (chưa có code, không mở được) */
export interface UpcomingGame {
  id: string;
  title: string;
  tagline: string;
}
