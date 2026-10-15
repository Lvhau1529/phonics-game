/**
 * Schema nội dung Little English Explorers (worlds.json) — kiểm tra lúc tải module và trong test.
 * Mỗi câu: một tranh (ảnh trong public/assets/english-explorers/pictures hoặc emoji), câu hỏi có thể có
 * chỗ trống "___", 3 đáp án, câu mẫu đầy đủ để bé nói theo.
 */
import { z } from 'zod';

/** Tên ảnh trong public/assets/english-explorers/pictures/<tên>.webp (tools/english_explorers/build_assets.py) */
export const PICTURE_NAMES = [
  'lion',
  'rabbit',
  'elephant',
  'fish',
  'elephant_scene',
  'rabbit_scene',
  'forest',
  'ocean',
  'desert',
] as const;
export type PictureName = (typeof PICTURE_NAMES)[number];

/** Ảnh HOẶC emoji */
export const PictureSchema = z.union([
  z.strictObject({ image: z.enum(PICTURE_NAMES) }),
  z.strictObject({ emoji: z.string().min(1) }),
]);
export type Picture = z.infer<typeof PictureSchema>;

export const AnswerOptionSchema = z.object({
  label: z.string().trim().min(1),
  image: z.enum(PICTURE_NAMES).optional(),
  emoji: z.string().min(1).optional(),
});
export type AnswerOption = z.infer<typeof AnswerOptionSchema>;

export const QuestionSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d+$/),
  /** Câu hỏi; "___" là chỗ trống bé điền */
  prompt: z.string().min(1),
  picture: PictureSchema,
  options: z.array(AnswerOptionSchema).length(3),
  answer: z.int().min(0).max(2),
  /** Câu mẫu đầy đủ (máy đọc, bé nói theo) */
  sentence: z.string().min(1),
  /** Nghĩa tiếng Việt cho giáo viên (phần Hướng dẫn) — KHÔNG hiện trong game (bản gốc hiện trước khi bé chọn = lộ đáp án) */
  vi: z.string().min(1),
});
export type Question = z.infer<typeof QuestionSchema>;

export const WorldSchema = z.object({
  id: z.string().regex(/^[a-z]+$/),
  title: z.string().min(1),
  /** Mẫu câu luyện (hiện trên thẻ thế giới) */
  grammar: z.string().min(1),
  emoji: z.string().min(1),
  cover: z.enum(PICTURE_NAMES),
  questions: z.array(QuestionSchema).min(1),
});
export type World = z.infer<typeof WorldSchema>;

export const WorldBankSchema = z.object({
  version: z.literal(1),
  worlds: z.array(WorldSchema).min(1),
});
