/**
 * Repository bài nộp của học sinh (/me/submissions): chỉ khai báo endpoint và trả DTO đúng như BE.
 */
import {
  CommentView,
  CommentsResponse,
  ENDPOINTS,
  SaveAnswersResponse,
  SubmissionDetail,
  SubmitResponse,
  type CreateCommentBody,
  type SaveAnswersBody,
} from '@phonics/contracts';
import { HttpMethod, request } from '@/platform/api/client';

export const submissionsRepository = {
  /** 201 attempt mới / 200 attempt đang làm — đều trả SubmissionDetail */
  start: (assignmentId: string) =>
    request(ENDPOINTS.me.assignmentSubmissions(assignmentId), {
      method: HttpMethod.POST,
      schema: SubmissionDetail,
    }),
  detail: (id: string) => request(ENDPOINTS.me.submission(id), { schema: SubmissionDetail }),
  saveAnswers: (id: string, body: SaveAnswersBody, keepalive = false) =>
    request(ENDPOINTS.me.submissionAnswers(id), {
      method: HttpMethod.PUT,
      body,
      schema: SaveAnswersResponse,
      keepalive,
    }),
  submit: (id: string) =>
    request(ENDPOINTS.me.submit(id), { method: HttpMethod.POST, schema: SubmitResponse }),
  comments: (id: string) => request(ENDPOINTS.me.submissionComments(id), { schema: CommentsResponse }),
  reply: (id: string, body: CreateCommentBody) =>
    request(ENDPOINTS.me.submissionComments(id), { method: HttpMethod.POST, body, schema: CommentView }),
};
