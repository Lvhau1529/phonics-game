/**
 * Schema nội dung Halloween Candy Quest: thư viện 24 từ (words.json, ảnh ở public/assets/halloween-candy-quest/words)
 * và từ giáo viên tự thêm (ảnh upload, lưu trên máy). Kiểm tra lúc tải module, lúc đọc localStorage và trong test.
 */
import { z } from 'zod';

/** id từ thư viện = tên ảnh words/<id>.png (tools/halloween_candy_quest/build_assets.py) */
export const LibraryWordSchema = z.strictObject({
  id: z.string().regex(/^[a-z_]+$/),
  text: z.string().trim().min(1).max(30),
  /** Nghĩa tiếng Việt (chỉ hiện trong Hướng dẫn / màn từ vựng cho giáo viên) */
  meaning: z.string().trim().min(1),
});

export const WordBankSchema = z.strictObject({ words: z.array(LibraryWordSchema).min(2) });

export type LibraryWord = z.infer<typeof LibraryWordSchema>;

export const MAX_WORD_LENGTH = 30;
/** Ảnh upload sau khi thu nhỏ (data URL PNG) */
export const MAX_IMAGE_CHARS = 200_000;

/** Từ giáo viên thêm: chữ + (tuỳ chọn) nghĩa + ảnh upload */
export const CustomWordSchema = z.strictObject({
  id: z.string().regex(/^custom-[a-z0-9]+$/),
  text: z.string().trim().min(1).max(MAX_WORD_LENGTH),
  meaning: z.string().trim().max(60).default(''),
  image: z
    .string()
    .max(MAX_IMAGE_CHARS)
    .regex(/^data:image\/(png|jpeg|webp);base64,/),
  enabled: z.boolean(),
});

export type CustomWord = z.infer<typeof CustomWordSchema>;
