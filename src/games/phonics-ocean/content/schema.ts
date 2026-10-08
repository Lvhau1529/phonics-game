/**
 * Schema nội dung của Phonics Ocean (content/levels.json — sinh bởi tools/phonics_ocean/build_content.py
 * từ word_bank.csv + level_0x.json của resource pack). Kiểm tra bằng Zod để nội dung hỏng không làm sập game.
 */
import { z } from 'zod';

const word = z.string().regex(/^[a-z]+$/, 'chỉ gồm chữ cái thường');

/**
 * Kiểu câu hỏi của một cấp (luật chọn đáp án — session/questions.ts):
 *   initial  — nghe âm đầu (/m/), ăn từ bắt đầu bằng âm đó
 *   word     — nghe một từ, ăn đúng từ đó (từ gây nhiễu chỉ khác 1 âm)
 *   rime     — vần (-at): ăn từ cùng họ vần; 3 câu cùng vần liền nhau = RHYME COMBO
 *   contains — cụm phụ âm / digraph (bl, sh): ăn từ có chứa cụm đó
 *   sentence — ôn tập: nghe "I can see a ___." rồi ăn từ còn thiếu
 */
export const QuestionModeSchema = z.enum(['initial', 'word', 'rime', 'contains', 'sentence']);

export const BiomeSchema = z.enum([
  'coral_reef',
  'shipwreck',
  'deep_ocean',
  'ice_sea',
  'volcano',
  'treasure_zone',
]);

export const PredatorKindSchema = z.enum(['shark', 'puffer', 'eel', 'angler']);

export const TargetSchema = z.object({
  /** Âm / vần / cụm chữ, vd "m", "-at", "sh" */
  id: z.string().min(1),
  /** Chữ hiện trên HUD, vd "/m/", "-at", "sh" */
  label: z.string().min(1),
  /** Các đoạn Web Speech đọc để ra âm (vd ["mmm"]) */
  speech: z.array(z.string().min(1)).min(1),
  /** Từ đúng với mục tiêu này */
  words: z.array(word).min(1),
});

export const LevelSchema = z.object({
  /** Id ổn định — dùng làm key lưu tiến độ */
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  /** Mô tả trọng tâm (tiếng Anh, từ pack) */
  focus: z.string(),
  mode: QuestionModeSchema,
  biome: BiomeSchema,
  roundSeconds: z.number().int().positive(),
  correctToClear: z.number().int().positive(),
  /** Tỉ lệ đúng tối thiểu để đạt 2 sao (mastery gate) */
  minAccuracy: z.number().min(0).max(1),
  startChoices: z.number().int().min(2),
  maxChoices: z.number().int().min(2),
  predatorEverySec: z.number().positive(),
  /** Hệ số tốc độ bơi của cá trong cấp */
  speed: z.number().positive(),
  predators: z.array(PredatorKindSchema).min(1),
  /** Rỗng với cấp kiểu word / sentence (đề là chính từ đó) */
  targets: z.array(TargetSchema),
  words: z.array(word).min(3),
  /** Từ chỉ dùng làm từ gây nhiễu (vd cặp Magic-E: kit / kite) */
  extraDistractors: z.array(word),
});

export const ContentSchema = z.object({ levels: z.array(LevelSchema).min(1) });

export type QuestionMode = z.infer<typeof QuestionModeSchema>;
export type Biome = z.infer<typeof BiomeSchema>;
export type PredatorKind = z.infer<typeof PredatorKindSchema>;
export type TargetDef = z.infer<typeof TargetSchema>;
export type LevelDef = z.infer<typeof LevelSchema>;
