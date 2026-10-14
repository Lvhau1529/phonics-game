/**
 * Ghi âm bằng MediaRecorder: idle → requesting (xin mic) → recording → recorded (có blob để nghe lại / gửi).
 * iOS: gọi `start` trong thao tác chạm (đã `resumeAudio`). Tự dừng sau MAX_RECORD_SECONDS.
 * Mime: webm/opus (Chrome, Android) → webm → mp4 (Safari) → ogg; trình duyệt không hỗ trợ → `supported=false`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { resumeAudio } from '@/platform/audio/audioContext';
import { MAX_RECORD_SECONDS } from '@/platform/homework/config';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'recorded';

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export const recorderSupported = (): boolean =>
  typeof MediaRecorder !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia;

/** Lỗi mic → câu tiếng Anh ngắn cho bé */
export function recorderErrorText(error: unknown): string {
  const name = (error as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Please allow the microphone.';
  if (name === 'NotFoundError') return 'No microphone found.';
  return 'Recording did not work. Try again.';
}

export interface Recorder {
  state: RecorderState;
  supported: boolean;
  /** Giây đã ghi (đang ghi) hoặc thời lượng bản ghi */
  seconds: number;
  blob: Blob | null;
  /** URL tạm để nghe lại */
  url: string | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useMediaRecorder(): Recorder {
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef(0);
  const startedAt = useRef(0);

  const release = useCallback(() => {
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
  }, []);

  const reset = useCallback(() => {
    release();
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setBlob(null);
    setSeconds(0);
    setError(null);
    setState('idle');
  }, [release, url]);

  const stop = useCallback(() => {
    const current = recorder.current;
    if (current && current.state !== 'inactive') current.stop();
    else release();
  }, [release]);

  const start = useCallback(async () => {
    if (!recorderSupported()) {
      setError('Recording is not available on this device.');
      return;
    }
    resumeAudio();
    setError(null);
    setState('requesting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = rec;
      chunks.current = [];
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || mimeType || 'audio/webm';
        const result = new Blob(chunks.current, { type });
        const elapsed = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        release();
        setBlob(result);
        setUrl(URL.createObjectURL(result));
        setSeconds(elapsed);
        setState('recorded');
      };
      startedAt.current = Date.now();
      rec.start(1000);
      setSeconds(0);
      setState('recording');
      timer.current = window.setInterval(() => {
        const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_RECORD_SECONDS) stop();
      }, 250);
    } catch (caught) {
      release();
      setError(recorderErrorText(caught));
      setState('idle');
    }
  }, [release, stop]);

  // Rời màn: tắt mic, thu hồi URL
  useEffect(
    () => () => {
      release();
      if (url) URL.revokeObjectURL(url);
    },
    [release, url],
  );

  return { state, supported: recorderSupported(), seconds, blob, url, error, start, stop, reset };
}
