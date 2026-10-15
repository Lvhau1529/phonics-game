/**
 * Danh sách game hiện ở màn chọn game (theo thứ tự hiển thị).
 * Thêm game mới: tạo src/games/<id>/ (manifest.ts + root component) rồi thêm manifest vào đây
 * (đặt `price` trong manifest nếu muốn bé dùng kim cương mở khoá).
 * UPCOMING: thẻ COMING SOON — game ra mắt rồi thì xoá khỏi đây.
 */
import { breadCatcherManifest } from '@/games/bread-catcher/manifest';
import { foodStreamManifest } from '@/games/food-stream/manifest';
import { phonicsOceanManifest } from '@/games/phonics-ocean/manifest';
import { oddOneOutManifest } from '@/games/odd-one-out/manifest';
import { englishExplorersManifest } from '@/games/english-explorers/manifest';
import { ACCOUNT_SEGMENT, HOMEWORK_SEGMENT } from '@/core/navigation/platformStore';
import type { GameManifest, UpcomingGame } from '@/core/types/game';

export const GAMES: readonly GameManifest[] = [
  breadCatcherManifest,
  foodStreamManifest,
  phonicsOceanManifest,
  oddOneOutManifest,
  englishExplorersManifest,
];

export const UPCOMING: readonly UpcomingGame[] = [
  { id: 'next-game', title: 'NEW GAME', tagline: 'A brand-new phonics game is on the way!' },
];

// `#/account` là màn tài khoản, `#/homework` là màn bài tập (platformStore): không game nào được lấy id này
const RESERVED = [ACCOUNT_SEGMENT, HOMEWORK_SEGMENT];
if (import.meta.env.DEV && GAMES.some((game) => RESERVED.includes(game.id))) {
  throw new Error(`Game ids ${RESERVED.join(', ')} are reserved for platform screens`);
}
