/**
 * Một lượt chơi của một đội (plan §8–§16).
 *
 *   GET READY 3-2-1-GO ─▶ từ 1 ─▶ ... ─▶ từ 5 ─▶ TEAM TURN COMPLETE
 *                          (hoặc hết giờ: TIME'S UP!)
 *
 * Mỗi từ: hứng đúng lần lượt từng chữ. Hứng nhầm MỘT chữ là kết thúc từ đó
 * (từ sai ở lại để luyện sau). Đúng cả từ: +100 điểm.
 *
 * Scene chỉ "điều phối": tạo system, nối event, áp luật khi hứng.
 * Level HARD thêm TrollSystem (prank + chữ láo) — luật chấm điểm giữ nguyên.
 */
import Phaser from 'phaser';
import { SFX } from '@/core/audio/sfx';
import { PLAYER, THEME, TIMING } from '@/games/bread-catcher/game/config/gameConfig';
import { HAZARDS } from '@/games/bread-catcher/game/config/hazards';
import { LEVEL_STAGES, basketTierFor } from '@/games/bread-catcher/game/config/stages';
import { GameEventBus } from '@/games/bread-catcher/game/core/events';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { setupView } from '@/core/phaser/view';
import type FallingItem from '@/games/bread-catcher/game/objects/FallingItem';
import PlayerBasket from '@/games/bread-catcher/game/objects/PlayerBasket';
import { addStageBackground } from '@/games/bread-catcher/game/objects/StageBackground';
import type { PauseOrigin } from '@/games/bread-catcher/game/scenes/PauseScene';
import type { TurnCompleteData } from '@/games/bread-catcher/game/scenes/TurnCompleteScene';
import type { BreadAudio } from '@/games/bread-catcher/game/core/services';
import EffectsSystem from '@/games/bread-catcher/game/systems/EffectsSystem';
import InputController from '@/games/bread-catcher/game/systems/InputController';
import LetterSpawnSystem from '@/games/bread-catcher/game/systems/LetterSpawnSystem';
import TrollSystem from '@/games/bread-catcher/game/systems/troll/TrollSystem';
import TurnTimer from '@/games/bread-catcher/game/systems/TurnTimer';
import { playCountdown } from '@/games/bread-catcher/game/ui/Countdown';
import Hud from '@/games/bread-catcher/game/ui/Hud';
import { hudLayout } from '@/games/bread-catcher/game/ui/layout';
import TargetPanel from '@/games/bread-catcher/game/ui/TargetPanel';
import { sessionLetters } from '@/games/bread-catcher/session/content';
import {
  appStore,
  currentTeam,
  getWordPool,
  previousTeamWords,
  sessionActions,
} from '@/games/bread-catcher/session/sessionStore';
import {
  LEVELS,
  RULES,
  timeLimitSeconds,
  wordsPerTurn,
  type LevelDef,
} from '@/games/bread-catcher/session/settings';
import { prefsStore } from '@/core/audio/prefs';
import { LETTER_PRAISE, UI_TEXT, WORD_PRAISE } from '@/games/bread-catcher/session/text';
import type { TargetSupport, Team, TurnResult, WordAttempt } from '@/games/bread-catcher/session/types';
import { pickRandom } from '@/core/utils/random';
import { speech } from '@/core/utils/speech';

const { colors } = THEME;

/**
 * intro      — đang đếm ngược đầu lượt
 * playing    — đang hứng chữ (đồng hồ chạy)
 * transition — ăn mừng / chuyển từ (đồng hồ dừng)
 * over       — hết lượt
 */
type TurnState = 'intro' | 'playing' | 'transition' | 'over';

export default class GameScene extends Phaser.Scene {
  private bus!: GameEventBus;
  private audio!: BreadAudio;
  private spawner!: LetterSpawnSystem;
  private effects!: EffectsSystem;
  private controls!: InputController;
  private basket!: PlayerBasket;
  private timer!: TurnTimer;
  /** Chỉ có ở level HARD */
  private troll: TrollSystem | null = null;

