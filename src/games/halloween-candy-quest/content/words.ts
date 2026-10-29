/**
 * Từ vựng của Halloween Candy Quest: thư viện 24 từ của resource pack + từ giáo viên tự thêm.
 * Trong ván chơi mọi từ quy về `VocabWord` (ảnh = URL asset hoặc data URL ảnh upload).
 */
import bank from '@/games/halloween-candy-quest/content/words.json';
import {
  WordBankSchema,
  type CustomWord,
  type LibraryWord,
} from '@/games/halloween-candy-quest/content/schema';
import { wordImageUrl } from '@/games/halloween-candy-quest/app/assets';

export type { CustomWord, LibraryWord };

export const LIBRARY: readonly LibraryWord[] = WordBankSchema.parse(bank).words;

export interface VocabWord {
  id: string;
  text: string;
  meaning: string;
  image: string;
  /** Có sprite riêng để đặt vào cảnh (dạng Find the Object) — chỉ từ thư viện */
  sceneEligible: boolean;
  custom: boolean;
}

export function libraryWord(word: LibraryWord): VocabWord {
  return { ...word, image: wordImageUrl(word.id), sceneEligible: true, custom: false };
}

export function customWord(word: CustomWord): VocabWord {
  return {
    id: word.id,
    text: word.text,
    meaning: word.meaning,
    image: word.image,
    sceneEligible: false,
    custom: true,
  };
}

/** Các từ đang bật, theo thứ tự thư viện rồi tới từ tự thêm */
export function activeWords(enabledLibrary: readonly string[], custom: readonly CustomWord[]): VocabWord[] {
  const enabled = new Set(enabledLibrary);
  return [
    ...LIBRARY.filter((word) => enabled.has(word.id)).map(libraryWord),
    ...custom.filter((word) => word.enabled).map(customWord),
  ];
}

/** Chuẩn hoá để so trùng: "Trick  or Treat" == "trick or treat" */
export const normalizeText = (text: string): string => text.trim().toLowerCase().replace(/\s+/g, ' ');
