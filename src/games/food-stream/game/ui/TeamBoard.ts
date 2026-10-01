/**
 * Classroom: banner TEAM A / TEAM B ở hai góc sân khấu + điểm; đội tới lượt nhún nhảy.
 */
import type Phaser from 'phaser';
import { DEPTH, THEME } from '@/games/food-stream/game/config/theme';
import { addText } from '@/games/food-stream/game/ui/text';
import type { Team, TeamId } from '@/games/food-stream/session/types';
import { fitText } from '@/platform/phaser/text';

const BANNER_KEYS: Record<TeamId, string> = { 0: 'ui.banner.a', 1: 'ui.banner.b' };

interface TeamView {
  container: Phaser.GameObjects.Container;
  score: Phaser.GameObjects.Text;
  bob: Phaser.Tweens.Tween | null;
}

export default class TeamBoard {
  private readonly views = new Map<TeamId, TeamView>();

  constructor(
    private readonly scene: Phaser.Scene,
    stage: Phaser.Geom.Rectangle,
    teams: readonly Team[],
  ) {
    const bannerHeight = Math.min(96, stage.height * 0.42);
    teams.forEach((team, index) => {
      const x = index === 0 ? stage.x + 34 : stage.right - 34;
      const banner = scene.add.image(0, 0, BANNER_KEYS[team.id]).setOrigin(0.5, 0);
      banner.setScale(bannerHeight / banner.height);
      const name = fitText(
        addText(scene, 0, bannerHeight + 10, team.name, 'outline', { fontSize: '12px' }),
        70,
      );
      const score = addText(scene, 0, bannerHeight + 28, '0', 'outline', {
        fontSize: '20px',
        color: team.id === 0 ? THEME.colors.pink : THEME.colors.blue,
        stroke: THEME.colors.white,
      });
      const container = scene.add.container(x, stage.y + 6, [banner, name, score]).setDepth(DEPTH.STAGE_FX);
      this.views.set(team.id, { container, score, bob: null });
    });
  }

  setScore(teamId: TeamId, score: number): void {
    const view = this.views.get(teamId);
    if (!view) return;
    view.score.setText(String(score));
    this.scene.tweens.add({
      targets: view.score,
      scale: { from: 1.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  setTurn(teamId: TeamId): void {
    this.views.forEach((view, id) => {
      view.bob?.stop();
      view.container.setAngle(0).setAlpha(id === teamId ? 1 : 0.6);
      view.bob =
        id === teamId
          ? this.scene.tweens.add({
              targets: view.container,
              angle: { from: -4, to: 4 },
              duration: 500,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })
          : null;
    });
  }
}
