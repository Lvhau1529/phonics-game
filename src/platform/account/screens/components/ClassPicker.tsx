/**
 * Chọn lớp khi đăng ký (GET /public/classes — lớp giáo viên đang cho học sinh tự vào).
 */
import { getPublicClasses } from '@/platform/account/accountApi';
import { errorText } from '@/platform/account/errorText';
import { useRequest } from '@/platform/account/hooks/useRequest';
import Button from '@/platform/ui/Button';
import Field, { FieldHint } from '@/platform/ui/Field';
import OptionGroup, { type Option } from '@/platform/ui/OptionGroup';
import styles from '@/platform/account/screens/components/ClassPicker.module.scss';

interface ClassPickerProps {
  value: string;
  onChange: (classId: string) => void;
  error?: string;
}

export default function ClassPicker({ value, onChange, error }: ClassPickerProps) {
  const classes = useRequest(() => getPublicClasses().then((response) => response.items), 'classes');

  const options: Option<string>[] = (classes.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
    sub: `${item.grade} · ${item.schoolYear}`,
    tone: 'teal',
  }));

  return (
    <Field label="MY CLASS">
      {classes.loading && <FieldHint>Loading classes…</FieldHint>}
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
