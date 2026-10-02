/**
 * Service thông báo: gọi `notificationsRepository` rồi đổi DTO → model (`NotificationModel`).
 * Store chỉ gọi service, không gọi repository trực tiếp.
 */
import type { NotificationListResponse } from '@phonics/contracts';
import { notificationsRepository } from '@/platform/account/api/notificationsRepository';
import { NotificationModel } from '@/platform/account/models/NotificationModel';

/** Trang thông báo: total / page / unreadCount như BE, các mục là model */
export type NotificationList = Omit<NotificationListResponse, 'items'> & { items: NotificationModel[] };

export const notificationsService = {
  /** `unreadOnly` false thì không gửi `unread` (server coerce mọi chuỗi khác rỗng thành true) */
  list: async (unreadOnly: boolean, pageSize = 20): Promise<NotificationList> => {
    const data = await notificationsRepository.list({ unread: unreadOnly ? 'true' : undefined, pageSize });
    return { ...data, items: data.items.map((item) => new NotificationModel(item)) };
  },
  /** Không có ids = đánh dấu tất cả đã đọc. Ack (số đã đổi + số chưa đọc) → giữ DTO */
  markRead: (ids?: string[]) => notificationsRepository.markRead(ids ? { ids } : {}),
};
