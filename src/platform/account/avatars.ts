/**
 * Ảnh đại diện preset (contracts AVATARS): key -> ảnh có sẵn trong app.
 *   pip                      — linh vật ong (Bee pack)
 *   lion / tiger / panda / bunny — linh vật Bread Catcher
 *   girl / boy               — streamer của Food Stream
 * Đường dẫn ghi thẳng (không import module của game) để chunk tài khoản không kéo theo code game.
 */
import { AVATARS, DEFAULT_AVATAR, type AvatarKey } from '@phonics/contracts';
import { MASCOT } from '@/platform/ui/icons';

const BREAD = 'assets/bread-catcher/phonics';
const FOOD = 'assets/food-stream/characters';

export const AVATAR_IMAGES: Record<AvatarKey, string> = {
  pip: MASCOT.hello,
  lion: `${BREAD}/mascot_lion.png`,
  tiger: `${BREAD}/mascot_tiger.png`,
  panda: `${BREAD}/mascot_panda.png`,
  bunny: `${BREAD}/mascot_bunny.png`,
  girl: `${FOOD}/girl_happy.png`,
  boy: `${FOOD}/boy_happy.png`,
};

export function avatarUrl(key: string | null | undefined): string {
  return AVATAR_IMAGES[(key ?? DEFAULT_AVATAR) as AvatarKey] ?? AVATAR_IMAGES[DEFAULT_AVATAR];
}

export const avatarLabel = (key: AvatarKey): string =>
  AVATARS.find((avatar) => avatar.key === key)?.label.toUpperCase() ?? key.toUpperCase();

/** Ảnh linh vật là cảnh vuông (ong) hay sticker pixel-art (động vật, streamer) — để CSS bo khung khác nhau */
export const isSceneAvatar = (key: string | null | undefined): boolean => (key ?? DEFAULT_AVATAR) === 'pip';
