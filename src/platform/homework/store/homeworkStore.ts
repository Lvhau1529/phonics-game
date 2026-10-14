/**
 * Trạng thái bài tập về nhà của học sinh:
 *   list    — bài giao của bé (GET /me/assignments?filter=all), tải khi mở màn HOMEWORK / có thông báo bài mới
 *   attempt — lần làm đang mở: phiếu (không đáp án) + câu trả lời + chỉ số câu; mỗi lần sửa ghi bản nháp
 *             localStorage và hẹn tự lưu lên server sau AUTOSAVE_MS (PUT answers chỉ gửi câu đã đổi)
 *   result  — kết quả vừa nộp (hạng có ngay khi không có câu chấm tay) để màn RESULT hiện tức thì
 * Mất mạng: giữ bản nháp, có mạng lại (`online`) thì lưu tiếp; đóng tab thì gửi `keepalive`.
 */
import type { MediaMap, MediaRef, QuestionAnswer, SubmitResponse } from '@phonics/contracts';
import { authStore, isSignedIn } from '@/platform/account/authStore';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { notificationsStore } from '@/platform/account/notificationsStore';
import { isApiError } from '@/platform/api/client';
import { assignmentsService } from '@/platform/homework/api/assignmentsService';
import { submissionsService } from '@/platform/homework/api/submissionsService';
import { clearDraft, mergeDraft, readDraft, writeDraft } from '@/platform/homework/answers/draftStorage';
import { AUTOSAVE_MS } from '@/platform/homework/config';
import type { AssignmentDetailModel, AssignmentModel } from '@/platform/homework/models/AssignmentModel';
import type { SubmissionModel } from '@/platform/homework/models/SubmissionModel';
import { useStore } from '@/platform/hooks/useStore';
import { createStore } from '@/shared/createStore';

export interface ListState {
  items: AssignmentModel[];
  loading: boolean;
  loaded: boolean;
  error: unknown;
}

export interface Attempt {
  assignment: AssignmentDetailModel;
  submission: SubmissionModel;
  answers: Record<string, QuestionAnswer>;
  /** URL media của phiếu + file bé vừa tải lên */
  media: MediaMap;
  /** Câu đang mở (0-based) */
  index: number;
  /** worksheetItemId đã sửa, chưa lưu lên server */
  dirty: string[];
  saving: boolean;
  saveError: unknown;
  savedAt: string | null;
  /** Server từ chối (bài đã đóng / đã nộp): dừng tự lưu, màn làm bài báo cho bé */
  locked: boolean;
  submitting: boolean;
}

export interface HomeworkState {
  list: ListState;
  attempt: Attempt | null;
  /** Kết quả lần nộp gần nhất (theo assignmentId) */
  result: { assignmentId: string; response: SubmitResponse } | null;
}

const EMPTY_LIST: ListState = { items: [], loading: false, loaded: false, error: null };

export const homeworkStore = createStore<HomeworkState>({ list: EMPTY_LIST, attempt: null, result: null });

let saveTimer = 0;
let saveInFlight: Promise<void> | null = null;

const patchAttempt = (patch: Partial<Attempt> | ((attempt: Attempt) => Partial<Attempt>)): void =>
  homeworkStore.set((state) => {
    if (!state.attempt) return state;
    const next = typeof patch === 'function' ? patch(state.attempt) : patch;
    return { ...state, attempt: { ...state.attempt, ...next } };
  });

/** Lỗi 4xx nghĩa là bài không còn sửa được — gửi lại cũng vô ích */
const isLockError = (error: unknown): boolean =>
  isApiError(error) &&
  error.isClientError &&
  error.code !== 'RATE_LIMITED' &&
  error.code !== 'UNAUTHORIZED' &&
  error.code !== 'TOKEN_EXPIRED';

