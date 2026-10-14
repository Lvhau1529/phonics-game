/**
 * Repository bài giao của học sinh (/me/assignments): chỉ khai báo endpoint và trả DTO đúng như BE.
 */
import {
  AssignmentRankingResponse,
  ENDPOINTS,
  MyAssignmentDetail,
  MyAssignmentSummary,
  paginated,
  type MyAssignmentFilter,
} from '@phonics/contracts';
import { request } from '@/core/api/client';

const MyAssignmentPage = paginated(MyAssignmentSummary);

/** `type` (không phải interface) để gán được vào `QueryParams` của client */
export type MyAssignmentsQuery = {
  filter: MyAssignmentFilter;
  page?: number;
  pageSize?: number;
};

export const assignmentsRepository = {
  list: (query: MyAssignmentsQuery) => request(ENDPOINTS.me.assignments, { query, schema: MyAssignmentPage }),
  detail: (id: string) => request(ENDPOINTS.me.assignment(id), { schema: MyAssignmentDetail }),
  ranking: (id: string) => request(ENDPOINTS.me.assignmentRanking(id), { schema: AssignmentRankingResponse }),
};
