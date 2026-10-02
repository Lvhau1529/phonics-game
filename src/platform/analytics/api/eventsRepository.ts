/**
 * Repository sự kiện ẩn danh (POST /public/events): chỉ khai báo endpoint và trả DTO đúng như BE.
 */
import { ENDPOINTS, EventBatchResponse, type EventBatchBody } from '@phonics/contracts';
import { request } from '@/platform/api/client';

export const eventsRepository = {
  /** `keepalive`: gửi được cả khi trang đang đóng (pagehide) */
  send: (body: EventBatchBody, keepalive: boolean) =>
    request(ENDPOINTS.public.events, {
      method: 'POST',
      body,
      schema: EventBatchResponse,
      auth: 'optional',
      keepalive,
    }),
};
