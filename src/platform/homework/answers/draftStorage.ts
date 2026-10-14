/**
 * Bản nháp câu trả lời trong localStorage (`phonics-arcade:homework:<submissionId>`): mất mạng / tắt tab giữa
 * chừng không mất bài. Khi mở lại: bản nháp mới hơn `updatedAt` của server thì dùng bản nháp.
 */
import { QuestionAnswer, type QuestionAnswer as Answer } from '@phonics/contracts';
import { z } from 'zod';
import { DRAFT_KEY_PREFIX } from '@/platform/homework/config';
import { readJson, removeKeys, writeJson } from '@/platform/storage';

const Draft = z.object({
  userId: z.string(),
  assignmentId: z.string(),
  answers: z.record(z.string(), QuestionAnswer),
  /** ISO — lúc bé sửa lần cuối */
  updatedAt: z.string(),
});
export type Draft = z.infer<typeof Draft>;

export const draftKey = (submissionId: string): string => `${DRAFT_KEY_PREFIX}${submissionId}`;

export function readDraft(submissionId: string, userId: string): Draft | null {
  const parsed = Draft.safeParse(readJson<Draft>(draftKey(submissionId)));
  if (!parsed.success || parsed.data.userId !== userId) return null;
  return parsed.data;
}

export function writeDraft(
  submissionId: string,
  draft: { userId: string; assignmentId: string; answers: Record<string, Answer>; updatedAt: string },
): void {
  writeJson(draftKey(submissionId), draft satisfies Draft);
}

export function clearDraft(submissionId: string): void {
  removeKeys([draftKey(submissionId)]);
}

/** Gộp bản nháp vào câu trả lời server: nháp mới hơn lần lưu trên server thì nháp thắng */
export function mergeDraft(
  server: Record<string, Answer>,
  serverUpdatedAt: string,
  draft: Draft | null,
): Record<string, Answer> {
  if (!draft || draft.updatedAt <= serverUpdatedAt) return server;
  return { ...server, ...draft.answers };
}
