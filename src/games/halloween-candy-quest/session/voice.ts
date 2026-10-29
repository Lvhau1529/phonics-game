/**
 * Máy đọc tiếng Anh (Web Speech) theo cài đặt VOICE chung (prefsStore) và chế độ giọng của buổi chơi:
 * `teacher` = máy im, giáo viên đọc theo dòng nhắc trên màn hình.
 * Pack v1 chưa có file ghi âm từng từ (spec §14.1) — mọi câu đọc bằng giọng máy.
 */
import type { VoiceMode } from '@/games/halloween-candy-quest/session/types';
import { prefsStore } from '@/core/audio/prefs';
import { speech, type SayOptions } from '@/core/utils/speech';

/** Máy đọc được từ trong chế độ giọng này (Look & Listen / Match the Pairs cần) */
export const canSpeakIn = (voiceMode: VoiceMode): boolean => speech.supported && voiceMode !== 'teacher';

export function say(text: string, voiceMode: VoiceMode, options?: SayOptions): void {
  if (!prefsStore.get().voice || !canSpeakIn(voiceMode)) {
    options?.onEnd?.();
    return;
  }
  speech.say(text, options);
}
