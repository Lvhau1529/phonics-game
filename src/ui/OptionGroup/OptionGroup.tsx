/**
 * Nhóm lựa chọn dạng chip (radio group) cho màn Setup của các game. Chip cao tối thiểu 48px.
 */
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { toneVars, type ToneColor } from '@/ui/tone';
import styles from '@/ui/OptionGroup/OptionGroup.module.scss';

export interface Option<T> {
  value: T;
  label: string;
  /** Dòng phụ nhỏ bên dưới nhãn */
  sub?: string;
  /** Màu riêng khi được chọn (vd: màu theo level); mặc định cam */
  tone?: ToneColor;
  /** Ảnh minh hoạ phía trên nhãn */
  icon?: string;
}

interface OptionGroupProps<T> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}

export default function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns = options.length,
}: OptionGroupProps<T>) {
  return (
    <div
      className={styles.options}
      role="radiogroup"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={clsx(styles.option, selected && styles.selected)}
            style={option.tone && toneVars(option.tone)}
            onClick={() => {
              if (selected) return;
              playSfx(SFX.UI_CLICK);
              onChange(option.value);
            }}
          >
            {option.icon && <img className={styles.icon} src={option.icon} alt="" />}
            <span className={styles.label}>{option.label}</span>
            {option.sub && <span className={styles.sub}>{option.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}
