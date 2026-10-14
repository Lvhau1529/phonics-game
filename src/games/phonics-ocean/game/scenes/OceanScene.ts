/**
 * Một lượt chơi Phonics Ocean (GAMEPLAY_PHONICS_V2 §3 — Feeding Frenzy + phonics):
 *
 *   ra đề (đọc âm / vần / từ, hiện ở HUD) -> 2–6 cá mang chữ bơi vào -> bé bơi tới ăn
 *     đúng: cắn + đọc lại từ + điểm + Growth (đủ mốc thì lớn thêm một cỡ) -> đề mới
 *     nhầm: choáng nhẹ, cá bị đẩy ra, mất chuỗi, đọc lại đề — KHÔNG mất tim; nhầm 2 lần -> gợi ý
 *   cá săn mồi (có cảnh báo "!") cắn thì mất tim; hết tim / hết giờ / đủ số từ -> kết thúc
 *   đàn cá thường kiểu Feeding Frenzy luôn bơi kín màn: ăn cá nhỏ hơn mình lấy điểm + đầy thanh FRENZY
 *     (FRENZY!: điểm ×2, bơi nhanh), va cá to hơn thì bật ra (session/frenzy.ts)
 *
 * Scene chỉ DIỄN: luật nằm ở session/round.ts + session/questions.ts, hình ở objects/ + ui/.
 */
import Phaser from 'phaser';
import { getLevel, type LevelDef } from '@/games/phonics-ocean/content/levels';
import { JINGLE, MUSIC, OCEAN_SFX } from '@/games/phonics-ocean/game/config/assets';
import { PREY_KEYS } from '@/games/phonics-ocean/game/config/sprites';
import { FEEL, THEME } from '@/games/phonics-ocean/game/config/theme';
import { SCENES } from '@/games/phonics-ocean/game/core/keys';
import { getAudio, playOceanSfx, type OceanAudio } from '@/games/phonics-ocean/game/core/services';
import OceanBackground from '@/games/phonics-ocean/game/objects/OceanBackground';
import PlayerFish, { type SteerInput } from '@/games/phonics-ocean/game/objects/PlayerFish';
import PowerUp, { type PowerUpKind } from '@/games/phonics-ocean/game/objects/PowerUp';
import Predator, { showWarning } from '@/games/phonics-ocean/game/objects/Predator';
import type SchoolFish from '@/games/phonics-ocean/game/objects/SchoolFish';
import WordFish from '@/games/phonics-ocean/game/objects/WordFish';
import Effects from '@/games/phonics-ocean/game/systems/Effects';
import SchoolDirector from '@/games/phonics-ocean/game/systems/SchoolDirector';
import Voice from '@/games/phonics-ocean/game/systems/Voice';
import Hud from '@/games/phonics-ocean/game/ui/Hud';
import { oceanLayout, type OceanLayout } from '@/games/phonics-ocean/game/ui/layout';
import TargetPanel from '@/games/phonics-ocean/game/ui/TargetPanel';
import { canEat, FRENZY, FrenzyMeter } from '@/games/phonics-ocean/session/frenzy';
import { QuestionDeck } from '@/games/phonics-ocean/session/questions';
import { RoundState, RULES } from '@/games/phonics-ocean/session/round';
import { phonicsOceanActions, phonicsOceanStore } from '@/games/phonics-ocean/session/store';
import type { EndReason, Question } from '@/games/phonics-ocean/session/types';
import { PRAISE, TEXT } from '@/games/phonics-ocean/session/text';
import { SFX } from '@/platform/audio/sfx';
import { setupView } from '@/platform/phaser/view';
import { pickRandom, shuffle } from '@/shared/random';

type Phase = 'intro' | 'playing' | 'between' | 'complete';

/** Khoảng trống trên / dưới vùng bơi khi xếp làn cho cá mang chữ */
const LANE_MARGIN = { top: 34, bottom: 30 };

