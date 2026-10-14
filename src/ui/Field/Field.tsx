/**
 * Một mục trong form Setup: nhãn + (tuỳ chọn) nút "?" mở đúng phần Hướng dẫn của game.
 * `FieldHint`: dòng gợi ý nhỏ bên dưới lựa chọn.
 */
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { openGuide } from '@/ui/guide/guideStore';
import styles from '@/ui/Field/Field.module.scss';

interface FieldProps {
  label: string;
  /** Id phần Hướng dẫn mở khi bấm "?" */
  guide?: string;
  children: ReactNode;
}

export default function Field({ label, guide, children }: FieldProps) {
  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>
        {label}
        {guide && (
          <button
            type="button"
            className={styles.help}
            aria-label={`GUIDE: ${label}`}
            onClick={() => openGuide(guide)}
          >
            ?
          </button>
        )}
      </legend>
      {children}
    </fieldset>
  );
}

interface FieldHintProps {
  /** Chữ đỏ: cảnh báo (level khó, chưa có từ, từ bị bỏ qua...) */
  hard?: boolean;
  children: ReactNode;
}

export function FieldHint({ hard = false, children }: FieldHintProps) {
  return <p className={clsx(styles.hint, hard && styles.hard)}>{children}</p>;
}
