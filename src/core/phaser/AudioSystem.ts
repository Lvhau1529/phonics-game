/**
 * Nhạc nền + SFX cho một game Phaser, sống suốt vòng đời game (dùng chung giữa các scene).
 * Game truyền vào bảng volume của nhạc; SFX là thư viện dùng chung (platform/audio/sfx.ts).
 *
 * - Bật/tắt theo `prefsStore` (React và Phaser cùng đổi được).
 * - Nhạc được tải trước ở PreloadScene của game (file nhỏ) nên đổi nhạc là phát ngay.
 * - "Duck": giảm nhạc khi Pause hoặc khi đang đọc âm / từ (để nghe rõ giọng đọc).
 * - Nhạc kết thúc (playJingle) không bao giờ chồng lên nhạc nền.
 * - Fade dùng event `step` của game nên không phụ thuộc scene nào đang chạy.
 * - Trên mobile, audio bị khoá tới lần chạm đầu tiên: chờ `unlocked` rồi mới phát.
 */
import Phaser from 'phaser';
import { SFX_VOLUME, type SfxKey } from '@/core/audio/sfx';
import { prefsStore } from '@/core/audio/prefs';

const MUSIC_FADE_MS = 700;
const DUCK_FADE_MS = 250;
/** Mức nhạc khi bị duck (30–50%) */
const DUCK_LEVEL = 0.35;

export type DuckReason = 'pause' | 'speech';

type Sound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;

export interface PlayOptions {
  rate?: number;
  volumeScale?: number;
}

export default class AudioSystem<MusicKey extends string = string> {
  private readonly sound: Phaser.Sound.BaseSoundManager;
  private music: Sound | null = null;
  private musicKey: MusicKey | null = null;
  /** Track muốn phát (kể cả khi nhạc đang tắt) */
  private desiredMusicKey: MusicKey | null = null;
  private readonly ducks = new Set<DuckReason>();
  /** Nhạc kết thúc đang phát (playJingle) */
  private jingle: Sound | null = null;
  private fadeHandler: ((time: number, delta: number) => void) | null = null;
  private readonly unsubscribePrefs: () => void;

  constructor(
    private readonly game: Phaser.Game,
    private readonly musicVolume: Record<MusicKey, number>,
  ) {
    this.sound = game.sound;
    let { music } = prefsStore.get();
    this.unsubscribePrefs = prefsStore.subscribe(() => {
      const next = prefsStore.get().music;
      if (next === music) return;
      music = next;
      if (!next) this.stopMusic();
      else if (this.desiredMusicKey) this.playMusic(this.desiredMusicKey);
    });
  }

  // -------------------------------------------------------------------------
  // SFX
  // -------------------------------------------------------------------------
  playSfx(key: SfxKey, { rate = 1, volumeScale = 1 }: PlayOptions = {}): void {
    if (!prefsStore.get().sfx || !this.game.cache.audio.exists(key)) return;
    this.sound.play(key, { volume: SFX_VOLUME[key] * volumeScale, rate });
  }

  // -------------------------------------------------------------------------
  // Music
  // -------------------------------------------------------------------------
  playMusic(key: MusicKey): void {
    this.desiredMusicKey = key;
    if (!prefsStore.get().music || !this.game.cache.audio.exists(key)) return;
    if (this.musicKey === key && this.music?.isPlaying) return;

    if (this.sound.locked) {
      this.sound.once('unlocked', () => {
        if (this.desiredMusicKey === key) this.playMusic(key);
      });
      return;
    }
    this.stopMusic();
    const music = this.sound.add(key, { loop: true, volume: 0 }) as Sound;
    music.play();
    this.music = music;
    this.musicKey = key;
    this.fadeTo(this.targetVolume, MUSIC_FADE_MS);
  }

  stopMusic(): void {
    this.cancelFade();
    this.music?.stop();
    this.music?.destroy();
    this.music = null;
    this.musicKey = null;
    this.stopJingle();
  }

  /** Tắt hẳn nhạc nền (kể cả khi người dùng bật lại MUSIC) cho tới lần playMusic / playJingle sau */
  silence(): void {
    this.desiredMusicKey = null;
    this.stopMusic();
  }

  /**
   * Nhạc kết thúc lượt / màn kết quả: tắt nhạc nền rồi phát `key` MỘT lần, không chồng lên nhạc khác.
   * Phát xong mới chuyển sang nhạc `then` (nếu có). Đổi nhạc giữa chừng (playMusic) thì jingle dừng.
   * `key` có thể là nhạc riêng của game hoặc một SFX trong thư viện chung (đã được tải sẵn).
   */
  playJingle(key: string, volume: number, then?: MusicKey): void {
    this.silence();
    this.desiredMusicKey = then ?? null;
    if (!prefsStore.get().music || this.sound.locked || !this.game.cache.audio.exists(key)) {
      if (then) this.playMusic(then);
      return;
    }
    const jingle = this.sound.add(key, { volume }) as Sound;
    jingle.once(Phaser.Sound.Events.COMPLETE, () => {
      if (this.jingle !== jingle) return;
      this.stopJingle();
      if (this.desiredMusicKey) this.playMusic(this.desiredMusicKey);
    });
    jingle.play();
    this.jingle = jingle;
  }

  /** Giảm / trả lại âm lượng nhạc nền; nhiều lý do có thể chồng lên nhau */
  setDucked(reason: DuckReason, ducked: boolean): void {
    if (ducked) this.ducks.add(reason);
    else this.ducks.delete(reason);
    if (this.music) this.fadeTo(this.targetVolume, DUCK_FADE_MS);
  }

  destroy(): void {
    this.unsubscribePrefs();
    this.stopMusic();
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------
  private stopJingle(): void {
    const jingle = this.jingle;
    this.jingle = null;
    jingle?.stop();
    jingle?.destroy();
  }

  private get targetVolume(): number {
    if (!this.musicKey) return 0;
    return this.musicVolume[this.musicKey] * (this.ducks.size > 0 ? DUCK_LEVEL : 1);
  }

  private fadeTo(target: number, duration: number): void {
    const sound = this.music;
    if (!sound) return;
    this.cancelFade();
    const start = sound.volume;
    let elapsed = 0;
    this.fadeHandler = (_time, delta) => {
      elapsed += delta;
      const t = Math.min(1, elapsed / duration);
      sound.setVolume(start + (target - start) * t);
      if (t >= 1) this.cancelFade();
    };
    this.game.events.on('step', this.fadeHandler);
  }

  private cancelFade(): void {
    if (!this.fadeHandler) return;
    this.game.events.off('step', this.fadeHandler);
    this.fadeHandler = null;
  }
}
