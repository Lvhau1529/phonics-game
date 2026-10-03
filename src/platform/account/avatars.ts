/**
 * Ảnh đại diện preset (contracts AVATARS): key -> ảnh có sẵn trong app.
 *   tiger / elephant / lion / monkey / dog / cat / panda / bunny — Animal Avatar sheet
 *     (`public/assets/shared/avatars/`, sinh bởi tools/build_avatars.py)
 *   pip / girl / boy — avatar cũ (ong Bee pack, streamer Food Stream): không còn trong picker,
 *     vẫn hiển thị cho tài khoản đã chọn
 * Đường dẫn ghi thẳng (không import module của game) để chunk tài khoản không kéo theo code game.
 */
import { AVATARS, DEFAULT_AVATAR, type AvatarKey } from '@phonics/contracts';
import { MASCOT } from '@/platform/ui/icons';

const ANIMALS = 'assets/shared/avatars';
const FOOD = 'assets/food-stream/characters';

/**
 * Đủ mọi AvatarKey của contracts; thêm index signature để key của contracts mới hơn bản đang cài
 * (elephant / monkey / dog / cat từ 1.1.0) không làm hỏng typecheck trước khi `pnpm up @phonics/contracts`.
 */
export const AVATAR_IMAGES: Record<AvatarKey, string> & Record<string, string> = {
  tiger: `${ANIMALS}/tiger.webp`,
  elephant: `${ANIMALS}/elephant.webp`,
  lion: `${ANIMALS}/lion.webp`,
  monkey: `${ANIMALS}/monkey.webp`,
  dog: `${ANIMALS}/dog.webp`,
  cat: `${ANIMALS}/cat.webp`,
  panda: `${ANIMALS}/panda.webp`,
  bunny: `${ANIMALS}/bunny.webp`,
  pip: MASCOT.hello,
  girl: `${FOOD}/girl_happy.png`,
  boy: `${FOOD}/boy_happy.png`,
};

export function avatarUrl(key: string | null | undefined): string {
  return AVATAR_IMAGES[key ?? DEFAULT_AVATAR] ?? AVATAR_IMAGES[DEFAULT_AVATAR];
}

export const avatarLabel = (key: AvatarKey): string =>
  AVATARS.find((avatar) => avatar.key === key)?.label.toUpperCase() ?? key.toUpperCase();

/** Ảnh linh vật là cảnh vuông (ong) hay chân dung có khung / sticker (con vật, streamer) — để CSS bo khung khác nhau */
export const isSceneAvatar = (key: string | null | undefined): boolean => (key ?? DEFAULT_AVATAR) === 'pip';
