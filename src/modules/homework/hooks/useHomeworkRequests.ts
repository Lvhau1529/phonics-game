/** Dữ liệu bài tập cho các màn React (kết quả, nhận xét) — màn chỉ dùng các hook này, không gọi service */
import { useRequest } from '@/core/hooks/useRequest';
import type { CommentModel } from '@/modules/homework/models/CommentModel';
import { assignmentsService } from '@/modules/homework/services/assignmentsService';
import { submissionsService } from '@/modules/homework/services/submissionsService';

/** Chi tiết bài giao (kèm lần làm) */
export const useAssignmentDetail = (assignmentId: string) =>
  useRequest(() => assignmentsService.detail(assignmentId), `hw-detail:${assignmentId}`);

/** Một bài nộp (null khi chưa có id) */
export const useSubmissionDetail = (submissionId: string | null) =>
  useRequest(
    () => (submissionId ? submissionsService.detail(submissionId) : Promise.resolve(null)),
    `hw-sub:${submissionId ?? ''}`,
  );

/** Nhận xét của giáo viên trên một bài nộp (chỉ xem — bé không trả lời) */
export const useSubmissionComments = (submissionId: string | null) =>
  useRequest(
    () => (submissionId ? submissionsService.comments(submissionId) : Promise.resolve([] as CommentModel[])),
    `hw-comments:${submissionId ?? ''}`,
  );
