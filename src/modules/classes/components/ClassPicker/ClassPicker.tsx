/**
 * Chọn lớp khi đăng ký (GET /public/classes — lớp giáo viên đang cho học sinh tự vào).
 */
import { usePublicClasses } from '@/modules/classes/hooks/usePublicClasses';
import { errorText } from '@/core/api/errorText';
import Button from '@/ui/Button/Button';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import Field, { FieldHint } from '@/ui/Field/Field';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import styles from '@/modules/classes/components/ClassPicker/ClassPicker.module.scss';

interface ClassPickerProps {
  value: string;
  onChange: (classId: string) => void;
  error?: string;
}

export default function ClassPicker({ value, onChange, error }: ClassPickerProps) {
  const classes = usePublicClasses();
  const showLoading = useDelayedLoading(classes.loading);

  const options: Option<string>[] = (classes.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
    sub: item.subtitle,
    tone: 'teal',
  }));

  return (
    <Field label="MY CLASS">
      {showLoading && (
        <FieldHint>
          <LottieLoader size="sm" /> Loading classes…
        </FieldHint>
      )}
      {classes.error != null && (
        <div className={styles.retry}>
          <FieldHint hard>{errorText(classes.error)}</FieldHint>
          <Button color="cream" onClick={classes.reload}>
            TRY AGAIN
          </Button>
        </div>
      )}
      {classes.data && options.length === 0 && (
        <FieldHint hard>No class is open yet. Ask your teacher.</FieldHint>
      )}
      {options.length > 0 && (
        <OptionGroup
          label="MY CLASS"
          options={options}
          value={value}
          onChange={onChange}
          columns={options.length > 1 ? 2 : 1}
        />
      )}
      {error && <FieldHint hard>{error}</FieldHint>}
    </Field>
  );
}
