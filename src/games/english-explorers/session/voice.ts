/**
 * Máy đọc tiếng Anh (Web Speech) theo cài đặt VOICE chung (prefsStore).
 */
import { prefsStore } from '@/core/audio/prefs';
import { speech, type SayOptions } from '@/core/utils/speech';

export function say(text: string, options?: SayOptions): void {
  if (!prefsStore.get().voice) {
    options?.onEnd?.();
    return;
  }
  speech.say(text, options);
}
