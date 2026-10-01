/**
 * Nút "Continue with Google" (Google Identity Services): nạp script lúc mở màn, vẽ nút chính thức của Google;
 * nhận ID token -> `onCredential`. Không có VITE_GOOGLE_CLIENT_ID thì không hiện gì.
 */
import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/platform/account/config';
import { loadGis } from '@/platform/account/google/loadGis';
import GoogleG from '@/platform/ui/svg/GoogleG';
import styles from '@/platform/account/screens/components/GoogleButton.module.scss';

interface GoogleButtonProps {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

export default function GoogleButton({ onCredential, disabled = false }: GoogleButtonProps) {
  const host = useRef<HTMLDivElement>(null);
  // Google giữ callback từ lúc initialize: trỏ qua ref để luôn gọi bản mới nhất
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  });
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let active = true;
    loadGis()
      .then(() => {
        if (!active || !host.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => callback.current(credential),
          ux_mode: 'popup',
          itp_support: true,
        });
        host.current.replaceChildren();
        google.accounts.id.renderButton(host.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
        });
        setState('ready');
      })
      .catch(() => active && setState('failed'));
    return () => {
      active = false;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className={styles.google} aria-busy={state === 'loading'}>
      <p className={styles.or}>OR</p>
      <div className={styles.host} ref={host} inert={disabled || state !== 'ready' ? true : undefined} />
      {state !== 'ready' && (
        <p className={styles.placeholder}>
          <GoogleG size={20} /> {state === 'failed' ? 'GOOGLE SIGN-IN IS NOT AVAILABLE' : 'LOADING GOOGLE…'}
        </p>
      )}
    </div>
  );
}
