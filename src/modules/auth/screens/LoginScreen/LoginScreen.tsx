/**
 * Đăng nhập: email + mật khẩu, hoặc Google. Tài khoản Google mới (server cần tên + lớp) -> màn đăng ký.
 */
import { useState, type FormEvent } from 'react';
import { authActions } from '@/modules/auth/stores/authStore';
import { errorText } from '@/core/api/errorText';
import GoogleButton from '@/modules/auth/components/GoogleButton/GoogleButton';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { platformActions } from '@/app/stores/platformStore';
import Button from '@/ui/Button/Button';
import { MASCOT } from '@/ui/icons';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import TextInput from '@/ui/TextInput/TextInput';
import styles from '@/modules/auth/screens/LoginScreen/LoginScreen.module.scss';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = email.trim() !== '' && password !== '' && !busy;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await authActions.login({ email: email.trim(), password });
      playSfx(SFX.UI_START);
      platformActions.openAccount('profile');
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  const google = async (idToken: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await authActions.google(idToken);
      playSfx(SFX.UI_START);
      platformActions.openAccount(result === 'ok' ? 'profile' : 'register');
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScreenHeader title="SIGN IN" backLabel="All games" onBack={() => platformActions.exitToHub()} />
      <form className={styles.form} onSubmit={submit} aria-busy={busy}>
        <img className={styles.mascot} src={MASCOT.hello} alt="" />
        <TextInput
          label="EMAIL"
          type="email"
          name="email"
          value={email}
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          onChange={setEmail}
        />
        <TextInput
          label="PASSWORD"
          type="password"
          name="password"
          value={password}
          autoComplete="current-password"
          enterKeyHint="go"
          onChange={setPassword}
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" color="green" size="lg" sfx={null} disabled={!canSubmit}>
          {busy ? 'PLEASE WAIT…' : 'SIGN IN'}
        </Button>
        <GoogleButton onCredential={google} disabled={busy} />
      </form>
      <button type="button" className={styles.link} onClick={() => platformActions.openAccount('register')}>
        NEW HERE? <b>CREATE ACCOUNT</b>
      </button>
    </>
  );
}
