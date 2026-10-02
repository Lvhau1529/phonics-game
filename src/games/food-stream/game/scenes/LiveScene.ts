/**
 * Một lượt livestream (Solo hoặc Classroom). Scene chỉ DIỄN: luật nằm ở RoundController
 * (session/), hình ảnh ở objects/ + ui/, hiệu ứng ở systems/.
 *
 * Vòng lặp (plan §4):
 *   ra đề (đọc âm / từ) -> chọn món -> đúng: bay vào miệng -> ăn -> nghe lại âm / từ -> người xem, tim, combo
 *                                  -> sai: rung nhẹ, streamer suy nghĩ -> chọn lại / đội kia giành quyền / hiện đáp án
 * Mọi bước đi qua state machine của RoundController nên không thể chạm 2 lần hay cộng điểm 2 lần.
 */
import Phaser from 'phaser';
import { getLevel, type LevelDef } from '@/games/food-stream/content/levels';
import { getPack, PACKS } from '@/games/food-stream/content/packs';
import { JINGLE, MUSIC } from '@/games/food-stream/game/config/assets';
import { DEPTH, THEME, TIMING } from '@/games/food-stream/game/config/theme';
import { SCENES } from '@/games/food-stream/game/core/keys';
import { getAudio, type FoodStreamAudio } from '@/games/food-stream/game/core/services';
import FoodChoice from '@/games/food-stream/game/objects/FoodChoice';
import { FOOD_KEYS } from '@/games/food-stream/game/objects/FoodPiece';
import PromptPanel from '@/games/food-stream/game/objects/PromptPanel';
import StreamRoom from '@/games/food-stream/game/objects/StreamRoom';
import Streamer from '@/games/food-stream/game/objects/Streamer';
import Effects from '@/games/food-stream/game/systems/Effects';
import { eat, flyToMouth } from '@/games/food-stream/game/systems/feeding';
import Voice from '@/games/food-stream/game/systems/Voice';
import CommentFeed from '@/games/food-stream/game/ui/CommentFeed';
import Hud from '@/games/food-stream/game/ui/Hud';
import { gridCells, liveLayout, type LiveLayout } from '@/games/food-stream/game/ui/layout';
import ProgressBar from '@/games/food-stream/game/ui/ProgressBar';
import TeamBoard from '@/games/food-stream/game/ui/TeamBoard';
import { addText } from '@/games/food-stream/game/ui/text';
import { QuestionDeck } from '@/games/food-stream/session/questions';
import { RoundController, type AnswerOutcome } from '@/games/food-stream/session/RoundController';
import { SCORING } from '@/games/food-stream/session/scoring';
import {
  foodStreamActions,
  foodStreamStore,
  questionCount,
  type ActiveSession,
} from '@/games/food-stream/session/store';
import type { Question, RoundResult, StreamerId, Team } from '@/games/food-stream/session/types';
import { chantComment, COMMENTS, TEXT } from '@/games/food-stream/session/text';
import { SFX } from '@/platform/audio/sfx';
import { setupView } from '@/platform/phaser/view';
import { pickRandom, shuffle } from '@/shared/random';

const PLATES = ['prop.plate.pink', 'prop.plate.blue'];
const TEAM_COLORS = [THEME.colors.pink, THEME.colors.blue];

type Correct = Extract<AnswerOutcome, { kind: 'correct' }>;
type Wrong = Extract<AnswerOutcome, { kind: 'wrong' }>;
type Progress = Extract<AnswerOutcome, { kind: 'progress' }>;

export default class LiveScene extends Phaser.Scene {
  private session!: ActiveSession;
  private level!: LevelDef;
  private layout!: LiveLayout;
  private controller!: RoundController;
  private audio!: FoodStreamAudio;
  private voice!: Voice;
  private effects!: Effects;
  private hud!: Hud;
  private progressBar!: ProgressBar;
  private prompt!: PromptPanel;
  private comments!: CommentFeed;
  private teamBoard: TeamBoard | null = null;
  private streamers = new Map<StreamerId, Streamer>();
  private choices: FoodChoice[] = [];
  private roundTimer: Phaser.Time.TimerEvent | null = null;
  private answerTimer: Phaser.Time.TimerEvent | null = null;
  private lastMultiplier = 1;
  /** Tăng mỗi lần create(): chuỗi async của lần chơi trước (vd giọng đọc xong muộn) tự dừng */
  private run = 0;

  constructor() {
    super(SCENES.LIVE);
  }

