/**
 * Chọn ảnh đại diện trong bộ preset (contracts AVATARS -> ảnh ở platform/account/avatars.ts).
 */
import { AVATARS, type AvatarKey } from '@phonics/contracts';
import { avatarLabel, AVATAR_IMAGES } from '@/modules/auth/utils/avatars';
import Field from '@/ui/Field/Field';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import styles from '@/modules/auth/components/AvatarPicker/AvatarPicker.module.scss';

const OPTIONS: Option<AvatarKey>[] = AVATARS.map((avatar) => ({
  value: avatar.key,
  label: avatarLabel(avatar.key),
  icon: AVATAR_IMAGES[avatar.key],
  tone: 'purple',
}));

interface AvatarPickerProps {
  value: AvatarKey;
  onChange: (value: AvatarKey) => void;
}

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <Field label="AVATAR">
      <div className={styles.picker}>
        <OptionGroup label="AVATAR" options={OPTIONS} value={value} onChange={onChange} columns={4} />
      </div>
    </Field>
  );
}
