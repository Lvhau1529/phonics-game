/**
 * Giao thức postMessage giữa admin và màn xem trước `#/preview` (admin nhúng iframe):
 *   game  → admin  `ready`                 — màn đã sẵn sàng nhận nội dung (gửi lại mỗi lần mở / tải lại)
 *   admin → game   `load`                  — tiêu đề + danh sách câu (config, đáp án) + map media; gửi lại khi
 *                                            admin sửa nháp (câu đổi nội dung thì bỏ câu trả lời thử của câu đó)
 *   game  → admin  `check`                 — câu trả lời thử của mọi câu khi bấm CHECK
 *   admin → game   `results`               — kết quả từng câu (admin chấm bằng checkAnswer của nó)
 * Mọi message có `channel: 'phonics-preview'`. Admin giữ bản sao kiểu ở features/questions/utils/studentPreview.ts.
 */
import {
  MediaMap,
  QuestionAnswerKey,
  QuestionConfig,
  QuestionExample,
  type QuestionAnswer,
} from '@phonics/contracts';
import { z } from 'zod';

export const PREVIEW_CHANNEL = 'phonics-preview';

/** Mép trái khung câu theo kết quả (giống màn xem lại) */
export const PreviewTone = z.enum(['right', 'almost', 'wrong', 'checking']);
export type PreviewTone = z.infer<typeof PreviewTone>;

export const PreviewItem = z.object({
  /** Khoá ổn định của câu trong phiếu (id item / id câu) */
  key: z.string().min(1),
  instruction: z.string(),
  example: QuestionExample.nullable(),
  config: QuestionConfig,
  /** Thiếu = chưa nhập đủ đáp án → vẫn xem được, không hiện ANSWER */
  answerKey: QuestionAnswerKey.nullable(),
});
export type PreviewItem = z.infer<typeof PreviewItem>;

const LoadMessage = z.object({
  channel: z.literal(PREVIEW_CHANNEL),
  type: z.literal('load'),
  title: z.string(),
  items: z.array(PreviewItem),
  media: MediaMap,
});

const ResultsMessage = z.object({
  channel: z.literal(PREVIEW_CHANNEL),
  type: z.literal('results'),
  results: z.record(z.string(), PreviewTone),
});

/** Message admin gửi sang */
export const AdminMessage = z.discriminatedUnion('type', [LoadMessage, ResultsMessage]);
export type AdminMessage = z.infer<typeof AdminMessage>;
export type PreviewContent = Omit<z.infer<typeof LoadMessage>, 'channel' | 'type'>;

/** Message game gửi về admin */
export type PreviewMessage =
  | { channel: typeof PREVIEW_CHANNEL; type: 'ready' }
  | { channel: typeof PREVIEW_CHANNEL; type: 'check'; answers: Record<string, QuestionAnswer> };

/** Là message của kênh xem trước (bỏ qua message khác: devtools, extension…) */
export const isPreviewMessage = (data: unknown): boolean =>
  typeof data === 'object' && data !== null && (data as { channel?: unknown }).channel === PREVIEW_CHANNEL;
