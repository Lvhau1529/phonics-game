/**
 * Nhận xét của giáo viên trên bài nộp (chung cả bài hoặc theo câu), kèm trả lời một cấp (của GV, hoặc của bé từ
 * trước 2.0). Chỉ xem: bé 5 tuổi không gõ trả lời — phụ huynh đọc cùng bé.
 */
import clsx from 'clsx';
import { avatarUrl } from '@/modules/auth';
import { timeAgo } from '@/core/utils/timeAgo';
import type { CommentModel } from '@/modules/homework/models/CommentModel';
import styles from '@/modules/homework/components/CommentThread/CommentThread.module.scss';

interface CommentThreadProps {
  comments: CommentModel[];
  /** Tiêu đề nhỏ ("TEACHER SAYS") — bỏ khi nằm trong thẻ câu */
  title?: string;
}

export default function CommentThread({ comments, title }: CommentThreadProps) {
  if (comments.length === 0) return null;
  return (
    <section className={styles.thread}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <ul className={styles.list}>
        {comments.map((comment) => (
          <Root key={comment.id} comment={comment} />
        ))}
      </ul>
    </section>
  );
}

function Root({ comment }: { comment: CommentModel }) {
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
