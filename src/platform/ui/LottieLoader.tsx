/**
 * Ba chấm nhún (Lottie `assets/shared/ui/lottie/loading.json`, 120×60) cho các chỗ đang tải.
 *   sm — nằm trong dòng chữ (60px), vd "SAVING POINTS…", góc thẻ đang tải lại
 *   lg — khối giữa màn, kèm nhãn tiếng Anh ngắn (LOADING…)
 * Người dùng bật "giảm chuyển động" (hoặc không tải được) -> ba chấm tĩnh bằng CSS.
 * Dùng bản `lottie_light` (chỉ SVG, không expression); player (chunk riêng, ~85KB gzip) + file JSON chỉ tải
 * lần đầu có chỗ cần hiện, trong lúc chờ hiện ba chấm CSS.
 */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type lottiePlayer from 'lottie-web/build/player/lottie_light';
import type { AnimationItem } from 'lottie-web/build/player/lottie_light';
import styles from '@/platform/ui/LottieLoader.module.scss';

type LottiePlayer = typeof lottiePlayer;

interface LottieAssets {
  lottie: LottiePlayer;
  data: object;
}

const LOADING_JSON = 'assets/shared/ui/lottie/loading.json';

let assets: LottieAssets | null = null;
let loading: Promise<LottieAssets> | null = null;

/** Tải player + file JSON một lần (JSON tương đối theo `document.baseURI` như mọi asset khác); lỗi thì lần sau thử lại */
function loadAssets(): Promise<LottieAssets> {
  loading ??= Promise.all([
    import('lottie-web/build/player/lottie_light').then((module) => module.default),
    fetch(new URL(LOADING_JSON, document.baseURI).href).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<object>;
    }),
  ])
    .then(([lottie, data]) => {
      assets = { lottie, data };
      return assets;
    })
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
}

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface LottieLoaderProps {
  size?: 'sm' | 'lg';
  /** Chữ dưới hoạt hình (chỉ `lg`), vd "LOADING…"; cũng là nhãn đọc màn hình */
  label?: string;
  className?: string;
}

export default function LottieLoader({ size = 'lg', label, className }: LottieLoaderProps) {
  const container = useRef<HTMLSpanElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [ready, setReady] = useState<LottieAssets | null>(assets);
  const [failed, setFailed] = useState(false);

  // Lần đầu: tải player + JSON (các lần sau đã có sẵn trong bộ nhớ)
  useEffect(() => {
    if (reduced || ready) return undefined;
    let active = true;
    loadAssets()
      .then((loaded) => active && setReady(loaded))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [reduced, ready]);

  useEffect(() => {
    const element = container.current;
    if (!ready || !element) return undefined;
    const animation: AnimationItem = ready.lottie.loadAnimation({
      container: element,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      // Lottie sửa dữ liệu tại chỗ khi dựng -> mỗi hoạt hình một bản sao
      animationData: structuredClone(ready.data),
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    return () => animation.destroy();
  }, [ready]);

  const animated = ready !== null && !reduced && !failed;
  return (
    <span
      className={clsx(styles.loader, size === 'sm' ? styles.sm : styles.lg, className)}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      {animated ? (
        <span ref={container} className={styles.anim} aria-hidden="true" />
      ) : (
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      {label && size === 'lg' && (
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
