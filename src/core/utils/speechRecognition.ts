/**
 * Nghe bé nói tiếng Anh bằng Web Speech API (SpeechRecognition — Chrome / Edge / Android, Safari 14.1+).
 * Trình duyệt không hỗ trợ hoặc bé / giáo viên chặn micro thì game vẫn chơi được: bé nói với giáo viên.
 *
 * Chỉ nhận dạng chữ để khen bé ("I heard: ..."), KHÔNG chấm phát âm. `matchWords` đếm bao nhiêu từ của câu
 * mẫu xuất hiện trong câu bé nói (bỏ qua hoa / thường, dấu câu, mạo từ).
 */

// lib.dom của TypeScript chưa có kiểu SpeechRecognition — khai báo phần game dùng
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  readonly results: { readonly length: number; [index: number]: RecognitionResult };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

const Ctor: RecognitionConstructor | null = (() => {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
})();

/** Lỗi gom nhóm cho UI: chặn micro / không nghe thấy gì / lỗi khác (mạng, thiết bị...) */
export type ListenError = 'blocked' | 'no-speech' | 'failed';

export interface ListenHandlers {
  /** Chữ nghe được tới giờ (cả kết quả tạm) */
  onText: (transcript: string) => void;
  /** Luôn được gọi đúng 1 lần khi phiên nghe kết thúc (xong, lỗi, bị dừng) */
  onEnd: (error: ListenError | null) => void;
}

function toListenError(code: string): ListenError {
  if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') return 'blocked';
  if (code === 'no-speech' || code === 'aborted') return 'no-speech';
  return 'failed';
}

export const speechRecognition = {
  supported: Ctor !== null,

  /** Bắt đầu nghe một câu; trả về hàm dừng (huỷ) — gọi khi rời màn / bấm lại */
  listen({ onText, onEnd }: ListenHandlers): () => void {
    let finished = false;
    let error: ListenError | null = null;
    const finish = () => {
      if (finished) return;
      finished = true;
      onEnd(error);
    };
    if (!Ctor) {
      error = 'failed';
      finish();
      return () => undefined;
    }

    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const parts: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) parts.push(event.results[i][0]?.transcript ?? '');
      onText(parts.join(' ').replace(/\s+/g, ' ').trim());
    };
    recognition.onerror = (event) => {
      error = toListenError(event.error);
    };
    recognition.onend = finish;
    try {
      recognition.start();
    } catch {
      error = 'failed';
      finish();
    }
    return () => {
      if (finished) return;
      recognition.onresult = null;
      try {
        recognition.abort();
      } catch {
        // đã dừng
      }
      finish();
    };
  },
};

/** Từ không mang nghĩa — không bắt bé phải nói đúng */
const FILLERS = new Set(['a', 'an', 'the']);

/** Tách câu thành các từ thường, bỏ dấu câu ("T-shirt" -> "t", "shirt"; "I've" -> "ive") */
export function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Tỉ lệ từ (0–1) của `target` có trong `heard` — đủ để biết bé đã nói gần đúng câu mẫu */
export function matchWords(heard: string, target: string): number {
  const said = new Set(toWords(heard));
  const wanted = toWords(target).filter((word) => !FILLERS.has(word));
  if (wanted.length === 0) return 0;
  // "ears" ~ "ear" (từ ngắn như "is", "has" thì không bỏ "s")
  const heardIt = (word: string) => said.has(word) || (word.length > 3 && said.has(word.replace(/s$/, '')));
  return wanted.filter(heardIt).length / wanted.length;
}
