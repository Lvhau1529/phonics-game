/**
 * Service bài nộp của học sinh: repository → model. Ack autosave / kết quả nộp (số liệu) → giữ DTO.
 */
import type { SaveAnswersBody, SubmitResponse } from '@phonics/contracts';
import { submissionsRepository } from '@/platform/homework/api/submissionsRepository';
import { CommentModel } from '@/platform/homework/models/CommentModel';
import { SubmissionModel } from '@/platform/homework/models/SubmissionModel';

export const submissionsService = {
  start: async (assignmentId: string): Promise<SubmissionModel> =>
    new SubmissionModel(await submissionsRepository.start(assignmentId)),
  detail: async (id: string): Promise<SubmissionModel> =>
    new SubmissionModel(await submissionsRepository.detail(id)),
  /** Autosave: `{ saved, updatedAt }` → giữ DTO */
  saveAnswers: (id: string, body: SaveAnswersBody, keepalive = false) =>
    submissionsRepository.saveAnswers(id, body, keepalive),
  /** Nộp bài: bài + hạng (nếu không có câu chấm tay) → giữ DTO */
  submit: (id: string): Promise<SubmitResponse> => submissionsRepository.submit(id),
  comments: async (id: string): Promise<CommentModel[]> =>
    (await submissionsRepository.comments(id)).items.map((item) => new CommentModel(item)),
  reply: async (id: string, parentId: string, body: string): Promise<CommentModel> =>
    new CommentModel(await submissionsRepository.reply(id, { body, parentId })),
};
