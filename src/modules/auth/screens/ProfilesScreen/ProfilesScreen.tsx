/**
 * Màn chọn bé (#/account) của phụ huynh: các hồ sơ bé của tài khoản gia đình (`GET /auth/profiles`). Bấm bé đã duyệt
 * → mở phiên của bé (`auth/switch-profile`) → về màn chọn game cho bé chơi. Bé chờ duyệt / bị từ chối hiện trạng thái.
 * Mở màn này khi bé đang chơi là rời hồ sơ bé (phiên về phụ huynh). Cuối màn: tên phụ huynh + SIGN OUT.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { useFamilyProfiles } from '@/modules/auth/hooks/useFamilyProfiles';
import type { FamilyProfileModel } from '@/modules/auth/models/FamilyProfileModel';
import { authActions, useAuth } from '@/modules/auth/stores/authStore';
import { avatarUrl, isSceneAvatar } from '@/modules/auth/utils/avatars';
import { errorText } from '@/core/api/errorText';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import { platformActions } from '@/core/navigation/platformStore';
import Button from '@/ui/Button/Button';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/modules/auth/screens/ProfilesScreen/ProfilesScreen.module.scss';

export default function ProfilesScreen() {
  const { user, parent } = useAuth();
  const family = parent ?? user;
  const profiles = useFamilyProfiles();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showLoading = useDelayedLoading(profiles.loading);

  const play = async (profile: FamilyProfileModel) => {
    if (!profile.canPlay || busyId) return;
    setBusyId(profile.id);
    setError(null);
    try {
      await authActions.switchProfile(profile.id);
      playSfx(SFX.UI_START);
      platformActions.exitToHub();
    } catch (caught) {
      setError(errorText(caught));
      setBusyId(null);
    }
  };

  const items = profiles.data ?? [];

  return (
    <>
      <ScreenHeader
        title="WHO IS PLAYING?"
        backLabel="All games"
        onBack={() => platformActions.exitToHub()}
      />
      {showLoading && <LottieLoader size="lg" label="LOADING…" className={styles.loading} />}
      {profiles.error != null && (
        <div className={styles.card}>
          <p className={styles.error} role="alert">
            {errorText(profiles.error)}
          </p>
          <Button color="green" onClick={profiles.reload}>
            TRY AGAIN
          </Button>
        </div>
      )}
      {profiles.data && items.length === 0 && (
        <div className={styles.card}>
          <img className={styles.mascot} src={MASCOT.sleep} alt="" />
          <p className={styles.empty}>
            No children yet. Ask your child&apos;s center to add them to your family.
          </p>
        </div>
      )}
      {items.length > 0 && (
        <ul className={styles.grid}>
          {items.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                className={clsx(styles.profile, !profile.canPlay && styles.waiting)}
                disabled={!profile.canPlay || busyId !== null}
                aria-label={`${profile.displayName} — ${profile.statusText}`}
                onClick={() => void play(profile)}
              >
                <img
                  className={clsx(styles.avatar, isSceneAvatar(profile.avatarKey) && styles.scene)}
                  src={avatarUrl(profile.avatarKey)}
                  alt=""
                />
                <span className={styles.name}>{profile.firstName.toUpperCase()}</span>
                <span className={styles.status}>
                  {busyId === profile.id ? 'OPENING…' : profile.statusText}
                </span>
                {profile.rejectReason && <span className={styles.reason}>{profile.rejectReason}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <footer className={styles.footer}>
        {family && <span className={styles.family}>Signed in as {family.displayName}</span>}
        <Button
          color="red"
          onClick={() => void authActions.signOut().then(() => platformActions.exitToHub())}
        >
          SIGN OUT
        </Button>
      </footer>
    </>
  );
}
