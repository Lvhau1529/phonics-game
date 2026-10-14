import { NotificationView } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { NotificationModel } from '@/modules/notifications/models/NotificationModel';

const dto: NotificationView = {
  id: '0b1e6f2e-1c3a-4e5b-9d7f-123456789abc',
  type: 'BONUS_AWARDED',
  title: 'GREAT JOB!',
  body: 'You got 10 bonus points.',
  data: { points: 10 },
  readAt: null,
  createdAt: '2026-10-01T08:00:00.000Z',
};

describe('NotificationModel', () => {
  it('isUnread theo readAt', () => {
    expect(new NotificationModel(dto).isUnread).toBe(true);
    expect(new NotificationModel({ ...dto, readAt: '2026-10-01T09:00:00.000Z' }).isUnread).toBe(false);
  });

  it('markedRead tạo bản mới (vẫn là model, giữ getter); đã đọc rồi thì trả chính nó', () => {
    const item = new NotificationModel(dto);
    const read = item.markedRead('2026-10-01T09:00:00.000Z');
    expect(read).toBeInstanceOf(NotificationModel);
    expect(read).not.toBe(item);
    expect(read.isUnread).toBe(false);
    expect(read.readAt).toBe('2026-10-01T09:00:00.000Z');
    expect(item.isUnread).toBe(true);
    expect(read.markedRead('2026-10-02T00:00:00.000Z')).toBe(read);
  });

  it('target: thông báo bài tập mở màn làm bài / kết quả; loại khác hoặc thiếu assignmentId -> null', () => {
    const data = { assignmentId: 'a1', submissionId: 's1' };
    expect(new NotificationModel({ ...dto, type: 'ASSIGNMENT_NEW', data }).target).toEqual({
      name: 'do',
      assignmentId: 'a1',
    });
    expect(new NotificationModel({ ...dto, type: 'SUBMISSION_GRADED', data }).target).toEqual({
      name: 'result',
      assignmentId: 'a1',
    });
    expect(new NotificationModel({ ...dto, type: 'COMMENT_REPLY', data }).target?.name).toBe('result');
    expect(new NotificationModel({ ...dto, type: 'ASSIGNMENT_NEW', data: null }).target).toBeNull();
    expect(new NotificationModel(dto).target).toBeNull();
  });

  it('round-trip: toJSON -> NotificationView.parse -> new NotificationModel', () => {
    const item = new NotificationModel(dto);
    const restored = new NotificationModel(NotificationView.parse(JSON.parse(JSON.stringify(item))));
    expect(restored.toJSON()).toEqual(dto);
    expect(restored.isUnread).toBe(true);
  });
});
