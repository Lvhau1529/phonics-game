/**
 * Tạo tài khoản học sinh: email + mật khẩu (hoặc "chế độ Google": đã có idToken, chỉ cần hồ sơ),
 * tên hiển thị, avatar, lớp (GET /public/classes).
 */
import { useState, type FormEvent } from 'react';
import { DEFAULT_AVATAR, DisplayName, Email, Password, type AvatarKey } from '@phonics/contracts';
import { authActions, useAuth } from '@/platform/account/authStore';
import { errorText, fieldError } from '@/platform/account/errorText';
import AvatarPicker from '@/platform/account/screens/components/AvatarPicker';
import ClassPicker from '@/platform/account/screens/components/ClassPicker';
import GoogleButton from '@/platform/account/screens/components/GoogleButton';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { platformActions } from '@/platform/platformStore';
import Button from '@/platform/ui/Button';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import TextInput from '@/platform/ui/TextInput';
import styles from '@/platform/account/screens/RegisterScreen.module.scss';

interface FieldErrors {
  email?: string;
  password?: string;
  displayName?: string;
  classId?: string;
}

export default function RegisterScreen() {
  const googleIdToken = useAuth().pendingGoogleIdToken;
  const googleMode = googleIdToken !== null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>(DEFAULT_AVATAR);
  const [classId, setClassId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  /** Kiểm tra bằng chính schema của contracts trước khi gửi */
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!googleMode) {
      if (!Email.safeParse(email).success) errors.email = 'Please type a real email.';
      if (!Password.safeParse(password).success) errors.password = 'Password needs at least 6 characters.';
    }
    if (!DisplayName.safeParse(displayName).success)
      errors.displayName = 'Please type your name (up to 30 letters).';
    if (!classId) errors.classId = 'Please pick your class.';
    return errors;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const errors = validate();
    setFields(errors);
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    setError(null);
    try {
      const profile = { displayName: displayName.trim(), avatarKey, classId };
      if (googleIdToken) {
        await authActions.google(googleIdToken, profile);
      } else {
        await authActions.register({ email: email.trim(), password, ...profile });
      }
      playSfx(SFX.UI_START);
      platformActions.openAccount('profile');
    } catch (caught) {
      setError(errorText(caught));
      setFields({
        email: fieldError(caught, 'email'),
        password: fieldError(caught, 'password'),
        displayName: fieldError(caught, 'displayName'),
        classId: fieldError(caught, 'classId'),
      });
    } finally {
      setBusy(false);
    }
  };

  const google = async (idToken: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await authActions.google(idToken);
      if (result === 'ok') {
        playSfx(SFX.UI_START);
        platformActions.openAccount('profile');
      }
      // profile-required: authStore giữ idToken -> form này chuyển sang chế độ Google
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    authActions.clearPendingGoogle();
    platformActions.openAccount('login');
  };

  return (
    <>
      <ScreenHeader title="NEW ACCOUNT" backLabel="Sign in" onBack={back} />
      <form className={styles.form} onSubmit={submit} aria-busy={busy} noValidate>
        {googleMode ? (
          <p className={styles.note}>Almost done! Tell us your name and class.</p>
        ) : (
          <>
            <TextInput
              label="EMAIL"
              type="email"
              name="email"
              value={email}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              error={fields.email}
              onChange={setEmail}
            />
            <TextInput
              label="PASSWORD"
              type="password"
              name="new-password"
              value={password}
              autoComplete="new-password"
              enterKeyHint="next"
              error={fields.password}
              onChange={setPassword}
            />
          </>
        )}
        <TextInput
          label="MY NAME"
          name="displayName"
          value={displayName}
          maxLength={30}
          autoComplete="nickname"
          enterKeyHint="done"
          error={fields.displayName}
          onChange={setDisplayName}
        />
        <AvatarPicker value={avatarKey} onChange={setAvatarKey} />
        <ClassPicker value={classId} onChange={setClassId} error={fields.classId} />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" color="green" size="lg" sfx={null} disabled={busy}>
          {busy ? 'PLEASE WAIT…' : googleMode ? "LET'S GO!" : 'CREATE ACCOUNT'}
        </Button>
        {!googleMode && <GoogleButton onCredential={google} disabled={busy} />}
      </form>
      {!googleMode && (
        <button type="button" className={styles.link} onClick={() => platformActions.openAccount('login')}>
          HAVE AN ACCOUNT? <b>SIGN IN</b>
        </button>
      )}
    </>
  );
}
