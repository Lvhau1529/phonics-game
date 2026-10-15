/**
 * Schema ngân hàng câu đố Odd One Out (puzzles.json) — kiểm tra lúc tải module và trong test.
 * Mỗi câu: 4 hình, đúng 1 hình "khác loại" (`odd`), 3 hình còn lại cùng nhóm (`group`).
 */
import { z } from 'zod';

export const LEVELS = ['easy', 'challenge'] as const;
export type Level = (typeof LEVELS)[number];

/**
 * Một hình: emoji, hoặc hình vẽ bằng CSS khi không có emoji phù hợp / emoji quá mới (máy cũ hiện ô vuông):
 * `dot` chấm tròn màu `color`, `rectangle` hình chữ nhật, `oval` hình bầu dục.
 */
export const PuzzleOptionSchema = z
  .object({
    name: z.string().trim().min(1),
    emoji: z.string().min(1).optional(),
    shape: z.enum(['dot', 'rectangle', 'oval']).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
  })
  .refine((option) => Boolean(option.emoji) !== Boolean(option.shape), 'cần emoji HOẶC shape');
export type PuzzleOption = z.infer<typeof PuzzleOptionSchema>;

export const PuzzleSchema = z.object({
  id: z.string().regex(/^[a-z-]+-[ec]\d+$/),
  topic: z.string().min(1),
  level: z.enum(LEVELS),
  options: z.array(PuzzleOptionSchema).length(4),
  odd: z.int().min(0).max(3),
  /** Điểm chung của 3 hình còn lại (tiếng Anh, hiện ở đáp án: "The other three: ...") */
  group: z.string().min(1),
  /** Câu mẫu bé nói theo — máy đọc ở bước đáp án */
  sample: z.string().min(1),
  /** Gợi ý tiếng Việt cho giáo viên (phần Hướng dẫn) */
  vi: z.string().min(1),
});
export type Puzzle = z.infer<typeof PuzzleSchema>;

export const PuzzleBankSchema = z.object({
  version: z.literal(1),
  puzzles: z.array(PuzzleSchema).min(1),
});
