/**
 * Nhận xét của giáo viên trên bài nộp (chung cả bài hoặc theo câu) + trả lời của bé (1 cấp: bé chỉ trả lời
 * dưới nhận xét gốc). Ô trả lời là textarea thường (câu ngắn, có bàn phím hệ điều hành là chấp nhận được).
 */
import { useState } from 'react';
import clsx from 'clsx';
import { avatarUrl } from '@/modules/auth';
import { errorText } from '@/core/api/errorText';
import { timeAgo } from '@/core/utils/timeAgo';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import type { CommentModel } from '@/modules/homework/models/CommentModel';
import Button from '@/ui/Button/Button';
import styles from '@/modules/homework/components/CommentThread/CommentThread.module.scss';

interface CommentThreadProps {
  comments: CommentModel[];
  /** Gửi trả lời cho nhận xét gốc `parentId` */
  onReply: (parentId: string, body: string) => Promise<void>;
  /** Tiêu đề nhỏ ("TEACHER SAYS") — bỏ khi nằm trong thẻ câu */
  title?: string;
}

export default function CommentThread({ comments, onReply, title }: CommentThreadProps) {
  if (comments.length === 0) return null;
  return (
    <section className={styles.thread}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <ul className={styles.list}>
        {comments.map((comment) => (
          <Root key={comment.id} comment={comment} onReply={onReply} />
        ))}
      </ul>
    </section>
  );
}

function Root({ comment, onReply }: { comment: CommentModel; onReply: CommentThreadProps['onReply'] }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const body = text.trim();

  const send = async () => {
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      await onReply(comment.id, body);
      playSfx(SFX.UI_START);
      setText('');
      setOpen(false);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={styles.item}>
      <Bubble comment={comment} />
      {comment.replies.length > 0 && (
        <ul className={styles.replies}>
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <Bubble comment={reply} />
            </li>
          ))}
        </ul>
      )}
      {!comment.deleted &&
        (open ? (
          <div className={styles.composer}>
            <textarea
              className={styles.input}
              value={text}
              maxLength={1000}
              rows={2}
              placeholder="Type your reply…"
              autoFocus
              onChange={(event) => setText(event.target.value)}
            />
            <div className={styles.actions}>
              <Button color="cream" disabled={busy} onClick={() => setOpen(false)}>
                CANCEL
              </Button>
              <Button color="green" disabled={!body || busy} onClick={send}>
                SEND
              </Button>
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <button type="button" className={styles.replyBtn} onClick={() => setOpen(true)}>
            REPLY
          </button>
        ))}
    </li>
  );
}

function Bubble({ comment }: { comment: CommentModel }) {
  return (
    <div className={clsx(styles.bubble, comment.isStudent && styles.mine)}>
      <img className={styles.avatar} src={avatarUrl(comment.authorAvatarKey)} alt="" />
      <div className={styles.text}>
        <span className={styles.author}>
          {comment.isStudent ? 'ME' : comment.authorName.toUpperCase()}{' '}
          <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
        </span>
        <p className={styles.body}>{comment.deleted ? '(deleted)' : comment.body}</p>
      </div>
    </div>
  );
}
