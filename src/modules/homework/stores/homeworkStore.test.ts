import type { MyAssignmentDetail, SubmissionDetail } from '@phonics/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const services = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  start: vi.fn(),
  saveAnswers: vi.fn(),
  submit: vi.fn(),
}));

vi.mock('@/core/config/account', () => ({
  ACCOUNT_ENABLED: true,
  API_URL: 'http://api',
  OFFLINE_MODE: false,
}));
vi.mock('@/modules/auth/stores/authStore', () => ({
  authStore: { get: () => ({ status: 'signedIn', user: { id: 'u1' } }), subscribe: () => () => undefined },
  isSignedIn: () => true,
}));
vi.mock('@/modules/notifications/stores/notificationsStore', () => ({
  notificationsStore: { get: () => ({ items: [] }), subscribe: () => () => undefined },
}));
vi.mock('@/modules/homework/services/assignmentsService', () => ({
  assignmentsService: { list: services.list, detail: services.detail, ranking: vi.fn() },
}));
vi.mock('@/modules/homework/services/submissionsService', () => ({
  submissionsService: { start: services.start, saveAnswers: services.saveAnswers, submit: services.submit },
}));

const { homeworkActions, homeworkStore } = await import('@/modules/homework/stores/homeworkStore');
const { AssignmentDetailModel } = await import('@/modules/homework/models/AssignmentModel');
const { SubmissionModel } = await import('@/modules/homework/models/SubmissionModel');
const { AUTOSAVE_MS } = await import('@/modules/homework/constants');
const { draftKey, readDraft } = await import('@/modules/homework/answers/draftStorage');

const question = (id: string) => ({
  id,
  type: 'MULTIPLE_CHOICE' as const,
  gradingMode: 'AUTO' as const,
  instruction: 'Circle',
  instructionVi: null,
  example: null,
  config: {
    type: 'MULTIPLE_CHOICE' as const,
    options: [
      { id: 'o1', text: 'a' },
      { id: 'o2', text: 'b' },
    ],
  },
});

const worksheet = {
  worksheetId: 'w1',
  title: 'W',
  subject: 'PHONICS' as const,
  topic: null,
  grade: null,
  week: null,
  day: null,
  kind: 'WORKSHEET' as const,
  maxScore: 2,
  snapshotAt: '2026-10-09T00:00:00.000Z',
  sections: [
    {
      id: 'sec',
      order: 0,
      title: 'Part 1',
      instruction: null,
      items: [
        { worksheetItemId: 'i1', order: 0, points: 1, question: question('q1') },
        { worksheetItemId: 'i2', order: 1, points: 1, question: question('q2') },
      ],
    },
  ],
};

const detail: MyAssignmentDetail = {
  id: 'a1',
  worksheetTitle: 'W',
  subject: 'PHONICS',
  topic: null,
  kind: 'WORKSHEET',
  scheduledFor: '2026-10-09',
  availableFrom: '2026-10-09T00:00:00.000Z',
  dueAt: null,
  allowLate: false,
  maxAttempts: 1,
  showAnswersAfterSubmit: false,
  status: 'OPEN',
  isOpen: true,
  maxScore: 2,
  itemCount: 2,
  hasManualItems: false,
  attemptsUsed: 0,
  canStart: true,
  inProgressSubmissionId: null,
  best: null,
  unreadComments: 0,
  worksheet,
  media: {},
  submissions: [],
};

const submission: SubmissionDetail = {
  id: 's1',
  assignmentId: 'a1',
  studentId: 'u1',
  studentName: 'Bi',
  attemptNo: 1,
  status: 'IN_PROGRESS',
  startedAt: '2026-10-09T01:00:00.000Z',
  submittedAt: null,
  gradedAt: null,
  gradedById: null,
  gradedByName: null,
  autoScore: 0,
  manualScore: null,
  totalScore: null,
  maxScore: 2,
  percent: null,
  durationMs: null,
  late: false,
  updatedAt: '2026-10-09T01:00:00.000Z',
  answers: [
    {
      worksheetItemId: 'i1',
      questionType: 'MULTIPLE_CHOICE',
      maxPoints: 1,
      answer: { type: 'MULTIPLE_CHOICE', optionId: 'o2' },
      isCorrect: null,
      autoScore: null,
      manualScore: null,
      score: null,
      teacherNote: null,
      gradeDetail: null,
      gradedAt: null,
      answerKey: null,
    },
  ],
  worksheet,
  media: {},
  pendingManual: 0,
};