  private team!: Team;
  private level!: LevelDef;
  private support: TargetSupport = 'word';
  private totalWords = 0;
  /** Có giọng đọc (trình duyệt hỗ trợ + giáo viên bật VOICE) */
  private canHear = false;

  private state: TurnState = 'intro';
  private word = '';
  private letterIndex = 0;
  private attempts: WordAttempt[] = [];
  private score = 0;
  private wrongCatches = 0;
  /** Tránh lặp từ trong lượt và từ của đội ngay trước (plan §14) */
  private avoidWords = new Set<string>();

  constructor() {
    super(SCENES.GAME);
  }

  create(): void {
    const { width, height } = setupView(this);
    const session = appStore.get().session;
    const team = session && currentTeam(session);
    if (!session || !team) {
      sessionActions.abortSession();
      return;
    }

    this.team = team;
    this.level = LEVELS[session.settings.levelId];
    this.totalWords = wordsPerTurn(session.settings);
    this.canHear = speech.supported && prefsStore.get().voice;
    // Không nghe được thì mức gợi ý "chỉ nghe" phải hiện chữ, nếu không sẽ không chơi được
    const listenOnly = this.level.support === 'first-letter' || this.level.support === 'blank';
    this.support = listenOnly && !this.canHear ? 'word' : this.level.support;
    this.resetTurnState(previousTeamWords(session));
    this.physics.world.timeScale = 1;

    this.bus = new GameEventBus();
    this.audio = getAudio(this);
    const stage = LEVEL_STAGES[this.level.id];
    addStageBackground(this, stage.background, THEME.gameplayBackgroundTint);

    this.basket = new PlayerBasket(this, width / 2, height - PLAYER.bottomMargin);
    this.controls = new InputController(this, () => this.basket.x);
    this.effects = new EffectsSystem(this);
    this.spawner = new LetterSpawnSystem(
      this,
      this.bus,
      this.level,
      sessionLetters(session.settings),
      hudLayout(this).playTop,
      { lineY: this.basket.rimY, catchWidth: () => this.basket.body.width },
    );
    this.timer = new TurnTimer(this.bus, timeLimitSeconds(session.settings) * 1000, () => this.timeUp());

    new Hud(this, this.bus, {
      team,
      onPause: () => this.openPause('pause'),
      onBack: () => this.openPause('back'),
      onEnd: () => this.openPause('end'),
    });
    new TargetPanel(this, this.bus, this.canHear ? () => this.speakWord() : null);
    this.troll = this.level.troll ? this.createTrollSystem() : null;

    this.physics.add.overlap(this.basket, this.spawner.group, (_basket, item) => {
      this.handleCatch(item as FallingItem);
    });
    this.bindEvents();

    this.audio.playMusic(stage.music);
    this.cameras.main.fadeIn(250);
    playCountdown(this, { withGetReady: true }).then(() => this.startTurn());
  }

  override update(_time: number, delta: number): void {
    if (this.state === 'over') return;
    this.basket.move(delta, this.controls);
    this.spawner.update(delta);
    if (this.state === 'playing') this.timer.update(delta);
    this.troll?.update(delta);
  }

  // -------------------------------------------------------------------------
  // Wiring
  // -------------------------------------------------------------------------
  private resetTurnState(avoid: Set<string>): void {
    this.state = 'intro';
    this.word = '';
    this.letterIndex = 0;
    this.attempts = [];
    this.score = 0;
    this.wrongCatches = 0;
    this.avoidWords = avoid;
  }

  private createTrollSystem(): TrollSystem {
    return new TrollSystem({
      scene: this,
      bus: this.bus,
      basket: this.basket,
      controls: this.controls,
      spawner: this.spawner,
      effects: this.effects,
      audio: this.audio,
    });
  }

  private bindEvents(): void {
    // Phím tắt pause + tự pause khi chuyển app / khoá màn hình (mobile)
    this.input.keyboard?.on('keydown-P', () => this.openPause('pause'));
    this.input.keyboard?.on('keydown-ESC', () => this.openPause('pause'));
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.autoPause, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.autoPause, this);

