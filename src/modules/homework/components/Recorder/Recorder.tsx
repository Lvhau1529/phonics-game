/**
 * Ghi âm cho dạng SPEAK / TRACE_AND_READ: nút mic lớn → đang ghi (đếm giây, STOP) → nghe lại → SEND
 * (tải lên object storage: presign → PUT → complete) → báo "SAVED" và trả `MediaRef` cho renderer.
 * Đã có bản ghi (làm dở / xem lại) thì hiện trình phát + nút RECORD AGAIN.
 */
import { useState } from 'react';
import clsx from 'clsx';
import type { MediaRef } from '@phonics/contracts';
import { errorText } from '@/core/api/errorText';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { mediaService } from '@/modules/homework/services/mediaService';
import { useMedia } from '@/modules/homework/renderers/mediaContext';
import { useMediaRecorder } from '@/modules/homework/hooks/useMediaRecorder';
import Button from '@/ui/Button/Button';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import styles from '@/modules/homework/components/Recorder/Recorder.module.scss';

interface RecorderProps {
  /** Bản ghi đã lưu (mediaId trong câu trả lời) */
  mediaId?: string | null;
  disabled?: boolean;
  onUploaded: (ref: MediaRef) => void;
}

export default function Recorder({ mediaId, disabled, onUploaded }: RecorderProps) {
  const saved = useMedia(mediaId);
  const rec = useMediaRecorder();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [again, setAgain] = useState(false);

  const send = async () => {
    if (!rec.blob) return;
    setUploading(true);
    setUploadError(null);
    try {
      const ref = await mediaService.upload(rec.blob, {
        kind: 'AUDIO',
        fileName: `recording.${rec.blob.type.includes('mp4') ? 'm4a' : rec.blob.type.includes('ogg') ? 'ogg' : 'webm'}`,
        durationMs: rec.seconds * 1000,
        onProgress: setProgress,
      });
      playSfx(SFX.WORD_COMPLETE);
      onUploaded(ref);
      rec.reset();
      setAgain(false);
    } catch (caught) {
      setUploadError(errorText(caught));
    } finally {
      setUploading(false);
    }
  };

  if (disabled) {
    return saved ? (
      <audio className={styles.player} controls src={saved.url} />
    ) : (
      <p className={styles.hint}>NO RECORDING</p>
    );
  }

  // Đã có bản ghi trên server và bé chưa bấm ghi lại
  if (saved && !again && rec.state === 'idle') {
    return (
      <div className={styles.recorder}>
        <p className={styles.saved}>SAVED!</p>
        <audio className={styles.player} controls src={saved.url} />
        <Button color="cream" onClick={() => setAgain(true)}>
          RECORD AGAIN
        </Button>
      </div>
    );
  }

  if (!rec.supported) return <p className={styles.hint}>Recording is not available on this device.</p>;

  return (
    <div className={styles.recorder}>
      {rec.state === 'idle' || rec.state === 'requesting' ? (
        <button
          type="button"
          className={styles.mic}
          disabled={rec.state === 'requesting'}
          aria-label="Record"
          onClick={() => {
            playSfx(SFX.UI_START);
            void rec.start();
          }}
        >
          🎤
        </button>
      ) : rec.state === 'recording' ? (
        <>
          <button
            type="button"
            className={clsx(styles.mic, styles.recording)}
            aria-label="Stop"
            onClick={rec.stop}
          >
            ■
          </button>
          <p className={styles.timer}>RECORDING… {rec.seconds}s</p>
        </>
      ) : (
        <>
          {rec.url && <audio className={styles.player} controls src={rec.url} />}
          <div className={styles.actions}>
            <Button color="cream" disabled={uploading} onClick={rec.reset}>
              AGAIN
            </Button>
            <Button color="green" disabled={uploading} onClick={send}>
              {uploading ? (
                <>
                  <LottieLoader size="sm" /> {Math.round(progress * 100)}%
                </>
              ) : (
                'SEND'
              )}
            </Button>
          </div>
        </>
      )}
      {rec.state === 'idle' && !rec.error && <p className={styles.hint}>TAP THE MIC AND SAY IT!</p>}
      {(rec.error || uploadError) && (
        <p className={styles.error} role="alert">
          {rec.error ?? uploadError}
        </p>
      )}
    </div>
  );
}
