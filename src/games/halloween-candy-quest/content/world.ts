/**
 * Thế giới Candy Moon: 3 khu vực (mỗi khu 4 ngôi nhà dọc con đường) + 6 nhân vật chọn được.
 *
 * Toạ độ theo "pixel thế giới" 320×180 (nền gốc của pack). Nền chỉ là tranh vẽ — nhà, cửa, chủ nhà, đồ vật bấm
 * được là sprite riêng đặt lên trên (spec §14.2: không suy hitbox từ ảnh nền).
 */
export const WORLD_WIDTH = 320;
export const WORLD_HEIGHT = 180;

/** Nhà rộng 72px (sprite 128px), cửa 22px đặt chính giữa chân nhà */
export const HOUSE_WIDTH = 72;
export const DOOR_WIDTH = 22;
/** Chân nhà / chân nhân vật (trục y, tính từ trên) */
export const HOUSE_BOTTOM = 148;
export const WALK_LINE = 174;
/** Nhân vật 48px gốc vẽ thành 40px thế giới */
export const CHARACTER_SIZE = 40;
/** Tâm 4 ngôi nhà (trục x) — lượt thứ k trong khu vực tới nhà k % 4 */
export const HOUSE_SLOTS = [42, 122, 202, 282] as const;
/** Nhân vật vào khu vực từ mép trái */
export const ENTRY_X = -24;

export interface House {
  building: string;
  door: string;
  /** Chủ nhà ra mở cửa */
  npc: string;
}

/** Đồ vật trang trí bấm được (không cộng điểm): đổi ảnh khi bấm (`toggled`) hoặc chỉ nảy lên */
export interface Prop {
  id: string;
  image: string;
  toggled?: string;
  /** Tâm x / chân y / rộng (px thế giới) */
  x: number;
  y: number;
  width: number;
  sound?: 'chest_open' | 'hint_twinkle';
}

export interface Zone {
  id: 'pumpkin_garden' | 'candy_village' | 'magic_castle';
  title: string;
  houses: readonly [House, House, House, House];
  props: readonly Prop[];
}

export const ZONES: readonly Zone[] = [
  {
    id: 'pumpkin_garden',
    title: 'PUMPKIN GARDEN',
    houses: [
      { building: 'pumpkin_house', door: 'pumpkin_door', npc: 'pumpkin_host' },
      { building: 'ghost_house', door: 'wood_closed', npc: 'friendly_ghost' },
      { building: 'mushroom_shop', door: 'pink_closed', npc: 'owl' },
      { building: 'witch_cottage', door: 'purple_closed', npc: 'black_cat_host' },
    ],
    props: [
      { id: 'pumpkin', image: 'pumpkin_closed', toggled: 'pumpkin_open', x: 82, y: 178, width: 20 },
      { id: 'haystack', image: 'haystack', x: 244, y: 179, width: 26, sound: 'hint_twinkle' },
    ],
  },
  {
    id: 'candy_village',
    title: 'CANDY VILLAGE',
    houses: [
      { building: 'candy_shop', door: 'pink_magic', npc: 'witch_host' },
      { building: 'purple_house', door: 'purple_closed', npc: 'black_cat_host' },
      { building: 'mushroom_shop', door: 'wood_glowing', npc: 'owl' },
      { building: 'witch_cottage', door: 'pumpkin_door', npc: 'cute_blue_monster' },
    ],
    props: [
      {
        id: 'chest',
        image: 'chest_closed',
        toggled: 'chest_open',
        x: 82,
        y: 178,
        width: 20,
        sound: 'chest_open',
      },
      { id: 'cauldron', image: 'cauldron', x: 244, y: 179, width: 22, sound: 'hint_twinkle' },
    ],
  },
  {
    id: 'magic_castle',
    title: 'MAGIC CASTLE',
    houses: [
      { building: 'castle_gate', door: 'wood_glowing', npc: 'friendly_ghost' },
      { building: 'castle_towers', door: 'magic_pumpkin_portal', npc: 'vampire_host' },
      { building: 'castle_main', door: 'purple_closed', npc: 'skeleton' },
      { building: 'ghost_house', door: 'dark_door', npc: 'mummy' },
    ],
    props: [
      {
        id: 'chest',
        image: 'chest_closed',
        toggled: 'chest_open',
        x: 82,
        y: 178,
        width: 20,
        sound: 'chest_open',
      },
      { id: 'lantern', image: 'lantern', x: 244, y: 178, width: 14, sound: 'hint_twinkle' },
    ],
  },
];

export const ZONE_COUNT = ZONES.length;

export interface Character {
  id: string;
  name: string;
}

export const CHARACTERS: readonly Character[] = [
  { id: 'pumpkin_kid', name: 'PUMPKIN KID' },
  { id: 'little_ghost', name: 'LITTLE GHOST' },
  { id: 'mini_witch', name: 'MINI WITCH' },
  { id: 'vampire_kid', name: 'VAMPIRE KID' },
  { id: 'black_cat', name: 'BLACK CAT' },
  { id: 'bat_explorer', name: 'BAT EXPLORER' },
];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];
}

/** Hàng trong spritesheet nhân vật */
export const POSES = ['idle', 'walk', 'knock', 'celebrate', 'try_again'] as const;
export type Pose = (typeof POSES)[number];
