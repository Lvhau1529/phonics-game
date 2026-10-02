/**
 * Repository thông báo của học sinh: chỉ khai báo endpoint và trả DTO đúng như BE.
 * Không map / format ở đây — việc đó của `notificationsService`.
 */
import { ENDPOINTS, MarkReadResponse, NotificationListResponse, type MarkReadBody } from '@phonics/contracts';
import { request, type QueryParams } from '@/platform/api/client';

export const notificationsRepository = {
  list: (query: QueryParams) =>
    request(ENDPOINTS.me.notifications, { query, schema: NotificationListResponse }),
  markRead: (body: MarkReadBody) =>
    request(ENDPOINTS.me.notificationsRead, { method: 'PATCH', body, schema: MarkReadResponse }),
};