export const homeworkActions = {
  async loadList(): Promise<void> {
    if (!ACCOUNT_ENABLED || !isSignedIn()) return;
    homeworkStore.set((state) => ({ ...state, list: { ...state.list, loading: true } }));
    try {
      const items = await assignmentsService.list('all');
      homeworkStore.set((state) => ({
        ...state,
        list: { items, loading: false, loaded: true, error: null },
      }));
    } catch (error) {
      homeworkStore.set((state) => ({ ...state, list: { ...state.list, loading: false, error } }));
    }
  },

  /**
   * Mở bài để làm: tải phiếu + bắt đầu / tiếp tục attempt, gộp bản nháp cục bộ (mới hơn server thì thắng).
   * Ném ApiError (ASSIGNMENT_NOT_OPEN, ATTEMPTS_EXHAUSTED...) để màn hình báo cho bé.
   */
  async open(assignmentId: string): Promise<Attempt> {
    const current = homeworkStore.get().attempt;
    if (current && current.assignment.id === assignmentId && !current.locked) return current;
    await homeworkActions.leave();
    const userId = authStore.get().user?.id ?? '';
    const [assignment, submission] = await Promise.all([
      assignmentsService.detail(assignmentId),
      submissionsService.start(assignmentId),
    ]);
    const draft = readDraft(submission.id, userId);
    const answers = mergeDraft(submission.answerMap, submission.updatedAt, draft);
    // Câu trong nháp khác server → coi là chưa lưu
    const dirty = Object.keys(answers).filter(
      (id) => JSON.stringify(answers[id]) !== JSON.stringify(submission.answerMap[id]),
    );
    const attempt: Attempt = {
      assignment,
      submission,
      answers,
      media: { ...assignment.media, ...submission.media },
      index: firstUnanswered(assignment, answers),
      dirty,
      saving: false,
      saveError: null,
      savedAt: submission.updatedAt,
      locked: false,
      submitting: false,
    };
    homeworkStore.set((state) => ({ ...state, attempt, result: null }));
    if (dirty.length) homeworkActions.scheduleSave();
    return attempt;
  },

  setAnswer(worksheetItemId: string, answer: QuestionAnswer): void {
    const { attempt } = homeworkStore.get();
    if (!attempt || attempt.locked) return;
    const answers = { ...attempt.answers, [worksheetItemId]: answer };
    const dirty = attempt.dirty.includes(worksheetItemId)
      ? attempt.dirty
      : [...attempt.dirty, worksheetItemId];
    patchAttempt({ answers, dirty });
    writeDraft(attempt.submission.id, {
      userId: authStore.get().user?.id ?? '',
      assignmentId: attempt.assignment.id,
      answers,
      updatedAt: new Date().toISOString(),
    });
    homeworkActions.scheduleSave();
  },

  /** Thêm file vừa tải lên (ghi âm / ảnh tô) vào map media để renderer hiện lại ngay */
  addMedia(ref: MediaRef): void {
    patchAttempt((attempt) => ({ media: { ...attempt.media, [ref.id]: ref } }));
  },

  goTo(index: number): void {
    patchAttempt((attempt) => ({
      index: Math.max(0, Math.min(attempt.assignment.items.length - 1, index)),
    }));
  },

  scheduleSave(): void {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => void homeworkActions.flush(), AUTOSAVE_MS);
  },

  /** Lưu các câu đã đổi lên server (single flight). `keepalive`: lúc đóng trang. */
  flush(keepalive = false): Promise<void> {
    window.clearTimeout(saveTimer);
    if (saveInFlight) return saveInFlight;
    const { attempt } = homeworkStore.get();
    if (!attempt || attempt.locked || attempt.dirty.length === 0) return Promise.resolve();
    const ids = attempt.dirty;
    const body = { answers: ids.map((id) => ({ worksheetItemId: id, answer: attempt.answers[id] })) };
    patchAttempt({ saving: true, saveError: null });
    saveInFlight = submissionsService
      .saveAnswers(attempt.submission.id, body, keepalive)
      .then((ack) => {
        // Giữ lại câu vừa bị sửa tiếp trong lúc đang gửi
        patchAttempt((a) => ({
          dirty: a.dirty.filter((id) => !ids.includes(id) || a.answers[id] !== attempt.answers[id]),
          saving: false,
          savedAt: ack.updatedAt,
        }));
      })
      .catch((error: unknown) => {
        patchAttempt({ saving: false, saveError: error, locked: isLockError(error) });
      })
      .finally(() => {
        saveInFlight = null;
        const next = homeworkStore.get().attempt;
        if (next && !next.locked && next.dirty.length && !next.saveError) homeworkActions.scheduleSave();
      });
    return saveInFlight;
  },

  /** Nộp bài: lưu nốt rồi POST submit; xong thì xoá bản nháp, giữ kết quả cho màn RESULT */
  async submit(): Promise<SubmitResponse> {
    const { attempt } = homeworkStore.get();
    if (!attempt) throw new Error('No attempt');
    patchAttempt({ submitting: true });
    try {
      await homeworkActions.flush();
      const after = homeworkStore.get().attempt;
      if (after?.saveError) throw after.saveError;
      const response = await submissionsService.submit(attempt.submission.id);
      clearDraft(attempt.submission.id);
      homeworkStore.set((state) => ({
        ...state,
        attempt: null,
        result: { assignmentId: attempt.assignment.id, response },
      }));
      void homeworkActions.loadList();
      return response;
    } catch (error) {
      patchAttempt({ submitting: false });
      throw error;
    }
  },

  /** Rời màn làm bài: lưu nốt (nếu có) rồi bỏ attempt khỏi bộ nhớ (bản nháp localStorage vẫn còn) */
  async leave(): Promise<void> {
    const { attempt } = homeworkStore.get();
    if (!attempt) return;
    await homeworkActions.flush().catch(() => {});
    homeworkStore.set((state) => (state.attempt === attempt ? { ...state, attempt: null } : state));
  },

  reset(): void {
    window.clearTimeout(saveTimer);
    homeworkStore.set({ list: EMPTY_LIST, attempt: null, result: null });
  },

  init(): void {
    if (!ACCOUNT_ENABLED) return;
    window.addEventListener('online', () => void homeworkActions.flush());
    window.addEventListener('pagehide', () => void homeworkActions.flush(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void homeworkActions.flush(true);
    });
    // Đăng xuất → bỏ dữ liệu của người cũ (máy lớp dùng chung)
    let wasSignedIn = isSignedIn();
    authStore.subscribe(() => {
      const now = isSignedIn();
      if (now === wasSignedIn) return;
      wasSignedIn = now;
      if (!now) homeworkActions.reset();
    });
    // Thông báo bài mới / chấm xong → danh sách đổi
    let seenNewest: string | null = null;
    notificationsStore.subscribe(() => {
      const newest = notificationsStore.get().items[0];
      if (!newest || newest.id === seenNewest) return;
      const first = seenNewest === null;
      seenNewest = newest.id;
      if (!first && newest.target && homeworkStore.get().list.loaded) void homeworkActions.loadList();
    });
  },
};

/** Câu đầu tiên bé chưa làm (tiếp tục đúng chỗ) */
function firstUnanswered(assignment: AssignmentDetailModel, answers: Record<string, QuestionAnswer>): number {
  const index = assignment.items.findIndex((item) => !answers[item.worksheetItemId]);
  return index === -1 ? 0 : index;
}

export const useHomeworkList = (): ListState => useStore(homeworkStore, (state) => state.list);
export const useAttempt = (): Attempt | null => useStore(homeworkStore, (state) => state.attempt);
export const useHomeworkResult = (): HomeworkState['result'] =>
  useStore(homeworkStore, (state) => state.result);
/** Số bài còn phải làm (badge nút HOMEWORK) */
export const useTodoCount = (): number =>
  useStore(homeworkStore, (state) => state.list.items.filter((item) => item.isTodo).length);
