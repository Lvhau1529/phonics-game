import type { NotificationType, NotificationView } from '@phonics/contracts';

/**
 * Thông báo của học sinh (từ `NotificationView` của BE). Field giữ nguyên tên như contracts; getter là dữ liệu chỉ
 * phía FE dùng. Không spread model (mất getter) — đổi trạng thái thì tạo bản mới (`markedRead`).
 */
export class NotificationModel {
  readonly id: string;
  readonly type: NotificationType;
  /** Tiếng Anh ngắn gọn cho bé (hiện nguyên văn) */
  readonly title: string;
  readonly body: string;
  readonly data: Record<string, unknown> | null;
  readonly readAt: string | null;
  readonly createdAt: string;

  constructor(data: NotificationView) {
    this.id = data.id;
    this.type = data.type;
    this.title = data.title;
    this.body = data.body;
    this.data = data.data;
    this.readAt = data.readAt;
    this.createdAt = data.createdAt;
  }

  get isUnread(): boolean {
    return this.readAt === null;
  }

  /** Bản đã đọc lúc `at` (ISO); đã đọc rồi thì trả chính nó */
  markedRead(at: string): NotificationModel {
    return this.isUnread ? new NotificationModel({ ...this.toJSON(), readAt: at }) : this;
  }

  /** DTO đúng như BE */
  toJSON(): NotificationView {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      body: this.body,
      data: this.data,
      readAt: this.readAt,
      createdAt: this.createdAt,
    };
  }
}