const answerA = { type: 'MULTIPLE_CHOICE', optionId: 'o1' } as const;

describe('homeworkStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    homeworkActions.reset();
    services.detail.mockResolvedValue(new AssignmentDetailModel(detail));
    services.start.mockResolvedValue(new SubmissionModel(submission));
    services.saveAnswers.mockResolvedValue({ saved: 1, updatedAt: '2026-10-09T01:05:00.000Z' });
    services.submit.mockResolvedValue({
      submission: { ...submission, status: 'GRADED' },
      rank: { rank: 1, members: 3 },
    });
    services.list.mockResolvedValue([]);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('open: nạp câu trả lời server, mở câu đầu tiên chưa làm; nháp mới hơn thì thắng và được hẹn lưu', async () => {
    localStorage.setItem(
      draftKey('s1'),
      JSON.stringify({
        userId: 'u1',
        assignmentId: 'a1',
        answers: { i2: answerA },
        updatedAt: '2026-10-09T01:30:00.000Z',
      }),
    );
    const attempt = await homeworkActions.open('a1');
    expect(attempt.answers.i1).toEqual({ type: 'MULTIPLE_CHOICE', optionId: 'o2' });
    expect(attempt.answers.i2).toEqual(answerA);
    expect(attempt.dirty).toEqual(['i2']);
    expect(attempt.index).toBe(0);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(services.saveAnswers).toHaveBeenCalledWith(
      's1',
      { answers: [{ worksheetItemId: 'i2', answer: answerA }] },
      false,
    );
    expect(homeworkStore.get().attempt?.dirty).toEqual([]);
  });

  it('setAnswer: ghi nháp localStorage, tự lưu sau AUTOSAVE_MS chỉ câu đã đổi', async () => {
    await homeworkActions.open('a1');
    homeworkActions.setAnswer('i2', answerA);
    expect(readDraft('s1', 'u1')?.answers.i2).toEqual(answerA);
    expect(homeworkStore.get().attempt?.dirty).toEqual(['i2']);
    expect(services.saveAnswers).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(services.saveAnswers).toHaveBeenCalledTimes(1);
    expect(homeworkStore.get().attempt?.savedAt).toBe('2026-10-09T01:05:00.000Z');
  });

  it('submit: lưu nốt rồi nộp, xoá nháp, giữ kết quả cho màn RESULT', async () => {
    await homeworkActions.open('a1');
    homeworkActions.setAnswer('i2', answerA);
    const response = await homeworkActions.submit();
    expect(services.saveAnswers).toHaveBeenCalledTimes(1);
    expect(services.submit).toHaveBeenCalledWith('s1');
    expect(response.rank?.rank).toBe(1);
    expect(localStorage.getItem(draftKey('s1'))).toBeNull();
    expect(homeworkStore.get().attempt).toBeNull();
    expect(homeworkStore.get().result?.assignmentId).toBe('a1');
  });

  it('server từ chối (bài đã đóng) → khoá, không gửi lại', async () => {
    const { ApiError } = await import('@/core/api/client');
    await homeworkActions.open('a1');
    services.saveAnswers.mockRejectedValueOnce(new ApiError(409, 'ASSIGNMENT_NOT_OPEN', 'closed'));
    homeworkActions.setAnswer('i2', answerA);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(homeworkStore.get().attempt?.locked).toBe(true);
    homeworkActions.setAnswer('i1', answerA);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    expect(services.saveAnswers).toHaveBeenCalledTimes(1);
  });
});
