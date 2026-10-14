import type { MyAssignmentSummary } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { AssignmentModel } from '@/platform/homework/models/AssignmentModel';

const base: MyAssignmentSummary = {
  id: 'a1',
  worksheetTitle: 'Letter Nn',
  subject: 'PHONICS',
  topic: 'Nn',
  kind: 'WORKSHEET',
  scheduledFor: '2026-10-09',
  availableFrom: '2026-10-09T00:00:00.000Z',
  dueAt: null,
  allowLate: false,
  maxAttempts: 2,
  showAnswersAfterSubmit: true,
  status: 'OPEN',
  isOpen: true,
  maxScore: 10,
  itemCount: 5,
  hasManualItems: false,
  attemptsUsed: 0,
  canStart: true,
  inProgressSubmissionId: null,
  best: null,
  unreadComments: 0,
};

describe('AssignmentModel', () => {
  it('bài mới: TO DO, nút START', () => {
    const m = new AssignmentModel(base);
    expect(m.isTodo).toBe(true);
    expect(m.statusLabel).toBe('NEW');
    expect(m.actionLabel).toBe('START');
    expect(m.scoreText).toBeNull();
    expect(m.subtitle).toBe('Nn · PHONICS');
  });

  it('đang làm dở: CONTINUE', () => {
    const m = new AssignmentModel({ ...base, inProgressSubmissionId: 's1', attemptsUsed: 1 });
    expect(m.statusLabel).toBe('CONTINUE');
    expect(m.actionLabel).toBe('CONTINUE');
  });

  it('đã chấm: sao theo %, TRY AGAIN khi còn lượt, SEE RESULT khi hết', () => {
    const best = {
      submissionId: 's1',
      status: 'GRADED' as const,
      totalScore: 9,
      percent: 0.9,
      late: false,
      rank: 2,
    };
    const again = new AssignmentModel({ ...base, attemptsUsed: 1, best });
    expect(again.isGraded).toBe(true);
    expect(again.stars).toBe(3);
    expect(again.scoreText).toBe('9/10');
    expect(again.actionLabel).toBe('TRY AGAIN');
    expect(again.isTodo).toBe(false);
    const done = new AssignmentModel({
      ...base,
      attemptsUsed: 2,
      canStart: false,
      best: { ...best, percent: 0.6 },
    });
    expect(done.stars).toBe(1);
    expect(done.actionLabel).toBe('SEE RESULT');
  });

  it('chờ chấm / sắp mở / đã đóng', () => {
    const pending = new AssignmentModel({
      ...base,
      best: {
        submissionId: 's1',
        status: 'SUBMITTED',
        totalScore: null,
        percent: null,
        late: false,
        rank: null,
      },
    });
    expect(pending.statusLabel).toBe('TEACHER IS CHECKING');
    expect(
      new AssignmentModel({ ...base, status: 'SCHEDULED', isOpen: false, canStart: false }).statusLabel,
    ).toBe('SOON');
    expect(
      new AssignmentModel({ ...base, status: 'CLOSED', isOpen: false, canStart: false }).statusLabel,
    ).toBe('CLOSED');
  });
});
