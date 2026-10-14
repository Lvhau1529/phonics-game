/**
 * Làm bài: một câu mỗi màn — thanh tiến độ, khung câu (hướng dẫn tự đọc), renderer theo dạng, BACK / NEXT,
 * câu cuối có SEND (hỏi lại nếu còn câu chưa làm). Câu trả lời tự lưu (homeworkStore); dòng dưới cùng báo
 * SAVING… / SAVED / WILL SAVE WHEN ONLINE. Bài đã đóng / đã nộp → hộp báo rồi về danh sách.
 */
import { useEffect, useState } from 'react';
import { errorText } from '@/core/api/errorText';
import { isApiError } from '@/core/api/client';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { isComplete } from '@/modules/homework/answers/answerTypes';
import { MediaMapContext } from '@/modules/homework/renderers/mediaContext';
import ProgressBar from '@/modules/homework/components/ProgressBar/ProgressBar';
import QuestionFrame from '@/modules/homework/components/QuestionFrame/QuestionFrame';
import QuestionRenderer from '@/modules/homework/renderers/QuestionRenderer';
import { homeworkActions, useAttempt } from '@/modules/homework/stores/homeworkStore';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import { platformActions } from '@/core/navigation/platformStore';
import Button from '@/ui/Button/Button';
import Dialog from '@/ui/Dialog/Dialog';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import { speech } from '@/core/utils/speech';
import styles from '@/modules/homework/screens/DoScreen/DoScreen.module.scss';

export default function DoScreen({ assignmentId }: { assignmentId: string }) {
  const attempt = useAttempt();
  const [openError, setOpenError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const ready = attempt?.assignment.id === assignmentId;
  const showLoading = useDelayedLoading(!ready && !openError);

  useEffect(() => {
    let active = true;
    homeworkActions.open(assignmentId).catch((error: unknown) => {
      if (!active) return;
      // Hết lượt / đã nộp → xem kết quả thay vì báo lỗi
      if (isApiError(error) && error.code === 'ATTEMPTS_EXHAUSTED') {
        platformActions.openHomework({ name: 'result', assignmentId });
        return;
      }
      setOpenError(errorText(error));
    });
    return () => {
      active = false;
    };
  }, [assignmentId]);

  const back = () => {
    speech.cancel();
    void homeworkActions.leave();
    platformActions.openHomework();
  };

  if (openError) {
    return (
      <>
        <ScreenHeader title="HOMEWORK" backLabel="Homework list" onBack={back} />
        <Dialog
          title="OOPS!"
          image={MASCOT.error}
          onClose={back}
          actions={<Button onClick={back}>BACK</Button>}
        >
          <p>{openError}</p>
        </Dialog>
      </>
    );
  }
  if (!ready || !attempt) {
    return (
      <>
        <ScreenHeader title="HOMEWORK" backLabel="Homework list" onBack={back} />
        {showLoading && <LottieLoader size="lg" label="LOADING…" className={styles.status} />}
      </>
    );
  }

  const { assignment, answers, index } = attempt;
  const items = assignment.items;
  const item = items[index];
  const answered = items.map((it) => isComplete(it.question.config, answers[it.worksheetItemId]));
  const missing = answered.filter((a) => !a).length;
  const last = index === items.length - 1;

  const send = async () => {
    setConfirm(false);
    setSubmitError(null);
    try {
      await homeworkActions.submit();
      playSfx(SFX.FINAL_RESULTS);
      speech.cancel();
      platformActions.openHomework({ name: 'result', assignmentId });
    } catch (error) {
      setSubmitError(errorText(error));
    }
  };

  return (
    <MediaMapContext.Provider value={attempt.media}>
      <ScreenHeader title={assignment.worksheetTitle} backLabel="Homework list" onBack={back} />
      <ProgressBar total={items.length} current={index} answered={answered} onJump={homeworkActions.goTo} />

      {item && (
        <QuestionFrame
          key={item.worksheetItemId}
          number={index + 1}
          instruction={item.question.instruction}
          example={item.question.example}
          speak
        >
          <QuestionRenderer
            config={item.question.config}
            answer={answers[item.worksheetItemId] ?? null}
            mode="do"
            onChange={(answer) => homeworkActions.setAnswer(item.worksheetItemId, answer)}
            onMedia={homeworkActions.addMedia}
          />
        </QuestionFrame>
      )}

      <div className={styles.nav}>
        <Button color="cream" disabled={index === 0} onClick={() => homeworkActions.goTo(index - 1)}>
          ◀ BACK
        </Button>
        {last ? (
          <Button
            color="green"
            size="lg"
            disabled={attempt.submitting || attempt.locked}
            onClick={() => setConfirm(true)}
          >
            {attempt.submitting ? <LottieLoader size="sm" /> : 'SEND ✔'}
          </Button>
        ) : (
          <Button color="blue" onClick={() => homeworkActions.goTo(index + 1)}>
            NEXT ▶
          </Button>
        )}
      </div>

      <p className={styles.save} role="status">
        {attempt.locked
          ? errorText(attempt.saveError)
          : attempt.saving
            ? 'SAVING…'
            : attempt.dirty.length > 0
              ? navigator.onLine
                ? 'NOT SAVED YET'
                : 'WILL SAVE WHEN ONLINE'
              : 'SAVED'}
      </p>

      {attempt.locked && (
        <Dialog
          title="OOPS!"
          image={MASCOT.error}
          onClose={back}
          actions={<Button onClick={back}>BACK</Button>}
        >
          <p>{errorText(attempt.saveError)}</p>
        </Dialog>
      )}

      {confirm && (
        <Dialog
          title="SEND?"
          image={missing > 0 ? MASCOT.encourage : MASCOT.celebrate}
          onClose={() => setConfirm(false)}
          actions={
            <>
              <Button color="cream" onClick={() => setConfirm(false)}>
                NOT YET
              </Button>
              <Button color="green" onClick={send}>
                SEND
              </Button>
            </>
          }
        >
          {missing > 0 ? (
            <p>
              You have <b>{missing}</b> {missing === 1 ? 'question' : 'questions'} left. Send anyway?
            </p>
          ) : (
            <p>All done! Send your homework to your teacher?</p>
          )}
        </Dialog>
      )}

      {submitError && (
        <Dialog
          title="OOPS!"
          image={MASCOT.error}
          onClose={() => setSubmitError(null)}
          actions={<Button onClick={() => setSubmitError(null)}>OK</Button>}
        >
          <p>{submitError}</p>
        </Dialog>
      )}
    </MediaMapContext.Provider>
  );
}
