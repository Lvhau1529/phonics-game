/**
 * Xem trước cho admin (#/preview, nhúng iframe): giống màn làm bài (một câu mỗi màn, thanh tiến độ, BACK / NEXT)
 * nhưng nội dung do admin gửi qua postMessage, câu cuối là CHECK (admin chấm) thay cho SEND. Không đăng nhập,
 * không gọi API, không lưu gì. Không tự đọc hướng dẫn (admin đang gõ thì sẽ đọc liên tục) — vẫn có nút loa.
 */
import { useEffect } from 'react';
import { isComplete } from '@/modules/homework/answers/answerTypes';
import { MediaUploadContext } from '@/modules/homework/hooks/useMediaUpload';
import { MediaMapContext } from '@/modules/homework/renderers/mediaContext';
import ProgressBar from '@/modules/homework/components/ProgressBar/ProgressBar';
import QuestionFrame from '@/modules/homework/components/QuestionFrame/QuestionFrame';
import QuestionRenderer from '@/modules/homework/renderers/QuestionRenderer';
import { previewActions, usePreview } from '@/modules/homework/stores/previewStore';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import Button from '@/ui/Button/Button';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/modules/homework/screens/PreviewScreen/PreviewScreen.module.scss';

export default function PreviewScreen() {
  const preview = usePreview();
  const showLoading = useDelayedLoading(preview.status === 'waiting');

  useEffect(() => previewActions.connect(), []);

  return (
    <main className={styles.root}>
      <div className={styles.screen}>
        {preview.status === 'ready' ? (
          <PreviewContent />
        ) : preview.status === 'standalone' ? (
          <div className={styles.empty}>
            <img className={styles.mascot} src={MASCOT.hello} alt="" />
            <p>OPEN THIS PREVIEW FROM THE ADMIN PAGE</p>
          </div>
        ) : (
          showLoading && <LottieLoader size="lg" label="LOADING…" className={styles.empty} />
        )}
      </div>
    </main>
  );
}

function PreviewContent() {
  const { title, items, media, answers, index, checking, results } = usePreview();
  const item = items[index];
  const answered = items.map((it) => isComplete(it.config, answers[it.key]));
  const last = index === items.length - 1;
  const right = results ? Object.values(results).filter((tone) => tone === 'right').length : 0;
  // Bấm BACK của header: không có nơi để về trong bản xem trước → về câu trước
  const back = () => previewActions.goTo(index - 1);

  return (
    <MediaUploadContext.Provider value={previewActions.upload}>
      <MediaMapContext.Provider value={media}>
        <ScreenHeader title={title || 'HOMEWORK'} backLabel="Previous question" onBack={back} />
        {items.length > 1 && (
          <ProgressBar
            total={items.length}
            current={index}
            answered={answered}
            onJump={previewActions.goTo}
          />
        )}

        {item ? (
          <QuestionFrame
            key={item.key}
            number={index + 1}
            instruction={item.instruction}
            example={item.example}
            tone={results?.[item.key]}
          >
            <QuestionRenderer
              config={item.config}
              answer={answers[item.key] ?? null}
              answerKey={results ? item.answerKey : null}
              mode={results ? 'review' : 'do'}
              onChange={(answer) => previewActions.setAnswer(item.key, answer)}
              onMedia={previewActions.addMedia}
            />
          </QuestionFrame>
        ) : (
          <div className={styles.empty}>
            <img className={styles.mascot} src={MASCOT.encourage} alt="" />
            <p>NO QUESTIONS YET</p>
          </div>
        )}

        {item && (
          <div className={styles.nav}>
            {items.length > 1 && (
              <Button color="cream" disabled={index === 0} onClick={() => previewActions.goTo(index - 1)}>
                ◀ BACK
              </Button>
            )}
            {!last ? (
              <Button color="blue" onClick={() => previewActions.goTo(index + 1)}>
                NEXT ▶
              </Button>
            ) : results ? (
              <Button color="orange" onClick={previewActions.retry}>
                TRY AGAIN
              </Button>
            ) : (
              <Button color="green" size="lg" disabled={checking} onClick={previewActions.check}>
                {checking ? <LottieLoader size="sm" /> : 'CHECK ✔'}
              </Button>
            )}
          </div>
        )}

        <p className={styles.note} role="status">
          {results ? `${right} / ${items.length} RIGHT · ` : ''}PREVIEW · NOTHING IS SAVED
        </p>
      </MediaMapContext.Provider>
    </MediaUploadContext.Provider>
  );
}
