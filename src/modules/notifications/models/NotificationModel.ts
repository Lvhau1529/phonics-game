import type { NotificationType, NotificationView } from '@phonics/contracts';
import type { HomeworkPage } from '@/core/navigation/platformStore';

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

  /** Thông báo về bài tập: bấm vào thì mở màn tương ứng (bài mới → làm bài; chấm xong / nhận xét → kết quả) */
  get target(): HomeworkPage | null {
    const assignmentId = this.data?.assignmentId;
    if (typeof assignmentId !== 'string' || !assignmentId) return null;
    if (this.type === 'ASSIGNMENT_NEW') return { name: 'do', assignmentId };
    if (this.type === 'SUBMISSION_GRADED' || this.type === 'COMMENT_REPLY') {
      return { name: 'result', assignmentId };
    }
    return null;
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
