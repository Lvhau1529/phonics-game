/**
 * Bật/tắt SOUND · MUSIC · VOICE — dùng chung cho mọi game, lưu localStorage,
 * game Phaser đang chạy cập nhật ngay (prefsStore). Mỗi nút một icon riêng (loa / nốt nhạc / miệng).
 */
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { usePrefs } from '@/core/store/useStore';
import { setPref, type Prefs } from '@/core/audio/prefs';
import Icon from '@/ui/Icon/Icon';
import type { IconName } from '@/ui/icons';
import { speech } from '@/core/utils/speech';
import styles from '@/ui/AudioToggles/AudioToggles.module.scss';

const TOGGLES: { key: keyof Prefs; label: string; on: IconName; off: IconName }[] = [
  { key: 'sfx', label: 'SOUND', on: 'soundOn', off: 'soundOff' },
  { key: 'music', label: 'MUSIC', on: 'musicOn', off: 'musicOff' },
  { key: 'voice', label: 'VOICE', on: 'voiceOn', off: 'voiceOff' },
];

/** `className`: màn chứa đặt vị trí (vd ô lưới ở bố cục ngang) */
export default function AudioToggles({ className }: { className?: string }) {
  const prefs = usePrefs();
  const toggles = speech.supported ? TOGGLES : TOGGLES.filter((toggle) => toggle.key !== 'voice');

  return (
    <div className={clsx(styles.toggles, className)}>
      {toggles.map(({ key, label, on: iconOn, off: iconOff }) => {
        const on = prefs[key];
        const toggle = () => setPref(key, !on);
        return (
          <button
            key={key}
            type="button"
            className={clsx(styles.toggle, !on && styles.off)}
            aria-pressed={on}
            onClick={() => {
              // Tắt SOUND: phát tiếng "tắt" trước khi im; bật lại SOUND: nghe ngay tiếng "bật"
              if (key === 'sfx' && on) {
                playSfx(SFX.UI_TOGGLE_OFF);
                toggle();
              } else {
                toggle();
                playSfx(on ? SFX.UI_TOGGLE_OFF : SFX.UI_TOGGLE_ON);
              }
            }}
          >
            <Icon name={on ? iconOn : iconOff} size={40} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
