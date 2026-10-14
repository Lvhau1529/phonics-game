/**
 * Nền động phía sau các màn React (Home / Setup / Results):
 * tiệm bánh + bánh chữ "P H O N I C S" bay lơ lửng, kèm nhạc nền theo màn.
 */
import Phaser from 'phaser';
import { MUSIC } from '@/games/bread-catcher/game/config/assets';
import { SFX, SFX_VOLUME } from '@/core/audio/sfx';
import { LETTER_BREADS, STAGE_BACKGROUNDS } from '@/games/bread-catcher/game/config/stages';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { setupView, view } from '@/core/phaser/view';
import { addStageBackground, setStageBackground } from '@/games/bread-catcher/game/objects/StageBackground';
import { ensureLetterTexture, LETTER_TEXTURE_SCALE } from '@/games/bread-catcher/game/objects/letterTextures';
import type { Screen } from '@/games/bread-catcher/session/sessionStore';

export type ShellScreen = Extract<Screen, 'home' | 'setup' | 'results'>;

/** Bánh chữ trang trí dọc 2 mép màn hình (x, y theo tỉ lệ) */
const FLOATING_LETTERS = [
  { letter: 'P', x: 0.11, y: 0.09 },
  { letter: 'H', x: 0.89, y: 0.07 },
  { letter: 'O', x: 0.91, y: 0.3 },
  { letter: 'N', x: 0.09, y: 0.33 },
  { letter: 'I', x: 0.9, y: 0.84 },
  { letter: 'C', x: 0.1, y: 0.87 },
  { letter: 'S', x: 0.5, y: 0.95 },
];

export default class ShellScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private screen: ShellScreen | null = null;

  constructor() {
    super(SCENES.SHELL);
  }

  create({ screen }: { screen: ShellScreen }): void {
    setupView(this);
    this.screen = null;
    this.background = addStageBackground(this, STAGE_BACKGROUNDS[0], 0x8a7a6a);
    this.addFloatingLetters();
    this.setScreen(screen);
    this.cameras.main.fadeIn(300);
  }

  setScreen(screen: ShellScreen): void {
    if (screen === this.screen) return;
    const audio = getAudio(this);
    this.screen = screen;

    if (screen === 'results') {
      setStageBackground(this.background, STAGE_BACKGROUNDS[2]);
      // Fanfare kết thúc phát một mình, xong mới vào nhạc màn kết quả
      audio.playJingle(SFX.FINAL_RESULTS, SFX_VOLUME.final_results, MUSIC.RESULTS);
    } else {
      setStageBackground(this.background, STAGE_BACKGROUNDS[0]);
      audio.playMusic(MUSIC.MENU);
    }
  }

  private addFloatingLetters(): void {
    const { width, height } = view(this);
    FLOATING_LETTERS.forEach(({ letter, x, y }, index) => {
      const bread = LETTER_BREADS[index % LETTER_BREADS.length];
      const sprite = this.add
        .image(width * x, height * y, ensureLetterTexture(this, bread, letter))
        .setScale(LETTER_TEXTURE_SCALE)
        .setAngle(Phaser.Math.Between(-12, 12));
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 12,
        angle: sprite.angle + 8,
        duration: 1300 + index * 170,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }
}
