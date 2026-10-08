/**
 * Tạm dừng (overlay trên OceanScene): màn chơi tối lại, RESUME hoặc QUIT (có xác nhận).
 */
import Phaser from 'phaser';
import { DEPTH, THEME } from '@/games/phonics-ocean/game/config/theme';
import { SCENES } from '@/games/phonics-ocean/game/core/keys';
import { getAudio } from '@/games/phonics-ocean/game/core/services';
import PillButton from '@/games/phonics-ocean/game/ui/PillButton';
import { addText } from '@/games/phonics-ocean/game/ui/text';
import { phonicsOceanActions } from '@/games/phonics-ocean/session/store';
import { TEXT } from '@/games/phonics-ocean/session/text';
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
      .rectangle(0, 0, width, height, THEME.hex.ink, 0.82)
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
      new PillButton(this, 0, -10, TEXT.resume, () => this.resume(), { color: 'green' }),
      new PillButton(this, 0, 70, TEXT.quit, () => this.confirmQuit(), { color: 'white' }),
    ]);
  }

  private confirmQuit(): void {
    this.panel.removeAll(true);
    this.panel.add([
      addText(this, 0, -90, TEXT.quitQuestion, 'banner', { fontSize: '30px', color: THEME.colors.white }),
      new PillButton(this, 0, 0, TEXT.quit, () => phonicsOceanActions.abortSession(), { color: 'orange' }),
      new PillButton(this, 0, 80, TEXT.cancel, () => this.showMenu(), { color: 'white' }),
    ]);
  }

  private resume(): void {
    getAudio(this).playSfx(SFX.RESUME);
    this.scene.resume(SCENES.OCEAN);
    this.scene.stop();
  }
}
