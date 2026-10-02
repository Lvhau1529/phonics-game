/**
 * Gói từ vựng (PHONICS PACK) dựng từ content/phonics_word_bank.json.
 * Chỉ dùng phần Phonics của bảng từ (không dùng phần ESL review).
 * Thêm gói MY WORDS: giáo viên tự gõ từ cho buổi chơi ở màn Setup.
 * Chữ luôn viết HOA khi chơi (plan §34: chữ rơi in hoa, cỡ lớn).
 */
import wordBank from '@/games/bread-catcher/content/phonics_word_bank.json';
import type { BuiltinPackId, SessionSettings } from '@/games/bread-catcher/session/types';

export interface PackDef {
  id: BuiltinPackId;
  label: string;
  words: string[];
}

const { packs } = wordBank;

/** Chỉ giữ từ đơn gồm chữ cái, viết hoa, bỏ trùng */
function normalize(words: readonly string[]): string[] {
  const clean = words.filter((word) => /^[a-z]+$/i.test(word)).map((word) => word.toUpperCase());
  return [...new Set(clean)];
}

const earlyWords = normalize(packs.early_blending);
const blendingWords = normalize([...packs.blending_core, ...packs.longer_review]);
const pictureWords = normalize(Object.values(packs.phonics_picture_vocab).flat());

export const PACKS: Record<BuiltinPackId, PackDef> = {
  blending_core: { id: 'blending_core', label: 'BLENDING WORDS', words: blendingWords },
  early_blending: { id: 'early_blending', label: 'EARLY BLENDING', words: earlyWords },
  picture_vocab: { id: 'picture_vocab', label: 'PICTURE VOCABULARY', words: pictureWords },
  mixed_review: {
    id: 'mixed_review',
    label: 'MIXED REVIEW',
    words: normalize([...earlyWords, ...blendingWords, ...pictureWords]),
  },
};

export const PACK_ORDER: BuiltinPackId[] = [
  'blending_core',
  'early_blending',
  'picture_vocab',
  'mixed_review',
];

export const CUSTOM_PACK_LABEL = 'MY WORDS';

/** Vài từ mẫu (rải đều trong gói) để giáo viên hình dung gói từ */
export function packPreview(words: readonly string[], count = 4): string {
  const step = Math.max(1, Math.floor(words.length / count));
  return words
    .filter((_, index) => index % step === 0)
    .slice(0, count)
    .map((word) => word.toLowerCase())
    .join(' · ');
}

/** Độ dài ngắn nhất / dài nhất của các từ trong gói */
export function wordLengthRange(words: readonly string[]): { min: number; max: number } {
  const lengths = words.map((word) => word.length);
  return { min: Math.min(...lengths), max: Math.max(...lengths) };
}

// ---------------------------------------------------------------------------
// MY WORDS — từ tự nhập
// ---------------------------------------------------------------------------
/** Ô từ thu nhỏ được tới 10 chữ ở màn dọc 360px; 1 chữ thì không còn là "ghép từ" */
export const CUSTOM_WORD_LETTERS = { min: 2, max: 10 } as const;

export interface ParsedWords {
  /** Từ hợp lệ: viết hoa, bỏ trùng, giữ thứ tự gõ */
  words: string[];
  /** Phần bị bỏ qua (có số / dấu / chữ có dấu tiếng Việt, quá ngắn hoặc quá dài) */
  skipped: string[];
}

/** Tách ô MY WORDS thành từ: cách nhau bởi dấu cách, xuống dòng, dấu phẩy / chấm phẩy / gạch chéo */
export function parseCustomWords(text: string): ParsedWords {
  const words = new Set<string>();
  const skipped = new Set<string>();
  for (const token of text.split(/[\s,;/|]+/)) {
    // Bỏ dấu câu dính ở hai đầu ("cat." "(dog)") nhưng giữ dấu ở giữa ("don't" vẫn bị bỏ qua)
    const word = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!word) continue;
    const valid =
      /^[a-z]+$/i.test(word) &&
      word.length >= CUSTOM_WORD_LETTERS.min &&
      word.length <= CUSTOM_WORD_LETTERS.max;
    if (valid) words.add(word.toUpperCase());
    else skipped.add(word);
  }
  return { words: [...words], skipped: [...skipped] };
}

/** Từ dùng cho phiên chơi: gói có sẵn hoặc MY WORDS */
export function sessionWords(settings: Pick<SessionSettings, 'packId' | 'customWords'>): string[] {
  return settings.packId === 'custom' ? settings.customWords : PACKS[settings.packId].words;
}

/** Chữ cái của bảng Phonics — bù thêm chữ nhiễu khi MY WORDS có quá ít chữ cái khác nhau */
const PHONICS_LETTERS = ['M', 'A', 'S', 'P', 'T', 'I', 'N', 'C', 'O', 'D'];
const MIN_DISTRACTOR_LETTERS = 6;

/** Tập chữ cái của gói — dùng làm chữ "gây nhiễu" khi rơi (plan §10) */
export function sessionLetters(settings: Pick<SessionSettings, 'packId' | 'customWords'>): string[] {
  const letters = new Set(sessionWords(settings).join(''));
  for (const letter of PHONICS_LETTERS) {
    if (letters.size >= MIN_DISTRACTOR_LETTERS) break;
    letters.add(letter);
  }
  return [...letters].sort();
}
