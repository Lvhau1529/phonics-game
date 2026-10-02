/**
 * Gói nội dung (WORD PACK) mà gameplay dùng — dựng từ JSON trong ./packs (plan §7, §20).
 * Scene không bao giờ hard-code "dog", "d"...: mọi thứ học đều đến từ đây.
 *
 * Gói chữ cái (Letter D, Letter O) lấy thẳng từ JSON; gói tổng hợp (CVC Words, All Letters)
 * ghép từ các gói chữ cái — thêm JSON mới là các gói tổng hợp tự có thêm nội dung.
 */
import letterD from '@/games/food-stream/content/packs/letter-d.json';
import letterO from '@/games/food-stream/content/packs/letter-o.json';
import { LetterPackSchema, type LetterPackData, type WordTarget } from '@/games/food-stream/content/schema';
import { hasSprite } from '@/games/food-stream/game/config/sprites';

export type { WordTarget };

/** Một âm mục tiêu (nghe & chọn chữ, tìm từ theo âm) */
export interface SoundDef {
  grapheme: string;
  phoneme: string;
  /** Web Speech đọc chuỗi này để ra âm (vd "duh") */
  speech: string;
}

export interface ContentPack {
  id: string;
  title: string;
  /** Tranh đại diện ở màn Setup */
  icon: string;
  sounds: SoundDef[];
  /** Từ bắt đầu bằng các âm của gói */
  words: WordTarget[];
  /** Từ ngắn (≤ 4 chữ) để ghép từ */
  spellingWords: WordTarget[];
  confusables: string[];
}

/** Từ dài hơn thì không ghép (quá nhiều ô cho trẻ 5 tuổi / màn hình điện thoại) */
export const MAX_SPELLING_LENGTH = 4;

const LETTER_PACKS: LetterPackData[] = [letterD, letterO].map((data) => LetterPackSchema.parse(data));

const unique = <T>(items: T[], key: (item: T) => string): T[] => [
  ...new Map(items.map((item) => [key(item), item])).values(),
];

const byWord = (target: WordTarget) => target.word;

function soundOf(pack: LetterPackData): SoundDef {
  return { grapheme: pack.grapheme, phoneme: pack.phoneme, speech: pack.phonemeSpeech };
}

function spellingWordsOf(pack: LetterPackData): WordTarget[] {
  const short = pack.targets.filter((target) => target.word.length <= MAX_SPELLING_LENGTH);
  return unique([...pack.cvcWords, ...short], byWord);
}

function letterPack(pack: LetterPackData): ContentPack {
  return {
    id: pack.id,
    title: pack.title.toUpperCase(),
    icon: pack.targets.find((target) => hasSprite(target.imageAsset))?.imageAsset ?? '',
    sounds: [soundOf(pack)],
    words: pack.targets,
    spellingWords: spellingWordsOf(pack),
    confusables: pack.confusables,
  };
}

const allCvc = unique(
  LETTER_PACKS.flatMap((pack) => pack.cvcWords),
  byWord,
);

export const PACKS: readonly ContentPack[] = [
  ...LETTER_PACKS.map(letterPack),
  {
    id: 'cvc-words',
    title: 'CVC WORDS',
    icon: allCvc.find((target) => hasSprite(target.imageAsset))?.imageAsset ?? '',
    sounds: [],
    words: allCvc,
    spellingWords: allCvc,
    confusables: unique(
      LETTER_PACKS.flatMap((pack) => pack.confusables),
      (letter) => letter,
    ),
  },
  {
    id: 'all-letters',
    title: 'ALL LETTERS',
    icon: 'food.donut',
    sounds: LETTER_PACKS.map(soundOf),
    words: unique(
      LETTER_PACKS.flatMap((pack) => pack.targets),
      byWord,
    ),
    spellingWords: unique(LETTER_PACKS.flatMap(spellingWordsOf), byWord),
    confusables: unique(
      LETTER_PACKS.flatMap((pack) => pack.confusables),
      (letter) => letter,
    ),
  },
];

export const DEFAULT_PACK_ID = PACKS[0].id;

export function getPack(id: string): ContentPack {
  return PACKS.find((pack) => pack.id === id) ?? PACKS[0];
}

/** Mọi từ có tranh (của mọi gói) — làm từ gây nhiễu cho "Find the Word" */
export const PICTURED_WORDS: readonly WordTarget[] = unique(
  LETTER_PACKS.flatMap((pack) => [...pack.targets, ...pack.cvcWords]),
  byWord,
).filter((target) => hasSprite(target.imageAsset));

export const hasPicture = (target: WordTarget): boolean => hasSprite(target.imageAsset);

/** Vài từ mẫu để giáo viên hình dung gói */
export function packPreview(pack: ContentPack, count = 3): string {
  const source = pack.sounds.length > 0 ? pack.words : pack.spellingWords;
  return source
    .slice(0, count)
    .map((target) => target.word)
    .join(' · ');
}
