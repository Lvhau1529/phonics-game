/**
 * Sửa hồ sơ: tên hiển thị + avatar (PATCH /me/profile). Đổi lớp phải nhờ giáo viên.
 * Kèm liên kết / gỡ Google (POST / DELETE auth/google/link) cho tài khoản tự đăng nhập.
 */
import { useState, type FormEvent } from 'react';
import { DisplayName, type AvatarKey } from '@/modules/auth/utils/profileForm';
import { authActions, useAuth } from '@/modules/auth/stores/authStore';
import { errorText, fieldError } from '@/core/api/errorText';
import AvatarPicker from '@/modules/auth/components/AvatarPicker/AvatarPicker';
import GoogleButton from '@/modules/auth/components/GoogleButton/GoogleButton';
import { GOOGLE_CLIENT_ID } from '@/core/config/account';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { platformActions } from '@/core/navigation/platformStore';
import Button from '@/ui/Button/Button';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import TextInput from '@/ui/TextInput/TextInput';
import styles from '@/modules/auth/screens/EditProfileScreen/EditProfileScreen.module.scss';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>(user?.avatarKey ?? 'pip');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  /** Gỡ Google cần bấm hai lần (lần đầu chỉ đổi chữ trên nút) */
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  if (!user) return null;

  const runGoogle = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      playSfx(SFX.UI_START);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
      setConfirmUnlink(false);
    }
  };

  const unlink = () => {
    if (!confirmUnlink) {
      setConfirmUnlink(true);
      return;
    }
    void runGoogle(() => authActions.unlinkGoogle());
  };

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
      await authActions.updateProfile({
        ...(displayName.trim() !== user.displayName ? { displayName: displayName.trim() } : {}),
        ...(avatarKey !== user.avatarKey ? { avatarKey } : {}),
      });
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
        {user.email !== null && (user.hasGoogle || GOOGLE_CLIENT_ID) && (
          <section className={styles.google} aria-label="Google sign-in">
            <p className={styles.note}>
              {user.hasGoogle
                ? 'Google is linked. You can sign in with Google or your password.'
                : 'Link Google to sign in with one tap.'}
            </p>
            {!user.hasGoogle && (
              <GoogleButton
                divider={false}
                disabled={busy}
                onCredential={(idToken) => void runGoogle(() => authActions.linkGoogle(idToken))}
              />
            )}
            {user.hasGoogle && user.hasPassword && (
              <Button color="cream" onClick={unlink} disabled={busy}>
                {confirmUnlink ? 'TAP AGAIN TO UNLINK' : 'UNLINK GOOGLE'}
              </Button>
            )}
          </section>
        )}
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
