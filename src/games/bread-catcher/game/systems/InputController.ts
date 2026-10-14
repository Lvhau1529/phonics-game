/**
 * Gom mọi kiểu điều khiển thành 2 giá trị đơn giản cho rổ:
 *   - direction: -1 / 0 / 1 (bàn phím ← → / A D)
 *   - targetX:   vị trí X mong muốn (chuột / cảm ứng), null nếu không có
 *
 * Mobile: kéo TƯƠNG ĐỐI — đặt ngón tay ở bất kỳ đâu rồi kéo, rổ di chuyển
 * theo độ dời của ngón tay (không nhảy cóc, ngón tay không che rổ).
 * Desktop: rổ bám theo con trỏ chuột.
 *
 * `setInverted(true)` đảo ngược mọi kiểu điều khiển (prank của level HARD).
 * Toạ độ con trỏ dùng `worldX` (toạ độ logic, đã tính camera zoom).
 */
import Phaser from 'phaser';
import { PLAYER } from '@/games/bread-catcher/game/config/gameConfig';
import { view } from '@/core/phaser/view';

type Pointer = Phaser.Input.Pointer;

interface DragState {
  pointerId: number;
  startPointerX: number;
  startBasketX: number;
}

export default class InputController {
  targetX: number | null = null;
  enabled = true;

  private drag: DragState | null = null;
  private inverted = false;
  private lastPointerX = 0;
  private readonly keys?: Record<'left' | 'right' | 'a' | 'd', Phaser.Input.Keyboard.Key>;

  constructor(
    private readonly scene: Phaser.Scene,
    /** Vị trí hiện tại của rổ (điểm bắt đầu kéo) */
    private readonly getBasketX: () => number,
  ) {
    const { LEFT, RIGHT, A, D } = Phaser.Input.Keyboard.KeyCodes;
    // enableCapture = false: không chặn phím của trình duyệt (vd: gõ tên đội ở form React)
    this.keys = scene.input.keyboard?.addKeys({ left: LEFT, right: RIGHT, a: A, d: D }, false) as
      InputController['keys'] | undefined;

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get direction(): -1 | 0 | 1 {
    if (!this.enabled || !this.keys) return 0;
    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    if (left === right) return 0;
    this.targetX = null; // bàn phím được ưu tiên hơn chuột
    if (this.inverted) return right ? -1 : 1;
    return right ? 1 : -1;
  }

  /** Đảo ngược điều khiển; neo lại điểm kéo để rổ không bị giật khi đổi chiều */
  setInverted(inverted: boolean): void {
    if (inverted === this.inverted) return;
    this.inverted = inverted;
    this.targetX = null;
    if (this.drag) {
      this.drag.startPointerX = this.lastPointerX;
      this.drag.startBasketX = this.getBasketX();
    }
  }

  reset(): void {
    this.targetX = null;
    this.drag = null;
    if (this.keys) Object.values(this.keys).forEach((key) => key.reset());
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
  }

  private onPointerDown(pointer: Pointer, currentlyOver: Phaser.GameObjects.GameObject[]): void {
    if (!this.enabled || currentlyOver.length > 0) return; // đang bấm nút UI
    this.lastPointerX = pointer.worldX;
    if (pointer.wasTouch) {
      this.drag = { pointerId: pointer.id, startPointerX: pointer.worldX, startBasketX: this.getBasketX() };
    } else {
      this.targetX = this.mapMouseX(pointer.worldX);
    }
  }

  private onPointerMove(pointer: Pointer): void {
    if (!this.enabled) return;
    this.lastPointerX = pointer.worldX;
    if (this.drag && pointer.id === this.drag.pointerId) {
      const sign = this.inverted ? -1 : 1;
      const dx = (pointer.worldX - this.drag.startPointerX) * PLAYER.dragSensitivity * sign;
      this.targetX = this.drag.startBasketX + dx;
    } else if (!pointer.wasTouch) {
      this.targetX = this.mapMouseX(pointer.worldX);
    }
  }

  /** Chuột: khi đảo ngược thì rổ chạy tới vị trí đối xứng */
  private mapMouseX(x: number): number {
    return this.inverted ? view(this.scene).width - x : x;
  }

  private onPointerUp(pointer: Pointer): void {
    if (this.drag && pointer.id === this.drag.pointerId) this.drag = null;
  }
}
