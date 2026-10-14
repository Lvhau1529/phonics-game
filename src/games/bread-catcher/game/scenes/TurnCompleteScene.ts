/**
 * Tổng kết sau mỗi lượt (plan §21):
 *
 *   TEAM TURN COMPLETE
 *   🦁 LIONS
 *   3 / 5 WORDS · 300 POINTS
 *   [NEXT TEAM]  (đội cuối: [FINAL RESULTS] · Solo: [SEE RESULTS])
 */
import Phaser from 'phaser';
import { MASCOT_IMAGE_SCALE, mascotTexture } from '@/games/bread-catcher/game/config/assets';
import { SFX, SFX_VOLUME } from '@/core/audio/sfx';
import { THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { setupView } from '@/core/phaser/view';
import { createDim, createPanel } from '@/games/bread-catcher/game/scenes/overlay';
import TextButton from '@/games/bread-catcher/game/ui/TextButton';
import { addText } from '@/games/bread-catcher/game/ui/text';
import { fitText } from '@/core/phaser/text';
import { appStore, isSessionComplete, sessionActions } from '@/games/bread-catcher/session/sessionStore';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import type { Team, TurnResult } from '@/games/bread-catcher/session/types';

export interface TurnCompleteData {
  team: Team;
  result: TurnResult;
  totalWords: number;
}

export default class TurnCompleteScene extends Phaser.Scene {
  constructor() {
    super(SCENES.TURN_COMPLETE);
  }

  create({ team, result, totalWords }: TurnCompleteData): void {
    setupView(this);
    const session = appStore.get().session;
    const isSolo = session?.settings.mode === 'solo';
    const isLastTurn = !session || isSessionComplete(session);

    createDim(this, 0.7);
    const panel = createPanel(this, 420);
    const top = panel.top;

    const mascot = this.add
      .image(0, top + 160, mascotTexture(team.mascot))
      .setScale(1.1 * MASCOT_IMAGE_SCALE);
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const [label, action] = isSolo
      ? [UI_TEXT.seeResults, () => sessionActions.finishSession()]
      : isLastTurn
        ? [UI_TEXT.finalResults, () => sessionActions.finishSession()]
        : [UI_TEXT.nextTeam, () => this.nextTeam()];
    const button = new TextButton(this, 0, top + 360, label, action, {
      color: 'green',
      width: 240,
      fontSize: 22,
    });

    panel.add([
      addText(this, 0, top + 96, isSolo ? UI_TEXT.greatJob : UI_TEXT.teamTurnComplete, 'heading', {
        fontSize: '23px',
      }),
      mascot,
      fitText(
        addText(this, 0, top + 222, team.name, 'heading', { fontSize: '28px', color: THEME.colors.orange }),
        panel.panelWidth - 70,
      ),
      addText(this, 0, top + 262, `${result.correctWords} / ${totalWords} ${UI_TEXT.words}`, 'label', {
        fontSize: '20px',
      }),
      addText(this, 0, top + 294, `${result.score} ${UI_TEXT.points}`, 'label', {
        fontSize: '24px',
        fontStyle: '800',
        color: THEME.colors.blue,
      }),
      button,
    ]);

    // Nhạc kết thúc lượt phát một mình (nhạc nền của lượt tắt hẳn)
    getAudio(this).playJingle(SFX.ROUND_COMPLETE, SFX_VOLUME.round_complete);
    this.input.keyboard?.once('keydown-ENTER', () => button.trigger());
  }

  private nextTeam(): void {
    this.scene.stop(SCENES.GAME);
    this.scene.start(SCENES.TURN_PICKER);
  }
}