  create(): void {
    const session = foodStreamStore.get().session;
    if (!session) return;
    this.run += 1;
    this.session = session;
    this.streamers = new Map();
    this.choices = [];
    this.teamBoard = null;
    this.roundTimer = null;
    this.answerTimer = null;
    this.lastMultiplier = 1;

    setupView(this);
    const { settings } = session;
    const pack = getPack(settings.packId);
    this.level = getLevel(settings.levelId);
    this.layout = liveLayout(this);
    this.audio = getAudio(this);
    this.voice = new Voice(this.audio);
    this.effects = new Effects(this, this.layout.stage);

    new StreamRoom(this, this.layout.stage, PACKS.indexOf(pack));
    this.createStreamers(session.teams);
    const classroom = settings.mode === 'classroom';
    this.hud = new Hud(this, this.layout.hud, {
      showTimer: this.level.timeLimitSec !== undefined || (classroom && settings.answerSeconds > 0),
      onPause: () => this.openPause(),
    });
    this.hud.setViewers(SCORING.viewers.start);
    this.hud.setTime((this.level.timeLimitSec ?? settings.answerSeconds) * 1000);
    this.progressBar = new ProgressBar(this, this.layout.progress);
    this.prompt = new PromptPanel(this, this.layout.prompt, () => this.speakPrompt());
    this.comments = new CommentFeed(this, this.commentArea(classroom));
    if (classroom) this.teamBoard = new TeamBoard(this, this.layout.stage, session.teams);

    this.controller = new RoundController(
      {
        mode: settings.mode,
        teams: session.teams,
        questionCount: questionCount(settings),
        steal: settings.steal,
        firstTeam: session.firstTeam,
      },
      new QuestionDeck(pack, this.level, { canSpeak: Voice.available }),
    );

    this.audio.playMusic(classroom ? MUSIC.CLASSROOM : MUSIC.GAMEPLAY);
    this.bindKeys();
    // Chuyển app / tab thì tự tạm dừng
    this.game.events.on(Phaser.Core.Events.BLUR, this.openPause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.openPause, this);
      this.voice.cancel();
    });
    this.cameras.main.fadeIn(250);
    void this.startRound();
  }

  override update(): void {
    const timer = this.roundTimer ?? this.answerTimer;
    if (timer) this.hud.setTime(timer.getRemaining());
  }

  // -------------------------------------------------------------------------
  // Dựng sân khấu
  // -------------------------------------------------------------------------
  private createStreamers(teams: readonly Team[]): void {
    const { stage } = this.layout;
    const bottom = stage.bottom - 2;
    if (teams.length === 1) {
      const height = Math.min(stage.height * 0.68, 210);
      this.streamers.set(
        teams[0].streamer,
        new Streamer(this, stage.centerX, bottom, teams[0].streamer, height),
      );
      return;
    }
    // Hai nhân vật ngồi cạnh nhau không chồng lên nhau (ảnh rộng ≈ 0.81 chiều cao)
    const height = Math.min(stage.height * 0.58, 180, (stage.width * 0.4) / 0.81);
    teams.forEach((team, index) => {
      const x = stage.x + stage.width * (index === 0 ? 0.29 : 0.71);
      this.streamers.set(team.streamer, new Streamer(this, x, bottom, team.streamer, height));
    });
  }

  /** Bình luận: góc trên bên phải (Solo) / giữa hai banner đội (Classroom) */
  private commentArea(classroom: boolean): Phaser.Geom.Rectangle {
    const { stage } = this.layout;
    const height = 84;
    if (classroom) return new Phaser.Geom.Rectangle(stage.x + 72, stage.y + 6, stage.width - 144, height);
    const width = Math.min(160, stage.width * 0.45);
    return new Phaser.Geom.Rectangle(stage.right - width - 8, stage.y + 8, width, height);
  }

  private bindKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.on('keydown-P', () => this.openPause());
    keyboard.on('keydown-ESC', () => this.openPause());
    keyboard.on('keydown-SPACE', () => this.speakPrompt());
    // Phím số 1..6 chọn món (giáo viên dùng bàn phím máy chiếu)
    keyboard.on('keydown', (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      const choice = this.choices[index];
      if (choice?.isEnabled) this.onChoice(choice);
    });
  }

  // -------------------------------------------------------------------------
  // Luồng lượt chơi
  // -------------------------------------------------------------------------
  private async startRound(): Promise<void> {
    this.comments.post(pickRandom(COMMENTS.hello));
    if (this.session.settings.mode === 'classroom') await this.guard(this.whoGoesFirst());
    this.controller.machine.go('countdown');
    await this.guard(this.countdown());
    if (this.level.timeLimitSec) {
      this.roundTimer = this.time.delayedCall(
        this.level.timeLimitSec * 1000,
        () => void this.completeRound('time'),
      );
    }
    await this.showNextQuestion();
  }

  private async showNextQuestion(): Promise<void> {
    const { controller } = this;
    const question = controller.nextQuestion();
    if (!question) {
      await this.completeRound('questions');
      return;
    }
    controller.machine.go('prompt');
    const { index, total } = controller.progress;
    this.progressBar.setProgress(index - 1, total);
    this.clearChoices();

    if (this.session.settings.mode === 'classroom') {
      const team = controller.answeringTeam;
      this.setTurn(team);
      await this.guard(
        this.effects.banner(`${team.name}\n${TEXT.yourTurn}`, {
          color: TEAM_COLORS[team.id],
          size: 30,
          holdMs: 500,
        }),
      );
    }

    this.prompt.show(question);
    if (question.slots) this.prompt.highlightSlot(controller.slotIndex);
    this.createChoices(question);
    this.speakPrompt();
    controller.machine.go('awaiting-input');
    this.startAnswerTimer();
  }

  private onChoice(view: FoodChoice): void {
    const outcome = this.controller.answer(view.choice.id);
    switch (outcome.kind) {
      case 'progress':
        void this.handleProgress(view, outcome);
        break;
      case 'correct':
        void this.handleCorrect(view, outcome);
        break;
      case 'wrong':
        void this.handleWrong(view, outcome);
        break;
    }
  }

  /** Ghép từ: đúng một chữ -> điền ô, cắn nhanh một miếng, chọn tiếp */
  private async handleProgress(view: FoodChoice, outcome: Progress): Promise<void> {
    this.audio.playSfx(SFX.CORRECT_LETTER, { rate: 1 + outcome.slotIndex * 0.08 });
    this.prompt.fillSlot(outcome.slotIndex, view.choice.label);
    this.prompt.highlightSlot(this.controller.slotIndex);
    this.clearHints();
    const streamer = this.streamerOf(this.controller.answeringTeam);
    const piece = view.detachPiece();
    await this.guard(flyToMouth(this, piece, streamer));
    await this.guard(eat(this, this.effects, piece, streamer, { quick: true }));
    this.controller.machine.go('awaiting-input');
  }

  private async handleCorrect(view: FoodChoice, outcome: Correct): Promise<void> {
    const { controller } = this;
    const question = controller.current!;
    this.stopAnswerTimer();
    this.clearHints();
    this.audio.playSfx(SFX.CORRECT_LETTER);
    if (outcome.slotIndex !== undefined) {
      this.prompt.fillSlot(outcome.slotIndex, view.choice.label);
      this.prompt.highlightSlot(-1);
    }
    this.choices.forEach((choice) => choice.setEnabled(false));
    this.comments.post(question.sound ? chantComment(question.sound.grapheme) : pickRandom(COMMENTS.correct));

    const streamer = this.streamerOf(outcome.team);
    const piece = view.detachPiece();
    controller.machine.go('feeding');
    await this.guard(flyToMouth(this, piece, streamer));
    controller.machine.go('eating');
    // Nghe lại âm / từ trong lúc ăn (plan §4: PHONEME / WORD REPLAY)
    this.voice.say(question.feedbackSpeech);
    await this.guard(eat(this, this.effects, piece, streamer));
    controller.machine.go('reward');
    this.showReward(outcome, streamer);
    await this.guard(this.wait(TIMING.rewardHold));
    controller.machine.go('next-question');
    await this.showNextQuestion();
  }

  private async handleWrong(view: FoodChoice | null, outcome: Wrong): Promise<void> {
    const { controller } = this;
    const question = controller.current!;
    this.stopAnswerTimer();
    this.audio.playSfx(SFX.WRONG_LETTER);
    view?.shake();
    if (outcome.removedChoiceId) this.choiceById(outcome.removedChoiceId)?.markRemoved();
    this.streamerOf(outcome.team).oops(TIMING.wrongRecover + 300);
    this.comments.post(pickRandom(COMMENTS.wrong));
    if (outcome.choiceId === null) void this.effects.banner(TEXT.timesUp, { size: 30, holdMs: 400 });

    switch (outcome.next) {
      case 'retry':
        await this.guard(this.wait(TIMING.wrongRecover));
        // Sai nhiều lần: gợi ý nhẹ nhàng đáp án (không có màn "thua")
        if (outcome.hintChoiceId) this.choiceById(outcome.hintChoiceId)?.setHint(true);
        controller.machine.go('awaiting-input');
        break;

      case 'steal': {
        await this.guard(this.wait(TIMING.wrongRecover * 0.6));
        const team = controller.answeringTeam;
        this.setTurn(team);
        this.audio.playSfx(SFX.TEAM_SELECTED);
        await this.guard(
          this.effects.banner(`${TEXT.steals}\n${team.name}`, {
            color: TEAM_COLORS[team.id],
            size: 30,
            holdMs: 500,
          }),
        );
        controller.machine.go('awaiting-input');
        this.startAnswerTimer();
        break;
      }

      case 'reveal':
        // Không đội nào đúng: hiện đáp án rồi sang câu mới
        this.choices.forEach((choice) => choice.setEnabled(false));
        this.choiceById(controller.expectedChoiceId())?.setHint(true);
        this.prompt.revealSlots(question, controller.slotIndex);
        this.voice.say(question.feedbackSpeech);
        await this.guard(this.wait(TIMING.reveal));
        controller.machine.go('next-question');
        await this.showNextQuestion();
        break;
    }
  }

  private showReward(outcome: Correct, streamer: Streamer): void {
    const { controller } = this;
    const { stage } = this.layout;
    this.audio.playSfx(SFX.WORD_COMPLETE);
    streamer.cheer();
    this.hud.setViewers(controller.viewers);
    this.hud.setHearts(controller.hearts);
    this.effects.hearts(stage.right - 30, stage.bottom - 20, 6);
    const mouth = streamer.mouth;
    this.effects.sparkles(mouth.x, mouth.y, 6, 44);
    this.effects.popup(mouth.x, mouth.y - 40, `+${outcome.reward.points}`);

    const { multiplier } = outcome.reward;
    if (multiplier > 1 && multiplier !== this.lastMultiplier) {
      this.effects.sticker('ui.combo', stage.centerX, stage.centerY - 10);
      this.effects.popup(
        stage.centerX,
        stage.centerY + 40,
        `${TEXT.combo} x${multiplier}`,
        THEME.colors.pink,
      );
    }
    this.lastMultiplier = multiplier;

    const score = controller.scores.find((item) => item.team.id === outcome.team.id)?.score ?? 0;
    this.teamBoard?.setScore(outcome.team.id, score);
  }

  private async completeRound(endedBy: RoundResult['endedBy']): Promise<void> {
    if (this.controller.machine.is('complete')) return;
    this.roundTimer?.remove();
    this.roundTimer = null;
    this.stopAnswerTimer();
    this.voice.cancel();
    this.choices.forEach((choice) => choice.setEnabled(false));
    const result = this.controller.finish(endedBy);
    const run = this.run;

    this.hud.setViewers(result.viewers);
    // Hết lượt: tắt nhạc nền ngay, chỉ còn nhạc kết thúc (không chồng lên nhau)
    this.audio.silence();
    if (endedBy === 'time') {
      this.audio.playSfx(SFX.TIME_UP);
      await this.effects.banner(TEXT.timesUp, { color: THEME.colors.red });
    }
    this.audio.playJingle(JINGLE.key, JINGLE.volume, MUSIC.REWARD);
    this.streamers.forEach((streamer) => streamer.cheer());
    const { stage } = this.layout;
    this.effects.hearts(stage.centerX, stage.bottom - 20, 10);
    if (result.perfect) this.effects.sticker('ui.perfect', stage.centerX, stage.centerY, 190);
    await this.effects.banner(TEXT.liveComplete, { holdMs: TIMING.roundCompleteHold - 700 });
    if (run === this.run) foodStreamActions.finishRound(result);
  }

  // -------------------------------------------------------------------------
  // Mở đầu lượt
  // -------------------------------------------------------------------------
  /** Classroom: chọn ngẫu nhiên đội đi trước (plan §5.2) */
  private async whoGoesFirst(): Promise<void> {
    const { teams, firstTeam } = this.session;
    const { centerX, centerY } = this.layout.stage;
    const title = addText(this, centerX, centerY - 50, TEXT.whoGoesFirst, 'banner', {
      fontSize: '26px',
    }).setDepth(DEPTH.BANNER);
    const name = addText(this, centerX, centerY + 10, '', 'banner', { fontSize: '34px' }).setDepth(
      DEPTH.BANNER,
    );
    this.audio.playSfx(SFX.DICE_ROLL);
    const flips = 10 + (firstTeam === teams[0].id ? 0 : 1);
    for (let i = 0; i <= flips; i += 1) {
      const team = teams[i % teams.length];
      name.setText(team.name).setColor(TEAM_COLORS[team.id]);
      this.setTurn(team);
      await this.guard(this.wait(TIMING.whoGoesFirst / flips + i * 12));
    }
    this.audio.playSfx(SFX.TEAM_SELECTED);
    this.tweens.add({ targets: name, scale: 1.3, duration: 180, yoyo: true });
    await this.guard(this.wait(700));
    title.destroy();
    name.destroy();
  }

  private async countdown(): Promise<void> {
    await this.effects.banner(TEXT.getReady, { holdMs: 500 });
    for (const step of ['3', '2', '1']) {
      this.audio.playSfx(SFX.COUNTDOWN_TICK);
      await this.effects.banner(step, {
        size: 72,
        holdMs: TIMING.countdownStep - 440,
        color: THEME.colors.pink,
      });
    }
    this.audio.playSfx(SFX.COUNTDOWN_GO);
    await this.effects.banner(TEXT.go, { size: 64, holdMs: 200, color: THEME.colors.green });
  }

  // -------------------------------------------------------------------------
  // Tiện ích
  // -------------------------------------------------------------------------
  private createChoices(question: Question): void {
    const count = question.choices.length;
    const isWord = question.choices.some((choice) => choice.picture);
    const perRow = isWord || count <= 3 ? count : count === 4 ? (this.layout.landscape ? 4 : 2) : 3;
    const cells = gridCells(this.layout.tray, count, perRow);
    const foods = shuffle(FOOD_KEYS);
    this.choices = question.choices.map(
      (choice, index) =>
        new FoodChoice(
          this,
          cells[index],
          choice,
          foods[index % foods.length],
          PLATES[index % PLATES.length],
          (view) => this.onChoice(view),
        ),
    );
  }

  private clearChoices(): void {
    this.choices.forEach((choice) => choice.destroy());
    this.choices = [];
  }

  private clearHints(): void {
    this.choices.forEach((choice) => choice.setHint(false));
  }

  private choiceById(id: string | undefined): FoodChoice | undefined {
    return this.choices.find((choice) => choice.choice.id === id);
  }

  private streamerOf(team: Team): Streamer {
    return this.streamers.get(team.streamer) ?? [...this.streamers.values()][0];
  }

  /** Classroom: đội tới lượt sáng lên, đội kia mờ đi */
  private setTurn(team: Team): void {
    this.teamBoard?.setTurn(team.id);
    this.streamers.forEach((streamer, id) => streamer.setTurnActive(id === team.streamer));
  }

  private speakPrompt(): void {
    const question = this.controller.current;
    if (!question) return;
    this.voice.say(question.promptSpeech, {
      onStart: () => this.prompt.setSpeaking(true),
      onEnd: () => this.prompt.setSpeaking(false),
    });
  }

  private startAnswerTimer(): void {
    const seconds = this.session.settings.mode === 'classroom' ? this.session.settings.answerSeconds : 0;
    if (seconds <= 0) return;
    this.stopAnswerTimer();
    this.answerTimer = this.time.delayedCall(seconds * 1000, () => this.onAnswerTimeout());
  }

  private stopAnswerTimer(): void {
    this.answerTimer?.remove();
    this.answerTimer = null;
  }

  private onAnswerTimeout(): void {
    this.answerTimer = null;
    const outcome = this.controller.timeout();
    if (outcome.kind === 'wrong') {
      void this.handleWrong(null, outcome);
    } else if (!this.controller.machine.is('complete')) {
      // Đang diễn hiệu ứng (vd cắn một chữ khi ghép từ): chờ chút rồi xét lại
      this.answerTimer = this.time.delayedCall(300, () => this.onAnswerTimeout());
    }
  }

  private openPause(): void {
    if (this.controller.machine.is('complete') || !this.scene.isActive()) return;
    this.voice.cancel();
    this.prompt.setSpeaking(false);
    this.scene.launch(SCENES.PAUSE);
    this.scene.pause();
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, () => resolve()));
  }

  /**
   * Chờ một hiệu ứng; nếu trong lúc chờ lượt đã kết thúc (hết giờ) hoặc scene đã chạy lại
   * thì không bao giờ tiếp tục chuỗi cũ.
   */
  private guard<T>(promise: Promise<T>): Promise<T> {
    const run = this.run;
    return promise.then((value) =>
      run === this.run && !this.controller.machine.is('complete') ? value : new Promise<T>(() => undefined),
    );
  }
}
