/** Dữ liệu bài tập cho các màn React (xếp hạng, kết quả, nhận xét) — màn chỉ dùng các hook này, không gọi service */
import { useRequest } from '@/core/hooks/useRequest';
import type { CommentModel } from '@/modules/homework/models/CommentModel';
import { assignmentsService } from '@/modules/homework/services/assignmentsService';
import { submissionsService } from '@/modules/homework/services/submissionsService';

/** Xếp hạng theo bài giao */
export const useAssignmentRanking = (assignmentId: string) =>
  useRequest(() => assignmentsService.ranking(assignmentId), `hw-ranking:${assignmentId}`);

/** Chi tiết bài giao (kèm lần làm) */
export const useAssignmentDetail = (assignmentId: string) =>
  useRequest(() => assignmentsService.detail(assignmentId), `hw-detail:${assignmentId}`);

/** Một bài nộp (null khi chưa có id) */
export const useSubmissionDetail = (submissionId: string | null) =>
  useRequest(
    () => (submissionId ? submissionsService.detail(submissionId) : Promise.resolve(null)),
    `hw-sub:${submissionId ?? ''}`,
  );

/** Nhận xét trên một bài nộp + gửi trả lời (tải lại danh sách sau khi gửi) */
export function useSubmissionComments(submissionId: string | null) {
  const comments = useRequest(
    () => (submissionId ? submissionsService.comments(submissionId) : Promise.resolve([] as CommentModel[])),
    `hw-comments:${submissionId ?? ''}`,
  );
  const reply = async (parentId: string, body: string): Promise<void> => {
    if (!submissionId) return;
    await submissionsService.reply(submissionId, parentId, body);
    comments.reload();
  };
  return { ...comments, reply };
}
