/**
 * Trạng thái màn xem trước `#/preview` (admin nhúng iframe, giao thức ở models/preview.ts):
 * nội dung admin gửi + câu trả lời thử + câu đang mở + kết quả CHECK. Không gọi API, không lưu gì:
 * ghi âm / ảnh tô chỉ thành blob URL cục bộ.
 */
import type { MediaMap, MediaRef, QuestionAnswer } from '@phonics/contracts';
import { ADMIN_ORIGINS } from '@/core/config/preview';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { createStore } from '@/core/store/createStore';
import { useStore } from '@/core/store/useStore';
import {
  AdminMessage,
  isPreviewMessage,
  PREVIEW_CHANNEL,
  type PreviewContent,
  type PreviewItem,
  type PreviewMessage,
  type PreviewTone,
} from '@/modules/homework/models/preview';
import type { UploadOptions } from '@/modules/homework/services/mediaService';

export type PreviewStatus =
  /** Chờ admin gửi nội dung */
  | 'waiting'
  /** Mở thẳng (không nằm trong iframe của admin) */
  | 'standalone'
  | 'ready';

export interface PreviewState {
  status: PreviewStatus;
  title: string;
  items: PreviewItem[];
  /** Media của nội dung + file bé "tải lên" cục bộ */
  media: MediaMap;
  answers: Record<string, QuestionAnswer>;
  index: number;
  /** Đã bấm CHECK, đang chờ admin chấm */
  checking: boolean;
  results: Record<string, PreviewTone> | null;
}

const INITIAL: PreviewState = {
  status: 'waiting',
  title: '',
  items: [],
  media: {},
  answers: {},
  index: 0,
  checking: false,
  results: null,
};

export const previewStore = createStore<PreviewState>(INITIAL);

/** Origin admin đã gửi nội dung (trả lời đúng nơi đó) */
let parentOrigin: string | null = null;
/** Nội dung lần trước (admin gửi lại y hệt thì bỏ qua để không xoá câu trả lời / kết quả) */
let lastContent = '';
/** Media do bé tạo trong lần xem trước (giữ qua các lần admin gửi lại) */
let localMedia: MediaMap = {};

const post = (message: PreviewMessage, origin: string) => window.parent.postMessage(message, origin);

/** Nội dung mới: giữ câu trả lời của câu còn nguyên config, bỏ kết quả cũ */
export function applyContent(state: PreviewState, content: PreviewContent): PreviewState {
  const before = new Map(state.items.map((item) => [item.key, JSON.stringify(item.config)]));
  const answers: Record<string, QuestionAnswer> = {};
  for (const item of content.items) {
    const answer = state.answers[item.key];
    if (answer && before.get(item.key) === JSON.stringify(item.config)) answers[item.key] = answer;
  }
  return {
    ...state,
    status: 'ready',
    title: content.title,
    items: content.items,
    media: { ...content.media, ...localMedia },
    answers,
    index: Math.min(state.index, Math.max(content.items.length - 1, 0)),
    checking: false,
    results: null,
  };
}

function onMessage(event: MessageEvent): void {
  if (event.source !== window.parent || !ADMIN_ORIGINS.includes(event.origin)) return;
  if (!isPreviewMessage(event.data)) return;
  const parsed = AdminMessage.safeParse(event.data);
  if (!parsed.success) {
    console.error('[Phonics Arcade] Invalid preview message:', parsed.error.issues);
    return;
  }
  parentOrigin = event.origin;
  const message = parsed.data;
  if (message.type === 'load') {
    const { title, items, media } = message;
    const key = JSON.stringify({ title, items, media });
    if (key === lastContent) return;
    lastContent = key;
    previewStore.set((state) => applyContent(state, { title, items, media }));
    return;
  }
  playSfx(SFX.FINAL_RESULTS);
  previewStore.set((state) => ({ ...state, checking: false, results: message.results }));
}

export const previewActions = {
  /** Mở màn: nghe message của admin + báo `ready`. Trả hàm huỷ */
  connect(): () => void {
    if (window.parent === window) {
      previewStore.set({ ...INITIAL, status: 'standalone' });
      return () => undefined;
    }
    window.addEventListener('message', onMessage);
    // Chưa biết admin ở origin nào: gửi tới từng origin được phép (sai origin thì trình duyệt bỏ qua)
    ADMIN_ORIGINS.forEach((origin) => post({ channel: PREVIEW_CHANNEL, type: 'ready' }, origin));
    return () => window.removeEventListener('message', onMessage);
  },

  setAnswer(key: string, answer: QuestionAnswer): void {
    previewStore.set((state) => ({ ...state, answers: { ...state.answers, [key]: answer } }));
  },

  goTo(index: number): void {
    previewStore.set((state) => ({
      ...state,
      index: Math.max(0, Math.min(index, state.items.length - 1)),
    }));
  },

  addMedia(ref: MediaRef): void {
    localMedia = { ...localMedia, [ref.id]: ref };
    previewStore.set((state) => ({ ...state, media: { ...state.media, [ref.id]: ref } }));
  },

  /** Gửi câu trả lời cho admin chấm */
  check(): void {
    if (!parentOrigin) return;
    const { answers } = previewStore.get();
    previewStore.set((state) => ({ ...state, checking: true }));
    post({ channel: PREVIEW_CHANNEL, type: 'check', answers }, parentOrigin);
  },

  /** TRY AGAIN: xoá câu trả lời + kết quả, về câu đầu */
  retry(): void {
    previewStore.set((state) => ({ ...state, answers: {}, index: 0, checking: false, results: null }));
  },

  /** Thay cho tải media lên server: chỉ tạo blob URL trong trang */
  async upload(blob: Blob, options: UploadOptions): Promise<MediaRef> {
    options.onProgress?.(1);
    return { id: crypto.randomUUID(), url: URL.createObjectURL(blob), kind: options.kind };
  },
};

export const usePreview = (): PreviewState => useStore(previewStore, (state) => state);
