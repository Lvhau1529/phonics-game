/**
 * Sửa hồ sơ: tên hiển thị + avatar (PATCH /me/profile). Đổi lớp phải nhờ giáo viên.
 */
import { useState, type FormEvent } from 'react';
import { DisplayName, type AvatarKey } from '@phonics/contracts';
import { authService } from '@/platform/account/api/authService';
import { authActions, useAuth } from '@/platform/account/authStore';
import { errorText, fieldError } from '@/platform/account/errorText';
import AvatarPicker from '@/platform/account/screens/components/AvatarPicker';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { platformActions } from '@/platform/platformStore';
import Button from '@/platform/ui/Button';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import TextInput from '@/platform/ui/TextInput';
import styles from '@/platform/account/screens/EditProfileScreen.module.scss';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>(user?.avatarKey ?? 'pip');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  if (!user) return null;

  const back = () => platformActions.openAccount('profile');
  const changed = displayName.trim() !== user.displayName || avatarKey !== user.avatarKey;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!changed) {
      back();
      return;
    }
    if (!DisplayName.safeParse(displayName).success) {
      setNameError('Please type your name (up to 30 letters).');
      return;
    }
    setBusy(true);
    setError(null);
    setNameError(undefined);
    try {
      const updated = await authService.updateProfile({
        ...(displayName.trim() !== user.displayName ? { displayName: displayName.trim() } : {}),
        ...(avatarKey !== user.avatarKey ? { avatarKey } : {}),
      });
      authActions.setUser(updated);
      playSfx(SFX.UI_START);
      back();
    } catch (caught) {
      setError(errorText(caught));
      setNameError(fieldError(caught, 'displayName'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScreenHeader title="EDIT PROFILE" backLabel="My profile" onBack={back} />
      <form className={styles.form} onSubmit={submit} aria-busy={busy} noValidate>
        <TextInput
          label="MY NAME"
          name="displayName"
          value={displayName}
          maxLength={30}
          autoComplete="nickname"
          enterKeyHint="done"
          error={nameError}
          onChange={setDisplayName}
        />
        <AvatarPicker value={avatarKey} onChange={setAvatarKey} />
        <p className={styles.note}>
          {user.hasClass ? `Class: ${user.className}. ` : ''}Ask your teacher to change your class.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.row}>
          <Button color="cream" onClick={back}>
            CANCEL
          </Button>
          <Button type="submit" color="green" sfx={null} disabled={busy}>
            {busy ? 'SAVING…' : 'SAVE'}
          </Button>
        </div>
      </form>
    </>
  );
}
