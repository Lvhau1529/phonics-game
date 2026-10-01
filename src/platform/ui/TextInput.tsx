/**
 * Ô nhập chữ cho form tài khoản (email, mật khẩu, tên): nhãn hiện rõ phía trên, không viết hoa tự động,
 * Enter gửi <form> bao ngoài, mật khẩu có nút SHOW / HIDE, dòng lỗi đỏ bên dưới.
 */
import { useId, useState, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import styles from '@/platform/ui/TextInput.module.scss';

interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'className'
> {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export default function TextInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  className,
  ...rest
}: TextInputProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={clsx(styles.input, error && styles.invalid, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.box}>
        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          value={value}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={shown}
            onClick={() => {
              playSfx(SFX.UI_CLICK);
              setShown((state) => !state);
            }}
          >
            {shown ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
