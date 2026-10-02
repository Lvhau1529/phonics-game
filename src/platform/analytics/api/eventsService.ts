/**
 * Service sự kiện ẩn danh (`analytics/events.ts` gọi). Không gọi repository trực tiếp từ nơi khác.
 */
import type { EventBatchBody } from '@phonics/contracts';
import { eventsRepository } from '@/platform/analytics/api/eventsRepository';

export const eventsService = {
  /** Ack số nhận / trùng (số liệu) → giữ DTO */
  send: (body: EventBatchBody, keepalive = false) => eventsRepository.send(body, keepalive),
};
