/**
 * Mount một game Phaser vào <div>. Game được tạo 1 lần và huỷ khi unmount
 * (an toàn với React StrictMode mount/unmount 2 lần ở dev).
 *
 * `inputLocked`: màn React đang phủ lên game -> khoá chạm / bàn phím của game
 * (tránh thao tác xuyên xuống scene phía sau).
 *
 * Tải asset (core/phaser/assetLoading.ts): chưa xong mà đã vào màn chơi (không còn màn React phủ lên) thì hiện
 * màn LOADING có thanh tiến độ — tải xong SceneDirector tự vào ván; còn màn React thì chỉ hiện thanh mảnh ở đáy.
 */
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { beginAssetLoad } from '@/core/phaser/assetActivity';
import { ASSETS_PROGRESS, ASSETS_READY } from '@/core/phaser/assetLoading';
import GameLoading, { LoadingBar } from '@/ui/GameLoading/GameLoading';
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
  /** Tiến độ tải asset 0–1; null = đã sẵn sàng */
  const [progress, setProgress] = useState<number | null>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // Tạo game ở tick sau: StrictMode mount → unmount → mount ngay lập tức,
    // lần mount đầu bị huỷ trước khi Phaser kịp boot (tránh lỗi WebGL/AudioContext).
    let endLoad: ((ready: boolean) => void) | undefined;
    const timer = window.setTimeout(() => {
      // Báo đang tải để việc nền (PWA precache) chờ game tải xong mới chạy — core/phaser/assetActivity.ts
      endLoad = beginAssetLoad();
      const game = create(container);
      gameRef.current = game;
      game.events.once(Phaser.Core.Events.READY, () => applyInputLock(game, lockedRef.current));
      game.events.on(ASSETS_PROGRESS, (value: number) =>
        setProgress((current) => (current === null ? null : value)),
      );
      game.events.once(ASSETS_READY, () => {
        setProgress(null);
        endLoad?.(true);
      });
    });
    return () => {
      window.clearTimeout(timer);
      endLoad?.(false);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [create]);

  useEffect(() => {
    lockedRef.current = inputLocked;
    if (gameRef.current) applyInputLock(gameRef.current, inputLocked);
  }, [inputLocked]);

  return (
    <>
      <div ref={containerRef} className={styles.host} />
      {progress !== null &&
        (inputLocked ? <LoadingBar progress={progress} /> : <GameLoading progress={progress} />)}
    </>
  );
}