    // Pause che hẳn chữ đang rơi để không ai "học tủ" vị trí chữ (plan §18)
    this.events.on(Phaser.Scenes.Events.PAUSE, () => this.spawner.group.setVisible(false));
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.spawner.group
        .getMatching('active', true)
        .forEach((item) => (item as FallingItem).setVisible(true));
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.autoPause, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.autoPause, this);
      this.troll?.setEnabled(false);
      this.troll = null;
      speech.cancel();
      this.audio.setDucked('speech', false);
      this.bus.destroy();
    });
  }

  // -------------------------------------------------------------------------
  // Turn flow
  // -------------------------------------------------------------------------
  private startTurn(): void {
    if (this.state !== 'intro') return;
    this.timer.start();
    this.nextWord();
  }

  private nextWord(): void {
    if (this.state === 'over') return;
    if (this.attempts.length >= this.totalWords) {
      this.endTurn('words');
      return;
    }

    this.word = getWordPool().draw(this.avoidWords);
    this.avoidWords.add(this.word);
    this.letterIndex = 0;
    this.state = 'playing';

    this.bus.emit('word-started', {
      word: this.word,
      index: this.attempts.length,
      total: this.totalWords,
      support: this.support,
    });
    this.spawner.setTarget(this.word, this.letterIndex);
    this.spawner.resume();
    this.timer.start();
    this.speakWord();
  }

  /** Đọc to từ mục tiêu, giảm nhạc nền trong lúc đọc (plan §28) */
  private speakWord(): void {
    if (!this.canHear || !this.word) return;
    speech.say(this.word, {
      onStart: () => this.audio.setDucked('speech', true),
      onEnd: () => this.audio.setDucked('speech', false),
    });
  }

  private timeUp(): void {
    if (this.state === 'over') return;
    // Từ đang làm dở: không tính đúng/sai, nhưng giữ lại để luyện sau
    if (this.state === 'playing' && this.word) getWordPool().markWrong(this.word);
    this.stopPlay();
    // Hết lượt: tắt nhạc nền, chỉ còn âm báo hết giờ
    this.audio.silence();
    this.audio.playSfx(SFX.TIME_UP);
    this.effects.announce(UI_TEXT.timesUp, colors.red, { holdMs: 1000, size: 46 });
    this.time.delayedCall(TIMING.timesUp, () => this.endTurn('time'));
  }

  private endTurn(endedBy: TurnResult['endedBy']): void {
    this.stopPlay();
    const correctWords = this.attempts.filter((attempt) => attempt.correct).length;
    const result: TurnResult = {
      teamId: this.team.id,
      attempts: this.attempts,
      correctWords,
      wrongWords: this.attempts.length - correctWords,
      wrongCatches: this.wrongCatches,
      timeLimitMs: timeLimitSeconds(appStore.get().session!.settings) * 1000,
      timeRemainingMs: Math.round(this.timer.remainingMs),
      score: this.score,
      endedBy,
    };
    sessionActions.recordTurn(result);

    const data: TurnCompleteData = { team: this.team, result, totalWords: this.totalWords };
    this.scene.launch(SCENES.TURN_COMPLETE, data);
    this.scene.pause();
  }

  /** Dừng mọi thứ đang chạy của lượt */
  private stopPlay(): void {
    this.state = 'over';
    this.timer.stop();
    this.spawner.freeze();
    this.troll?.setEnabled(false);
    this.controls.enabled = false;
    speech.cancel();
  }

  // -------------------------------------------------------------------------
  // Catch rules
  // -------------------------------------------------------------------------
  private handleCatch(item: FallingItem): void {
    if (this.state !== 'playing' || !item.body.enable) return;
    if (this.troll?.interceptCatch(item)) return; // vd: chữ nảy khỏi rổ

    this.bus.emit('item-caught', item);
    if (!item.isLetter) this.catchHazard(item);
    else if (item.letter === this.word[this.letterIndex]) this.catchCorrect(item);
    else this.catchWrong(item);
  }

  private catchCorrect(item: FallingItem): void {
    const { x, y } = item;
    const letter = this.word[this.letterIndex];
    item.collect(this.basket.x, this.basket.rimY);
    this.basket.squash();
    this.effects.catchBurst(x, y);
    this.audio.playSfx(SFX.CORRECT_LETTER, { rate: 1 + this.letterIndex * 0.06 });
    this.bus.emit('letter-filled', { index: this.letterIndex, letter });

    this.letterIndex += 1;
    if (this.letterIndex >= this.word.length) {
      this.completeWord();
      return;
    }
    this.effects.popup(x, y - 24, pickRandom(LETTER_PRAISE), colors.green);
    this.spawner.setTarget(this.word, this.letterIndex);
  }

  /** Đúng cả từ: pháo sao, rổ nảy, đọc lại từ, +100 (plan §12) */
  private completeWord(): void {
    this.state = 'transition';
    this.timer.stop();
    this.spawner.pause();
    this.spawner.clear();

    this.attempts.push({ word: this.word, correct: true });
    getWordPool().markCorrect(this.word);
    this.score += RULES.correctWordScore;
    this.bus.emit('score-changed', { score: this.score, delta: RULES.correctWordScore });
    this.bus.emit('word-finished', { word: this.word, correct: true });

    const { x, rimY } = this.basket;
    this.effects.wordBurst(x, rimY - 10);
    this.effects.popup(x, rimY - 40, `+${RULES.correctWordScore}`);
    this.effects.announce(pickRandom(WORD_PRAISE), colors.gold, { size: 40 });
    this.audio.playSfx(SFX.WORD_COMPLETE);
    this.basket.celebrate();
    this.basket.setTier(basketTierFor(this.attempts.filter((attempt) => attempt.correct).length));
    this.speakWord();

    this.time.delayedCall(TIMING.wordComplete, () => this.nextWord());
  }

  /** Hứng nhầm một chữ: kết thúc từ này, nhẹ nhàng chuyển sang từ khác (plan §13) */
  private catchWrong(item: FallingItem): void {
    this.state = 'transition';
    this.timer.stop();
    this.spawner.freeze();

    this.wrongCatches += 1;
    this.attempts.push({ word: this.word, correct: false });
    getWordPool().markWrong(this.word);
    this.bus.emit('word-finished', { word: this.word, correct: false });

    this.effects.wrongPuff(item.x, item.y);
    item.vanish();
    this.basket.shake();
    this.audio.playSfx(SFX.WRONG_LETTER);
    this.effects.announce(UI_TEXT.tryNextWord, colors.cream, { size: 28 });

    this.time.delayedCall(TIMING.wordFailed, () => {
      this.spawner.clear();
      this.nextWord();
    });
  }

  /** Vật cản (level HARD): rổ bị choáng, không tính là hứng sai */
  private catchHazard(item: FallingItem): void {
    const hazard = HAZARDS[item.hazard ?? 'egg_broken'];
    const { x, y } = item;
    item.collect(this.basket.x, this.basket.rimY);
    if (hazard.explodes) this.effects.explosion(x, y);
    else this.effects.wrongPuff(x, y);
    this.basket.freeze(hazard.stunMs);
    this.effects.popup(this.basket.x, this.basket.rimY - 30, hazard.label, colors.red);
    this.audio.playSfx(SFX.WRONG_LETTER, { rate: 0.7 });
  }

  // -------------------------------------------------------------------------
  // Pause / teacher controls
  // -------------------------------------------------------------------------
  private autoPause(): void {
    this.openPause('pause');
  }

  private openPause(origin: PauseOrigin): void {
    if (this.state === 'over' || !this.scene.isActive()) return;
    this.controls.reset();
    speech.cancel();
    this.audio.playSfx(SFX.PAUSE);
    this.scene.launch(SCENES.PAUSE, { origin });
    this.scene.pause();
  }
}
