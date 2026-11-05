/**
 * Đặt mật khẩu tài khoản gia đình từ link mời (#/set-password?token=…, mail `parent.invite`): token dùng một lần, có
 * hạn 72 giờ. Xong là đăng nhập luôn → màn chọn bé.
 */
import { useState, type FormEvent } from 'react';
import { authActions } from '@/modules/auth/stores/authStore';
import { PASSWORD_MIN_LENGTH } from '@/modules/auth/utils/password';
import { errorText } from '@/core/api/errorText';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { platformActions } from '@/core/navigation/platformStore';
import Button from '@/ui/Button/Button';
import { MASCOT } from '@/ui/icons';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import TextInput from '@/ui/TextInput/TextInput';
import styles from '@/modules/auth/screens/SetPasswordScreen/SetPasswordScreen.module.scss';

export default function SetPasswordScreen({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = !!token && password.length >= PASSWORD_MIN_LENGTH && confirm === password && !busy;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await authActions.setPassword({ token, password });
      playSfx(SFX.UI_START);
      platformActions.openAccount();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScreenHeader title="SET PASSWORD" backLabel="All games" onBack={() => platformActions.exitToHub()} />
      <form className={styles.form} onSubmit={submit} aria-busy={busy}>
        <img className={styles.mascot} src={MASCOT.hello} alt="" />
        {token ? (
          <p className={styles.lead}>Welcome! Choose a password for your family account.</p>
        ) : (
          <p className={styles.error} role="alert">
            This link is not complete. Open the link from your invite email again.
          </p>
        )}
        <TextInput
          label="NEW PASSWORD"
          type="password"
          name="password"
          value={password}
          autoComplete="new-password"
          enterKeyHint="next"
          onChange={setPassword}
          error={tooShort ? `At least ${PASSWORD_MIN_LENGTH} characters.` : undefined}
        />
        <TextInput
          label="TYPE IT AGAIN"
          type="password"
          name="confirm"
          value={confirm}
          autoComplete="new-password"
          enterKeyHint="go"
          onChange={setConfirm}
          error={mismatch ? 'The passwords do not match.' : undefined}
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" color="green" size="lg" sfx={null} disabled={!canSubmit}>
          {busy ? 'PLEASE WAIT…' : 'SAVE & SIGN IN'}
        </Button>
      </form>
    </>
  );
}
