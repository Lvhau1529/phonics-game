/**
 * Phát âm từ vựng bằng Web Speech API (có sẵn trên Chrome / Android / iOS Safari).
 * Trình duyệt không hỗ trợ thì game vẫn chạy bình thường — chỉ không có giọng đọc.
 *
 * Khi có file ghi âm thật (plan §28: thư mục voice/) chỉ cần thay phần `say`.
 */
const synth: SpeechSynthesis | null =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

/** Đọc chậm hơn bình thường một chút cho trẻ 5 tuổi */
const DEFAULT_RATE = 0.8;
/** Phòng khi trình duyệt không bắn sự kiện `end` */
const MAX_UTTERANCE_MS = 4000;

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): void {
  const voices = synth?.getVoices() ?? [];
  voice =
    voices.find((v) => v.lang === 'en-US' && v.localService) ??
    voices.find((v) => v.lang.replace('_', '-').startsWith('en-US')) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null;
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export interface SayOptions {
  rate?: number;
  onStart?: () => void;
  /** Luôn được gọi đúng 1 lần (kết thúc, lỗi, bị huỷ hoặc quá giờ) */
  onEnd?: () => void;
}

export const speech = {
  supported: synth !== null,

  /** Gọi trong handler của một lần chạm: iOS chỉ cho phát tiếng sau thao tác của người dùng */
  unlock(): void {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    synth.speak(utterance);
  },

  say(text: string, { rate = DEFAULT_RATE, onStart, onEnd }: SayOptions = {}): void {
    if (!synth) {
      onEnd?.();
      return;
    }
    synth.cancel();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      onEnd?.();
    };
    const timeout = window.setTimeout(finish, MAX_UTTERANCE_MS);

    // Chữ thường: tránh bị đánh vần như từ viết tắt ("MAP" -> "M-A-P")
    const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
    utterance.lang = 'en-US';
    utterance.rate = rate;
    if (voice) utterance.voice = voice;
    utterance.onstart = () => onStart?.();
    utterance.onend = finish;
    utterance.onerror = finish;
    synth.speak(utterance);
  },

  cancel(): void {
    synth?.cancel();
  },
};
