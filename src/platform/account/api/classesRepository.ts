/**
 * Repository lớp học (phía học sinh): chỉ khai báo endpoint và trả DTO đúng như BE.
 * Không map / format ở đây — việc đó của `classesService`.
 */
import { ENDPOINTS, PublicClassesResponse } from '@phonics/contracts';
import { request } from '@/platform/api/client';

export const classesRepository = {
  publicList: () => request(ENDPOINTS.public.classes, { schema: PublicClassesResponse, auth: 'none' }),
};
