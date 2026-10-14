/**
 * Phòng stream phía sau các màn React (Home / Setup / Results): hai streamer ngồi chờ,
 * tim bay lên, kèm nhạc menu (màn kết quả giữ nhạc kết thúc do LiveScene phát).
 */
import Phaser from 'phaser';
import { MUSIC } from '@/games/food-stream/game/config/assets';
import { SCENES } from '@/games/food-stream/game/core/keys';
import { getAudio } from '@/games/food-stream/game/core/services';
import StreamRoom from '@/games/food-stream/game/objects/StreamRoom';
import Streamer from '@/games/food-stream/game/objects/Streamer';
import Effects from '@/games/food-stream/game/systems/Effects';
import type { Screen } from '@/games/food-stream/session/store';
import { setupView } from '@/core/phaser/view';

export type StudioScreen = Exclude<Screen, 'play'>;

const HEART_INTERVAL_MS = 1400;

export default class StudioScene extends Phaser.Scene {
  private screen: StudioScreen | null = null;
  private streamers: Streamer[] = [];

  constructor() {
    super(SCENES.STUDIO);
  }

  create({ screen }: { screen: StudioScreen }): void {
    const { width, height } = setupView(this);
    this.screen = null;
    const area = new Phaser.Geom.Rectangle(0, 0, width, height);
    new StreamRoom(this, area, 0, { framed: false });

    const characterHeight = Math.min(height * 0.3, 220);
    const bottom = height * 0.98;
    this.streamers = [
      new Streamer(this, width * 0.28, bottom, 'girl', characterHeight),
      new Streamer(this, width * 0.72, bottom, 'boy', characterHeight),
    ];

    const effects = new Effects(this);
    this.time.addEvent({
      delay: HEART_INTERVAL_MS,
      loop: true,
      callback: () => effects.hearts(Phaser.Math.Between(20, width - 20), height * 0.9, 2),
    });
    this.setScreen(screen);
    this.cameras.main.fadeIn(300);
  }

  setScreen(screen: StudioScreen): void {
    if (screen === this.screen) return;
    this.screen = screen;
    if (screen === 'results') {
      // Nhạc kết thúc đã được LiveScene phát (xong jingle mới tự sang nhạc reward) — không phát chồng
      this.streamers.forEach((streamer) => streamer.cheer());
    } else {
      getAudio(this).playMusic(MUSIC.MENU);
    }
  }
}
