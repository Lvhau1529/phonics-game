/**
 * Tạm dừng (overlay trên LiveScene): màn chơi tối lại, RESUME hoặc QUIT (có xác nhận).
 */
import Phaser from 'phaser';
import { DEPTH, THEME } from '@/games/food-stream/game/config/theme';
import { SCENES } from '@/games/food-stream/game/core/keys';
import { getAudio } from '@/games/food-stream/game/core/services';
import CandyButton from '@/games/food-stream/game/ui/CandyButton';
import { addText } from '@/games/food-stream/game/ui/text';
import { foodStreamActions } from '@/games/food-stream/session/store';
import { TEXT } from '@/games/food-stream/session/text';
import { SFX } from '@/platform/audio/sfx';
import { setupView } from '@/platform/phaser/view';

export default class PauseScene extends Phaser.Scene {
  private panel!: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.PAUSE);
  }

  create(): void {
    const { width, height } = setupView(this);
    const audio = getAudio(this);
    audio.playSfx(SFX.PAUSE);
    audio.setDucked('pause', true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => audio.setDucked('pause', false));

    this.add
      .rectangle(0, 0, width, height, 0x1a0d2a, 0.82)
      .setOrigin(0)
      .setInteractive()
      .setDepth(DEPTH.OVERLAY);
    this.panel = this.add.container(width / 2, height / 2).setDepth(DEPTH.OVERLAY + 1);
    this.showMenu();

    this.input.keyboard?.on('keydown-P', () => this.resume());
    this.input.keyboard?.on('keydown-ESC', () => this.resume());
  }

  private showMenu(): void {
    this.panel.removeAll(true);
    this.panel.add([
      addText(this, 0, -110, TEXT.paused, 'banner'),
      new CandyButton(this, 0, -10, TEXT.resume, () => this.resume(), { color: 'green', width: 220 }),
      new CandyButton(this, 0, 70, TEXT.quit, () => this.confirmQuit(), { color: 'white', width: 220 }),
    ]);
  }

  private confirmQuit(): void {
    this.panel.removeAll(true);
    this.panel.add([
      addText(this, 0, -90, TEXT.quitQuestion, 'banner', { fontSize: '30px', color: THEME.colors.white }),
      new CandyButton(this, 0, 0, TEXT.quit, () => foodStreamActions.abortSession(), {
        color: 'pink',
        width: 220,
      }),
      new CandyButton(this, 0, 80, TEXT.cancel, () => this.showMenu(), { color: 'white', width: 220 }),
    ]);
  }

  private resume(): void {
    getAudio(this).playSfx(SFX.RESUME);
    this.scene.resume(SCENES.LIVE);
    this.scene.stop();
  }
}
