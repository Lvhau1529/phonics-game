/**
 * Giọng đọc âm / từ (Web Speech — shared/speech.ts), tách khỏi nhạc & SFX: đọc lần lượt từng đoạn,
 * trong lúc đọc giảm nhạc nền rồi trả lại. Sau này có file ghi âm (audio_manifest.csv của pack)
 * thì chỉ cần thay phần phát ở đây.
 */
import type { OceanAudio } from '@/games/phonics-ocean/game/core/services';
import { prefsStore } from '@/core/audio/prefs';
import { speech } from '@/core/utils/speech';

/** Nghỉ giữa các đoạn (vd "Find" ... "at") */
const PART_GAP_MS = 250;

export default class Voice {
  private token = 0;
  private gapTimer: number | undefined;

  constructor(private readonly audio: OceanAudio) {}

  /** Có đọc được không (trình duyệt hỗ trợ + VOICE đang bật) */
  static get available(): boolean {
    return speech.supported && prefsStore.get().voice;
  }

  /** Đọc các đoạn nối tiếp; `onEnd` luôn được gọi đúng 1 lần (kể cả khi không đọc được / bị huỷ) */
  say(parts: readonly string[], { onStart, onEnd }: { onStart?: () => void; onEnd?: () => void } = {}): void {
    this.cancel();
    const token = ++this.token;
    if (!Voice.available || parts.length === 0) {
      onEnd?.();
      return;
    }
    this.audio.setDucked('speech', true);
    onStart?.();
    const finish = () => {
      if (token !== this.token) return;
      this.audio.setDucked('speech', false);
      onEnd?.();
    };
    const speakPart = (index: number) => {
      if (token !== this.token) return;
      if (index >= parts.length) {
        finish();
        return;
      }
      speech.say(parts[index], {
        onEnd: () => {
          this.gapTimer = window.setTimeout(() => speakPart(index + 1), PART_GAP_MS);
        },
      });
    };
    speakPart(0);
  }

  cancel(): void {
    this.token += 1;
    window.clearTimeout(this.gapTimer);
    speech.cancel();
    this.audio.setDucked('speech', false);
  }
}
