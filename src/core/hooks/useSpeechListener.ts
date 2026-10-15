/**
 * React: một phiên "bé nói, máy nghe" (core/utils/speechRecognition) cho nút micro trong game.
 *
 *   idle ──start()──▶ listening ──(nói xong / hết giờ)──▶ heard | silent | blocked
 *
 * Rời màn (unmount) hoặc `reset()` thì dừng nghe. `supported = false` -> game ẩn nút micro.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { speech } from '@/core/utils/speech';
import { speechRecognition } from '@/core/utils/speechRecognition';

export type ListenStatus = 'idle' | 'listening' | 'heard' | 'silent' | 'blocked';

export interface SpeechListener {
  supported: boolean;
  status: ListenStatus;
  /** Chữ nghe được (rỗng nếu chưa nghe thấy gì) */
  transcript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechListener(): SpeechListener {
  const [status, setStatus] = useState<ListenStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    speech.cancel(); // máy đang đọc thì micro nghe nhầm giọng máy
    setTranscript('');
    setStatus('listening');
    let heard = '';
    stopRef.current = speechRecognition.listen({
      onText: (text) => {
        heard = text;
        setTranscript(text);
      },
      onEnd: (error) => {
        stopRef.current = null;
        if (heard) setStatus('heard');
        else setStatus(error === 'blocked' ? 'blocked' : 'silent');
      },
    });
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setStatus('idle');
    setTranscript('');
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { supported: speechRecognition.supported, status, transcript, start, stop, reset };
}
