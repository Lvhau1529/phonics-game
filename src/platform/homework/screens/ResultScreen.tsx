/**
 * Kết quả một bài: sao + điểm (hoặc TEACHER IS CHECKING khi còn câu chấm tay), hạng trong lớp,
 * SEE ANSWERS (xem lại từng câu: đúng / sai, đáp án nếu GV cho xem, nhận xét từng câu + trả lời),
 * RANKING, TRY AGAIN (còn lượt), nhận xét chung của GV.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { errorText } from '@/platform/account/errorText';
import { useRequest } from '@/platform/account/hooks/useRequest';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { assignmentsService } from '@/platform/homework/api/assignmentsService';
import { submissionsService } from '@/platform/homework/api/submissionsService';
import CommentThread from '@/platform/homework/components/CommentThread';
import FeedbackBadge from '@/platform/homework/components/FeedbackBadge';
import { MediaMapContext } from '@/platform/homework/components/mediaContext';
import QuestionFrame from '@/platform/homework/components/QuestionFrame';
import type { CommentModel } from '@/platform/homework/models/CommentModel';
import QuestionRenderer from '@/platform/homework/renderers/QuestionRenderer';
import { Stars } from '@/platform/homework/screens/ListScreen';
import { homeworkActions, useHomeworkResult } from '@/platform/homework/store/homeworkStore';
import { useDelayedLoading } from '@/platform/hooks/useDelayedLoading';
import { platformActions } from '@/platform/platformStore';
import Button from '@/platform/ui/Button';
import Icon from '@/platform/ui/Icon';
import { MASCOT } from '@/platform/ui/icons';
import LottieLoader from '@/platform/ui/LottieLoader';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import styles from '@/platform/homework/screens/ResultScreen.module.scss';

export default function ResultScreen({ assignmentId }: { assignmentId: string }) {
  const result = useHomeworkResult();
  const justSent = result?.assignmentId === assignmentId ? result.response : null;
  const assignment = useRequest(() => assignmentsService.detail(assignmentId), `hw-detail:${assignmentId}`);
  // Bài nộp mới nhất (vừa nộp → có ngay id; mở lại → từ danh sách lần làm)
  const submissionId = justSent?.submission.id ?? assignment.data?.latestSubmission?.id ?? null;
  const submission = useRequest(
    () => (submissionId ? submissionsService.detail(submissionId) : Promise.resolve(null)),
    `hw-sub:${submissionId ?? ''}`,
  );
  const comments = useRequest(
    () => (submissionId ? submissionsService.comments(submissionId) : Promise.resolve([] as CommentModel[])),
    `hw-comments:${submissionId ?? ''}`,
  );
  const [showAnswers, setShowAnswers] = useState(false);
  const showLoading = useDelayedLoading(assignment.loading || submission.loading);

  const back = () => platformActions.openHomework();
  const a = assignment.data;
  const s = submission.data;
  const rank = justSent?.rank?.rank ?? a?.best?.rank ?? null;

  const reply = async (parentId: string, body: string) => {
    if (!submissionId) return;
    await submissionsService.reply(submissionId, parentId, body);
    comments.reload();
    void homeworkActions.loadList();
  };

  const general = (comments.data ?? []).filter((c) => c.isGeneral);
  const byItem = (id: string) => (comments.data ?? []).filter((c) => c.worksheetItemId === id);

  return (
    <>
      <ScreenHeader title="RESULT" backLabel="Homework list" onBack={back} />
      {showLoading && <LottieLoader size="lg" label="LOADING…" className={styles.status} />}
      {(assignment.error != null || submission.error != null) && (
        <div className={styles.empty}>
          <p className={styles.status}>{errorText(assignment.error ?? submission.error)}</p>
          <Button
            color="cream"
            onClick={() => (assignment.error ? assignment.reload() : submission.reload())}
          >
            TRY AGAIN
          </Button>
        </div>
      )}
      {a && !submissionId && !assignment.loading && (
        <div className={styles.empty}>
          <img className={styles.mascot} src={MASCOT.encourage} alt="" />
          <p className={styles.status}>NOT SENT YET</p>
          {a.canStart && (
            <Button color="green" onClick={() => platformActions.openHomework({ name: 'do', assignmentId })}>
              START
            </Button>
          )}
        </div>
      )}

      {a && s && (
        <MediaMapContext.Provider value={{ ...a.media, ...s.media }}>
          <section className={clsx(styles.card, s.isGraded && styles.graded)}>
            <img
              className={styles.mascot}
              src={s.isGraded ? (s.stars >= 2 ? MASCOT.celebrate : MASCOT.encourage) : MASCOT.hello}
              alt=""
            />
            <h2 className={styles.title}>{a.worksheetTitle}</h2>
            {s.isGraded ? (
              <>
                <Stars count={s.stars} />
                <p className={styles.score}>
                  {s.scoreText}
                  {rank !== null && (
                    <span className={styles.rank}>
                      <Icon name="trophy" size={20} /> #{rank}
                    </span>
                  )}
                </p>
                <p className={styles.cheer}>
                  {s.stars === 3 ? 'PERFECT! AMAZING!' : s.stars >= 1 ? 'GREAT JOB!' : 'KEEP PRACTICING!'}
                </p>
              </>
            ) : (
              <>
                <p className={styles.checking}>TEACHER IS CHECKING</p>
                <p className={styles.cheer}>
                  {s.rightCount} RIGHT SO FAR · {s.pendingManual} TO CHECK
                </p>
              </>
            )}
            {s.late && <p className={styles.late}>SENT LATE</p>}
          </section>

          <div className={styles.actions}>
            <Button color="blue" onClick={() => setShowAnswers((v) => !v)}>
              {showAnswers ? 'HIDE ANSWERS' : 'SEE ANSWERS'}
            </Button>
            <Button
              color="orange"
              onClick={() => platformActions.openHomework({ name: 'ranking', assignmentId })}
            >
              <Icon name="trophy" size={22} /> RANKING
            </Button>
            {a.canStart && (
              <Button
                color="green"
                onClick={() => {
                  playSfx(SFX.UI_START);
                  platformActions.openHomework({ name: 'do', assignmentId });
                }}
              >
                TRY AGAIN
              </Button>
            )}
          </div>

          {general.length > 0 && (
            <section className={styles.card}>
              <CommentThread title="TEACHER SAYS" comments={general} onReply={reply} />
            </section>
          )}

          {showAnswers && (
            <div className={styles.review}>
              {s.items.map((item, i) => {
                const answer = s.answerOf(item.worksheetItemId);
                const outcome = answer?.outcome ?? 'wrong';
                return (
                  <QuestionFrame
                    key={item.worksheetItemId}
                    number={i + 1}
                    instruction={item.question.instruction}
                    example={item.question.example}
                    tone={outcome}
                  >
                    <FeedbackBadge outcome={outcome} score={answer?.score} maxPoints={item.points} />
                    <QuestionRenderer
                      config={item.question.config}
                      answer={answer?.answer ?? null}
                      answerKey={answer?.answerKey ?? null}
                      mode="review"
                      onChange={() => undefined}
                    />
                    {answer?.teacherNote && <p className={styles.note}>💬 {answer.teacherNote}</p>}
                    <CommentThread comments={byItem(item.worksheetItemId)} onReply={reply} />
                  </QuestionFrame>
                );
              })}
            </div>
          )}
        </MediaMapContext.Provider>
      )}
    </>
  );
}