export default class OceanScene extends Phaser.Scene {
  private level!: LevelDef;
  private layout!: OceanLayout;
  private audio!: OceanAudio;
  private voice!: Voice;
  private effects!: Effects;
  private hud!: Hud;
  private panel!: TargetPanel;
  private player!: PlayerFish;
  private round!: RoundState;
  private deck!: QuestionDeck;
  private background!: OceanBackground;
  private schools!: SchoolDirector;
  private frenzy!: FrenzyMeter;
  private predatorsOn = true;
  private phase: Phase = 'intro';
  private question: Question | null = null;
  private fishes: WordFish[] = [];
  private predators: Predator[] = [];
  private powerUps: PowerUp[] = [];
  private incomingPredators = 0;
  private remainingMs = 0;
  private predatorClock = 0;
  private powerUpClock = 0;
  private steer: SteerInput = { keys: null, target: null };
  private keys: Record<
    'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd',
    Phaser.Input.Keyboard.Key
  > | null = null;
  /** Tăng mỗi lần create(): callback của lần chơi trước (vd giọng đọc xong muộn) tự dừng */
  private run = 0;

  constructor() {
    super(SCENES.OCEAN);
  }

  create(): void {
    const session = phonicsOceanStore.get().session;
    if (!session) return;
    this.run += 1;
    this.phase = 'intro';
    this.question = null;
    this.fishes = [];
    this.predators = [];
    this.powerUps = [];
    this.incomingPredators = 0;
    this.predatorClock = 0;
    this.powerUpClock = 0;
    this.steer = { keys: null, target: null };

    const { width, height } = setupView(this);
    this.level = getLevel(session.settings.levelId);
    this.predatorsOn = session.settings.predators;
    this.layout = oceanLayout(this);
    this.audio = getAudio(this);
    this.voice = new Voice(this.audio);
    this.effects = new Effects(this, this.layout.play);
    this.round = new RoundState(this.level);
    this.deck = new QuestionDeck(this.level, { canSpeak: Voice.available });
    this.remainingMs = this.level.roundSeconds * 1000;

    this.background = new OceanBackground(
      this,
      this.level.biome,
      new Phaser.Geom.Rectangle(0, 0, width, height),
    );
    // Dải tối nhẹ sau HUD cho chữ dễ đọc
    this.add.rectangle(0, 0, width, this.layout.play.y, THEME.hex.ink, 0.28).setOrigin(0).setDepth(1);
    const { play } = this.layout;
    this.player = new PlayerFish(this, play.centerX, play.centerY, play);
    this.frenzy = new FrenzyMeter();
    this.schools = new SchoolDirector(this, play);
    this.schools.populate({ x: this.player.x, y: this.player.y });
    this.hud = new Hud(this, this.layout, {
      maxHearts: RULES.hearts,
      showHearts: this.predatorsOn,
      onPause: () => this.openPause(),
    });
    this.hud.setTime(this.remainingMs);
    this.hud.setFrenzy(0, false);
    this.panel = new TargetPanel(this, this.layout, () => this.speakPrompt());

    this.bindInput();
    this.audio.playMusic(MUSIC.GAMEPLAY);
    // Chuyển app / tab thì tự tạm dừng
    this.game.events.on(Phaser.Core.Events.BLUR, this.openPause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.openPause, this);
      this.voice.cancel();
    });
    this.cameras.main.fadeIn(250);
    this.intro();
  }

  override update(_time: number, delta: number): void {
    if (!this.round || this.phase === 'complete') return;
    this.readKeys();
    const { player, frenzy } = this;
    player.setSpeedScale((1 + this.round.speedBoost * 0.5) * (frenzy.active ? FRENZY.speedBoost : 1));
    player.steer(this.steer, delta);
    this.background.follow(player.x, player.y);

    const speed = this.level.speed * (1 + this.round.speedBoost);
    this.fishes.forEach((fish) => fish.update(delta, this.layout.play, speed));
    this.fishes = this.fishes.filter((fish) => !fish.gone);
    this.schools.update(delta, this.level.speed, { x: player.x, y: player.y, tier: player.tier });
    this.predators.forEach((predator) => predator.update(delta, player.y, this.round.predatorsCalm));
    this.predators = this.predators.filter((predator) => !predator.finished);
    this.predatorsFeed();
    this.powerUps = this.powerUps.filter((item) => item.available);

    if (this.phase === 'intro') return;
    frenzy.tick(delta);
    player.setFrenzy(frenzy.active);
    this.hud.setFrenzy(frenzy.display, frenzy.active);
    this.remainingMs -= delta;
    this.hud.setTime(this.remainingMs);
    if (this.remainingMs <= 0) {
      this.complete('time');
      return;
    }
    this.checkPrey();
    this.checkSchool();
    this.checkPredators();
    this.checkPowerUps();
    this.spawnTimers(delta);
  }

  // -------------------------------------------------------------------------
  // Luồng lượt chơi
  // -------------------------------------------------------------------------
  private intro(): void {
    const run = this.run;
    void this.effects
      .banner(TEXT.getReady, { holdMs: 600, size: 36 })
      .then(() => {
        if (run !== this.run) return undefined;
        this.audio.playSfx(SFX.COUNTDOWN_GO);
        return this.effects.banner(TEXT.go, { holdMs: 150, size: 56, color: THEME.colors.green });
      })
      .then(() => {
        if (run !== this.run || this.phase === 'complete') return;
        this.nextQuestion();
      });
  }

  private nextQuestion(): void {
    this.round.startQuestion();
    const question = this.deck.next(this.round.choiceCount);
    this.question = question;
    this.panel.show(question);
    this.speakPrompt();
    this.spawnFish(question);
    this.phase = 'playing';
  }

  private spawnFish(question: Question): void {
    const { play } = this.layout;
    const top = play.y + LANE_MARGIN.top;
    const laneHeight = (play.height - LANE_MARGIN.top - LANE_MARGIN.bottom) / question.choices.length;
    const lanes = shuffle(question.choices.map((_, index) => top + laneHeight * (index + 0.5)));
    const textures = shuffle(PREY_KEYS);
    question.choices.forEach((word, index) => {
      // Vào từ mép xa cá của bé hơn (không bơi thẳng vào miệng ngay lúc xuất hiện)
      const fromLeft = Math.random() < (this.player.x > play.centerX ? 0.7 : 0.3);
      const speed = Phaser.Math.Between(FEEL.preySpeed.min, FEEL.preySpeed.max) * (fromLeft ? 1 : -1);
      const fish = new WordFish(this, word, word === question.answer, textures[index % textures.length], {
        x: fromLeft ? play.x - 40 - index * 12 : play.right + 40 + index * 12,
        y: lanes[index],
        speed,
      });
      this.fishes.push(fish);
    });
  }

  private checkPrey(): void {
    if (this.phase !== 'playing' || this.player.stunned) return;
    const mouth = this.player.mouth;
    const fish = this.fishes.find(
      (item) =>
        item.catchable &&
        Phaser.Math.Distance.Between(mouth.x, mouth.y, item.x, item.y) < mouth.r + item.radius * 0.7,
    );
    if (!fish) return;
    if (fish.correct) this.onCorrect(fish);
    else if (this.player.isChasing(fish.x, fish.y)) this.onWrong(fish);
    else fish.swerve(this.player.x);
  }

  private onCorrect(fish: WordFish): void {
    const question = this.question!;
    const run = this.run;
    this.phase = 'between';
    const outcome = this.round.answerCorrect(fish.word, question.targetId);
    const mouth = this.player.mouth;
    // FRENZY!: nhân đôi cả điểm từ đúng; ăn đúng cũng làm đầy thanh FRENZY
    const points = outcome.points * this.frenzy.multiplier;
    this.round.addBonus(points - outcome.points);
    if (this.frenzy.word()) this.startFrenzy();

    this.player.bite();
    void fish.eatenBy(mouth);
    playOceanSfx(this, OCEAN_SFX.CORRECT);
    this.effects.sparkles(mouth.x, mouth.y);
    this.effects.bubbles(mouth.x, mouth.y);
    this.effects.popup(mouth.x, mouth.y - 28, `+${points}`);
    this.effects.popup(mouth.x, mouth.y - 52, pickRandom(PRAISE), THEME.colors.white, 16);
    this.voice.say(question.feedbackSpeech);
    this.panel.reveal(question);
    this.fishes.forEach((other) => other !== fish && other.leave());

    this.hud.setScore(this.round.score);
    this.hud.setGrowth(this.round.growth, this.round.tier);
    if (outcome.multiplier > 1) {
      this.effects.popup(
        this.layout.play.centerX,
        this.layout.play.y + 40,
        `${TEXT.combo} x${outcome.multiplier}`,
        THEME.colors.orange,
        24,
      );
    }
    if (outcome.rhymeCombo)
      void this.effects.banner(TEXT.rhymeCombo, { size: 30, holdMs: 500, color: THEME.colors.sky });
    if (outcome.harder)
      this.effects.popup(
        this.layout.play.centerX,
        this.layout.play.bottom - 30,
        TEXT.moreFish,
        THEME.colors.sky,
      );

    let delay: number = FEEL.nextQuestionDelay;
    if (outcome.grew) {
      this.player.grow(this.round.tier);
      playOceanSfx(this, OCEAN_SFX.LEVEL_UP);
      this.effects.sparkles(this.player.x, this.player.y, 10, 60);
      void this.effects.banner(TEXT.bigger, { size: 40, holdMs: 500, color: THEME.colors.green });
      delay += 500;
    }
    if (outcome.cleared) {
      this.time.delayedCall(500, () => run === this.run && this.complete('cleared'));
      return;
    }
    this.time.delayedCall(delay, () => {
      if (run === this.run && this.phase === 'between') this.nextQuestion();
    });
  }

  private onWrong(fish: WordFish): void {
    const outcome = this.round.answerWrong();
    const run = this.run;
    fish.reject(this.player.x);
    this.player.stun();
    playOceanSfx(this, OCEAN_SFX.WRONG);
    this.effects.popup(fish.x, fish.y - 30, 'OOPS!', '#ffb3b3', 16);
    if (outcome.hint) this.fishes.find((item) => item.correct)?.setHint(true);
    // Nghe lại đề (không phạt — chỉ mất chuỗi)
    this.time.delayedCall(450, () => {
      if (run === this.run && this.phase === 'playing') this.speakPrompt();
    });
  }

  /** Đàn cá thường: ăn cá nhỏ hơn mình, va cá to hơn thì bật ra */
  private checkSchool(): void {
    const { player } = this;
    if (player.stunned) return;
    const mouth = player.mouth;
    for (const fish of this.schools.fishes) {
      if (fish.finished) continue;
      const edible = canEat(player.tier, fish.size);
      const distance = edible
        ? Phaser.Math.Distance.Between(mouth.x, mouth.y, fish.x, fish.y)
        : Phaser.Math.Distance.Between(player.x, player.y, fish.x, fish.y);
      const reach = edible ? mouth.r + fish.radius * 0.6 : player.hitRadius + fish.radius * 0.8;
      if (distance >= reach) continue;
      if (edible) this.eatSchoolFish(fish);
      else if (player.bump(fish.x, fish.y)) {
        this.frenzy.bump();
        playOceanSfx(this, OCEAN_SFX.WRONG, { rate: 1.35 });
      }
      return;
    }
  }

  private eatSchoolFish(fish: SchoolFish): void {
    const mouth = this.player.mouth;
    fish.eatenBy(mouth);
    this.schools.remove(fish);
    this.player.bite();
    const { points, started } = this.frenzy.eat(fish.size);
    this.round.addBonus(points);
    this.hud.setScore(this.round.score);
    playOceanSfx(this, OCEAN_SFX.COLLECT, { rate: Phaser.Math.FloatBetween(1.1, 1.45) });
    this.effects.bubbles(mouth.x, mouth.y, 3);
    this.effects.popup(mouth.x, mouth.y - 20, `+${points}`, THEME.colors.white, 14);
    if (started) this.startFrenzy();
  }

  private startFrenzy(): void {
    playOceanSfx(this, OCEAN_SFX.LEVEL_UP, { rate: 1.2 });
    this.effects.sparkles(this.player.x, this.player.y, 8, 50);
    void this.effects.banner(TEXT.frenzy, { size: 38, holdMs: 450, color: THEME.colors.orange });
  }

  /** Cá săn mồi đi qua thì đớp luôn cá nhỏ (đại dương sống động hơn) */
  private predatorsFeed(): void {
    this.predators.forEach((predator) => {
      const center = predator.hitCenter;
      this.schools.fishes.forEach((fish) => {
        if (fish.size === 'big' || fish.finished) return;
        if (Phaser.Math.Distance.Between(center.x, center.y, fish.x, fish.y) < predator.hitRadius) {
          fish.eatenBy(center);
          this.schools.remove(fish);
        }
      });
    });
  }

  private checkPredators(): void {
    if (this.player.invulnerable) return;
    const hit = this.predators.find((predator) => {
      const center = predator.hitCenter;
      return (
        Phaser.Math.Distance.Between(center.x, center.y, this.player.x, this.player.y) <
        predator.hitRadius + this.player.hitRadius * 0.8
      );
    });
    if (!hit) return;
    this.player.hurt(hit.x);
    this.cameras.main.shake(180, 0.004);
    if (this.player.shielded) {
      this.player.setShield(false);
      playOceanSfx(this, OCEAN_SFX.COLLECT);
      this.effects.popup(this.player.x, this.player.y - 40, TEXT.shield, THEME.colors.sky);
      return;
    }
    const hearts = this.round.loseHeart();
    this.hud.setHearts(hearts);
    this.audio.playSfx(SFX.WRONG_LETTER, { rate: 0.75 });
    this.effects.popup(this.player.x, this.player.y - 40, TEXT.ouch, THEME.colors.red, 22);
    if (hearts <= 0) this.complete('caught');
  }

  private checkPowerUps(): void {
    const item = this.powerUps.find(
      (power) =>
        power.available &&
        Phaser.Math.Distance.Between(power.x, power.y, this.player.x, this.player.y) <
          power.radius + this.player.hitRadius,
    );
    if (!item) return;
    item.collect();
    playOceanSfx(this, OCEAN_SFX.COLLECT);
    this.round.addBonus(RULES.points.powerUp);
    this.hud.setScore(this.round.score);
    const { x, y } = this.player;
    switch (item.kind) {
      case 'clock':
        this.remainingMs += RULES.bonusSeconds * 1000;
        this.effects.popup(x, y - 40, TEXT.extraTime, THEME.colors.sky);
        break;
      case 'bubble':
        this.player.setShield(true);
        this.effects.popup(x, y - 40, TEXT.shield, THEME.colors.sky);
        break;
      case 'heart':
        this.round.gainHeart();
        this.hud.setHearts(this.round.hearts);
        this.effects.popup(x, y - 40, TEXT.extraHeart, THEME.colors.red);
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Cá săn mồi + vật phẩm
  // -------------------------------------------------------------------------
  private spawnTimers(delta: number): void {
    if (this.predatorsOn) {
      this.predatorClock += delta;
      const maxPredators = this.level.number >= 5 ? 2 : 1;
      if (
        this.predatorClock >= this.level.predatorEverySec * 1000 &&
        this.predators.length + this.incomingPredators < maxPredators
      ) {
        this.predatorClock = Phaser.Math.Between(-2000, 1000);
        this.spawnPredator();
      }
    }
    this.powerUpClock += delta;
    if (this.powerUpClock >= FEEL.powerUpEveryMs) {
      this.powerUpClock = Phaser.Math.Between(-3000, 0);
      this.spawnPowerUp();
    }
  }

  private spawnPredator(): void {
    const { play } = this.layout;
    const run = this.run;
    // Vào từ phía xa cá của bé (không xuất hiện sát bé)
    const direction: 1 | -1 = this.player.x > play.centerX ? 1 : -1;
    const y = Phaser.Math.Between(play.y + 40, play.bottom - 40);
    const kind = pickRandom(this.level.predators);
    this.incomingPredators += 1;
    playOceanSfx(this, OCEAN_SFX.DANGER);
    void showWarning(this, direction > 0 ? play.x + 22 : play.right - 22, y, FEEL.warningMs).then(() => {
      if (run !== this.run) return;
      this.incomingPredators -= 1;
      if (this.phase === 'complete') return;
      const speed = FEEL.predatorSpeed * this.level.speed;
      this.predators.push(new Predator(this, kind, y, direction, play, speed));
    });
  }

  private spawnPowerUp(): void {
    const kinds: PowerUpKind[] = ['clock'];
    if (this.predatorsOn) kinds.push('bubble');
    if (this.predatorsOn && this.round.hearts < RULES.hearts) kinds.push('heart', 'heart');
    const { play } = this.layout;
    this.powerUps.push(
      new PowerUp(this, pickRandom(kinds), Phaser.Math.Between(play.x + 40, play.right - 40), play),
    );
  }

  // -------------------------------------------------------------------------
  // Kết thúc
  // -------------------------------------------------------------------------
  private complete(endedBy: EndReason): void {
    if (this.phase === 'complete') return;
    this.phase = 'complete';
    const run = this.run;
    this.voice.cancel();
    this.panel.setSpeaking(false);
    this.fishes.forEach((fish) => fish.leave());
    const result = this.round.finish(endedBy);
    this.hud.setTime(Math.max(0, this.remainingMs));

    // Hết lượt: tắt nhạc nền ngay, chỉ còn nhạc kết thúc
    this.audio.silence();
    let banner: Promise<void>;
    if (endedBy === 'cleared') {
      playOceanSfx(this, OCEAN_SFX.LEVEL_UP);
      this.effects.sparkles(this.player.x, this.player.y, 12, 70);
      banner = this.effects.banner(TEXT.levelClear, { size: 40, holdMs: 1100 });
    } else if (endedBy === 'time') {
      this.audio.playSfx(SFX.TIME_UP);
      banner = this.effects.banner(TEXT.timesUp, { color: THEME.colors.red, holdMs: 1000 });
    } else {
      banner = this.effects.banner(TEXT.caught, { color: THEME.colors.red, holdMs: 1000 });
    }
    this.audio.playJingle(JINGLE.key, JINGLE.volume, MUSIC.REWARD);
    void banner.then(() => {
      if (run === this.run) phonicsOceanActions.finishRound(result);
    });
  }

  // -------------------------------------------------------------------------
  // Điều khiển
  // -------------------------------------------------------------------------
  private bindInput(): void {
    const setTarget = (pointer: Phaser.Input.Pointer) => {
      this.steer.target = { x: pointer.worldX, y: pointer.worldY };
    };
    this.input.on(Phaser.Input.Events.POINTER_DOWN, setTarget);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) setTarget(pointer);
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    const { KeyCodes } = Phaser.Input.Keyboard;
    this.keys = keyboard.addKeys({
      up: KeyCodes.UP,
      down: KeyCodes.DOWN,
      left: KeyCodes.LEFT,
      right: KeyCodes.RIGHT,
      w: KeyCodes.W,
      a: KeyCodes.A,
      s: KeyCodes.S,
      d: KeyCodes.D,
    }) as NonNullable<OceanScene['keys']>;
    keyboard.on('keydown-P', () => this.openPause());
    keyboard.on('keydown-ESC', () => this.openPause());
    keyboard.on('keydown-SPACE', () => this.speakPrompt());
  }

  private readKeys(): void {
    const k = this.keys;
    if (!k) return;
    const x = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    const y = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    if (x !== 0 || y !== 0) {
      this.steer.keys = { x, y };
      this.steer.target = null;
    } else {
      this.steer.keys = null;
    }
  }

  private speakPrompt(): void {
    const question = this.question;
    if (!question || this.phase === 'complete') return;
    this.voice.say(question.promptSpeech, {
      onStart: () => this.panel.setSpeaking(true),
      onEnd: () => this.panel.setSpeaking(false),
    });
  }

  private openPause(): void {
    if (this.phase === 'complete' || !this.scene.isActive()) return;
    this.voice.cancel();
    this.panel.setSpeaking(false);
    this.steer.target = null;
    this.scene.launch(SCENES.PAUSE);
    this.scene.pause();
  }
}
