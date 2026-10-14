/**
 * Teacher Pause (plan §18–§20), chạy chồng lên GameScene (GameScene đang paused).
 *
 *   - Nền tối ~85% che sân chơi (chữ rơi cũng bị ẩn) để không ai "học tủ" vị trí chữ.
 *   - RESUME luôn đếm ngược 3-2-1-GO rồi mới chơi tiếp, lớp tối giữ nguyên tới GO.
 *   - BACK / END GAME có hộp thoại xác nhận. Kết thúc khi chưa đủ 3 đội
 *     thì quay về Setup và KHÔNG hiện thống kê so sánh.
 */
import Phaser from 'phaser';
import { SFX } from '@/core/audio/sfx';
import { DEPTH } from '@/games/bread-catcher/game/config/gameConfig';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { setupView } from '@/core/phaser/view';
import { createDim, createPanel, showConfirm } from '@/games/bread-catcher/game/scenes/overlay';
import { playCountdown } from '@/games/bread-catcher/game/ui/Countdown';
import type Panel from '@/games/bread-catcher/game/ui/Panel';
import TextButton from '@/games/bread-catcher/game/ui/TextButton';
import { addText } from '@/games/bread-catcher/game/ui/text';
import { sessionActions } from '@/games/bread-catcher/session/sessionStore';
import { RULES } from '@/games/bread-catcher/session/settings';
import { UI_TEXT } from '@/games/bread-catcher/session/text';

/** Mở từ nút nào trên HUD: Pause (menu) hoặc thẳng tới hộp thoại Back / End */
export type PauseOrigin = 'pause' | 'back' | 'end';

export default class PauseScene extends Phaser.Scene {
  private origin: PauseOrigin = 'pause';
  private panel: Panel | null = null;
  private resuming = false;

  constructor() {
    super(SCENES.PAUSE);
  }

  create({ origin }: { origin: PauseOrigin }): void {
    setupView(this);
    this.origin = origin;
    this.panel = null;
    this.resuming = false;

    const audio = getAudio(this);
    audio.setDucked('pause', true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => audio.setDucked('pause', false));

    createDim(this, RULES.pauseOverlayOpacity);
    if (origin === 'back') this.confirmLeave();
    else if (origin === 'end') this.confirmEnd();
    else this.showMenu();

    const resumeFromMenu = () => {
      if (this.panel) this.resume();
    };
    this.input.keyboard?.on('keydown-ESC', resumeFromMenu);
    this.input.keyboard?.on('keydown-P', resumeFromMenu);
  }

  private showMenu(): void {
    const panel = createPanel(this, 380);
    const top = panel.top;
    panel.add([
      addText(this, 0, top + 100, UI_TEXT.paused, 'heading', { fontSize: '32px' }),
      new TextButton(this, 0, top + 176, UI_TEXT.resume, () => this.resume(), {
        color: 'green',
        width: 220,
        sfx: null,
      }),
      new TextButton(this, 0, top + 244, UI_TEXT.back, () => this.closeMenu(() => this.confirmLeave()), {
        color: 'blue',
        width: 220,
      }),
      new TextButton(this, 0, top + 312, UI_TEXT.endGame, () => this.closeMenu(() => this.confirmEnd()), {
        color: 'red',
        width: 220,
      }),
    ]);
    this.panel = panel;
  }

  private closeMenu(next: () => void): void {
    this.panel?.destroy();
    this.panel = null;
    next();
  }

  /** Huỷ hộp thoại: về menu nếu mở từ nút Pause, còn không thì chơi tiếp */
  private cancelDialog(): void {
    if (this.origin === 'pause') this.showMenu();
    else this.resume();
  }

  private confirmLeave(): void {
    showConfirm(this, {
      title: UI_TEXT.leaveGameQuestion,
      confirmLabel: UI_TEXT.leave,
      onConfirm: () => sessionActions.abortSession(),
      onCancel: () => this.cancelDialog(),
      withDim: false,
    });
  }

  private confirmEnd(): void {
    showConfirm(this, {
      title: UI_TEXT.endGameQuestion,
      confirmLabel: UI_TEXT.end,
      // Chưa đủ 3 đội -> về Setup, không hiện thống kê (plan §20)
      onConfirm: () => sessionActions.finishSession(),
      onCancel: () => this.cancelDialog(),
      withDim: false,
    });
  }

  /** 3-2-1-GO trên nền tối rồi mới trả quyền cho GameScene (plan §19) */
  private resume(): void {
    if (this.resuming) return;
    this.resuming = true;
    this.panel?.destroy();
    this.panel = null;
    getAudio(this).playSfx(SFX.RESUME);
    playCountdown(this, { depth: DEPTH.OVERLAY + 5 }).then(() => {
      this.scene.resume(SCENES.GAME);
      this.scene.stop();
    });
  }
}
