/**
 * Mount một game Phaser vào <div>. Game được tạo 1 lần và huỷ khi unmount
 * (an toàn với React StrictMode mount/unmount 2 lần ở dev).
 *
 * `inputLocked`: màn React đang phủ lên game -> khoá chạm / bàn phím của game
 * (tránh thao tác xuyên xuống scene phía sau).
 */
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import styles from '@/core/phaser/PhaserHost.module.scss';

interface PhaserHostProps {
  /** Hàm tạo game — nên là hàm ổn định (khai báo ở module), đổi hàm là dựng lại game */
  create: (parent: HTMLElement) => Phaser.Game;
  inputLocked?: boolean;
}

function applyInputLock(game: Phaser.Game, locked: boolean): void {
  if (!game.isBooted) return;
  game.input.enabled = !locked;
  if (game.input.keyboard) game.input.keyboard.enabled = !locked;
}

export default function PhaserHost({ create, inputLocked = false }: PhaserHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const lockedRef = useRef(inputLocked);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // Tạo game ở tick sau: StrictMode mount → unmount → mount ngay lập tức,
    // lần mount đầu bị huỷ trước khi Phaser kịp boot (tránh lỗi WebGL/AudioContext).
    const timer = window.setTimeout(() => {
      const game = create(container);
      gameRef.current = game;
      game.events.once(Phaser.Core.Events.READY, () => applyInputLock(game, lockedRef.current));
    });
    return () => {
      window.clearTimeout(timer);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [create]);

  useEffect(() => {
    lockedRef.current = inputLocked;
    if (gameRef.current) applyInputLock(gameRef.current, inputLocked);
  }, [inputLocked]);

  return <div ref={containerRef} className={styles.host} />;
}
