/**
 * Dạng chấm tay: TRACE_AND_READ (tô chữ + ghi âm đọc to), SPEAK (ghi âm). GV chấm sau khi nộp.
 */
import clsx from 'clsx';
import AudioButton from '@/modules/homework/components/AudioButton/AudioButton';
import { useMedia } from '@/modules/homework/renderers/mediaContext';
import Recorder from '@/modules/homework/components/Recorder/Recorder';
import TracePad from '@/modules/homework/components/TracePad/TracePad';
import type { RendererProps } from '@/modules/homework/renderers/types';
import styles from '@/modules/homework/renderers/renderers.module.scss';

export function TraceAndReadRenderer({
  config,
  answer,
  mode,
  onChange,
  onMedia,
}: RendererProps<'TRACE_AND_READ'>) {
  const image = useMedia(config.imageMediaId);
  const review = mode === 'review';
  const set = (patch: Partial<{ traceMediaId: string; recordingMediaId: string }>) =>
    onChange({
      type: 'TRACE_AND_READ',
      traceMediaId: answer?.traceMediaId,
      recordingMediaId: answer?.recordingMediaId,
      ...patch,
    });
  // Câu có phần tô nổi bật
  const index = config.sentence.toLowerCase().indexOf(config.tracePart.toLowerCase());
  const before = index >= 0 ? config.sentence.slice(0, index) : config.sentence;
  const part = index >= 0 ? config.sentence.slice(index, index + config.tracePart.length) : '';
  const after = index >= 0 ? config.sentence.slice(index + config.tracePart.length) : '';
  return (
    <div className={clsx(styles.col, styles.center)}>
      <div className={styles.hero}>
        {image && <img className={styles.heroImage} src={image.url} alt="" />}
        <AudioButton
          mediaId={config.modelAudioMediaId}
          text={config.sentence}
          size="lg"
          label="Listen to the sentence"
        />
      </div>
      <p className={styles.learn}>
        {before}
        {part && <span className={styles.trace}>{part}</span>}
        {after}
      </p>
      {config.requireTrace && (
        <TracePad
          text={config.tracePart}
          mediaId={answer?.traceMediaId}
          disabled={review}
          onUploaded={(ref) => {
            onMedia?.(ref);
            set({ traceMediaId: ref.id });
          }}
        />
      )}
      {config.requireRecording && (
        <Recorder
          mediaId={answer?.recordingMediaId}
          disabled={review}
          onUploaded={(ref) => {
            onMedia?.(ref);
            set({ recordingMediaId: ref.id });
          }}
        />
      )}
    </div>
  );
}

export function SpeakRenderer({ config, answer, mode, onChange, onMedia }: RendererProps<'SPEAK'>) {
  const image = useMedia(config.imageMediaId);
  const review = mode === 'review';
  return (
    <div className={clsx(styles.col, styles.center)}>
      <div className={styles.hero}>
        {image && <img className={styles.heroImage} src={image.url} alt="" />}
        <AudioButton mediaId={config.modelAudioMediaId} text={config.prompt} size="lg" label="Listen" />
      </div>
      <p className={styles.learn}>{config.prompt}</p>
      <Recorder
        mediaId={answer?.recordingMediaId}
        disabled={review}
        onUploaded={(ref) => {
          onMedia?.(ref);
          onChange({ type: 'SPEAK', recordingMediaId: ref.id });
        }}
      />
    </div>
  );
}
