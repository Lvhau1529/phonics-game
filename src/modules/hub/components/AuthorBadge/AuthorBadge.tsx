/**
 * Nút nhỏ ở góc màn chọn game; bấm mở popup thông tin tác giả (tên, số điện thoại — chạm để gọi).
 */
import { useState } from 'react';
import { AUTHOR } from '@/modules/hub/constants';
import Dialog from '@/ui/Dialog/Dialog';
import styles from '@/modules/hub/components/AuthorBadge/AuthorBadge.module.scss';

export default function AuthorBadge() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.badge} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span aria-hidden="true">ⓘ</span> AUTHOR
      </button>

      {open && (
        <Dialog title="AUTHOR" className={styles.popup} onClose={() => setOpen(false)}>
          <dl>
            <dt>NAME</dt>
            <dd lang="vi">{AUTHOR.name}</dd>
            <dt>PHONE</dt>
            <dd>
              <a href={`tel:${AUTHOR.phone}`}>{AUTHOR.phone}</a>
            </dd>
          </dl>
        </Dialog>
      )}
    </>
  );
}
